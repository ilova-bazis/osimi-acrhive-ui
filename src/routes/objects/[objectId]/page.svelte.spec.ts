import { page } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { locale } from '$lib/i18n/locale';

const { invalidateAllMock } = vi.hoisted(() => ({
	invalidateAllMock: vi.fn()
}));

vi.mock('$app/navigation', () => ({
	invalidateAll: invalidateAllMock
}));

vi.mock('$app/paths', () => ({
	resolve: (path: string) => path
}));

import ObjectDetailPage from './+page.svelte';
import type { ObjectDetail } from '$lib/services/objects';

const detail: ObjectDetail = {
	id: 'row-1',
	objectId: 'OBJ-20260804-CHECKSUM1',
	thumbnailArtifactId: null,
	title: 'Checksum archive sample',
	type: 'document',
	processingState: 'index_done',
	curationState: 'reviewed',
	availabilityState: 'AVAILABLE',
	accessLevel: 'private',
	language: 'en',
	tags: [],
	tenantId: 'tenant-1',
	sourceIngestionId: null,
	sourceBatchLabel: null,
	metadata: {},
	embargoUntil: null,
	embargoKind: 'none',
	embargoCurationState: null,
	rightsNote: null,
	sensitivityNote: null,
	canDownload: true,
	accessReasonCode: 'OK',
	createdAt: '2026-08-04T12:00:00.000Z',
	updatedAt: '2026-08-04T13:00:00.000Z',
	ingestManifest: null,
	isAuthorized: true,
	isDeliverable: true
};

const pageData = () => ({
	detail,
	backHref: '/objects',
	viewer: {
		mediaType: 'image' as const,
		primarySource: {
			sourceType: 'preview' as const,
			artifactKind: 'preview' as const,
			variant: null,
			status: 'available' as const,
			availableFileId: null,
			artifactId: null,
			displayName: null,
			contentType: null,
			sizeBytes: null,
			accessReasonCode: 'OK' as const
		},
		activeRequest: null,
		previewArtifacts: {
			thumbnail: null,
			poster: null,
			ocrText: null,
			transcript: null,
			captions: null
		},
		viewerPayload: {
			kind: 'image' as const,
			artifactId: null,
			contentType: null,
			width: null,
			height: null
		}
	},
	artifacts: [],
	artifactsError: null,
	availableFiles: [],
	availableFilesError: null,
	pendingRequests: [],
	pendingRequestsError: null,
	session: { role: 'admin' as const }
});

describe('/objects/[objectId] +page.svelte localization', () => {
	afterEach(() => {
		locale.setLocale('en');
		vi.unstubAllGlobals();
	});

	it('resolves object detail keys instead of rendering raw key paths', async () => {
		render(ObjectDetailPage, { data: pageData() });

		await expect.element(page.getByText(/objects\.detail/)).not.toBeInTheDocument();
		await expect.element(page.getByText('View mode')).toBeInTheDocument();
		await expect.element(page.getByText(/Image object/)).toBeInTheDocument();
		await expect
			.element(page.getByText('Media available in read-only mode'))
			.toBeInTheDocument();

		await page.getByRole('button', { name: 'Support' }).click();
		await expect
			.element(page.getByText('No artifacts found for this object.'))
			.toBeInTheDocument();
	});

	it('renders the same fragments in Russian', async () => {
		locale.setLocale('ru');
		render(ObjectDetailPage, { data: pageData() });

		await expect.element(page.getByText(/objects\.detail/)).not.toBeInTheDocument();
		await expect.element(page.getByText('Режим просмотра')).toBeInTheDocument();
		await expect.element(page.getByText('Объект типа изображение')).toBeInTheDocument();
		await expect
			.element(page.getByText('Медиа доступно в режиме чтения'))
			.toBeInTheDocument();
		await expect.element(page.getByText('Индекс готов')).toBeInTheDocument();
		await expect.element(page.getByText('Доступен', { exact: true })).toBeInTheDocument();
		await expect.element(page.getByText('index_done')).not.toBeInTheDocument();

		await page.getByRole('button', { name: 'Поддержка' }).click();
		await expect
			.element(page.getByText('Для этого объекта артефакты не найдены.'))
			.toBeInTheDocument();
	});

	it('opens the support sheet with translated English tab labels', async () => {
		render(ObjectDetailPage, { data: pageData() });

		await page.getByRole('button', { name: 'Support' }).click();

		for (const label of ['Files', 'Access', 'Requests', 'Raw ingest']) {
			await expect
				.element(page.getByRole('button', { name: label, exact: true }))
				.toBeInTheDocument();
		}
		await expect.element(page.getByText(/detail\.tabs/)).not.toBeInTheDocument();
	});

	it('opens the support sheet with translated Russian tab labels', async () => {
		locale.setLocale('ru');
		render(ObjectDetailPage, { data: pageData() });

		await page.getByRole('button', { name: 'Поддержка' }).click();

		for (const label of ['Файлы', 'Доступ', 'Запросы', 'Исходные данные']) {
			await expect
				.element(page.getByRole('button', { name: label, exact: true }))
				.toBeInTheDocument();
		}
		await expect.element(page.getByText(/detail\.tabs/)).not.toBeInTheDocument();
	});

	it('retranslates the support sheet after switching locale without remounting', async () => {
		render(ObjectDetailPage, { data: pageData() });

		await page.getByRole('button', { name: 'Support' }).click();
		await expect
			.element(page.getByRole('button', { name: 'Files', exact: true }))
			.toBeInTheDocument();

		locale.setLocale('ru');

		await expect
			.element(page.getByRole('button', { name: 'Файлы', exact: true }))
			.toBeInTheDocument();
	});

	it('localizes known archive request actions and statuses in Russian', async () => {
		const data = pageData();
		data.pendingRequests = [{
			id: 'req-1', tenantId: 'tenant-1', targetType: 'object', targetId: detail.objectId,
			actionType: 'object_resync', requestedBy: 'user-1', dedupeKey: null,
			status: 'PROCESSING', failureReason: null, createdAt: '2026-08-04T12:00:00.000Z',
			updatedAt: '2026-08-04T12:01:00.000Z', completedAt: null
		}] as unknown as typeof data.pendingRequests;
		locale.setLocale('ru');
		render(ObjectDetailPage, { data });

		await page.getByRole('button', { name: 'Поддержка' }).click();
		await page.getByRole('button', { name: 'Запросы', exact: true }).click();
		await expect.element(page.getByText('Синхронизация объекта')).toBeInTheDocument();
		await expect.element(page.getByText('Выполняется')).toBeInTheDocument();
		await expect.element(page.getByText('object_resync')).not.toBeInTheDocument();
	});

	it('localizes the typed access reason in Russian without raw codes', async () => {
		locale.setLocale('ru');
		render(ObjectDetailPage, { data: pageData() });

		await page.getByRole('button', { name: 'Поддержка' }).click();
		await page.getByRole('button', { name: 'Доступ', exact: true }).click();

		await expect
			.element(page.getByText('Доступно для скачивания', { exact: true }))
			.toBeInTheDocument();
		await expect.element(page.getByText('OK', { exact: true })).not.toBeInTheDocument();
	});

	it('localizes the typed access reason in English without raw codes', async () => {
		render(ObjectDetailPage, { data: pageData() });

		await page.getByRole('button', { name: 'Support' }).click();
		await page.getByRole('button', { name: 'Access', exact: true }).click();

		await expect
			.element(page.getByText('Available to download', { exact: true }))
			.toBeInTheDocument();
		await expect.element(page.getByText('OK', { exact: true })).not.toBeInTheDocument();
	});

	it('renders a localized info drawer', async () => {
		render(ObjectDetailPage, { data: pageData() });

		await page.getByRole('button', { name: 'Info' }).click();

		await expect.element(page.getByText('Object info')).toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Close info panel' }))
			.toBeInTheDocument();
	});

	it('renders a localized Russian info drawer', async () => {
		locale.setLocale('ru');
		render(ObjectDetailPage, { data: pageData() });

		await page.getByRole('button', { name: 'Информация' }).click();

		await expect.element(page.getByText('Информация об объекте')).toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Закрыть панель информации' }))
			.toBeInTheDocument();
	});

	it('renders artifact timestamps with date and time in UTC', async () => {
		const data = pageData();
		data.artifacts = [
			{
				id: 'a-1',
				kind: 'preview',
				variant: null,
				storageKey: 'stor-1',
				contentType: 'image/jpeg',
				sizeBytes: 512,
				createdAt: '2026-08-04T12:34:56.000Z'
			}
		] as unknown as typeof data.artifacts;
		render(ObjectDetailPage, { data });

		await page.getByRole('button', { name: 'Support' }).click();

		await expect.element(page.getByText(/12:34/)).toBeInTheDocument();
	});

	it('falls back to the unknown marker for invalid timestamps', async () => {
		const data = pageData();
		data.artifacts = [
			{
				id: 'a-1',
				kind: 'preview',
				variant: null,
				storageKey: 'stor-1',
				contentType: 'image/jpeg',
				sizeBytes: 512,
				createdAt: 'not-a-date'
			}
		] as unknown as typeof data.artifacts;
		render(ObjectDetailPage, { data });

		await page.getByRole('button', { name: 'Support' }).click();

		await expect.element(page.getByText('—')).toBeInTheDocument();
	});

	it('localizes the media request banner in Russian', async () => {
		locale.setLocale('ru');
		const data = pageData();
		data.viewer = {
			...data.viewer,
			primarySource: {
				...data.viewer.primarySource,
				status: 'request_required' as const,
				availableFileId: '11111111-1111-4111-8111-111111111111'
			}
		} as unknown as typeof data.viewer;
		render(ObjectDetailPage, { data });

		await expect.element(page.getByText('Хранится в архиве')).toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Запросить доступ' }))
			.toBeInTheDocument();
	});

	it('keeps the hidden request form when request_required has a target', async () => {
		const data = pageData();
		data.viewer = {
			...data.viewer,
			primarySource: {
				...data.viewer.primarySource,
				status: 'request_required' as const,
				availableFileId: '11111111-1111-4111-8111-111111111111'
			}
		} as unknown as typeof data.viewer;
		render(ObjectDetailPage, { data });

		const form = document.querySelector(
			'form.hidden[action="?/requestDownload"]'
		) as HTMLFormElement | null;
		expect(form).not.toBeNull();
		expect(
			(form?.querySelector('input[name="availableFileId"]') as HTMLInputElement | null)?.value
		).toBe('11111111-1111-4111-8111-111111111111');
	});

	it('hides the request action and form when request_required lacks a target', async () => {
		const data = pageData();
		data.viewer = {
			...data.viewer,
			primarySource: {
				...data.viewer.primarySource,
				status: 'request_required' as const,
				availableFileId: null
			}
		} as unknown as typeof data.viewer;
		render(ObjectDetailPage, { data });

		await expect.element(page.getByText('Stored in archive')).toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Request access' }))
			.not.toBeInTheDocument();
		expect(document.querySelector('form.hidden[action="?/requestDownload"]')).toBeNull();
	});

	it('treats blank request targets as missing', async () => {
		const data = pageData();
		data.viewer = {
			...data.viewer,
			primarySource: {
				...data.viewer.primarySource,
				status: 'request_required' as const,
				availableFileId: '   '
			}
		} as unknown as typeof data.viewer;
		render(ObjectDetailPage, { data });

		await expect
			.element(page.getByRole('button', { name: 'Request access' }))
			.not.toBeInTheDocument();
		expect(document.querySelector('form.hidden[action="?/requestDownload"]')).toBeNull();
	});

	it('localizes the unavailable viewer state in Russian', async () => {
		locale.setLocale('ru');
		const data = pageData();
		data.viewer = null as unknown as typeof data.viewer;
		render(ObjectDetailPage, { data });

		await expect.element(page.getByText('Просмотр недоступен')).toBeInTheDocument();
	});

	it('localizes audio viewer transcript and captions labels in Russian', async () => {
		locale.setLocale('ru');
		const data = pageData();
		data.viewer = {
			...data.viewer,
			mediaType: 'audio' as const,
			primarySource: { ...data.viewer.primarySource, status: 'available' as const },
			previewArtifacts: {
				thumbnail: null,
				poster: null,
				ocrText: null,
				transcript: {
					available: true,
					artifactId: 'tr-1',
					contentType: 'text/plain',
					displayName: null,
					metadata: {}
				},
				captions: null
			},
			viewerPayload: {
				kind: 'audio' as const,
				artifactId: 'au-1',
				contentType: 'audio/mpeg',
				transcriptArtifactId: 'tr-1',
				durationSeconds: null
			}
		} as unknown as typeof data.viewer;
		render(ObjectDetailPage, { data });

		await expect.element(page.getByText('Комната прослушивания')).toBeInTheDocument();
		await expect.element(page.getByText('Транскрипция')).toBeInTheDocument();
	});

	it('localizes document page labels in Russian', async () => {
		locale.setLocale('ru');
		const data = pageData();
		data.viewer = {
			...data.viewer,
			mediaType: 'document' as const,
			primarySource: { ...data.viewer.primarySource, status: 'available' as const },
			previewArtifacts: {
				thumbnail: null,
				poster: null,
				ocrText: null,
				transcript: null,
				captions: null
			},
			viewerPayload: {
				kind: 'document' as const,
				artifactId: null,
				contentType: 'application/pdf',
				ocrTextArtifactId: null,
				pageCount: 1,
				pages: [
					{
						pageNumber: 1,
						label: null,
						imageArtifactId: 'p-1',
						ocrTextArtifactId: null
					}
				]
			}
		} as unknown as typeof data.viewer;
		render(ObjectDetailPage, { data });

		await expect.element(page.getByText('Страница 1')).toBeInTheDocument();
	});

	it('localizes image zoom controls in Russian', async () => {
		locale.setLocale('ru');
		const data = pageData();
		data.viewer = {
			...data.viewer,
			mediaType: 'image' as const,
			primarySource: { ...data.viewer.primarySource, status: 'available' as const },
			previewArtifacts: {
				thumbnail: null,
				poster: null,
				ocrText: null,
				transcript: null,
				captions: null
			},
			viewerPayload: {
				kind: 'image' as const,
				artifactId: 'img-1',
				contentType: 'image/jpeg',
				width: 640,
				height: 480
			}
		} as unknown as typeof data.viewer;
		render(ObjectDetailPage, { data });

		await expect.element(page.getByText('Приблизить для осмотра')).toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Приблизить' }))
			.toBeInTheDocument();
	});

	it('routes distinct per-page OCR artifacts through the document viewer', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(
				new Response('ocr body', { status: 200, headers: { 'content-type': 'text/plain' } })
			);
		vi.stubGlobal('fetch', fetchMock);

		const data = pageData();
		data.viewer = {
			...data.viewer,
			mediaType: 'document' as const,
			primarySource: { ...data.viewer.primarySource, status: 'available' as const },
			previewArtifacts: {
				thumbnail: null,
				poster: null,
				ocrText: null,
				transcript: null,
				captions: null
			},
			viewerPayload: {
				kind: 'document' as const,
				artifactId: null,
				contentType: 'application/pdf',
				ocrTextArtifactId: null,
				pageCount: 2,
				pages: [
					{
						pageNumber: 1,
						label: 'Page 1',
						imageArtifactId: 'img-1',
						ocrTextArtifactId: 'ocr-1'
					},
					{
						pageNumber: 2,
						label: 'Page 2',
						imageArtifactId: 'img-2',
						ocrTextArtifactId: 'ocr-2'
					}
				]
			}
		} as unknown as typeof data.viewer;
		render(ObjectDetailPage, { data });

		await page.getByRole('button', { name: 'OCR' }).click();

		await vi.waitFor(() => {
			expect(fetchMock.mock.calls.length).toBe(2);
		});
		const urls = fetchMock.mock.calls.map(([url]) => String(url));
		expect(urls.filter((url) => url.endsWith('/artifacts/ocr-1/view')).length).toBe(1);
		expect(urls.filter((url) => url.endsWith('/artifacts/ocr-2/view')).length).toBe(1);
	});

	it('routes aggregate-only document OCR through a single document-level preview', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(
				new Response('ocr body', { status: 200, headers: { 'content-type': 'text/plain' } })
			);
		vi.stubGlobal('fetch', fetchMock);

		const data = pageData();
		data.viewer = {
			...data.viewer,
			mediaType: 'document' as const,
			primarySource: { ...data.viewer.primarySource, status: 'available' as const },
			previewArtifacts: {
				thumbnail: null,
				poster: null,
				ocrText: null,
				transcript: null,
				captions: null
			},
			viewerPayload: {
				kind: 'document' as const,
				artifactId: null,
				contentType: 'application/pdf',
				ocrTextArtifactId: 'ocr-agg',
				pageCount: 1,
				pages: []
			}
		} as unknown as typeof data.viewer;
		render(ObjectDetailPage, { data });

		await page.getByRole('button', { name: 'OCR' }).click();

		await expect.element(page.getByText('Document OCR')).toBeInTheDocument();
		await vi.waitFor(() => {
			expect(fetchMock.mock.calls.length).toBe(1);
		});
		expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/artifacts/ocr-agg/view');
	});

	it('opens a semantic resync confirmation dialog', async () => {
		render(ObjectDetailPage, { data: pageData() });

		await page.getByRole('button', { name: 'Resync' }).click();

		await expect.element(page.getByRole('dialog', { name: 'Confirm resync' })).toBeInTheDocument();
	});
});

describe('object detail count localization', () => {
	it('renders Russian plural forms for artifact, file, request, and page counts', async () => {
		locale.setLocale('ru');
		try {
			const data = pageData();
			data.artifacts = [
				{
					id: 'art-1', kind: 'pdf', variant: null, storageKey: 'k1', contentType: 'application/pdf',
					sizeBytes: 100, createdAt: '2026-08-04T00:00:00.000Z'
				},
				{
					id: 'art-2', kind: 'ocr_text', variant: null, storageKey: 'k2', contentType: 'text/plain',
					sizeBytes: 100, createdAt: '2026-08-04T00:00:00.000Z'
				}
			] as unknown as typeof data.artifacts;
			data.availableFiles = [
				{
					id: '11111111-1111-4111-8111-111111111111', archiveFileKey: 'k1', artifactKind: 'pdf',
					variant: null, displayName: 'report.pdf', contentType: 'application/pdf', sizeBytes: 100,
					checksumSha256: null, metadata: {}, isAvailable: true, syncedAt: '2026-08-04T00:00:00.000Z'
				},
				{
					id: '22222222-2222-4222-8222-222222222222', archiveFileKey: 'k2', artifactKind: 'ocr_text',
					variant: null, displayName: 'ocr.txt', contentType: 'text/plain', sizeBytes: 100,
					checksumSha256: null, metadata: {}, isAvailable: true, syncedAt: '2026-08-04T00:00:00.000Z'
				}
			] as unknown as typeof data.availableFiles;
			render(ObjectDetailPage, { data });

			await page.getByRole('button', { name: 'Поддержка' }).click();
			await expect.element(page.getByText('2 файла').nth(0)).toBeInTheDocument();
			await expect.element(page.getByText('2 файла').nth(1)).toBeInTheDocument();
		} finally {
			locale.setLocale('en');
		}
	});

	it('renders English singular page counts', async () => {
		const data = pageData();
		data.viewer = {
			...data.viewer,
			mediaType: 'document' as const,
			primarySource: { ...data.viewer.primarySource, status: 'available' as const },
			previewArtifacts: {
				thumbnail: null,
				poster: null,
				ocrText: null,
				transcript: null,
				captions: null
			},
			viewerPayload: {
				kind: 'document' as const,
				artifactId: 'pdf-1',
				contentType: 'application/pdf',
				ocrTextArtifactId: null,
				pageCount: 1,
				pages: [
					{
						pageNumber: 1,
						label: null,
						imageArtifactId: 'p-1',
						ocrTextArtifactId: null
					}
				]
			}
		} as unknown as typeof data.viewer;
		render(ObjectDetailPage, { data });

		await expect.element(page.getByText('1 page')).toBeInTheDocument();
	});
});
