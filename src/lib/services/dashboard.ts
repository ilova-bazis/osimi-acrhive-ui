import type { Role } from '$lib/auth/types';

export type DashboardActivity = {
	id: string;
	title: string;
	description: string;
	timestamp: string;
};

export type DashboardSummary = {
	metrics: {
		activeBatches: number;
		needsReview: number;
		pendingUploads: number;
	};
	primaryAction: string;
	secondaryAction: string;
	roleTagline: string;
	recentActivity: DashboardActivity[];
};

export type DashboardService = {
	getSummary: (role: Role) => Promise<DashboardSummary>;
};
