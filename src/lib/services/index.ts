import type { DashboardService } from './dashboard';
import type { IngestionOverviewService } from './ingestionOverview';
import type { IngestionNewService } from './ingestionNew';
import type { ObjectsService } from './objects';
import { mockDashboardService } from './mockDashboardService';
import { mockIngestionOverviewService } from './mockIngestionOverviewService';
import { mockIngestionNewService } from './mockIngestionNewService';
import { mockObjectsService } from './mockObjectsService';

export const dashboardService: DashboardService = mockDashboardService;
export const ingestionOverviewService: IngestionOverviewService = mockIngestionOverviewService;
export const ingestionNewService: IngestionNewService = mockIngestionNewService;
export const objectsService: ObjectsService = mockObjectsService;
