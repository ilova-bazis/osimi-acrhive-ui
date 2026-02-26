import type { Role } from '$lib/auth/types';
import type {
	DashboardActivityResponse,
	DashboardSummaryResponse
} from '$lib/api/schemas/dashboard';
import type { DashboardActivity, DashboardSummary } from '$lib/services/dashboard';

type RoleDashboardCopy = {
	primaryAction: string;
	secondaryAction: string;
	roleTagline: string;
};

const dashboardCopyByRole: Record<string, RoleDashboardCopy> = {
	admin: {
		primaryAction: 'Review access requests',
		secondaryAction: 'Audit recent activity',
		roleTagline: 'System oversight and access control.'
	},
	archiver: {
		primaryAction: 'Start a new batch',
		secondaryAction: 'Review flagged items',
		roleTagline: 'Prepare and validate ingestion batches.'
	},
	viewer: {
		primaryAction: 'Open latest releases',
		secondaryAction: 'View activity summary',
		roleTagline: 'Browse approved materials and reports.'
	}
};

const humanizeType = (value: string): string => {
	const cleaned = value.replace(/[_.]/g, ' ').trim();
	if (!cleaned) return 'Activity event';

	return cleaned
		.split(' ')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
		.join(' ');
};

const readPayloadMessage = (payload: unknown): string | null => {
	if (!payload || typeof payload !== 'object') {
		return null;
	}

	const candidate = (payload as Record<string, unknown>).message;
	if (typeof candidate === 'string' && candidate.trim().length > 0) {
		return candidate;
	}

	return null;
};

const toActivityDescription = (
	item: DashboardActivityResponse['activity'][number],
	defaultMessage: string
): string => {
	const payloadMessage = readPayloadMessage(item.payload);
	if (payloadMessage) {
		return payloadMessage;
	}

	if (item.ingestion_id) {
		return `Ingestion ${item.ingestion_id} updated.`;
	}

	if (item.object_id) {
		return `Object ${item.object_id} updated.`;
	}

	return defaultMessage;
};

const mapActivity = (
	activityResponse: DashboardActivityResponse
): DashboardActivity[] =>
	activityResponse.activity.slice(0, 12).map((item) => {
		const title = humanizeType(item.type);

		return {
			id: item.id,
			title,
			description: toActivityDescription(item, `${title} recorded.`),
			timestamp: item.created_at
		};
	});

export const mapDashboardSummary = (params: {
	role: Role;
	summaryResponse: DashboardSummaryResponse;
	activityResponse: DashboardActivityResponse;
}): DashboardSummary => {
	const copy = dashboardCopyByRole[params.role] ?? dashboardCopyByRole.viewer;
	const summary = params.summaryResponse.summary;

	return {
		metrics: {
			activeBatches: summary.total_ingestions,
			needsReview: summary.failed_count,
			pendingUploads: summary.processed_today
		},
		primaryAction: copy.primaryAction,
		secondaryAction: copy.secondaryAction,
		roleTagline: copy.roleTagline,
		recentActivity: mapActivity(params.activityResponse)
	};
};
