import { describe, expect, it } from 'vitest';
import {
	batchStatusKey,
	batchStatusTone,
	fileStatusKey,
	fileStatusTone,
	itemStatusKey,
	itemStatusTone,
	knownBatchStatusKey,
	knownFileStatusKey,
	normalizeStatusToken,
	presentationStatusKey,
	resolveBatchStatus,
	resolveFileStatus,
	resolveItemStatus,
	resolvePresentationStatus
} from './statusLabels';

describe('normalizeStatusToken', () => {
	it('trims, lowercases, and canonicalizes separators for lookup only', () => {
		expect(normalizeStatusToken(' UPLOADED ')).toBe('uploaded');
		expect(normalizeStatusToken('uPlOaDeD')).toBe('uploaded');
		expect(normalizeStatusToken('COMPLETED_WITH_ERRORS')).toBe('completed_with_errors');
		expect(normalizeStatusToken('COMPLETED-WITH-ERRORS')).toBe('completed_with_errors');
		expect(normalizeStatusToken('completed--with__errors')).toBe('completed_with_errors');
		expect(normalizeStatusToken('needs-review')).toBe('needs_review');
		expect(normalizeStatusToken('NEEDS_REVIEW')).toBe('needs_review');
	});
});

describe('batch status domain', () => {
	const expected: Record<string, string> = {
		DRAFT: 'draft',
		UPLOADING: 'uploading',
		QUEUED: 'queued',
		PROCESSING: 'ingesting',
		COMPLETED: 'completed',
		COMPLETED_WITH_ERRORS: 'completed_with_errors',
		FAILED: 'failed',
		CANCELED: 'canceled'
	};

	it.each(Object.entries(expected))('resolves %s to %s', (raw, value) => {
		const resolution = resolveBatchStatus(raw);
		expect(resolution.raw).toBe(raw);
		expect(resolution.value).toBe(value);
		expect(batchStatusKey(resolution.value)).toBe(`ingestionOverview.statuses.${value}`);
	});

	it('resolves separator, case, and whitespace variants', () => {
		expect(resolveBatchStatus(' completed-with-errors ').value).toBe('completed_with_errors');
		expect(resolveBatchStatus('Completed_With_Errors').value).toBe('completed_with_errors');
		expect(resolveBatchStatus('QUEUED').value).toBe('queued');
	});

	it('preserves unknown raw values without inventing a status', () => {
		const resolution = resolveBatchStatus('Future_State');
		expect(resolution.raw).toBe('Future_State');
		expect(resolution.value).toBeNull();
		expect(batchStatusKey(resolution.value)).toBeNull();
		expect(knownBatchStatusKey('done')).toBeNull();
		expect(knownBatchStatusKey('success')).toBeNull();
		expect(knownBatchStatusKey('running')).toBeNull();
	});

	it('treats missing values as unresolved', () => {
		const resolution = resolveBatchStatus(undefined);
		expect(resolution.raw).toBe('');
		expect(resolution.value).toBeNull();
	});

	it('maps badge tones deliberately', () => {
		expect(batchStatusTone('queued')).toBe('queued');
		expect(batchStatusTone('draft')).toBe('queued');
		expect(batchStatusTone('uploading')).toBe('processing');
		expect(batchStatusTone('ingesting')).toBe('processing');
		expect(batchStatusTone('completed')).toBe('approved');
		expect(batchStatusTone('completed_with_errors')).toBe('needs-review');
		expect(batchStatusTone('failed')).toBe('failed');
		expect(batchStatusTone('canceled')).toBe('blocked');
		expect(batchStatusTone(null)).toBe('queued');
	});
});

describe('backend file status domain', () => {
	const expected: Record<string, string> = {
		PENDING: 'pending',
		UPLOADED: 'uploaded',
		VALIDATED: 'validated',
		FAILED: 'failed'
	};

	it.each(Object.entries(expected))('resolves %s to %s', (raw, value) => {
		const resolution = resolveFileStatus(raw);
		expect(resolution.raw).toBe(raw);
		expect(resolution.value).toBe(value);
		expect(fileStatusKey(resolution.value)).toBe(`ingestionStatuses.files.${value}`);
	});

	it('resolves separator, case, and whitespace variants', () => {
		expect(resolveFileStatus(' uploaded ').value).toBe('uploaded');
		expect(resolveFileStatus('UpLoAdEd').value).toBe('uploaded');
	});

	it('does not accept presentation-only values', () => {
		expect(resolveFileStatus('needs-review').value).toBeNull();
		expect(resolveFileStatus('NEEDS_REVIEW').value).toBeNull();
		expect(resolveFileStatus('skipped').value).toBeNull();
		expect(resolveFileStatus('processing').value).toBeNull();
		expect(resolveFileStatus('approved').value).toBeNull();
	});

	it('preserves unknown raw values exactly', () => {
		const resolution = resolveFileStatus('Future_State');
		expect(resolution.raw).toBe('Future_State');
		expect(resolution.value).toBeNull();
		expect(knownFileStatusKey('Future_State')).toBeNull();
	});

	it('maps badge tones deliberately', () => {
		expect(fileStatusTone('pending')).toBe('queued');
		expect(fileStatusTone('uploaded')).toBe('approved');
		expect(fileStatusTone('validated')).toBe('approved');
		expect(fileStatusTone('failed')).toBe('failed');
		expect(fileStatusTone(null)).toBe('queued');
	});
});

describe('backend item status domain', () => {
	const expected: Record<string, string> = {
		PENDING: 'pending',
		READY: 'ready',
		PROCESSING: 'processing',
		COMPLETED: 'completed',
		FAILED: 'failed',
		SKIPPED: 'skipped'
	};

	it.each(Object.entries(expected))('resolves %s to %s', (raw, value) => {
		const resolution = resolveItemStatus(raw);
		expect(resolution.raw).toBe(raw);
		expect(resolution.value).toBe(value);
		expect(itemStatusKey(resolution.value)).toBe(`ingestionStatuses.items.${value}`);
	});

	it('resolves separator, case, and whitespace variants', () => {
		expect(resolveItemStatus(' processing ').value).toBe('processing');
	});

	it('preserves unknown raw values exactly', () => {
		const resolution = resolveItemStatus('DRAFT');
		expect(resolution.raw).toBe('DRAFT');
		expect(resolution.value).toBeNull();
	});

	it('maps badge tones deliberately', () => {
		expect(itemStatusTone('pending')).toBe('queued');
		expect(itemStatusTone('ready')).toBe('approved');
		expect(itemStatusTone('processing')).toBe('processing');
		expect(itemStatusTone('completed')).toBe('approved');
		expect(itemStatusTone('failed')).toBe('failed');
		expect(itemStatusTone('skipped')).toBe('skipped');
		expect(itemStatusTone(null)).toBe('queued');
	});
});

describe('presentation file status domain', () => {
	const expected: Record<string, string> = {
		queued: 'statuses.queued',
		processing: 'statuses.processing',
		extracted: 'statuses.extracted',
		'needs-review': 'statuses.needsReview',
		approved: 'statuses.approved',
		blocked: 'statuses.blocked',
		skipped: 'statuses.skipped',
		failed: 'statuses.failed'
	};

	it.each(Object.entries(expected))('resolves %s to %s', (value, key) => {
		expect(presentationStatusKey(value as never)).toBe(key);
		expect(resolvePresentationStatus(value).value).toBe(value);
	});

	it('resolves needs-review in any normalization form', () => {
		expect(resolvePresentationStatus('needs-review').value).toBe('needs-review');
		expect(resolvePresentationStatus('NEEDS_REVIEW').value).toBe('needs-review');
		expect(resolvePresentationStatus('needs_review').value).toBe('needs-review');
	});

	it('rejects unknown presentation values', () => {
		const resolution = resolvePresentationStatus('uploaded');
		expect(resolution.value).toBeNull();
		expect(resolution.raw).toBe('uploaded');
	});
});
