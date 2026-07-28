import { describe, expect, it } from 'vitest';

import { ingestionDtoSchema, ingestionsListResponseSchema } from './ingestions';

describe('ingestionDtoSchema', () => {
	it('accepts legacy and canonical identifier aliases', () => {
		expect(ingestionDtoSchema.safeParse({ id: 'id-1' }).success).toBe(true);
		expect(ingestionDtoSchema.safeParse({ ingestion_id: 'ing-1' }).success).toBe(true);
		expect(ingestionDtoSchema.safeParse({ batch_id: 'batch-1' }).success).toBe(true);
		expect(ingestionDtoSchema.safeParse({ batch_label: 'Batch 1' }).success).toBe(true);
	});

	it('rejects payloads without any ingestion identifier', () => {
		const parsed = ingestionDtoSchema.safeParse({ status: 'DRAFT' });

		expect(parsed.success).toBe(false);
		if (!parsed.success) {
			expect(parsed.error.issues[0]?.message).toBe('Expected at least one ingestion identifier field');
		}
	});
});

describe('ingestionsListResponseSchema', () => {
	it('rejects list responses containing rows without identifiers', () => {
		const parsed = ingestionsListResponseSchema.safeParse({
			ingestions: [{ status: 'DRAFT' }],
			next_cursor: null
		});

		expect(parsed.success).toBe(false);
	});
});
