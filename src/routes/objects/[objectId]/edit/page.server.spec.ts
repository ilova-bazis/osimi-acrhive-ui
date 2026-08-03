import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError } from '$lib/server/apiClient';
import { ObjectEditLockedError, ObjectEditRevisionConflictError } from '$lib/services/objectEdit';

const {
	getObjectEditPayloadMock,
	saveObjectMetadataMock,
	saveDocumentCurationMock,
	submitObjectCurationMock,
} = vi.hoisted(() => ({
	getObjectEditPayloadMock: vi.fn(),
	saveObjectMetadataMock: vi.fn(),
	saveDocumentCurationMock: vi.fn(),
	submitObjectCurationMock: vi.fn(),
}));

vi.mock('$lib/services', () => ({
	objectEditService: {
		getObjectEditPayload: getObjectEditPayloadMock,
		saveObjectMetadata: saveObjectMetadataMock,
		saveDocumentCuration: saveDocumentCurationMock,
		submitObjectCuration: submitObjectCurationMock,
	},
}));

import { actions, load } from './+page.server';

const session = { id: 'u1', username: 'test', tenantId: null, role: 'archiver' };

const baseEditPayload = {
	objectId: 'OBJ-1',
	revision: 4,
	mediaType: 'document',
	lock: { locked: true, lockedBy: 'u1', lockedUntil: '2026-05-23T19:00:00.000Z' },
	curationState: 'draft',
	draft: null,
	metadata: {
		title: 'Object title',
		publicationDate: '2026',
		datePrecision: 'year',
		dateApproximate: false,
		language: 'en',
		tags: ['archive'],
		people: ['Ada'],
		description: 'Description',
	},
	rights: {
		accessLevel: 'family',
		rightsNote: 'Rights',
		sensitivityNote: null,
	},
	capabilities: {
		canEditMetadata: true,
		canCurateText: true,
		canSubmitReview: true,
	},
	curation: {
		kind: 'document',
		machineOcrArtifactId: 'ocr-1',
		pageCount: 1,
		pages: [
			{ pageNumber: 1, label: '1', machineText: 'Raw', curatedText: 'Curated', status: 'edited' },
		],
	},
} as const;

const makeEvent = (body?: FormData) =>
	({
		params: { objectId: 'OBJ-1' },
		locals: { session },
		cookies: { get: () => 'token-1', delete: vi.fn() },
		fetch: vi.fn(),
		request: new Request('https://example.test/objects/OBJ-1/edit', {
			method: 'POST',
			body,
		}),
	}) as never;

const makeSaveDraftForm = (overrides: { revision?: unknown; metadata?: unknown; rights?: unknown; pages?: unknown } = {}) => {
	const form = new FormData();
	form.set('revision', String(overrides.revision ?? 4));
	form.set(
		'metadata',
		JSON.stringify(
			overrides.metadata ?? {
				title: 'Updated title',
				publicationDate: '2026',
				datePrecision: 'year',
				dateApproximate: false,
				language: 'en',
				tags: ['archive'],
				people: ['Ada'],
				description: 'Description',
			},
		),
	);
	form.set(
		'rights',
		JSON.stringify(overrides.rights ?? { rightsNote: 'Rights', sensitivityNote: null }),
	);
	if ('pages' in overrides) {
		form.set('pages', JSON.stringify(overrides.pages));
	} else {
		form.set('pages', JSON.stringify([{ pageNumber: 1, curatedText: 'Edited text' }]));
	}
	return form;
};

describe('/objects/[objectId]/edit +page.server', () => {
	beforeEach(() => {
		getObjectEditPayloadMock.mockReset();
		saveObjectMetadataMock.mockReset();
		saveDocumentCurationMock.mockReset();
		submitObjectCurationMock.mockReset();
		getObjectEditPayloadMock.mockResolvedValue(baseEditPayload);
		saveObjectMetadataMock.mockResolvedValue({
			objectId: 'OBJ-1',
			revision: 5,
			curationState: 'draft',
			updatedAt: '2026-05-23T18:00:00.000Z',
		});
		saveDocumentCurationMock.mockResolvedValue({
			objectId: 'OBJ-1',
			revision: 6,
			updatedCount: 1,
			updatedAt: '2026-05-23T18:00:00.000Z',
		});
		submitObjectCurationMock.mockResolvedValue({
			objectId: 'OBJ-1',
			revision: 5,
			curationState: 'under_review',
			submittedAt: '2026-05-23T18:00:00.000Z',
			submittedBy: 'u1',
			requestId: 'req-1',
			requestStatus: 'PENDING',
		});
	});

	it('loads edit payload for authenticated users', async () => {
		await expect(
			load({
				params: { objectId: 'OBJ-1' },
				locals: { session },
				cookies: { get: () => 'token-1', delete: vi.fn() },
				fetch: vi.fn(),
			} as never),
		).resolves.toEqual({ editPayload: baseEditPayload, isLockedByOtherUser: false });
	});

	it('returns 400 when saveDraft receives malformed pages', async () => {
		const form = makeSaveDraftForm({ pages: [{ pageNumber: 'one', curatedText: 'Edited text' }] });

		const result = await actions.saveDraft(makeEvent(form));

		expect(result).toMatchObject({ status: 400, data: { error: 'Invalid form payload.' } });
		expect(saveObjectMetadataMock).not.toHaveBeenCalled();
		expect(saveDocumentCurationMock).not.toHaveBeenCalled();
	});

	it('returns 400 when publication date does not match precision', async () => {
		const form = makeSaveDraftForm({
			metadata: {
				title: 'Updated title',
				publicationDate: '2026-05',
				datePrecision: 'year',
				dateApproximate: false,
				language: 'en',
				tags: [],
				people: [],
				description: null,
			},
		});

		const result = await actions.saveDraft(makeEvent(form));

		expect(result).toMatchObject({ status: 400, data: { error: 'Invalid form payload.' } });
		expect(getObjectEditPayloadMock).not.toHaveBeenCalled();
	});

	it('saves metadata and document curation when capabilities allow both', async () => {
		const result = await actions.saveDraft(makeEvent(makeSaveDraftForm()));

		expect(result).toEqual({ success: true, revision: 6 });
		expect(saveObjectMetadataMock).toHaveBeenCalledWith(
			expect.objectContaining({
				objectId: 'OBJ-1',
				revision: 4,
				metadata: expect.objectContaining({ title: 'Updated title' }),
				rights: { rightsNote: 'Rights', sensitivityNote: null },
			}),
		);
		expect(saveDocumentCurationMock).toHaveBeenCalledWith(
			expect.objectContaining({ revision: 5, pages: [{ pageNumber: 1, curatedText: 'Edited text' }] }),
		);
	});

	it('rejects saveDraft when edit capabilities do not allow requested changes', async () => {
		getObjectEditPayloadMock.mockResolvedValue({
			...baseEditPayload,
			capabilities: { canEditMetadata: false, canCurateText: false, canSubmitReview: false },
		});

		const result = await actions.saveDraft(makeEvent(makeSaveDraftForm()));

		expect(result).toMatchObject({ status: 403 });
		expect(saveObjectMetadataMock).not.toHaveBeenCalled();
		expect(saveDocumentCurationMock).not.toHaveBeenCalled();
	});

	it('allows text-only save without persisting metadata when metadata editing is denied', async () => {
		getObjectEditPayloadMock.mockResolvedValue({
			...baseEditPayload,
			capabilities: { canEditMetadata: false, canCurateText: true, canSubmitReview: false },
		});

		const form = makeSaveDraftForm();
		form.delete('metadata');
		form.delete('rights');
		const result = await actions.saveDraft(makeEvent(form));

		expect(result).toEqual({ success: true, revision: 6 });
		expect(saveObjectMetadataMock).not.toHaveBeenCalled();
		expect(saveDocumentCurationMock).toHaveBeenCalledOnce();
	});

	it('returns 423 when saveDraft hits an edit lock', async () => {
		saveObjectMetadataMock.mockRejectedValue(new ObjectEditLockedError('u2', '2026-05-23T19:00:00.000Z'));

		const result = await actions.saveDraft(makeEvent(makeSaveDraftForm({ pages: [] })));

		expect(result).toMatchObject({ status: 423, data: { locked: true } });
	});

	it('returns recovered partial state when document curation fails after metadata save', async () => {
		saveDocumentCurationMock.mockRejectedValue(
			new ApiClientError({ status: 502, code: 'BAD_REQUEST', message: 'Curation failed', requestId: 'req-2' }),
		);

		const result = await actions.saveDraft(makeEvent(makeSaveDraftForm()));

		expect(result).toMatchObject({
			status: 502,
			data: {
				error: 'Metadata saved, but document curation failed. Review the refreshed values before retrying.',
				recovery: { kind: 'partial', editPayload: baseEditPayload },
			},
		});
		expect(saveObjectMetadataMock).toHaveBeenCalledOnce();
		expect(getObjectEditPayloadMock).toHaveBeenCalledTimes(2);
	});

	it('returns refreshed state without writing when the submitted revision is stale', async () => {
		const result = await actions.saveDraft(makeEvent(makeSaveDraftForm({ revision: 3 })));

		expect(result).toMatchObject({
			status: 409,
			data: { recovery: { kind: 'conflict', editPayload: baseEditPayload } },
		});
		expect(saveObjectMetadataMock).not.toHaveBeenCalled();
		expect(saveDocumentCurationMock).not.toHaveBeenCalled();
	});

	it('refreshes authoritative state after a concurrent revision conflict', async () => {
		const refreshedPayload = { ...baseEditPayload, revision: 5 };
		getObjectEditPayloadMock.mockResolvedValueOnce(baseEditPayload).mockResolvedValueOnce(refreshedPayload);
		saveObjectMetadataMock.mockRejectedValue(new ObjectEditRevisionConflictError(5));

		const result = await actions.saveDraft(makeEvent(makeSaveDraftForm({ pages: [] })));

		expect(result).toMatchObject({
			status: 409,
			data: { recovery: { kind: 'conflict', editPayload: refreshedPayload } },
		});
		expect(saveDocumentCurationMock).not.toHaveBeenCalled();
	});

	it('saves only changed document pages without writing metadata', async () => {
		const form = makeSaveDraftForm({ pages: [{ pageNumber: 1, curatedText: 'Edited text' }] });
		form.delete('metadata');
		form.delete('rights');

		const result = await actions.saveDraft(makeEvent(form));

		expect(result).toEqual({ success: true, revision: 6 });
		expect(saveObjectMetadataMock).not.toHaveBeenCalled();
		expect(saveDocumentCurationMock).toHaveBeenCalledWith(
			expect.objectContaining({ revision: 4, pages: [{ pageNumber: 1, curatedText: 'Edited text' }] }),
		);
	});

	it('submits curation when capability allows review submission', async () => {
		const form = new FormData();
		form.set('reviewNote', 'Looks ready');
		form.set('revision', '4');

		const result = await actions.submitCuration(makeEvent(form));

		expect(result).toEqual({
			success: true,
			curationState: 'under_review',
			requestId: 'req-1',
			requestStatus: 'PENDING',
		});
		expect(submitObjectCurationMock).toHaveBeenCalledWith(
			expect.objectContaining({ objectId: 'OBJ-1', revision: 4, reviewNote: 'Looks ready' }),
		);
	});

	it('rejects submitCuration when submit capability is missing', async () => {
		getObjectEditPayloadMock.mockResolvedValue({
			...baseEditPayload,
			capabilities: { canEditMetadata: true, canCurateText: true, canSubmitReview: false },
		});

		const form = new FormData();
		form.set('revision', '4');
		const result = await actions.submitCuration(makeEvent(form));

		expect(result).toMatchObject({ status: 403 });
		expect(submitObjectCurationMock).not.toHaveBeenCalled();
	});
});
