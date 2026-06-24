import { existsSync, rmSync, mkdirSync, copySync } from 'fs-extra';
import { join } from 'path';
import apps from './apps.config.json';
import assets from './assets.config.json';

const ROOT_DIR = join(__dirname, '..');
const BUILD_DIR = join(ROOT_DIR, 'build');
const APPS_DIR = join(ROOT_DIR, 'apps');

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
