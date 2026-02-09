export type ObjectStatus = 'INGESTING' | 'READY' | 'NEEDS_REVIEW' | 'FAILED' | 'ARCHIVED';

export type ObjectIndicators = {
	ocr: boolean;
	transcript: boolean;
	embeddings: boolean;
};

export type ObjectRow = {
	id: string;
	title: string | null;
	type: string;
	status: ObjectStatus;
	language: string;
	updatedAt: string;
	batchId: string;
	thumbnailUrl?: string | null;
	indicators: ObjectIndicators;
};

export type ObjectsListResponse = {
	rows: ObjectRow[];
	page: number;
	pageSize: number;
	total: number;
};

export type ObjectsFilters = {
	query?: string;
	types?: string[];
	statuses?: ObjectStatus[];
	languages?: string[];
	batchId?: string;
	page?: number;
	pageSize?: number;
	sort?: string;
};

export type ObjectsService = {
	listObjects: (filters: ObjectsFilters) => Promise<ObjectsListResponse>;
	listRecent: () => Promise<ObjectRow[]>;
};
