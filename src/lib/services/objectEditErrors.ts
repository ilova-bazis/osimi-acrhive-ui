export type ObjectEditField =
	| 'title'
	| 'publicationDate'
	| 'tags'
	| 'people'
	| 'description'
	| 'rightsNote'
	| 'sensitivityNote'
	| 'pages';

export type ObjectEditFieldErrorCode =
	| 'titleRequired'
	| 'publicationDateInvalid'
	| 'tagsBlank'
	| 'peopleBlank'
	| 'pagesInvalid'
	| 'invalidValue';

export type ObjectEditFieldErrors = Partial<Record<ObjectEditField, ObjectEditFieldErrorCode>>;

export type ObjectEditErrorCode =
	| 'objectNotFound'
	| 'highlightedFields'
	| 'invalidPayload'
	| 'saveForbidden'
	| 'changedBeforeSave'
	| 'partialConflict'
	| 'partialFailedReview'
	| 'partialFailedRefresh'
	| 'validationFailed'
	| 'saveFailed'
	| 'ocrUnavailable'
	| 'publishForbidden'
	| 'changedBeforePublish'
	| 'publishFailed';
