import { page } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { locale } from '$lib/i18n/locale';
import type {
	DocumentViewerPayload,
	ObjectViewer,
	ObjectViewerDocumentPage
} from '$lib/services/objects';

import ObjectViewerCanvas from './ObjectViewerCanvas.svelte';

const fetchMock = vi.fn();

const textResponse = () =>
	new Response('ocr body', { status: 200, headers: { 'content-type': 'text/plain' } });

const primarySource = (status: ObjectViewer['primarySource']['status'] = 'available') =>
	({
		sourceType: 'access_copy',
		artifactKind: 'pdf',
		variant: null,
		status,
		availableFileId: '11111111-1111-4111-8111-111111111111',
		artifactId: null,
		displayName: null,
		contentType: null,
		sizeBytes: null,
		accessReasonCode: 'OK'
	}) as ObjectViewer['primarySource'];

const previewArtifacts = (overrides: Partial<ObjectViewer['previewArtifacts']> = {}) =>
	({
		thumbnail: null,
		poster: null,
		ocrText: null,
		transcript: null,
		captions: null,
		...overrides
	}) as ObjectViewer['previewArtifacts'];

const documentViewer = (
	pages: ObjectViewerDocumentPage[],
	extra: Partial<DocumentViewerPayload> = {}
): ObjectViewer => ({
	mediaType: 'document',
	primarySource: primarySource(),
	activeRequest: null,
	previewArtifacts: previewArtifacts(),
	viewerPayload: {
		kind: 'document',
		artifactId: null,
		contentType: 'application/pdf',
		ocrTextArtifactId: null,
		pageCount: pages.length,
		pages,
		...extra
	}
});

const imageViewer = (
	artifactId: string | null,
	status: ObjectViewer['primarySource']['status'] = 'available'
): ObjectViewer => ({
	mediaType: 'image',
	primarySource: primarySource(status),
	activeRequest: null,
	previewArtifacts: previewArtifacts(),
	viewerPayload: {
		kind: 'image',
		artifactId,
		contentType: artifactId ? 'image/jpeg' : null,
		width: 640,
		height: 480
	}
});

const audioViewer = (
	artifactId: string | null,
	transcriptArtifactId: string | null = null
): ObjectViewer => ({
	mediaType: 'audio',
	primarySource: primarySource(),
	activeRequest: null,
	previewArtifacts: previewArtifacts(),
	viewerPayload: {
		kind: 'audio',
		artifactId,
		contentType: artifactId ? 'audio/mpeg' : null,
		transcriptArtifactId,
		durationSeconds: null
	}
});

const videoViewer = (
	artifactId: string | null,
	captionsArtifactId: string | null = null
): ObjectViewer => ({
	mediaType: 'video',
	primarySource: primarySource(),
	activeRequest: null,
	previewArtifacts: previewArtifacts(),
	viewerPayload: {
		kind: 'video',
		artifactId,
		contentType: artifactId ? 'video/mp4' : null,
		posterArtifactId: 'poster-1',
		transcriptArtifactId: null,
		captionsArtifactId,
		durationSeconds: null
	}
});

const renderCanvas = (
	viewer: ObjectViewer | null,
	onRequest: (() => void) | undefined = undefined
) =>
	render(ObjectViewerCanvas, {
		objectId: 'OBJ-20260801-CANVAS1',
		title: 'Canvas object',
		viewer,
		onRequest
	});

describe('ObjectViewerCanvas', () => {
	beforeEach(() => {
		fetchMock.mockReset();
		fetchMock.mockImplementation(() => Promise.resolve(textResponse()));
		vi.stubGlobal('fetch', fetchMock);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		locale.setLocale('en');
	});

	it('fetches each page OCR artifact exactly once after enabling OCR', async () => {
		const viewer = documentViewer([
			{ pageNumber: 1, label: 'Page 1', imageArtifactId: 'img-1', ocrTextArtifactId: 'ocr-1' },
			{ pageNumber: 2, label: 'Page 2', imageArtifactId: 'img-2', ocrTextArtifactId: 'ocr-2' }
		]);
		renderCanvas(viewer);

		await page.getByRole('button', { name: 'OCR' }).click();

		await vi.waitFor(() => {
			expect(fetchMock.mock.calls.length).toBe(2);
		});
		const urls = fetchMock.mock.calls.map(([url]) => String(url));
		expect(urls.filter((url) => url.endsWith('/artifacts/ocr-1/view')).length).toBe(1);
		expect(urls.filter((url) => url.endsWith('/artifacts/ocr-2/view')).length).toBe(1);
	});

	it('renders OCR-only pages and loads their OCR without a toggle', async () => {
		const viewer = documentViewer([
			{ pageNumber: 1, label: 'Page 1', imageArtifactId: null, ocrTextArtifactId: 'ocr-1' }
		]);
		renderCanvas(viewer);

		await expect.element(page.getByText('Page 1', { exact: true })).toBeInTheDocument();
		await expect.element(page.getByAltText('Canvas object Page 1')).not.toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'OCR' })).not.toBeInTheDocument();

		await vi.waitFor(() => {
			expect(fetchMock.mock.calls.length).toBe(1);
		});
		expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/artifacts/ocr-1/view');
	});

	it('never uses aggregate OCR as page OCR', async () => {
		const viewer = documentViewer(
			[{ pageNumber: 1, label: 'Page 1', imageArtifactId: 'img-1', ocrTextArtifactId: null }],
			{ ocrTextArtifactId: 'ocr-agg' }
		);
		renderCanvas(viewer);

		await page.getByRole('button', { name: 'OCR' }).click();

		await expect.element(page.getByText('Document OCR')).toBeInTheDocument();
		await expect.element(page.getByText(/OCR excerpt/)).not.toBeInTheDocument();
		await vi.waitFor(() => {
			expect(fetchMock.mock.calls.length).toBe(1);
		});
		expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/artifacts/ocr-agg/view');
	});

	it('omits pages without image or OCR and counts rendered pages', async () => {
		const viewer = documentViewer([
			{ pageNumber: 1, label: 'Page 1', imageArtifactId: null, ocrTextArtifactId: null },
			{ pageNumber: 2, label: 'Page 2', imageArtifactId: 'img-2', ocrTextArtifactId: null }
		]);
		renderCanvas(viewer);

		await expect.element(page.getByAltText('Canvas object Page 2')).toBeInTheDocument();
		await expect.element(page.getByText('Page 1')).not.toBeInTheDocument();
		await expect.element(page.getByText('1 / 1')).toBeInTheDocument();
	});

	it('shows aggregate OCR once for aggregate-only documents', async () => {
		const viewer = documentViewer([], { ocrTextArtifactId: 'ocr-agg', pageCount: 1 });
		renderCanvas(viewer);

		await expect.element(page.getByText('Media preview unavailable')).toBeInTheDocument();

		await page.getByRole('button', { name: 'OCR' }).click();

		await expect.element(page.getByText('Document OCR')).toBeInTheDocument();
		await expect.element(page.getByText('Media preview unavailable')).not.toBeInTheDocument();
		await vi.waitFor(() => {
			expect(fetchMock.mock.calls.length).toBe(1);
		});
		expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/artifacts/ocr-agg/view');
	});

	it('shows a localized empty state for documents without usable content', async () => {
		renderCanvas(documentViewer([], { pageCount: 1 }));

		await expect.element(page.getByText('Media preview unavailable')).toBeInTheDocument();
		await expect.element(page.getByText(/1 \/ /)).not.toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'OCR' })).not.toBeInTheDocument();
	});

	it('does not duplicate the empty state for non-available documents', async () => {
		const viewer = documentViewer([], { pageCount: 1 });
		viewer.primarySource = primarySource('request_required');
		renderCanvas(viewer);

		await expect.element(page.getByText('Stored in archive')).toBeInTheDocument();
		await expect.element(page.getByText('Media preview unavailable')).not.toBeInTheDocument();
	});

	it('shows an empty state without zoom controls for images without an artifact', async () => {
		renderCanvas(imageViewer(null));

		await expect.element(page.getByText('Media preview unavailable')).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Zoom in' })).not.toBeInTheDocument();
	});

	it('localizes the image empty state in Russian', async () => {
		locale.setLocale('ru');
		renderCanvas(imageViewer(null));

		await expect
			.element(page.getByText('Предпросмотр медиа недоступен'))
			.toBeInTheDocument();
	});

	it('keeps transcript previews when the audio artifact is missing', async () => {
		renderCanvas(audioViewer(null, 'tr-1'));

		await expect.element(page.getByText('Media preview unavailable')).toBeInTheDocument();
		await expect.element(page.getByText('Transcript')).toBeInTheDocument();
		await expect.element(page.getByText('Listening room')).not.toBeInTheDocument();
		expect(document.querySelector('audio')).toBeNull();

		await vi.waitFor(() => {
			expect(fetchMock.mock.calls.length).toBe(1);
		});
		expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/artifacts/tr-1/view');
	});

	it('renders no caption tracks for an audio artifact', async () => {
		renderCanvas(audioViewer('au-1'));

		await expect.element(page.getByText('Listening room')).toBeInTheDocument();
		expect(document.querySelector('audio')).not.toBeNull();
		expect(document.querySelector('track')).toBeNull();
	});

	it('keeps caption previews without media or track elements for video', async () => {
		renderCanvas(videoViewer(null, 'cap-1'));

		await expect.element(page.getByText('Media preview unavailable')).toBeInTheDocument();
		await expect.element(page.getByText('Captions')).toBeInTheDocument();
		expect(document.querySelector('video')).toBeNull();
		expect(document.querySelector('track')).toBeNull();

		await vi.waitFor(() => {
			expect(fetchMock.mock.calls.length).toBe(1);
		});
		expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/artifacts/cap-1/view');
	});

	it('hides the request action when archived media has no request callback', async () => {
		renderCanvas(imageViewer(null, 'request_required'));

		await expect.element(page.getByText('Stored in archive')).toBeInTheDocument();
		await expect
			.element(page.getByText('This image is not currently available for access.'))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Request access' }))
			.not.toBeInTheDocument();
	});

	it('keeps the request action working when archived media has a callback', async () => {
		const onRequest = vi.fn();
		renderCanvas(imageViewer(null, 'request_required'), onRequest);

		await page.getByRole('button', { name: 'Request access' }).click();

		expect(onRequest).toHaveBeenCalledTimes(1);
	});
});
