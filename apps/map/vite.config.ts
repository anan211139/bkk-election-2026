import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import htmlPlugin from 'vite-plugin-html-config';
import { createReadStream, existsSync } from 'fs';
import { resolve, sep } from 'path';

process.env.VITE_BUILD_ENV = process.env.BUILD_ENV;

const resultsDir = resolve(__dirname, '../../build/results');

// https://vitejs.dev/config/
export default defineConfig({
	resolve: {
		alias: {
			react: 'preact/compat',
			'react-dom/test-utils': 'preact/test-utils',
			'react-dom': 'preact/compat',
			'react/jsx-runtime': 'preact/jsx-runtime'
		}
	},
	plugins: [
		preact(),
		{
			name: 'serve-results-from-build',
			configureServer(server) {
				server.middlewares.use((request, response, next) => {
					if (!request.url?.startsWith('/results/')) {
						next();
						return;
					}

					const requestedPath = decodeURIComponent(request.url.split('?')[0]);
					const filePath = resolve(resultsDir, requestedPath.replace(/^\/results\//, ''));
					const isInsideResultsDir =
						filePath === resultsDir || filePath.startsWith(`${resultsDir}${sep}`);

					if (!isInsideResultsDir || !existsSync(filePath)) {
						next();
						return;
					}

					response.setHeader('Content-Type', 'application/json; charset=utf-8');
					createReadStream(filePath).pipe(response);
				});
			}
		},
		/* @ts-ignore */
		htmlPlugin({
			favicon: '/static/favicon.png',
			links: [
				{
					rel: 'stylesheet',
					href: '/static/fonts/typography.css'
				},
				{
					rel: 'stylesheet',
					href: '/ui/style.css'
				}
			]
		})
	],
	base: '/map/',
	server: {
		port: 3004
	}
});
