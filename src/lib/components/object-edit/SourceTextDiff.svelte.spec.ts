import { page } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

import { locale } from '$lib/i18n/locale';

import SourceTextDiff from './SourceTextDiff.svelte';

const renderDiff = (overrides: Record<string, unknown> = {}) => {
	const onCuratedChange = vi.fn();
	const view = render(SourceTextDiff, {
		sourceLabel: 'OCR text',
		curatedLabel: 'Curated text',
		sourceText: 'Raw OCR',
		curatedText: '',
		onCuratedChange,
		...overrides
	});
	return { view, onCuratedChange };
};

afterEach(() => {
	locale.setLocale('en');
});

describe('SourceTextDiff', () => {
	it('exposes source text as a region named by sourceLabel', async () => {
		renderDiff();

		const region = page.getByRole('region', { name: 'OCR text' });
		await expect.element(region).toBeInTheDocument();
		await expect.element(region.getByText('Raw OCR')).toBeInTheDocument();
	});

	it('names the curated textarea through its visible label', async () => {
		renderDiff();

		await expect.element(page.getByRole('textbox', { name: 'Curated text' })).toBeInTheDocument();

		const textarea = document.querySelector('textarea');
		expect(textarea?.id).toBeTruthy();
		expect(document.querySelector(`label[for="${textarea!.id}"]`)?.textContent).toBe(
			'Curated text'
		);
	});

	it('reports typed text through onCuratedChange', async () => {
		const { onCuratedChange } = renderDiff();

		const textarea = page.getByRole('textbox', { name: 'Curated text' });
		await textarea.fill('Curated by hand');

		expect(onCuratedChange.mock.calls).toEqual([['Curated by hand']]);
	});

	it('copies the exact source text through onCuratedChange', async () => {
		const { onCuratedChange } = renderDiff({ curatedText: 'Existing' });

		await page.getByRole('button', { name: 'Copy from source' }).click();

		expect(onCuratedChange.mock.calls).toEqual([['Raw OCR']]);
	});

	it('copies an empty source through onCuratedChange', async () => {
		const { onCuratedChange } = renderDiff({ sourceText: '', curatedText: 'Existing' });

		await page.getByRole('button', { name: 'Copy from source' }).click();

		expect(onCuratedChange.mock.calls).toEqual([['']]);
	});

	it('resets curated text through onCuratedChange', async () => {
		const { onCuratedChange } = renderDiff({ curatedText: 'Some text' });

		await page.getByRole('button', { name: 'Reset' }).click();

		expect(onCuratedChange.mock.calls).toEqual([['']]);
	});

	it('hides reset while curated text is empty', async () => {
		renderDiff({ curatedText: '' });

		await expect.element(page.getByRole('button', { name: 'Reset' })).not.toBeInTheDocument();
	});

	it('renders the localized empty state for missing source text', async () => {
		renderDiff({ sourceText: '' });

		const region = page.getByRole('region', { name: 'OCR text' });
		await expect.element(region).toBeInTheDocument();
		await expect.element(region.getByText('No source text available')).toBeInTheDocument();
	});

	it('localizes the empty state when the locale changes', async () => {
		renderDiff({ sourceText: '' });

		await expect.element(page.getByText('No source text available')).toBeInTheDocument();

		locale.setLocale('ru');

		await expect.element(page.getByText('Исходный текст недоступен')).toBeInTheDocument();
	});

	it('retranslates internal controls without remounting', async () => {
		renderDiff({ curatedText: 'Existing' });

		await expect
			.element(page.getByRole('button', { name: 'Copy from source' }))
			.toBeInTheDocument();

		locale.setLocale('ru');

		await expect
			.element(page.getByRole('button', { name: 'Скопировать из источника' }))
			.toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Сбросить' })).toBeInTheDocument();
	});

	it('keeps default labels static English regardless of locale', async () => {
		render(SourceTextDiff, {
			sourceText: 'Raw OCR',
			curatedText: '',
			onCuratedChange: vi.fn()
		});

		locale.setLocale('ru');

		await expect.element(page.getByRole('region', { name: 'Auto-extracted' })).toBeInTheDocument();
		await expect.element(page.getByRole('textbox', { name: 'Curated' })).toBeInTheDocument();
	});

	it('discovers consumer labels after the consumer retranslates them', async () => {
		const { view, onCuratedChange } = renderDiff();

		await expect.element(page.getByRole('region', { name: 'OCR text' })).toBeInTheDocument();

		locale.setLocale('ru');
		await view.rerender({
			sourceLabel: 'OCR-текст',
			curatedLabel: 'Курированный текст',
			sourceText: 'Raw OCR',
			curatedText: '',
			onCuratedChange
		});

		await expect.element(page.getByRole('region', { name: 'OCR-текст' })).toBeInTheDocument();
		await expect
			.element(page.getByRole('textbox', { name: 'Курированный текст' }))
			.toBeInTheDocument();
	});

	it('gives each instance distinct label associations', async () => {
		const first = render(SourceTextDiff, {
			sourceLabel: 'OCR text',
			curatedLabel: 'Curated text',
			sourceText: 'Raw OCR',
			curatedText: '',
			onCuratedChange: vi.fn()
		});
		const second = render(SourceTextDiff, {
			sourceLabel: 'OCR text',
			curatedLabel: 'Curated text',
			sourceText: 'Raw OCR',
			curatedText: '',
			onCuratedChange: vi.fn()
		});

		await vi.waitFor(() => {
			expect(document.querySelectorAll('textarea')).toHaveLength(2);
		});

		const textareas = Array.from(document.querySelectorAll('textarea'));
		expect(textareas).toHaveLength(2);
		expect(textareas[0]?.id).toBeTruthy();
		expect(textareas[1]?.id).toBeTruthy();
		expect(textareas[0]?.id).not.toBe(textareas[1]?.id);
		expect(document.querySelectorAll(`label[for="${textareas[0]!.id}"]`)).toHaveLength(1);
		expect(document.querySelectorAll(`label[for="${textareas[1]!.id}"]`)).toHaveLength(1);

		await first.unmount();
		await second.unmount();
	});
});
