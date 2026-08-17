import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import { translations, type LocaleKey } from './translations';

const LOCALE_STORAGE_KEY = 'osimi-locale';
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

const createLocaleStore = () => {
	const { subscribe, set } = writable<LocaleKey>(DEFAULT_LOCALE);

	const apply = (value: LocaleKey) => {
		set(value);
		if (!browser) return;
		setDocumentLanguage(value);
		persistLocale(value);
	};

	const setLocale = (value: LocaleKey) => {
		apply(value);
	};

	const init = () => {
		if (!browser) return;

		const saved = readStoredLocale();
		apply(saved && isLocaleKey(saved) ? saved : DEFAULT_LOCALE);
	};

	return {
		subscribe,
		init,
		setLocale
	};
};

export const locale = createLocaleStore();
