import type { DashboardService } from './dashboard';
import type { IngestionOverviewService } from './ingestionOverview';
import { mockDashboardService } from './mockDashboardService';
import { mockIngestionOverviewService } from './mockIngestionOverviewService';

export const dashboardService: DashboardService = mockDashboardService;
export const ingestionOverviewService: IngestionOverviewService = mockIngestionOverviewService;
