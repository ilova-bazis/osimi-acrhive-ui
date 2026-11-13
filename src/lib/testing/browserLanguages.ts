import { onTestFinished } from 'vitest';

/**
 * Test helper that replaces the browser language preferences.
 *
 * `navigator.languages` and `navigator.language` are accessor properties on the
 * `Navigator` prototype, so the stub is installed as an own property on the
 * navigator instance and removed again once the test finishes. The restoration is
 * registered with the test runner so it also runs when an assertion fails.
 */
export const stubBrowserLanguages = (languages: string[], language = languages[0] ?? '') => {
	const target = window.navigator;
	const originalLanguages = Object.getOwnPropertyDescriptor(target, 'languages');
	const originalLanguage = Object.getOwnPropertyDescriptor(target, 'language');

	Object.defineProperty(target, 'languages', {
		configurable: true,
		get: () => languages
	});
	Object.defineProperty(target, 'language', {
		configurable: true,
		get: () => language
	});

	onTestFinished(() => {
		if (originalLanguages) {
			Object.defineProperty(target, 'languages', originalLanguages);
		} else {
			Reflect.deleteProperty(target, 'languages');
		}
		if (originalLanguage) {
			Object.defineProperty(target, 'language', originalLanguage);
		} else {
			Reflect.deleteProperty(target, 'language');
		}
	});
};
