import { existsSync, rmSync, mkdirSync, copySync, writeFileSync } from 'fs-extra';
import { join } from 'path';
import apps from './apps.config.json';
import assets from './assets.config.json';

const ROOT_DIR = join(__dirname, '..');
const BUILD_DIR = join(ROOT_DIR, 'build');
const APPS_DIR = join(ROOT_DIR, 'apps');
const DEPLOY_DIR = join(ROOT_DIR, 'deploy');
const MEDIA_API_FILES = ['69-governor-electiondata.json', '69-bmc-electiondata.json'];

if (existsSync(BUILD_DIR)) {
  rmSync(BUILD_DIR, { recursive: true });
}

mkdirSync(BUILD_DIR);

type AppConfig = {
  name: string;
  path: string;
  routes?: string[];
  output: string;
  excludeFromProduction?: boolean;
};

apps.forEach(({ name, path, routes, output, excludeFromProduction }: AppConfig) => {
  if (process.env.BUILD_ENV !== 'PRODUCTION' || !excludeFromProduction) {
    console.log(`Copying ${name} output artifacts...`);
    const appBuildDir = join(BUILD_DIR, path);
    copySync(join(APPS_DIR, name, output), appBuildDir);
    copyAppEntryToRoutes(path, routes, appBuildDir);
  } else {
    console.log(`Skipping ${name} output artifacts...`);
  }
});

assets.forEach(({ name, source, serve }) => {
  console.log(`Copying ${name} assets...`);
  copySync(join(ROOT_DIR, source), join(BUILD_DIR, serve));
});

console.log('Copying public media API files...');
MEDIA_API_FILES.forEach((fileName) => {
  const source = join(BUILD_DIR, 'map/data', fileName);

  if (!existsSync(source)) return;

  copySync(source, join(BUILD_DIR, 'results', fileName));
  copySync(source, join(BUILD_DIR, 'media-api', fileName));
});

if (existsSync(join(DEPLOY_DIR, 'nginx-cache.conf'))) {
  console.log('Copying server config snippets...');
  copySync(join(DEPLOY_DIR, 'nginx-cache.conf'), join(BUILD_DIR, '_server/nginx-cache.conf'));
}

writeFileSync(
  join(BUILD_DIR, 'index.html'),
  `<!doctype html>
<html lang="th">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content="0; url=/map" />
    <script>location.replace('/map');</script>
    <title>Redirecting...</title>
  </head>
  <body>
    <a href="/map">Go to map</a>
  </body>
</html>
`
);

function copyAppEntryToRoutes(appPath: string, routes: string[] | undefined, appBuildDir: string) {
  const appEntry = join(appBuildDir, 'index.html');
  if (!routes?.length) return;

  routes.forEach((route) => {
    const routePath = stripAppPath(route, appPath);
    if (!routePath) return;

    const routeHtml = join(appBuildDir, `${routePath}.html`);
    const routeIndex = join(appBuildDir, routePath, 'index.html');
    const sourceHtml = existsSync(routeHtml) ? routeHtml : appEntry;

    if (!existsSync(sourceHtml)) return;

    if (!existsSync(routeHtml)) {
      copySync(sourceHtml, routeHtml);
    }

    copySync(sourceHtml, routeIndex);
  });
}

function stripAppPath(route: string, appPath: string) {
  const normalizedRoute = route.replace(/^\/|\/$/g, '');
  const normalizedAppPath = appPath.replace(/^\/|\/$/g, '');

  if (!normalizedAppPath) return normalizedRoute;
  if (normalizedRoute === normalizedAppPath) return '';

  return normalizedRoute.startsWith(`${normalizedAppPath}/`)
    ? normalizedRoute.slice(normalizedAppPath.length + 1)
    : normalizedRoute;
}
