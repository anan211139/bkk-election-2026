import express from 'express';
import http from 'http';
import https from 'https';
import httpProxy from 'http-proxy';
import { readFileSync } from 'fs';
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

assets.forEach(({ source, serve }) => {
  app.use(serve, express.static(join(ROOT_DIR, source)));
});

app.use('/results', express.static(join(ROOT_DIR, 'build/results')));

app.use('/_app', express.static(join(ROOT_DIR, 'apps/landing/build/_app')));

app.get('/about', (_req, res) => {
  res.sendFile(join(ROOT_DIR, 'apps/landing/build/about.html'));
});

app.get('/map', (_req, res) => {
  res.redirect('/map/map');
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
  res.redirect('/map');
});

app.use((_req, res) => {
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
