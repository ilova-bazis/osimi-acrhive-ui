import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import { translations, type LocaleKey } from './translations';

export const LOCALE_STORAGE_KEY = 'osimi-locale';

const DEFAULT_LOCALE: LocaleKey = 'en';

const isLocaleKey = (value: string): value is LocaleKey =>
	Object.prototype.hasOwnProperty.call(translations, value);

const setDocumentLanguage = (value: LocaleKey) => {
	document.documentElement.lang = value;
};

const readStoredLocale = (): string | null => {
	try {
		return window.localStorage.getItem(LOCALE_STORAGE_KEY);
	} catch {
		return null;
	}
};

const persistLocale = (value: LocaleKey) => {
	try {
		window.localStorage.setItem(LOCALE_STORAGE_KEY, value);
	} catch {
		// Storage unavailable; the in-memory locale and document language still apply.
	}
};

const normalizeLanguageTag = (tag: string): string => tag.trim().toLowerCase().replace(/_/g, '-');

export const detectLocaleFromLanguages = (languages: readonly string[]): LocaleKey | null => {
	for (const tag of languages) {
		if (typeof tag !== 'string') continue;
		const normalized = normalizeLanguageTag(tag);
		if (!normalized) continue;
		const base = normalized.split('-')[0];
		if (base && isLocaleKey(base)) return base;
	}
	return null;
};

/**
 * Resolves the startup locale.
 *
 * Priority: a saved user preference, then the browser language, then English.
 * Every valid saved locale is honored, so a manual choice is never overridden
 * by browser detection.
 */
export const resolveInitialLocale = (
	stored: string | null,
	browserLanguages: readonly string[]
): LocaleKey => {
	if (stored !== null && isLocaleKey(stored)) return stored;

	return detectLocaleFromLanguages(browserLanguages) ?? DEFAULT_LOCALE;
};

const readBrowserLanguages = (): readonly string[] => {
	if (!browser) return [];
	try {
		const { languages, language } = window.navigator;
		if (Array.isArray(languages) && languages.length > 0) return languages;
		return typeof language === 'string' && language ? [language] : [];
	} catch {
		return [];
	}
};

const createLocaleStore = () => {
	const { subscribe, set } = writable<LocaleKey>(DEFAULT_LOCALE);

	const apply = (value: LocaleKey) => {
		set(value);
		if (!browser) return;
		setDocumentLanguage(value);
	};

	const setLocale = (value: LocaleKey) => {
		apply(value);
		if (!browser) return;
		persistLocale(value);
	};

	const init = () => {
		if (!browser) return;

		apply(resolveInitialLocale(readStoredLocale(), readBrowserLanguages()));
	};

	return {
		subscribe,
		init,
		setLocale
	};
};

export const locale = createLocaleStore();
