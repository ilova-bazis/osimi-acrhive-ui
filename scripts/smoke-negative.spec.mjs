import { spawn } from 'node:child_process';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const SKIP = process.env.RUN_SMOKE_NEGATIVE !== '1';

const spawned = [];

const runSmoke = (env) =>
	new Promise((resolve) => {
		const child = spawn(process.execPath, ['scripts/smoke-auth.mjs'], {
			cwd: new URL('..', import.meta.url).pathname,
			env: { ...process.env, ...env },
			stdio: ['ignore', 'pipe', 'pipe']
		});
		spawned.push(child);
		let output = '';
		child.stdout.on('data', (chunk) => {
			output += chunk.toString();
		});
		child.stderr.on('data', (chunk) => {
			output += chunk.toString();
		});
		child.on('exit', (code) => resolve({ code, output }));
	});

const portsFree = () =>
	import('node:net').then((net) =>
		Promise.all(
			[4600, 4601].map(
				(port) =>
					new Promise((resolve, reject) => {
						const socket = net.createServer();
						socket.once('error', reject);
						socket.listen(port, '127.0.0.1', () => socket.close(resolve));
					})
			)
		)
	);

const stopSpawned = () =>
	Promise.all(
		spawned.splice(0).map(
			(child) =>
				new Promise((resolve) => {
					if (child.exitCode !== null) {
						resolve();
						return;
					}
					child.once('exit', resolve);
					try {
						process.kill(-child.pid, 'SIGTERM');
					} catch {
						child.kill('SIGTERM');
					}
					setTimeout(() => {
						try {
							child.kill('SIGKILL');
						} catch {
							// already gone
						}
					}, 5000).unref();
				})
		)
	);

describe.skipIf(SKIP)('smoke negative gating', () => {
	beforeAll(async () => {
		await portsFree();
	});

	afterAll(async () => {
		await stopSpawned();
		await portsFree();
	});

	it(
		'exits nonzero when a deliberate failure is injected',
		async () => {
			const { code, output } = await runSmoke({ SMOKE_SABOTAGE: 'negative-test' });
			expect(output).toContain('sabotage negative-test: forced failure');
			expect(output).toContain('manifest: every route/viewport/locale visited');
			expect(code).not.toBe(0);
		},
		900_000
	);
});
