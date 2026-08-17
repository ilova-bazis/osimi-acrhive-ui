import type { IngestionOverviewService, IngestionOverviewSummary } from './ingestionOverview';

const stagingPurge = { state: 'not_scheduled' as const, startedAt: null, purgedAt: null };
const noActions = {
	canResume: false,
	canRetry: false,
	canCancel: false,
	canRestore: false,
	canDelete: false
};

const summary: IngestionOverviewSummary = {
	stats: {
		totalBatches: 18,
		objectsCreated: 214,
		inProgress: 4,
		needsAttention: 2
	},
	activeAndRecent: [
		{
			id: 'BATCH-20260202-0031',
			name: 'NoorMags Issue 80-82',
			createdAt: '2026-02-02T08:15:00Z',
			status: 'ingesting',
			statusRaw: 'PROCESSING',
			progress: { completed: 7, total: 12 },
			actionCapabilities: noActions,
			stagingPurge,
			actions: ['view']
		},
		{
			id: 'BATCH-20260201-0029',
			name: 'Photo Archive 2012 - Events',
			createdAt: '2026-02-01T14:05:00Z',
			status: 'completed',
			statusRaw: 'COMPLETED',
			progress: { completed: 24, total: 24 },
			actionCapabilities: noActions,
			stagingPurge,
			actions: ['view']
		},
		{
			id: 'BATCH-20260131-0024',
			name: 'Tajik Radio Interviews',
			createdAt: '2026-01-31T10:40:00Z',
			status: 'failed',
			statusRaw: 'FAILED',
			progress: { completed: 3, total: 9 },
			actionCapabilities: { ...noActions, canRetry: true },
			stagingPurge,
			actions: ['view', 'retry']
		},
		{
			id: 'BATCH-20260130-0020',
			name: 'Issue 79 Layout OCR',
			createdAt: '2026-01-30T09:25:00Z',
			status: 'ingesting',
			statusRaw: 'PROCESSING',
			progress: { completed: 11, total: 18 },
			actionCapabilities: noActions,
			stagingPurge,
			actions: ['view']
		}
	],
	drafts: [
		{
			id: 'BATCH-20260202-0033',
			name: 'Family Letters 1974',
			createdAt: '2026-02-02T09:30:00Z',
			status: 'draft',
			statusRaw: 'DRAFT',
			progress: { completed: 5, total: 10 },
			actionCapabilities: { ...noActions, canResume: true, canCancel: true, canDelete: true },
			stagingPurge,
			actions: ['resume', 'cancel', 'delete']
		}
	],
	nextCursor: null
};

export const mockIngestionOverviewService: IngestionOverviewService = {
	getSummary: async () => summary
};
