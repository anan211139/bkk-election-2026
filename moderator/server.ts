import express from 'express';
import http from 'http';
import httpProxy from 'http-proxy';
import { join } from 'path';
import apps from './apps.config.json';
import assets from './assets.config.json';

const PORT = 3000;
export const STATIC_PATH = '/static/';

const app = express();
var server = http.createServer(app);

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
  app.use(serve, express.static(join(__dirname, '..', source)));
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
  res.redirect('/map/map');
});

app.use((_req, res) => {
  res.status(404).send('Not found');
});

server.listen(PORT);

console.log(`Moderator gateway is running`);

assets.forEach(({ name, serve }) => {
  console.log(`> [Asset] ${name} - http://localhost:${PORT}${serve}`);
});

(apps as AppConfig[]).forEach(({ name, routes, path }) => {
  const displayRoutes = routes?.length ? routes : [path];

  displayRoutes.forEach((route) => {
    console.log(`> [App] ${name} - http://localhost:${PORT}${route}`);
  });
});
