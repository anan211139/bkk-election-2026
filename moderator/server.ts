import express from 'express';
import http from 'http';
import https from 'https';
import httpProxy from 'http-proxy';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import apps from './apps.config.json';
import assets from './assets.config.json';

const PORT = Number(process.env.PORT || 3000);
const HTTPS_PORT = Number(process.env.HTTPS_PORT || PORT);
const HTTP_REDIRECT_PORT = process.env.HTTP_REDIRECT_PORT
  ? Number(process.env.HTTP_REDIRECT_PORT)
  : undefined;
const ROOT_DIR = join(__dirname, '..');
export const STATIC_PATH = '/static/';
const LIVE_JSON_CACHE_CONTROL = 'public, max-age=1, s-maxage=3, stale-while-revalidate=30';
const STATIC_ASSET_CACHE_CONTROL = 'public, max-age=31536000, immutable';
const STATIC_PAGE_CACHE_CONTROL = 'public, max-age=300, s-maxage=1800, stale-while-revalidate=86400';
const MAP_URL = '/map/map';
const DEFAULT_META = {
  title: 'ผลการเลือกตั้ง - Bangkok Vote 2569',
  description: `'เลือกตั้งผู้ว่าฯ กทม. 2569' และ 'เลือกตั้ง ส.ก.' เช็กผลเลือกตั้ง กทม. แบบเรียลไทม์`,
  image: 'https://bangkokvote69.bangkok.go.th/map/images/og.png',
};

const app = express();
const httpsOptions = getHttpsOptions();
var server = httpsOptions ? https.createServer(httpsOptions, app) : http.createServer(app);

type AppConfig = {
  name: string;
  path: string;
  routes?: string[];
  assets?: string[];
  port: number;
  output: string;
  websocket?: string;
  excludeFromProduction?: boolean;
};

app.use((req, res, next) => {
  const path = req.path;

  if (isLiveJsonPath(path)) {
    res.setHeader('Cache-Control', LIVE_JSON_CACHE_CONTROL);
  } else if (isStaticAssetPath(path)) {
    res.setHeader('Cache-Control', STATIC_ASSET_CACHE_CONTROL);
  } else if (isStaticPagePath(path)) {
    res.setHeader('Cache-Control', STATIC_PAGE_CACHE_CONTROL);
  }

  next();
});

assets.forEach(({ source, serve }) => {
  app.use(serve, express.static(join(ROOT_DIR, source)));
});

app.use('/results', express.static(join(ROOT_DIR, 'build/results')));
app.use('/media-api', express.static(join(ROOT_DIR, 'build/media-api')));

app.use('/_app', express.static(join(ROOT_DIR, 'apps/landing/build/_app')));

app.get('/about', (_req, res) => {
  res.sendFile(join(ROOT_DIR, 'apps/landing/build/about.html'));
});

app.get('/map', (_req, res) => {
  res.send(createRedirectHtml(MAP_URL));
});

(apps as AppConfig[]).forEach(({ path, routes, assets: assetPaths = [], port, websocket }) => {
  if (websocket) {
    const wsPropxy = httpProxy.createProxyServer({
      target: `ws://localhost:${port}`,
    });

    app.get(`${websocket}*`, (req, res) => wsPropxy.ws(req, res, {}));
    server.on('upgrade', (req, socket, head) => wsPropxy.ws(req, socket, head));
  }

  const webProxy = httpProxy.createProxyServer({
    target: `http://localhost:${port}`,
  });

  const proxiedPaths = [...(routes || []), ...assetPaths.map((assetPath) => `${assetPath}*`)];
  const paths = proxiedPaths.length ? proxiedPaths : [`${path}*`];

  paths.forEach((proxiedPath) => {
    app.get(proxiedPath, (req, res) => {
      webProxy.web(req, res, {});
    });
  });
});

app.get('/', (_req, res) => {
  res.send(createRedirectHtml(MAP_URL));
});

app.use((_req, res) => {
  const fallbackPage = join(ROOT_DIR, 'build/candidate/404.html');

  if (existsSync(fallbackPage)) {
    res.status(404).sendFile(fallbackPage);
    return;
  }

  res.status(404).send('Not found');
});

server.listen(httpsOptions ? HTTPS_PORT : PORT);

if (httpsOptions && HTTP_REDIRECT_PORT) {
  http
    .createServer((req, res) => {
      const host = (req.headers.host || '').replace(/:\d+$/, '');
      res.writeHead(301, { Location: `https://${host}${req.url || '/'}` });
      res.end();
    })
    .listen(HTTP_REDIRECT_PORT);
}

console.log(
  `Moderator gateway is running on ${httpsOptions ? 'https' : 'http'}://localhost:${
    httpsOptions ? HTTPS_PORT : PORT
  }`
);

assets.forEach(({ name, serve }) => {
  console.log(`> [Asset] ${name} - ${getLocalUrl(serve)}`);
});

(apps as AppConfig[]).forEach(({ name, routes, path }) => {
  const displayRoutes = routes?.length ? routes : [path];

  displayRoutes.forEach((route) => {
    console.log(`> [App] ${name} - ${getLocalUrl(route)}`);
  });
});

function getLocalUrl(path: string) {
  const protocol = httpsOptions ? 'https' : 'http';
  const port = httpsOptions ? HTTPS_PORT : PORT;

  return `${protocol}://localhost:${port}${path}`;
}

function isLiveJsonPath(path: string) {
  return /^\/(?:data|map\/data|results|media-api)\/.+\.json$/.test(path);
}

function isStaticAssetPath(path: string) {
  return (
    path.startsWith('/map/assets/') ||
    path.startsWith('/_next/static/') ||
    path.startsWith('/ui/') ||
    path.startsWith('/data/') ||
    path.startsWith('/static/')
  );
}

function isStaticPagePath(path: string) {
  return (
    path === '/about' ||
    path === '/summary' ||
    path === '/map/map' ||
    path === '/map/slideshow' ||
    path === '/candidate' ||
    path.startsWith('/candidate/')
  );
}

function getHttpsOptions(): https.ServerOptions | undefined {
  if (process.env.SSL_PFX_PATH) {
    return {
      pfx: readFileSync(process.env.SSL_PFX_PATH),
      passphrase: process.env.SSL_PASSPHRASE,
    };
  }

  if (!process.env.SSL_KEY_PATH || !process.env.SSL_CERT_PATH) {
    return undefined;
  }

  return {
    key: readFileSync(process.env.SSL_KEY_PATH),
    cert: readFileSync(process.env.SSL_CERT_PATH),
    ca: process.env.SSL_CA_PATH ? readFileSync(process.env.SSL_CA_PATH) : undefined,
  };
}

function createRedirectHtml(url: string) {
  return `<!doctype html>
<html lang="th">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${DEFAULT_META.title}</title>
    <meta name="description" content="${DEFAULT_META.description}" />
    <meta property="og:title" content="${DEFAULT_META.title}" />
    <meta property="og:description" content="${DEFAULT_META.description}" />
    <meta property="og:image" content="${DEFAULT_META.image}" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <!-- Privacy-friendly analytics by Plausible -->
    <script async src="https://plausible.io/js/pa-cXX45NtKK22gafkcYZwUj.js"></script>
    <script>
      window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};
      plausible.init()
    </script>
    <meta http-equiv="refresh" content="0; url=${url}" />
    <script>location.replace('${url}');</script>
  </head>
  <body>
    <a href="${url}">${DEFAULT_META.title}</a>
  </body>
</html>
`;
}
