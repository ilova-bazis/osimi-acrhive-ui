export type FileStatus =
	| 'queued'
	| 'processing'
	| 'extracted'
	| 'needs-review'
	| 'approved'
	| 'blocked'
	| 'skipped'
	| 'failed';

export type FileItem = {
	id: number;
	name: string;
	type: string;
	size: string;
	status: FileStatus;
};

export type StatusBadgeTone = 'system' | 'attention';
