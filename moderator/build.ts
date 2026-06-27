import { existsSync, rmSync, mkdirSync, copySync, writeFileSync } from 'fs-extra';
import { join } from 'path';
import apps from './apps.config.json';
import assets from './assets.config.json';

const ROOT_DIR = join(__dirname, '..');
const BUILD_DIR = join(ROOT_DIR, 'build');
const APPS_DIR = join(ROOT_DIR, 'apps');
const DEPLOY_DIR = join(ROOT_DIR, 'deploy');
const MEDIA_API_FILES = ['69-governor-electiondata.json', '69-bmc-electiondata.json'];
const MAP_URL = '/map/map';
const DEFAULT_META = {
  title: 'ผลการเลือกตั้ง - Bangkok Vote 2569',
  description: `'เลือกตั้งผู้ว่าฯ กทม. 2569' และ 'เลือกตั้ง ส.ก.' เช็กผลเลือกตั้ง กทม. แบบเรียลไทม์`,
  image: 'https://bangkokvote69.bangkok.go.th/map/images/og.png',
};

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
  createRedirectHtml(MAP_URL)
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
