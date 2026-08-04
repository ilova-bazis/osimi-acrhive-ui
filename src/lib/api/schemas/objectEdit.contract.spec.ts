import { describe, expect, it } from 'vitest';

import contract from '../objectEdit.contract.json';
import { backendErrorSchema } from './errors';
import {
	objectEditPayloadSchema,
	releaseLockResultSchema,
	saveDocumentCurationRequestSchema,
	saveDocumentCurationResultSchema,
	saveMetadataRequestSchema,
	saveMetadataResultSchema,
	submitCurationRequestSchema,
	submitCurationResultSchema,
} from './objectEdit';

describe('backend-owned object-edit contract fixture', () => {
	it('validates all editor request and response payloads at the frontend boundary', () => {
		expect(contract.contract_version).toBe(1);
		expect(objectEditPayloadSchema.safeParse(contract.get_edit).success).toBe(true);
		expect(saveMetadataRequestSchema.safeParse(contract.save_metadata.request).success).toBe(true);
		expect(saveMetadataResultSchema.safeParse(contract.save_metadata.response).success).toBe(true);
		expect(saveDocumentCurationRequestSchema.safeParse(contract.save_document_curation.request).success).toBe(true);
		expect(saveDocumentCurationResultSchema.safeParse(contract.save_document_curation.response).success).toBe(true);
		expect(submitCurationRequestSchema.safeParse(contract.submit_curation.request).success).toBe(true);
		expect(submitCurationResultSchema.safeParse(contract.submit_curation.response).success).toBe(true);
		expect(releaseLockResultSchema.safeParse(contract.release_lock.response).success).toBe(true);
	});

	it('validates the editor error envelopes and statuses', () => {
		for (const [code, fixture] of Object.entries(contract.errors)) {
			expect(backendErrorSchema.safeParse(fixture.body).success).toBe(true);
			expect(fixture.body.error.code).toBe(code === 'revision_conflict' ? 'REVISION_CONFLICT' : code === 'validation_failed' ? 'VALIDATION_FAILED' : 'LOCKED');
		}
		expect(contract.errors.revision_conflict.status).toBe(409);
		expect(contract.errors.validation_failed.status).toBe(422);
		expect(contract.errors.locked.status).toBe(423);
	});
});
