import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import { translations, type LocaleKey } from './translations';

const LOCALE_STORAGE_KEY = 'osimi-locale';
const DEFAULT_LOCALE: LocaleKey = 'en';

const isLocaleKey = (value: string): value is LocaleKey => value in translations;

const createLocaleStore = () => {
	const { subscribe, set } = writable<LocaleKey>(DEFAULT_LOCALE);

	const setLocale = (value: LocaleKey) => {
		set(value);
		if (!browser) return;
		window.localStorage.setItem(LOCALE_STORAGE_KEY, value);
		document.documentElement.lang = value;
	};

	const init = () => {
		if (!browser) return;

		const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
		if (saved && isLocaleKey(saved)) {
			set(saved);
			document.documentElement.lang = saved;
			return;
		}

		document.documentElement.lang = DEFAULT_LOCALE;
	};

	return {
		subscribe,
		init,
		setLocale
	};
};

export const locale = createLocaleStore();
