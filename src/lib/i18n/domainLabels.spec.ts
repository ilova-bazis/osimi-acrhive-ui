import { describe, expect, it } from 'vitest';

import { translate } from './translate';
import { translations, type TranslationDictionary, type TranslationKey } from './translations';
import {
	accessLevelKeys,
	accessReasonKeys,
	availabilityStateKeys,
	curationStateKeys,
	dashboardActivityEventKeys,
	dashboardRoleCopyKeys,
	knownObjectTypeKey,
	mediaTypeKeys,
	knownMediaTypeKey,
	knownRequestActionKey,
	knownReviewLanguageKey,
	knownReviewPipelinePresetKey,
	knownSetupLanguageKey,
	knownSetupPipelinePresetKey,
	objectEditMediaTypeKeys,
	objectTypeKeys,
	primarySourceStatusKeys,
	processingStateKeys,
	requestStatusKeys,
	reviewPipelinePresetKeys,
	setupPipelinePresetKeys
} from './domainLabels';

const en = translations.en as TranslationDictionary;
const ru = translations.ru as TranslationDictionary;

const expectLocalized = (key: string, dictionary: TranslationDictionary): string => {
	const value = translate(dictionary, key as TranslationKey);
	expect(value).not.toBe(key);
	return value;
};

describe('domain label mappings', () => {
	it('maps every processing state member to a distinct translation', () => {
		const labels = Object.values(processingStateKeys).map((key) => expectLocalized(key, ru));
		expect(new Set(labels).size).toBe(labels.length);
	});

	it('maps every curation state member', () => {
		for (const key of Object.values(curationStateKeys)) {
			expectLocalized(key, en);
			expectLocalized(key, ru);
		}
	});

	it('maps every availability state member', () => {
		for (const key of Object.values(availabilityStateKeys)) {
			expectLocalized(key, en);
			expectLocalized(key, ru);
		}
	});

	it('maps every access reason member', () => {
		for (const key of Object.values(accessReasonKeys)) {
			expectLocalized(key, en);
			expectLocalized(key, ru);
		}
	});

	it('maps every media type member', () => {
		for (const key of Object.values(mediaTypeKeys)) {
			expectLocalized(key, en);
			expectLocalized(key, ru);
		}
	});

	it('maps every object edit media type member', () => {
		for (const key of Object.values(objectEditMediaTypeKeys)) {
			expectLocalized(key, en);
			expectLocalized(key, ru);
		}
	});

	it('maps every primary source status member', () => {
		for (const key of Object.values(primarySourceStatusKeys)) {
			expectLocalized(key, en);
			expectLocalized(key, ru);
		}
	});

	it('maps every archive request status member', () => {
		for (const key of Object.values(requestStatusKeys)) {
			expectLocalized(key, en);
			expectLocalized(key, ru);
		}
	});

	it('localizes known open-set values and preserves unknown values for raw fallback', () => {
		expect(knownMediaTypeKey('document')).toBe(mediaTypeKeys.document);
		expect(knownMediaTypeKey('external')).toBeNull();
		expect(knownRequestActionKey('object_resync')).toBe('objects.detail.values.requestAction.object_resync');
		expect(knownRequestActionKey('external_action')).toBeNull();
	});

	it('renders Russian availability labels without raw codes', () => {
		expect(translate(ru, availabilityStateKeys.ARCHIVED)).toBe('В архиве');
		expect(translate(ru, availabilityStateKeys.RESTORING)).toBe('Восстанавливается');
	});

	it('maps every known dashboard event to localized copy', () => {
		for (const key of Object.values(dashboardActivityEventKeys)) {
			expectLocalized(key, en);
			expectLocalized(key, ru);
		}
	});

	it('maps every dashboard role copy field', () => {
		for (const keys of Object.values(dashboardRoleCopyKeys)) {
			for (const key of Object.values(keys)) {
				expectLocalized(key, en);
				expectLocalized(key, ru);
			}
		}
	});

	it('maps every known review pipeline preset member', () => {
		for (const key of Object.values(reviewPipelinePresetKeys)) {
			expectLocalized(key, en);
			expectLocalized(key, ru);
		}
	});

	it('maps every known setup pipeline preset member', () => {
		for (const key of Object.values(setupPipelinePresetKeys)) {
			expectLocalized(key, en);
			expectLocalized(key, ru);
		}
	});

	it('resolves known pipeline presets and preserves unknown ones for raw fallback', () => {
		for (const preset of [
			'auto',
			'none',
			'ocr_text',
			'audio_transcript',
			'video_transcript',
			'ocr_and_audio_transcript',
			'ocr_and_video_transcript'
		]) {
			expect(knownReviewPipelinePresetKey(preset)).toBe(reviewPipelinePresetKeys[preset as keyof typeof reviewPipelinePresetKeys]);
			expect(knownSetupPipelinePresetKey(preset)).toBe(setupPipelinePresetKeys[preset as keyof typeof setupPipelinePresetKeys]);
		}
		expect(knownReviewPipelinePresetKey('future_pipeline')).toBeNull();
		expect(knownSetupPipelinePresetKey('future_pipeline')).toBeNull();
	});

	it('resolves known setup language codes and preserves unknown ones for raw fallback', () => {
		for (const language of ['en', 'ru', 'fa', 'tg', 'mixed', 'english', 'persian', 'tajik']) {
			expect(knownSetupLanguageKey(language)).not.toBeNull();
			expect(knownSetupLanguageKey(` ${language} `)).not.toBeNull();
		}
		expect(knownSetupLanguageKey('xx')).toBeNull();
		expect(knownReviewLanguageKey('xx')).toBeNull();
		expect(knownReviewLanguageKey('tg')).toBe('objects.languages.tg');
	});

	it('maps every access level member to a distinct translation', () => {
		for (const level of ['private', 'family', 'public'] as const) {
			expectLocalized(accessLevelKeys[level], en);
			expectLocalized(accessLevelKeys[level], ru);
		}
	});

	it('resolves known object types case-insensitively and preserves unknown ones', () => {
		for (const type of ['GENERIC', 'IMAGE', 'AUDIO', 'VIDEO', 'DOCUMENT']) {
			expect(knownObjectTypeKey(type)).toBe(objectTypeKeys[type]);
			expect(knownObjectTypeKey(type.toLowerCase())).toBe(objectTypeKeys[type]);
			expectLocalized(objectTypeKeys[type], en);
			expectLocalized(objectTypeKeys[type], ru);
		}
		expect(knownObjectTypeKey('hologram')).toBeNull();
	});
});
