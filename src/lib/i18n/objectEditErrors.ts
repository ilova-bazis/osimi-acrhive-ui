import type { TranslationKey } from './translations';
import type {
	ObjectEditErrorCode,
	ObjectEditFieldErrorCode
} from '$lib/services/objectEditErrors';

export const objectEditErrorKeys: Record<ObjectEditErrorCode, TranslationKey> = {
	objectNotFound: 'objectEdit.errors.objectNotFound',
	highlightedFields: 'objectEdit.errors.highlightedFields',
	invalidPayload: 'objectEdit.errors.invalidPayload',
	saveForbidden: 'objectEdit.errors.saveForbidden',
	changedBeforeSave: 'objectEdit.errors.changedBeforeSave',
	partialConflict: 'objectEdit.errors.partialConflict',
	partialFailedReview: 'objectEdit.errors.partialFailedReview',
	partialFailedRefresh: 'objectEdit.errors.partialFailedRefresh',
	validationFailed: 'objectEdit.errors.validationFailed',
	saveFailed: 'objectEdit.errors.saveFailed',
	ocrUnavailable: 'objectEdit.errors.ocrUnavailable',
	publishForbidden: 'objectEdit.errors.publishForbidden',
	changedBeforePublish: 'objectEdit.errors.changedBeforePublish',
	publishFailed: 'objectEdit.errors.publishFailed'
};

export const objectEditFieldErrorKeys: Record<ObjectEditFieldErrorCode, TranslationKey> = {
	titleRequired: 'objectEdit.fieldErrors.titleRequired',
	publicationDateInvalid: 'objectEdit.fieldErrors.publicationDateInvalid',
	tagsBlank: 'objectEdit.fieldErrors.tagsBlank',
	peopleBlank: 'objectEdit.fieldErrors.peopleBlank',
	pagesInvalid: 'objectEdit.fieldErrors.pagesInvalid',
	invalidValue: 'objectEdit.fieldErrors.invalidValue'
};
