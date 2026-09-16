import { page, userEvent } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';

const { beforeNavigateMock, afterNavigateMock } = vi.hoisted(() => ({
	beforeNavigateMock: vi.fn(),
	afterNavigateMock: vi.fn()
}));

const { pageState } = vi.hoisted(() => ({
	pageState: {
		current: { url: { pathname: '/', search: '' }, route: { id: '/' } }
	}
}));

vi.mock('$app/stores', () => {
	const listeners = new Set<(value: unknown) => void>();
	let current = pageState.current;
	return {
		page: {
			subscribe(fn: (value: unknown) => void) {
				fn(current);
				listeners.add(fn);
				return () => listeners.delete(fn);
			},
			set(value: { url: { pathname: string; search: string }; route: { id: string } }) {
				current = value;
				listeners.forEach((fn) => fn(current));
			}
		}
	};
});

vi.mock('$app/navigation', () => ({
	beforeNavigate: beforeNavigateMock,
	afterNavigate: afterNavigateMock
}));

vi.mock('$app/paths', () => ({
	resolve: (path: string) => path
}));

import Layout from './+layout.svelte';
import BaseDialog from '$lib/components/BaseDialog.svelte';
import { locale } from '$lib/i18n/locale';
import { page as mockedPage } from '$app/stores';

const setPageUrl = (pathname: string) => {
	(mockedPage as unknown as { set: (value: object) => void }).set({
		url: { pathname, search: '' },
		route: { id: pathname }
	});
};

const STORAGE_KEY = 'osimi-locale';

const session = {
	id: 'user-1',
	username: 'archivist',
	role: 'admin'
};

const renderLayout = (children = defaultChildren()) =>
	render(Layout, {
		children,
		data: { session, activeBatches: [] }
	});

const defaultChildren = () =>
	createRawSnippet(() => ({
		render: () => '<div data-testid="route-child">Route content</div>'
	}));

const tallChildren = () =>
	createRawSnippet(() => ({
		render: () => {
			const fillers = Array.from({ length: 40 }, () => '<div style="height:200px;"></div>').join(
				''
			);
			return `<div data-testid="route-child">${fillers}</div>`;
		}
	}));

describe('root layout shell', () => {
	beforeEach(() => {
		beforeNavigateMock.mockReset();
		afterNavigateMock.mockReset();
		vi.restoreAllMocks();
		window.localStorage.clear();
		locale.setLocale('en');
		pageState.current = { url: { pathname: '/', search: '' }, route: { id: '/' } };
	});

	afterEach(async () => {
		vi.restoreAllMocks();
		locale.setLocale('en');
		window.localStorage.clear();
		await page.viewport(1280, 720);
	});

	it('initializes the saved locale once per mount', async () => {
		const initSpy = vi.spyOn(locale, 'init');
		window.localStorage.setItem(STORAGE_KEY, 'ru');

		renderLayout();

		expect(initSpy).toHaveBeenCalledTimes(1);
		await expect
			.element(page.getByRole('button', { name: 'RU' }))
			.toHaveAttribute('aria-pressed', 'true');
		expect(document.documentElement.lang).toBe('ru');
	});

	it('falls back to English for invalid persisted locale values', async () => {
		window.localStorage.setItem(STORAGE_KEY, 'constructor');

		renderLayout();

		await expect
			.element(page.getByRole('button', { name: 'EN' }))
			.toHaveAttribute('aria-pressed', 'true');
		expect(document.documentElement.lang).toBe('en');
	});

	it('renders no authenticated shell on public routes', async () => {
		pageState.current = {
			url: { pathname: '/login', search: '' },
			route: { id: '/login' }
		};

		render(Layout, { children: defaultChildren(), data: { session: null, activeBatches: [] } });

		await expect
			.element(page.getByRole('navigation', { name: 'Primary navigation' }))
			.not.toBeInTheDocument();
		await expect
			.element(page.getByRole('group', { name: 'Interface language' }))
			.not.toBeInTheDocument();
	});

	it('keeps the mobile header outside the route scrollport', async () => {
		await page.viewport(375, 667);
		renderLayout();

		const header = page.getByRole('banner').element();
		const scrollport = document.querySelector('.app-route-scrollport') as HTMLDivElement;

		expect(scrollport).not.toBeNull();
		expect(scrollport.scrollHeight).toBeGreaterThan(0);
		expect(scrollport.getBoundingClientRect().top).toBeGreaterThanOrEqual(
			header.getBoundingClientRect().bottom - 1
		);
	});

	it('keeps a route-local sticky header below the mobile shell while scrolling', async () => {
		await page.viewport(375, 667);

		const children = createRawSnippet(() => ({
			render: () => {
				const fillers = Array.from({ length: 30 }, () => '<div style="height:200px;"></div>').join(
					''
				);
				return `<div><div data-testid="sticky-marker" style="position:sticky;top:0;height:40px;background:blue;"></div>${fillers}</div>`;
			}
		}));

		renderLayout(children);

		const header = page.getByRole('banner').element();
		const scrollport = document.querySelector('.app-route-scrollport') as HTMLDivElement;
		const marker = document.querySelector('[data-testid="sticky-marker"]') as HTMLDivElement;

		scrollport.scrollTop = 1200;
		await vi.waitFor(() => {
			expect(marker.getBoundingClientRect().top).toBeGreaterThanOrEqual(
				header.getBoundingClientRect().bottom - 1
			);
		});
		expect(marker.getBoundingClientRect().top).toBeLessThanOrEqual(
			header.getBoundingClientRect().bottom + 2
		);
	});

	it('resets mobile route scroll on ordinary navigation', async () => {
		await page.viewport(375, 667);
		renderLayout(tallChildren());

		const beforeNavigate = beforeNavigateMock.mock.calls.at(-1)?.[0] as (event: {
			type: string;
			to: { url: URL } | null;
			cancel: () => void;
		}) => void;
		const afterNavigate = afterNavigateMock.mock.calls.at(-1)?.[0] as () => void;

		const scrollport = document.querySelector('.app-route-scrollport') as HTMLDivElement;
		scrollport.scrollTop = 400;

		beforeNavigate({
			type: 'link',
			to: { url: new URL('https://app.test/ingestion') },
			cancel: () => {}
		});
		afterNavigate();

		expect(scrollport.scrollTop).toBe(0);
	});

	it('restores saved mobile route scroll on history navigation', async () => {
		await page.viewport(375, 667);
		renderLayout(tallChildren());

		const beforeNavigate = beforeNavigateMock.mock.calls.at(-1)?.[0] as (event: {
			type: string;
			to: { url: URL } | null;
			cancel: () => void;
		}) => void;
		const afterNavigate = afterNavigateMock.mock.calls.at(-1)?.[0] as () => void;

		const scrollport = document.querySelector('.app-route-scrollport') as HTMLDivElement;
		scrollport.scrollTop = 250;

		beforeNavigate({
			type: 'link',
			to: { url: new URL('https://app.test/objects') },
			cancel: () => {}
		});
		afterNavigate();
		setPageUrl('/objects');
		scrollport.scrollTop = 600;

		beforeNavigate({
			type: 'popstate',
			to: { url: new URL('https://app.test/') },
			cancel: () => {}
		});
		afterNavigate();
		setPageUrl('/');

		expect(scrollport.scrollTop).toBe(250);
	});

	it('hides the mobile shell and renders the sidebar at desktop widths', async () => {
		await page.viewport(1280, 720);
		renderLayout();

		await expect
			.element(page.getByRole('navigation', { name: 'Primary navigation' }))
			.toBeInTheDocument();
		expect(document.querySelector('header.lg\\:hidden')?.getBoundingClientRect().height ?? 0).toBe(
			0
		);
		const frame = document.querySelector('.app-mobile-frame') as HTMLDivElement;
		expect(getComputedStyle(frame).overflow).toBe('visible');
	});

	it('marks the route scrollport as a modal scroll root', async () => {
		renderLayout();

		const scrollport = document.querySelector('.app-route-scrollport') as HTMLDivElement;
		expect(scrollport).not.toBeNull();
		expect(scrollport.hasAttribute('data-modal-scroll-root')).toBe(true);
	});

	it('locks and restores the route scrollport while a BaseDialog is open', async () => {
		renderLayout();

		const onClose = vi.fn();
		const dialogView = render(BaseDialog, {
			open: true,
			label: 'Test dialog',
			onClose,
			children: createRawSnippet(() => ({
				render: () => '<button>Close</button>'
			}))
		});
		const scrollport = document.querySelector('.app-route-scrollport') as HTMLDivElement;
		await vi.waitFor(() => {
			expect(document.querySelector('dialog')?.open).toBe(true);
		});
		expect(scrollport.style.overflow).toBe('hidden');

		await dialogView.rerender({
			open: false,
			label: 'Test dialog',
			onClose,
			children: createRawSnippet(() => ({
				render: () => '<button>Close</button>'
			}))
		});
		await vi.waitFor(() => {
			expect(scrollport.style.overflow).toBe('');
		});
	});

	it('renders exactly one visible language switcher in desktop utility row at 1280x720', async () => {
		await page.viewport(1280, 720);
		renderLayout();

		const visibleGroups = page.getByRole('group', { name: 'Interface language' }).all();
		expect(visibleGroups).toHaveLength(1); // Exactly one visible accessible group

		const domGroups = document.querySelectorAll('[role="group"][aria-label="Interface language"]');
		expect(domGroups).toHaveLength(2); // One in desktop utility row, one in hidden mobile header

		const desktopRow = document.querySelector('.app-desktop-utility-row') as HTMLDivElement;
		expect(desktopRow).not.toBeNull();
		expect(getComputedStyle(desktopRow).display).toBe('flex');

		const mobileHeader = document.querySelector('header.lg\\:hidden') as HTMLElement;
		expect(getComputedStyle(mobileHeader).display).toBe('none');

		// Utility row is inside content column and not inside aside
		const contentColumn = document.querySelector('.app-content-column') as HTMLDivElement;
		expect(contentColumn.contains(desktopRow)).toBe(true);

		const aside = document.querySelector('aside') as HTMLElement;
		expect(aside.contains(desktopRow)).toBe(false);
		expect(aside.querySelector('[role="group"][aria-label="Interface language"]')).toBeNull();

		// Clicking RU switches locale
		const ruButton = desktopRow.querySelector('button:last-child') as HTMLButtonElement;
		expect(ruButton.textContent?.trim()).toBe('RU');
		await userEvent.click(ruButton);
		expect(window.localStorage.getItem(STORAGE_KEY)).toBe('ru');
		expect(document.documentElement.lang).toBe('ru');
	});

	it('renders exactly one visible language switcher in mobile header at 375x667', async () => {
		await page.viewport(375, 667);
		renderLayout();

		const desktopRow = document.querySelector('.app-desktop-utility-row') as HTMLDivElement;
		expect(desktopRow).not.toBeNull();
		expect(getComputedStyle(desktopRow).display).toBe('none');

		const mobileHeader = document.querySelector('header.lg\\:hidden') as HTMLElement;
		expect(mobileHeader).not.toBeNull();
		expect(getComputedStyle(mobileHeader).display).not.toBe('none');
		expect(mobileHeader.querySelector('[role="group"][aria-label="Interface language"]')).not.toBeNull();
	});

	it('toggles visibility at the 1024px responsive breakpoint boundary', async () => {
		// 1023px: mobile active, desktop hidden
		await page.viewport(1023, 768);
		renderLayout();

		const desktopRow = document.querySelector('.app-desktop-utility-row') as HTMLDivElement;
		const mobileHeader = document.querySelector('header.lg\\:hidden') as HTMLElement;

		expect(getComputedStyle(desktopRow).display).toBe('none');
		expect(getComputedStyle(mobileHeader).display).not.toBe('none');

		// 1024px: desktop active, mobile hidden
		await page.viewport(1024, 768);
		expect(getComputedStyle(desktopRow).display).toBe('flex');
		expect(getComputedStyle(mobileHeader).display).toBe('none');
	});
});
