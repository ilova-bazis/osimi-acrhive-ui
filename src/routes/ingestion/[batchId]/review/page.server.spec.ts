import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getDetailMock } = vi.hoisted(() => ({
	getDetailMock: vi.fn()
}));

vi.mock('$lib/services', () => ({
	ingestionDetailService: {
		getDetail: getDetailMock
	}
}));

import { load } from './+page.server';

describe('/ingestion/[batchId]/review +page.server', () => {
	beforeEach(() => {
		getDetailMock.mockReset();
	});

	it('redirects non-submittable ingestions directly to detail', async () => {
		getDetailMock.mockResolvedValue({
			status: 'completed',
			actionCapabilities: { canResume: false }
		});

		await expect(
			load({
				params: { batchId: 'batch-1' },
				locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'operator' } },
				cookies: { get: () => 'token-1' },
				fetch: vi.fn()
			} as never)
		).rejects.toMatchObject({ status: 303, location: '/ingestion/batch-1' });
	});
});
