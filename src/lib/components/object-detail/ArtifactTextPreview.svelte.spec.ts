import { page } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { locale } from '$lib/i18n/locale';

import ArtifactTextPreview from './ArtifactTextPreview.svelte';

const fetchMock = vi.fn();

const textResponse = (body = 'hello world', contentType = 'text/plain') =>
	new Response(body, { status: 200, headers: { 'content-type': contentType } });

const fakeResponse = (overrides: {
	ok?: boolean;
	redirected?: boolean;
	url?: string;
	contentType?: string | null;
	text: () => Promise<string>;
}): Response =>
	({
		ok: overrides.ok ?? true,
		redirected: overrides.redirected ?? false,
		url: overrides.url ?? '',
		headers: new Headers(
			overrides.contentType === undefined
				? { 'content-type': 'text/plain' }
				: overrides.contentType === null
					? {}
					: { 'content-type': overrides.contentType }
		),
		text: overrides.text
	}) as Response;

const renderPreview = (url: string | null = '/artifacts/text-1/view', emptyLabel?: string) =>
	render(ArtifactTextPreview, {
		title: 'Text preview',
		url,
		...(emptyLabel === undefined ? {} : { emptyLabel })
	});

describe('ArtifactTextPreview', () => {
	beforeEach(() => {
		fetchMock.mockReset();
		vi.stubGlobal('fetch', fetchMock);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		locale.setLocale('en');
	});

	it('renders plain text bodies', async () => {
		fetchMock.mockResolvedValue(textResponse('hello world'));
		renderPreview();

		await expect.element(page.getByText('hello world')).toBeInTheDocument();
	});

	it('renders WebVTT bodies', async () => {
		fetchMock.mockResolvedValue(textResponse('WEBVTT', 'text/vtt'));
		renderPreview();

		await expect.element(page.getByText('WEBVTT')).toBeInTheDocument();
	});

	it('accepts case-insensitive media types with parameters', async () => {
		fetchMock.mockResolvedValue(textResponse('normalized body', 'Text/Plain; charset=utf-8'));
		renderPreview();

		await expect.element(page.getByText('normalized body')).toBeInTheDocument();
	});

	it('shows the supplied empty label for whitespace-only bodies', async () => {
		fetchMock.mockResolvedValue(textResponse('   \n  '));
		renderPreview('/artifacts/text-1/view', 'Nothing to show');

		await expect.element(page.getByText('Nothing to show')).toBeInTheDocument();
	});

	it('fails on non-OK responses', async () => {
		fetchMock.mockResolvedValue(new Response('nope', { status: 500 }));
		renderPreview();

		await expect.element(page.getByText('Unable to load preview.')).toBeInTheDocument();
	});

	it('rejects redirected responses without reading their body', async () => {
		const textSpy = vi.fn().mockResolvedValue('redirected body');
		fetchMock.mockResolvedValue(
			fakeResponse({ redirected: true, url: 'https://api.example.test/artifact', text: textSpy })
		);
		renderPreview();

		await expect.element(page.getByText('Unable to load preview.')).toBeInTheDocument();
		expect(textSpy).not.toHaveBeenCalled();
	});

	it('rejects successful responses whose final URL is the login page', async () => {
		const textSpy = vi.fn().mockResolvedValue('<html>login form</html>');
		fetchMock.mockResolvedValue(fakeResponse({ url: '/login', text: textSpy }));
		renderPreview();

		await expect.element(page.getByText('Unable to load preview.')).toBeInTheDocument();
		expect(textSpy).not.toHaveBeenCalled();
	});

	it('rejects successful responses whose final URL is inside the login area', async () => {
		const textSpy = vi.fn().mockResolvedValue('<html>login form</html>');
		fetchMock.mockResolvedValue(fakeResponse({ url: '/login?next=/objects', text: textSpy }));
		renderPreview();

		await expect.element(page.getByText('Unable to load preview.')).toBeInTheDocument();
		expect(textSpy).not.toHaveBeenCalled();
	});

	it('rejects responses without a content type', async () => {
		const textSpy = vi.fn().mockResolvedValue('body without mime');
		fetchMock.mockResolvedValue(fakeResponse({ contentType: null, text: textSpy }));
		renderPreview();

		await expect.element(page.getByText('Unable to load preview.')).toBeInTheDocument();
		expect(textSpy).not.toHaveBeenCalled();
	});

	it.each(['image/png', 'application/pdf', 'text/html'])(
		'rejects the %s media type without reading its body',
		async (contentType) => {
			const textSpy = vi.fn().mockResolvedValue('should not be read');
			fetchMock.mockResolvedValue(fakeResponse({ contentType, text: textSpy }));
			renderPreview();

			await expect.element(page.getByText('Unable to load preview.')).toBeInTheDocument();
			expect(textSpy).not.toHaveBeenCalled();
		}
	);

	it('renders the localized failure message in Russian', async () => {
		locale.setLocale('ru');
		fetchMock.mockResolvedValue(new Response('nope', { status: 500 }));
		renderPreview();

		await expect
			.element(page.getByText('Не удалось загрузить предпросмотр.'))
			.toBeInTheDocument();
	});

	it('ignores stale responses after the url changes', async () => {
		let resolveStale: (response: Response) => void = () => undefined;
		const staleFetch = vi
			.fn()
			.mockImplementationOnce(
				() => new Promise<Response>((resolve) => (resolveStale = resolve))
			)
			.mockResolvedValue(textResponse('fresh body'));
		vi.stubGlobal('fetch', staleFetch);

		const view = renderPreview('/artifacts/stale/view');
		await view.rerender({
			title: 'Text preview',
			url: '/artifacts/fresh/view'
		});
		await expect.element(page.getByText('fresh body')).toBeInTheDocument();

		resolveStale(textResponse('stale body'));
		await new Promise((resolve) => setTimeout(resolve, 50));
		await expect.element(page.getByText('stale body')).not.toBeInTheDocument();
	});
});
