import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import net from 'node:net';
import { chromium } from 'playwright';

import { routeIdentityMismatch } from './smoke-checks.mjs';
import { collectVisibleText } from './smoke-dom.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const UI_DIR = join(SCRIPT_DIR, '..');

const UI_HOST = '127.0.0.1';
const UI_PORT = 4600;
const UI_ORIGIN = `http://${UI_HOST}:${UI_PORT}`;
const FIXTURE_PORT = 4601;
const FIXTURE_ORIGIN = `http://${UI_HOST}:${FIXTURE_PORT}`;

const USERNAME = 'smoke-archiver';
const PASSWORD = 'um98-smoke-password';

const ARTIFACT_DIR = process.env.SMOKE_ARTIFACT_DIR ?? join('/tmp', 'osimi-archive-ui-smoke-auth');

const VIEWPORTS = [
	{ name: 'mobile', width: 375, height: 667 },
	{ name: 'tablet', width: 768, height: 1024 },
	{ name: 'desktop', width: 1440, height: 900 }
];

const MANIFEST = [
	{ key: '/', path: () => '/' },
	{ key: '/ingestion', path: () => '/ingestion' },
	{ key: '/ingestion/new', path: () => '/ingestion/new' },
	{ key: '/ingestion/[batchId]', path: () => '/ingestion/BATCH-20260814-SMOKE' },
	{ key: '/ingestion/[batchId]/setup', path: () => '/ingestion/BATCH-20260814-SMOKE/setup' },
	{ key: '/ingestion/[batchId]/review', path: () => '/ingestion/BATCH-20260814-SMOKE/review' },
	{ key: '/objects', path: () => '/objects' },
	{ key: '/objects/[objectId]', path: () => '/objects/OBJ-20260814-DOC001' },
	{ key: '/objects/[objectId]/edit', path: () => '/objects/OBJ-20260814-DOC001/edit' }
];

const RAW_KEY_PATTERN = /\b[a-z][a-z0-9]*(?:\.[a-zA-Z][a-zA-Z0-9]*)+\b/g;
const RAW_KEY_ALLOWLIST = new Set(['notes.txt', 'e.g']);

const UNRESOLVED_PLACEHOLDER_PATTERN = /\{[A-Za-z_][A-Za-z0-9_]*\}/g;

const findUnresolvedPlaceholders = (text) => {
	const matches = new Set();
	for (const match of text.matchAll(UNRESOLVED_PLACEHOLDER_PATTERN)) {
		matches.add(match[0]);
	}
	return [...matches];
};

const results = [];
const tupleResults = new Map();
let failed = false;
let visitedTuples = new Set();
let assertedTuples = new Set();

const tupleId = (viewportName, locale, key) => `${viewportName}|${locale}|${key}`;

const recordTuple = (viewportName, locale, key, name, ok, details = '') => {
	const id = tupleId(viewportName, locale, key);
	if (!tupleResults.has(id)) tupleResults.set(id, []);
	tupleResults.get(id).push({ name, ok, details });
};

const record = (name, ok, details = '') => {
	results.push(`${ok ? 'PASS' : 'FAIL'} ${name}${details ? ` (${details})` : ''}`);
	if (!ok) failed = true;
};

const captureDiagnostics = async (page, { key, viewport, locale }) => {
	try {
		await import('node:fs/promises').then(async ({ mkdir, writeFile }) => {
			await mkdir(ARTIFACT_DIR, { recursive: true });
			const stamp = `${viewport.name}-${locale}-${key.replaceAll('/', '_')}`;
			const screenshot = await page.screenshot({ fullPage: true }).catch(() => null);
			if (screenshot) {
				await writeFile(join(ARTIFACT_DIR, `${stamp}.png`), screenshot);
			}
			const bodyText = await page.textContent('body').catch(() => '');
			await writeFile(
				join(ARTIFACT_DIR, `${stamp}.txt`),
				`url=${page.url()}\nviewport=${viewport.width}x${viewport.height}\nlocale=${locale}\n\n${bodyText ?? ''}`
			);
		});
	} catch (error) {
		console.error(`[smoke] failed to capture diagnostics: ${error.message}`);
	}
};

const isPortFree = (port) =>
	new Promise((resolve) => {
		const socket = net.connect({ host: UI_HOST, port });
		socket.once('connect', () => {
			socket.destroy();
			resolve(false);
		});
		socket.once('error', () => resolve(true));
	});

const waitFor = async (url, timeoutMs = 30000, intervalMs = 250) => {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		try {
			const response = await fetch(url);
			if (response.ok) return response;
		} catch {
			// not ready yet
		}
		await new Promise((resolve) => setTimeout(resolve, intervalMs));
	}
	throw new Error(`Timed out waiting for ${url}`);
};

const startProcess = (command, args, env) => {
	const child = spawn(command, args, {
		cwd: UI_DIR,
		env: { ...process.env, ...env },
		stdio: ['ignore', 'pipe', 'pipe'],
		detached: true
	});
	let output = '';
	child.stdout.on('data', (chunk) => {
		output += chunk.toString();
	});
	child.stderr.on('data', (chunk) => {
		output += chunk.toString();
	});
	child.on('exit', (code, signal) => {
		if (child._stopping) return;
		console.error(`[smoke] child process exited unexpectedly: ${command} ${args.join(' ')} (code=${code}, signal=${signal})`);
		console.error(output.slice(-4000));
		shutdown(1);
	});
	return child;
};

let children = [];
let browser = null;
let shutdownStarted = false;
let exitCodeRequested = 0;

const shutdown = async (exitCode) => {
	if (exitCode > 0) {
		exitCodeRequested = Math.max(exitCodeRequested, exitCode);
	}
	if (shutdownStarted) return;
	shutdownStarted = true;
	if (browser) {
		try {
			await browser.close();
		} catch {
			// ignore
		}
	}
	for (const child of children) {
		if (child.exitCode !== null) continue;
		child._stopping = true;
		try {
			process.kill(-child.pid, 'SIGTERM');
		} catch {
			// already gone
		}
	}
	await new Promise((resolve) => setTimeout(resolve, 1200));
	for (const child of children) {
		if (child.exitCode !== null) continue;
		try {
			process.kill(-child.pid, 'SIGKILL');
		} catch {
			// already gone
		}
	}
	process.exit(exitCodeRequested);
};

process.on('SIGINT', () => shutdown(130));
process.on('SIGTERM', () => shutdown(143));

const collectText = async (page) => page.evaluate(collectVisibleText);

const findRawKeys = (text) => {
	const matches = new Set();
	for (const match of text.matchAll(RAW_KEY_PATTERN)) {
		const token = match[0];
		if (RAW_KEY_ALLOWLIST.has(token)) continue;
		matches.add(token);
	}
	return [...matches];
};

const assertRouteState = async (page, { key, concretePath, locale, viewport, sentinel }) => {
	const beforeCount = results.length;

	const failTuple = async (name, details) => {
		record(`${viewport.name} ${locale} ${key}: ${name}`, false, details);
		await captureDiagnostics(page, { key, viewport, locale });
	};

	const finalUrl = page.url();
	const identityMismatch = routeIdentityMismatch(finalUrl, concretePath);
	if (identityMismatch) {
		await failTuple('stays on route', `redirected: ${finalUrl} (${identityMismatch})`);
		return;
	}
	record(`${viewport.name} ${locale} ${key}: stays on route`, true);
	recordTuple(viewport.name, locale, key, 'stays on route', true);

	const errorPage = await page.locator('html').getAttribute('data-sveltekit-error');
	if (errorPage) {
		await failTuple('no SvelteKit error page', 'error page rendered');
		return;
	}
	record(`${viewport.name} ${locale} ${key}: no SvelteKit error page`, true);
	recordTuple(viewport.name, locale, key, 'no SvelteKit error page', true);

	const lang = await page.evaluate(() => document.documentElement.lang);
	if (lang !== locale) {
		record(`${viewport.name} ${locale} ${key}: html lang matches locale`, false, `lang=${lang}`);
	} else {
		record(`${viewport.name} ${locale} ${key}: html lang matches locale`, true);
	}
	recordTuple(viewport.name, locale, key, 'html lang', lang === locale, `lang=${lang}`);

	const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
	record(`${viewport.name} ${locale} ${key}: no horizontal overflow`, overflow);
	recordTuple(viewport.name, locale, key, 'no horizontal overflow', overflow);

	const text = await collectText(page);
	const bodyText = ((await page.textContent('body')) ?? '').toString();
	const rawKeys = findRawKeys(text);
	record(`${viewport.name} ${locale} ${key}: no raw translation keys`, rawKeys.length === 0, rawKeys.slice(0, 8).join(','));
	recordTuple(viewport.name, locale, key, 'no raw translation keys', rawKeys.length === 0, rawKeys.slice(0, 8).join(','));

	const unresolved = findUnresolvedPlaceholders(text);
	record(
		`${viewport.name} ${locale} ${key}: no unresolved placeholders`,
		unresolved.length === 0,
		unresolved.slice(0, 8).join(',')
	);
	recordTuple(viewport.name, locale, key, 'no unresolved placeholders', unresolved.length === 0, unresolved.slice(0, 8).join(','));

	const enumCodes = findForbiddenEnumCodes(text);
	record(
		`${viewport.name} ${locale} ${key}: no raw enum codes`,
		enumCodes.length === 0,
		enumCodes.slice(0, 8).join(',')
	);
	recordTuple(viewport.name, locale, key, 'no raw enum codes', enumCodes.length === 0, enumCodes.slice(0, 8).join(','));

	const hasCyrillic = /[А-Яа-яЁё]/.test(text);
	const localeCopyOk =
		locale === 'ru' ? hasCyrillic : !bodyText.includes(RU_UI_SENTINELS[key]);
	record(
		`${viewport.name} ${locale} ${key}: localized copy renders`,
		localeCopyOk,
		locale === 'ru' ? 'no cyrillic in visible text' : `ru ui copy leaked into en (${RU_UI_SENTINELS[key]})`
	);
	recordTuple(viewport.name, locale, key, 'localized copy renders', localeCopyOk);

	const uiSentinel = locale === 'ru' ? RU_UI_SENTINELS[key] : EN_UI_SENTINELS[key];
	const uiSentinelPresent = bodyText.includes(uiSentinel);
	record(
		`${viewport.name} ${locale} ${key}: route ui copy renders`,
		uiSentinelPresent,
		`expected "${uiSentinel}"`
	);
	recordTuple(viewport.name, locale, key, 'route ui copy renders', uiSentinelPresent, `expected "${uiSentinel}"`);

	if (locale === 'ru') {
		const secondarySentinel = RU_UI_SENTINELS_SECONDARY[key];
		const secondaryPresent = bodyText.includes(secondarySentinel);
		record(
			`${viewport.name} ${locale} ${key}: secondary ru ui copy renders`,
			secondaryPresent,
			`expected "${secondarySentinel}"`
		);
		recordTuple(viewport.name, locale, key, 'secondary ru ui copy renders', secondaryPresent, `expected "${secondarySentinel}"`);
	}

	const sentinelPresent = bodyText.includes(sentinel);
	record(
		`${viewport.name} ${locale} ${key}: route-specific sentinel`,
		sentinelPresent,
		`expected "${sentinel}"`
	);
	recordTuple(viewport.name, locale, key, 'route-specific sentinel', sentinelPresent, `expected "${sentinel}"`);

	assertedTuples.add(tupleId(viewport.name, locale, key));

	const newFailures = results.slice(beforeCount).some((entry) => entry.startsWith('FAIL'));
	if (newFailures) {
		await captureDiagnostics(page, { key, viewport, locale });
	}
};

const checkRoute = async (page, { key, concretePath, locale, viewport }) => {
	visitedTuples.add(tupleId(viewport.name, locale, key));
	const sentinel = locale === 'ru' ? RU_UI_SENTINELS[key] : ROUTE_SENTINELS[key];
	await page.goto(`${UI_ORIGIN}${concretePath}`, { waitUntil: 'networkidle' });
	await assertRouteState(page, { key, concretePath, locale, viewport, sentinel });

	if (key === '/objects/[objectId]') {
		for (const variant of OBJECT_VARIANTS) {
			const variantUrl = `/objects/${variant.id}`;
			await page.goto(`${UI_ORIGIN}${variantUrl}`, { waitUntil: 'networkidle' });
			await assertRouteState(page, { key, concretePath: variantUrl, locale, viewport, sentinel: variant.sentinel });
		}
		await page.goto(`${UI_ORIGIN}${concretePath}`, { waitUntil: 'networkidle' });
	}
};

const ROUTE_SENTINELS = {
	'/': 'BATCH-20260814-SMOKE',
	'/ingestion': 'Smoke Batch',
	'/ingestion/new': 'Bring new material into the archive',
	'/ingestion/[batchId]': 'report-1945.pdf',
	'/ingestion/[batchId]/setup': 'photo-1945.jpg',
	'/ingestion/[batchId]/review': 'notes.txt',
	'/objects': 'OBJ-20260814-DOC001',
	'/objects/[objectId]': 'War-time newspaper issue',
	'/objects/[objectId]/edit': 'Page 1'
};

const EN_UI_SENTINELS = {
	'/': 'Welcome back',
	'/ingestion': 'Batch Overview',
	'/ingestion/new': 'What kind of item is it?',
	'/ingestion/[batchId]': 'Ingestion details',
	'/ingestion/[batchId]/setup': '1 · Organize',
	'/ingestion/[batchId]/review': 'Step 03 — Review what will run',
	'/objects': 'Catalog',
	'/objects/[objectId]': 'Support',
	'/objects/[objectId]/edit': 'Save draft'
};

const RU_UI_SENTINELS = {
	'/': 'С возвращением',
	'/ingestion': 'Обзор партий',
	'/ingestion/new': 'Добавить новый материал в архив',
	'/ingestion/[batchId]': 'Детали загрузки',
	'/ingestion/[batchId]/setup': '1 · Организация',
	'/ingestion/[batchId]/review': 'Шаг 03 — Проверка перед запуском',
	'/objects': 'Каталог',
	'/objects/[objectId]': 'Поддержка',
	'/objects/[objectId]/edit': 'Сохранить черновик'
};

const RU_UI_SENTINELS_SECONDARY = {
	'/': 'Недавняя активность',
	'/ingestion': 'Новая загрузка',
	'/ingestion/new': 'Какой это тип элемента?',
	'/ingestion/[batchId]': 'Назад к загрузкам',
	'/ingestion/[batchId]/setup': '2 · Метаданные',
	'/ingestion/[batchId]/review': 'Назад к настройке',
	'/objects': 'Объекты',
	'/objects/[objectId]': 'Редактировать',
	'/objects/[objectId]/edit': 'Машинный OCR'
};

const FORBIDDEN_ENUM_CODES = [
	'AVAILABLE',
	'ARCHIVED',
	'RESTORE_PENDING',
	'RESTORING',
	'UNAVAILABLE',
	'FORBIDDEN_POLICY',
	'EMBARGO_ACTIVE',
	'RESTORE_REQUIRED',
	'RESTORE_IN_PROGRESS',
	'TEMP_UNAVAILABLE',
	'GENERIC',
	'IMAGE',
	'AUDIO',
	'VIDEO',
	'DOCUMENT',
	'NEEDS_REVIEW',
	'REVIEW_IN_PROGRESS',
	'REVIEWED',
	'CURATION_FAILED',
	'QUEUED',
	'INGESTING',
	'INGESTED',
	'OCR_RUNNING',
	'OCR_DONE',
	'INDEX_RUNNING',
	'INDEX_DONE',
	'DERIVATIVES_RUNNING',
	'DERIVATIVES_DONE',
	'PROCESSING_FAILED',
	'PROCESSING_SKIPPED',
	'PENDING',
	'PROCESSING',
	'COMPLETED',
	'FAILED',
	'CANCELED',
	'DRAFT',
	'COMPLETED_WITH_ERRORS',
	'INGESTION_SUBMITTED',
	'INGESTION_QUEUED',
	'INGESTION_PROCESSING',
	'INGESTION_COMPLETED',
	'INGESTION_FAILED',
	'INGESTION_CANCELED',
	'LEASE_GRANTED',
	'LEASE_RENEWED',
	'LEASE_EXPIRED',
	'LEASE_RELEASED',
	'FILE_VALIDATED',
	'FILE_FAILED',
	'PIPELINE_STEP_STARTED',
	'PIPELINE_STEP_COMPLETED',
	'PIPELINE_STEP_FAILED',
	'INGESTION_ITEM_CREATED',
	'INGESTION_ITEM_UPDATED',
	'INGESTION_ITEM_PROCESSING',
	'INGESTION_ITEM_COMPLETED',
	'INGESTION_ITEM_FAILED',
	'OBJECT_CREATED',
	'ARTIFACT_CREATED'
];

const ENUM_CODE_ALLOWLIST = new Set(['PDF', 'OCR', 'EN', 'RU', 'UTC', 'YYYY', 'OK', 'B', 'KB', 'MB', 'GB', 'TB', 'PB']);

const findForbiddenEnumCodes = (text) => {
	const matches = new Set();
	for (const code of FORBIDDEN_ENUM_CODES) {
		if (ENUM_CODE_ALLOWLIST.has(code)) continue;
		const pattern = new RegExp(`(?<![A-Za-z0-9_-])${code}(?![A-Za-z0-9_-])`, 'g');
		for (const match of text.matchAll(pattern)) {
			matches.add(match[0]);
		}
	}
	return [...matches];
};

const OBJECT_VARIANTS = [
	{ id: 'OBJ-20260814-IMG001', sentinel: 'Field photograph' },
	{ id: 'OBJ-20260814-AUD001', sentinel: 'Recorded interview' },
	{ id: 'OBJ-20260814-VID001', sentinel: 'Home movie reel' }
];

const runDesktopInteractions = async (page) => {
	const observations = [];

	const pushObservation = (name, detail) => observations.push(`${name}: ${detail}`);

	const checkInteractionPlaceholders = async (name, exercised) => {
		if (!exercised) return;
		const text = await collectText(page);
		const unresolved = findUnresolvedPlaceholders(text);
		record(
			`desktop interaction ${name}: no unresolved placeholders`,
			unresolved.length === 0,
			unresolved.slice(0, 8).join(',')
		);
	};

	const requireInteraction = async (name, exercise) => {
		try {
			const outcome = await exercise();
			record(`desktop interaction ${name}: exercised`, outcome.ok, outcome.detail);
			pushObservation(name, outcome.ok ? outcome.detail : `FAILED: ${outcome.detail}`);
		} catch (error) {
			record(`desktop interaction ${name}: exercised`, false, error.message);
			pushObservation(name, `FAILED: ${error.message}`);
		}
	};

	const visibleDialogWithText = async (expectedTexts) => {
		const dialogs = page.locator('[role="dialog"]');
		const count = await dialogs.count();
		for (let index = 0; index < count; index += 1) {
			const dialog = dialogs.nth(index);
			if (!(await dialog.isVisible().catch(() => false))) continue;
			const text = ((await dialog.textContent()) ?? '').toString();
			if (expectedTexts.some((expected) => text.includes(expected))) return true;
		}
		return false;
	};

	await requireInteraction('new-ingestion tag removal', async () => {
		await page.goto(`${UI_ORIGIN}/ingestion/new`, { waitUntil: 'networkidle' });
		const tagInput = page.locator('#tagsInput');
		if (!(await tagInput.isVisible().catch(() => false))) {
			return { ok: false, detail: 'no tags input on new-ingestion page' };
		}
		await tagInput.fill('smoke-tag');
		await page.keyboard.press('Enter');
		await page.waitForTimeout(250);
		const addedTag = page.locator('button').filter({ hasText: 'smoke-tag' }).last();
		if (!(await addedTag.isVisible().catch(() => false))) {
			return { ok: false, detail: 'tag was not created after Enter' };
		}
		await addedTag.click();
		await page.waitForTimeout(250);
		const remainingTags = await page.locator('button').filter({ hasText: 'smoke-tag' }).count();
		if (remainingTags > 0) {
			return { ok: false, detail: 'tag still present after removal click' };
		}
		await checkInteractionPlaceholders('new-ingestion tag removal', true);
		return { ok: true, detail: 'tag created and removed' };
	});

	await requireInteraction('info drawer', async () => {
		await page.goto(`${UI_ORIGIN}/objects/OBJ-20260814-DOC001`, { waitUntil: 'networkidle' });
		const infoButton = page.locator('button').filter({ hasText: /Info|Инфо/i }).first();
		if (!(await infoButton.isVisible().catch(() => false))) {
			return { ok: false, detail: 'no info trigger found' };
		}
		await infoButton.click();
		await page.waitForTimeout(250);
		const drawerOpened = await page
			.locator('body')
			.filter({ hasText: /Object info|Информация об объекте/ })
			.isVisible()
			.catch(() => false);
		if (!drawerOpened) {
			return { ok: false, detail: 'info drawer did not open' };
		}
		await checkInteractionPlaceholders('info drawer', true);
		const closeInfo = page
			.locator('button[aria-label*="Close info panel"], button[aria-label*="Закрыть панель информации"]')
			.first();
		if (!(await closeInfo.isVisible().catch(() => false))) {
			return { ok: false, detail: 'no info drawer close control found' };
		}
		await closeInfo.click();
		await page.waitForTimeout(250);
		const drawerClosed = await page
			.locator('body')
			.filter({ hasText: /Object info|Информация об объекте/ })
			.isVisible()
			.catch(() => false);
		if (drawerClosed) {
			return { ok: false, detail: 'info drawer did not close' };
		}
		return { ok: true, detail: 'drawer opened and closed' };
	});

	await requireInteraction('support sheet', async () => {
		await page.goto(`${UI_ORIGIN}/objects/OBJ-20260814-DOC001`, { waitUntil: 'networkidle' });
		const supportButton = page.locator('button').filter({ hasText: /Support|Поддержка/i }).first();
		if (!(await supportButton.isVisible().catch(() => false))) {
			return { ok: false, detail: 'no support sheet trigger found' };
		}
		await supportButton.click();
		await page.waitForTimeout(250);
		const sheet = page
			.locator('aside')
			.filter({ has: page.locator('button[aria-label*="Close support panel"], button[aria-label*="Закрыть панель поддержки"]') })
			.first();
		if (!(await sheet.isVisible().catch(() => false))) {
			return { ok: false, detail: 'support sheet did not open' };
		}
		const sheetButtons = sheet.locator('button');
		const buttonCount = await sheetButtons.count();
		let tabClicks = 0;
		for (let index = 0; index < buttonCount; index += 1) {
			const button = sheetButtons.nth(index);
			const label = ((await button.textContent()) ?? '').trim();
			if (!label) continue;
			await button.click();
			tabClicks += 1;
			await page.waitForTimeout(80);
		}
		if (tabClicks === 0) {
			return { ok: false, detail: `no sheet tabs clicked of ${buttonCount} sheet buttons` };
		}
		await checkInteractionPlaceholders('support sheet', true);
		const closeSheet = page
			.locator('button[aria-label*="Close support panel"], button[aria-label*="Закрыть панель поддержки"]')
			.first();
		if (!(await closeSheet.isVisible().catch(() => false))) {
			return { ok: false, detail: 'no support sheet close control found' };
		}
		await closeSheet.click();
		await page.waitForTimeout(250);
		if (await sheet.isVisible().catch(() => false)) {
			return { ok: false, detail: 'support sheet did not close' };
		}
		return { ok: true, detail: `${tabClicks} tabs clicked of ${buttonCount} sheet buttons; sheet opened and closed` };
	});

	await requireInteraction('resync confirmation', async () => {
		await page.goto(`${UI_ORIGIN}/objects/OBJ-20260814-DOC001`, { waitUntil: 'networkidle' });
		const resyncButton = page.locator('button').filter({ hasText: /Resync|Синхр/i }).first();
		if (!(await resyncButton.isVisible().catch(() => false))) {
			return { ok: false, detail: 'no resync trigger found' };
		}
		await resyncButton.click();
		await page.waitForTimeout(300);
		const confirmDialogOpened = await visibleDialogWithText(['Подтвердите синхронизацию', 'Confirm resync']);
		if (!confirmDialogOpened) {
			return { ok: false, detail: 'resync confirmation dialog did not open' };
		}
		const confirm = page.locator('[role="dialog"] button').filter({ hasText: /Подтвердить|Confirm/ }).first();
		if (!(await confirm.isVisible().catch(() => false))) {
			return { ok: false, detail: 'no confirm control in resync dialog' };
		}
		const responsePromise = page.waitForResponse(
			(response) => response.url().includes('/resync') && response.request().method() === 'POST' && response.ok(),
			{ timeout: 8000 }
		);
		await confirm.click();
		const response = await responsePromise;
		if (!response.ok()) {
			return { ok: false, detail: `resync request failed with status ${response.status()}` };
		}
		await page.waitForTimeout(400);
		const successShown = await page
			.locator('body')
			.filter({ hasText: /Синхронизация запрошена|Resync requested/ })
			.isVisible()
			.catch(() => false);
		if (!successShown) {
			return { ok: false, detail: 'resync success message not shown after confirmation' };
		}
		await checkInteractionPlaceholders('resync confirmation', true);
		return { ok: true, detail: 'confirmation dialog opened, submitted, and succeeded' };
	});

	await requireInteraction('publish dialog', async () => {
		await page.goto(`${UI_ORIGIN}/objects/OBJ-20260814-DOC001/edit`, { waitUntil: 'networkidle' });
		const publishButton = page.locator('button').filter({ hasText: /Publish|Опублик/i }).first();
		if (!(await publishButton.isVisible().catch(() => false))) {
			return { ok: false, detail: 'no publish trigger found' };
		}
		await publishButton.click();
		await page.waitForTimeout(300);
		const publishDialogOpened = await visibleDialogWithText([
			'Опубликовать курированный OCR?',
			'Publish curated OCR?'
		]);
		if (!publishDialogOpened) {
			return { ok: false, detail: 'publish dialog did not open' };
		}
		await checkInteractionPlaceholders('publish dialog', true);
		const cancel = page.locator('[role="dialog"] button').filter({ hasText: /Отмен|Cancel/ }).first();
		if (!(await cancel.isVisible().catch(() => false))) {
			return { ok: false, detail: 'no cancel control in publish dialog' };
		}
		await cancel.click();
		await page.waitForTimeout(300);
		const dialogClosed = !(await visibleDialogWithText([
			'Опубликовать курированный OCR?',
			'Publish curated OCR?'
		]));
		if (!dialogClosed) {
			return { ok: false, detail: 'publish dialog did not close after cancel' };
		}
		return { ok: true, detail: 'dialog opened and closed via cancel' };
	});

	console.log('[smoke] desktop interactions:\n  ' + observations.join('\n  '));
};

const main = async () => {
	if (!(await isPortFree(UI_PORT)) || !(await isPortFree(FIXTURE_PORT))) {
		console.error(`[smoke] ports ${UI_PORT}/${FIXTURE_PORT} are not free; refusing to start.`);
		process.exit(1);
	}

	console.log('[smoke] building production bundle...');
	execSync('npm run build', { cwd: UI_DIR, stdio: 'inherit' });

	const fixture = startProcess(process.execPath, [join(SCRIPT_DIR, 'smoke-auth-fixture.mjs')], {
		SMOKE_FIXTURE_PORT: String(FIXTURE_PORT),
		SMOKE_UI_ORIGIN: UI_ORIGIN
	});
	children.push(fixture);

	const adapter = startProcess(process.execPath, [join(UI_DIR, 'build', 'index.js')], {
		HOST: UI_HOST,
		PORT: String(UI_PORT),
		ORIGIN: UI_ORIGIN,
		PRIVATE_API_BASE: FIXTURE_ORIGIN,
		PUBLIC_API_BASE: FIXTURE_ORIGIN,
		APP_BUILD_ID: 'um98-smoke',
		NODE_ENV: 'production'
	});
	children.push(adapter);

	try {
		await waitFor(`http://${UI_HOST}:${FIXTURE_PORT}/healthz`);
		const loginResponse = await waitFor(`${UI_ORIGIN}/login`);
		const buildId = loginResponse.headers.get('x-osimi-build-id');
		record('adapter-node build serves UI', true, `build-id=${buildId}`);
		if (buildId !== 'um98-smoke') {
			record('adapter-node build id matches', false, `got ${buildId}`);
		} else {
			record('adapter-node build id matches', true);
		}

		browser = await chromium.launch();

		for (const viewport of VIEWPORTS) {
			const context = await browser.newContext({ viewport });
			const page = await context.newPage();
			const requestFailures = [];
			const errorEvents = [];
			const consoleErrors = [];
			page.on('requestfailed', (request) => {
				if (!request.url().includes('favicon')) requestFailures.push(request.url());
			});
			page.on('pageerror', (error) => errorEvents.push(error.message));
			page.on('console', (message) => {
				if (message.type() === 'error') {
					consoleErrors.push(message.text());
				}
			});
			page.on('response', (response) => {
				if (response.status() >= 400 && !response.url().includes('favicon')) {
					requestFailures.push(`${response.status()} ${response.url()}`);
				}
			});

			await page.goto(`${UI_ORIGIN}/`, { waitUntil: 'networkidle' });
			if (!page.url().startsWith(`${UI_ORIGIN}/login`)) {
				record(`${viewport.name}: unauthenticated redirect to /login`, false, page.url());
			} else {
				record(`${viewport.name}: unauthenticated redirect to /login`, true);
			}

			await page.locator('#username').fill(USERNAME);
			await page.locator('#password').fill(PASSWORD);
			await Promise.all([
				page.waitForURL(`${UI_ORIGIN}/`, { timeout: 15000 }),
				page.locator('button[type="submit"]').click()
			]);
			record(`${viewport.name}: real login succeeds`, true);

			for (const entry of MANIFEST) {
				await checkRoute(page, {
					key: entry.key,
					concretePath: entry.path(),
					locale: 'en',
					viewport
				});
			}

			const ruButton = page.getByRole('button', { name: 'RU' });
			await ruButton.click();
			await page.waitForTimeout(200);

			for (const entry of MANIFEST) {
				await checkRoute(page, {
					key: entry.key,
					concretePath: entry.path(),
					locale: 'ru',
					viewport
				});
			}

			await page.reload({ waitUntil: 'networkidle' });
			const persistedLang = await page.evaluate(() => document.documentElement.lang);
			record(`${viewport.name}: reload preserves locale`, persistedLang === 'ru');

			if (viewport.name === 'desktop') {
				await runDesktopInteractions(page);
			}

			record(
				`${viewport.name}: no page errors or failed requests`,
				errorEvents.length === 0 && requestFailures.length === 0,
				[...errorEvents, ...requestFailures].slice(0, 6).join(' | ')
			);

			record(
				`${viewport.name}: no browser console errors`,
				consoleErrors.length === 0,
				consoleErrors.slice(0, 6).join(' | ')
			);

			await context.close();
		}

		const expectedTuples = [];
		for (const viewport of VIEWPORTS) {
			for (const locale of ['en', 'ru']) {
				for (const entry of MANIFEST) {
					expectedTuples.push(tupleId(viewport.name, locale, entry.key));
				}
			}
		}
		const visited = [...visitedTuples].sort();
		const asserted = [...assertedTuples].sort();
		const missing = expectedTuples.filter((id) => !visited.includes(id));
		const unexpected = visited.filter((id) => !expectedTuples.includes(id));
		const unasserted = expectedTuples.filter((id) => !asserted.includes(id));
		record('manifest: every route/viewport/locale visited', missing.length === 0, `missing=[${missing.join(',')}] unexpected=[${unexpected.join(',')}]`);
		record('manifest: every route/viewport/locale asserted', unasserted.length === 0, `unasserted=[${unasserted.join(',')}]`);

		if (process.env.SMOKE_SABOTAGE) {
			record(`sabotage ${process.env.SMOKE_SABOTAGE}: forced failure`, false, 'deliberate negative test');
		}

		console.log('[smoke] manifest coverage:');
		for (const entry of MANIFEST) {
			for (const locale of ['en', 'ru']) {
				const row = [];
				for (const viewport of VIEWPORTS) {
					const id = tupleId(viewport.name, locale, entry.key);
					const ok = visited.includes(id) && asserted.includes(id);
					row.push(`${viewport.name}:${ok ? 'ok' : 'MISSING'}`);
				}
				console.log(`  ${locale} ${entry.key} -> ${row.join(' ')}`);
			}
		}
	} catch (error) {
		record('smoke completed without crash', false, error.message);
	} finally {
		const passCount = results.filter((entry) => entry.startsWith('PASS')).length;
		console.log(results.join('\n'));
		console.log(`[smoke] ${passCount}/${results.length} checks passed`);
		await shutdown(failed ? 1 : 0);
	}
};

main().catch((error) => {
	console.error('[smoke] fatal:', error);
	shutdown(1);
});
