import type { DashboardService, DashboardSummary, DashboardSummaryRequest } from './dashboard';
import type { Role } from '$lib/auth/types';

const toActivity = (activity: {
	id: string;
	title: string;
	description: string;
	timestamp: string;
	type?: string;
	ingestionId?: string | null;
	objectId?: string | null;
	actorUserId?: string | null;
	payload?: unknown;
}) => ({
	id: activity.id,
	title: activity.title,
	description: activity.description,
	timestamp: activity.timestamp,
	type: activity.type ?? 'ACTIVITY_EVENT',
	ingestionId: activity.ingestionId ?? null,
	objectId: activity.objectId ?? null,
	actorUserId: activity.actorUserId ?? null,
	payload: activity.payload ?? null
});

const now = () => new Date();
const hoursAgo = (hours: number) => new Date(now().getTime() - hours * 60 * 60 * 1000);
const daysAgo = (days: number) => new Date(now().getTime() - days * 24 * 60 * 60 * 1000);

const formatTimestamp = (date: Date) => date.toISOString();

const summaries: Record<Role, DashboardSummary> = {
	admin: {
		metrics: {
			activeBatches: 4,
			needsReview: 7,
			pendingUploads: 12
		},
		primaryAction: 'Review access requests',
		secondaryAction: 'Audit recent activity',
		roleTagline: 'System oversight and access control.',
		recentActivity: [
			toActivity({
				id: 'activity-admin-1',
				title: 'Access request pending',
				description: 'New archiver account awaiting approval.',
				timestamp: formatTimestamp(hoursAgo(2))
			}),
			toActivity({
				id: 'activity-admin-2',
				title: 'Policy update logged',
				description: 'Retention policy revised for 1970s scans.',
				timestamp: formatTimestamp(daysAgo(1))
			}),
			toActivity({
				id: 'activity-admin-3',
				title: 'System audit completed',
				description: 'Quarterly audit finished with no critical findings.',
				timestamp: formatTimestamp(daysAgo(2))
			})
		]
	},
	archiver: {
		metrics: {
			activeBatches: 3,
			needsReview: 5,
			pendingUploads: 9
		},
		primaryAction: 'Start a new batch',
		secondaryAction: 'Review flagged items',
		roleTagline: 'Prepare and validate ingestion batches.',
		recentActivity: [
			toActivity({
				id: 'activity-archiver-1',
				title: 'Batch staged',
				description: 'NoorMags Issue 82 uploaded and awaiting intent review.',
				timestamp: formatTimestamp(hoursAgo(4)),
				type: 'INGESTION_UPLOADING',
				ingestionId: 'batch-1'
			}),
			toActivity({
				id: 'activity-archiver-2',
				title: 'OCR review flagged',
				description: 'Layout OCR for Issue 79 requires human confirmation.',
				timestamp: formatTimestamp(daysAgo(1)),
				type: 'INGESTION_FAILED',
				ingestionId: 'batch-1'
			}),
			toActivity({
				id: 'activity-archiver-3',
				title: 'Batch completed',
				description: 'Photo set 2012 ingested and published to archive.',
				timestamp: formatTimestamp(daysAgo(3)),
				type: 'INGESTION_COMPLETED',
				ingestionId: 'batch-2'
			})
		]
	},
	viewer: {
		metrics: {
			activeBatches: 2,
			needsReview: 1,
			pendingUploads: 4
		},
		primaryAction: 'Open latest releases',
		secondaryAction: 'View activity summary',
		roleTagline: 'Browse approved materials and reports.',
		recentActivity: [
			toActivity({
				id: 'activity-viewer-1',
				title: 'New release published',
				description: 'Tehran cultural review batch approved and published.',
				timestamp: formatTimestamp(hoursAgo(6))
			}),
			toActivity({
				id: 'activity-viewer-2',
				title: 'Collection update',
				description: 'Photo archive updated with 38 new items.',
				timestamp: formatTimestamp(daysAgo(2))
			}),
			toActivity({
				id: 'activity-viewer-3',
				title: 'Monthly summary ready',
				description: 'Usage and access trends report available.',
				timestamp: formatTimestamp(daysAgo(5))
			})
		]
	}
};

export const mockDashboardService: DashboardService = {
	getSummary: async (request: DashboardSummaryRequest) => summaries[request.role] ?? summaries.viewer,
	getActivity: async ({ ingestionId }) => {
		const entries = Object.values(summaries).flatMap((summary) => summary.recentActivity);
		if (!ingestionId) return entries;
		return entries.filter((entry) => entry.ingestionId === ingestionId);
	}
};
