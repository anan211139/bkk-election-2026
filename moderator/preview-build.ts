import express from 'express';
import { existsSync, statSync } from 'fs';
import { join, normalize } from 'path';

const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || '127.0.0.1';
const ROOT_DIR = join(__dirname, '..');
const BUILD_DIR = join(ROOT_DIR, 'build');
const NOT_FOUND_PAGE = join(BUILD_DIR, 'candidate/404.html');

const app = express();

app.use(
  express.static(BUILD_DIR, {
    redirect: false,
  })
);

app.get('*', (req, res, next) => {
  const pagePath = resolveStaticPage(req.path);

  if (!pagePath) {
    next();
    return;
  }

  res.sendFile(pagePath);
});

app.use((_req, res) => {
  if (existsSync(NOT_FOUND_PAGE)) {
    res.status(404).sendFile(NOT_FOUND_PAGE);
    return;
  }

  res.status(404).send('Not found');
});

app.listen(PORT, HOST, () => {
  console.log(`Static build preview is running at http://${HOST}:${PORT}`);
});

function resolveStaticPage(pathname: string) {
  const requestPath = safeRequestPath(pathname);
  if (!requestPath) return undefined;

  const candidates = [
    join(BUILD_DIR, requestPath),
    join(BUILD_DIR, `${requestPath}.html`),
    join(BUILD_DIR, requestPath, 'index.html'),
  ];

  return candidates.find(isFile);
}

function safeRequestPath(pathname: string) {
  const decodedPath = decodeURIComponent(pathname.split('?')[0] || '/');
  const normalizedPath = normalize(decodedPath).replace(/^(\.\.(\/|\\|$))+/, '');
  return normalizedPath.replace(/^\/+/, '') || 'index.html';
}

function isFile(pathname: string) {
  return existsSync(pathname) && statSync(pathname).isFile();
}
