import { describe, expect, it } from 'vitest';

import { collectVisibleText } from './smoke-dom.mjs';

const render = (html) => {
	document.body.innerHTML = html;
};

describe('collectVisibleText', () => {
	it('collects direct text nodes mixed with child elements', () => {
		render('<div>before <span>child</span> after</div>');
		const text = collectVisibleText();
		expect(text).toContain('before');
		expect(text).toContain('child');
		expect(text).toContain('after');
	});

	it('excludes hidden content from text and attributes', () => {
		render(
			'<div>visible <span style="display:none">hidden-key</span></div>' +
				'<div hidden>hidden-copy</div>' +
				'<input aria-label="hidden-aria" style="visibility:hidden" />' +
				'<input aria-label="visible-aria" />'
		);
		const text = collectVisibleText();
		expect(text).toContain('visible');
		expect(text).not.toContain('hidden-key');
		expect(text).not.toContain('hidden-copy');
		expect(text).not.toContain('hidden-aria');
		expect(text).toContain('visible-aria');
	});

	it('excludes hidden ancestors even when the child text is inside visible styling', () => {
		render('<div style="display:none"><span>should-not-appear</span></div>');
		expect(collectVisibleText()).not.toContain('should-not-appear');
	});

	it('collects visible cyrillic and ignores hidden cyrillic', () => {
		render('<div>Видимая надпись</div><div hidden>Скрытая надпись</div>');
		const text = collectVisibleText();
		expect(text).toContain('Видимая надпись');
		expect(text).not.toContain('Скрытая надпись');
	});

	it('collects attribute text from visible elements only', () => {
		render('<button aria-label="Close drawer" title="Close"></button><button aria-label="Nope" hidden></button>');
		const text = collectVisibleText();
		expect(text).toContain('Close drawer');
		expect(text).not.toContain('Nope');
	});

	it('excludes inert and transparent ancestors', () => {
		render(
			'<div inert><span>route.hidden</span></div>' +
				'<div style="opacity:0"><span>Скрытый текст</span></div>' +
				'<div>Visible route copy</div>'
		);
		const text = collectVisibleText();
		expect(text).toContain('Visible route copy');
		expect(text).not.toContain('route.hidden');
		expect(text).not.toContain('Скрытый текст');
	});

	it('excludes visibility collapse and keeps visible aria-hidden text', () => {
		render(
			'<div style="visibility:collapse">Collapsed route copy</div>' +
				'<div aria-hidden="true">Visible untranslated copy</div>'
		);
		const text = collectVisibleText();
		expect(text).not.toContain('Collapsed route copy');
		expect(text).toContain('Visible untranslated copy');
	});
});
