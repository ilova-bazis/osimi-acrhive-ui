import http from 'node:http';
import { pathToFileURL } from 'node:url';

import { buildRoutes, createContext, isAuthenticated, unauthorized } from './smoke-fixture-routes.mjs';

const HOST = '127.0.0.1';
const PORT = Number(process.env.SMOKE_FIXTURE_PORT ?? 4601);
const UI_ORIGIN = process.env.SMOKE_UI_ORIGIN ?? 'http://127.0.0.1:4600';

const json = (response, status, payload) => {
	const body = JSON.stringify(payload);
	response.writeHead(status, {
		'content-type': 'application/json',
		'content-length': Buffer.byteLength(body)
	});
	response.end(body);
};

export const createFixtureListener = ({ context = createContext(), routeOptions, logger = console } = {}) => {
	const routeHandlers = buildRoutes(context, routeOptions);
	return async (request, response) => {
		const { pathname } = new URL(request.url ?? '/', `http://${HOST}`);

		for (const route of routeHandlers) {
			if (route.method !== request.method || !route.pattern.test(pathname)) continue;
			if (route.auth && !isAuthenticated(context, request)) {
				unauthorized(response);
				return;
			}
			try {
				await route.handler(request, response);
			} catch (error) {
				logger.error('[smoke-fixture] handler error:', error?.message ?? error);
				if (!response.headersSent) {
					json(response, 500, {
						error: { code: 'INTERNAL', message: 'Fixture handler error.' },
						request_id: 'req-um98-fixture-error'
					});
				}
			}
			return;
		}

		json(response, 404, {
			error: { code: 'NOT_FOUND', message: `No fixture route for ${request.method} ${pathname}.` },
			request_id: 'req-um98-fixture-404'
		});
	};
};

export const createFixtureServer = (options) => http.createServer(createFixtureListener(options));

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
	const server = createFixtureServer();
	server.listen(PORT, HOST, () => {
		console.log(`[smoke-fixture] listening on http://${HOST}:${PORT} (ui origin ${UI_ORIGIN})`);
	});

	const shutdown = () => {
		server.close(() => process.exit(0));
		setTimeout(() => process.exit(0), 2000).unref();
	};

	process.on('SIGTERM', shutdown);
	process.on('SIGINT', shutdown);
}
