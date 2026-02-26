import type { CreateIngestionResponse, IngestionNewService } from './ingestionNew';

let counter = 42;

const makeBatchId = () => {
	const now = new Date();
	const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
		now.getDate()
	).padStart(2, '0')}`;
	const suffix = String(counter++).padStart(4, '0');
	return `BATCH-${stamp}-${suffix}`;
};

export const mockIngestionNewService: IngestionNewService = {
	createDraft: async (): Promise<CreateIngestionResponse> => ({
		batchId: makeBatchId()
	})
};
