import { describe, expect, it } from 'vitest';
import {
	createAttachmentDisposition,
	isSafeInlineArtifactMediaType,
	isSafePreviewMediaType,
	normalizeMediaType
} from './mediaResponses';

describe('media response helpers', () => {
	it('normalizes media types before evaluating an allowlist', () => {
		expect(normalizeMediaType(' IMAGE/JPEG; charset=binary ')).toBe('image/jpeg');
		expect(isSafePreviewMediaType(normalizeMediaType('image/jpeg; charset=binary'))).toBe(true);
		expect(isSafePreviewMediaType(normalizeMediaType('image/svg+xml'))).toBe(false);
		expect(isSafeInlineArtifactMediaType(normalizeMediaType('image/svg+xml'))).toBe(false);
	});

	it('always creates a safe attachment disposition', () => {
		const disposition = createAttachmentDisposition(
			'inline; filename="../../report\r\n.html"',
			'artifact-1'
		);

		expect(disposition).toContain('attachment;');
		expect(disposition).toContain('filename="report.html"');
		expect(disposition).not.toContain('\r');
		expect(disposition).not.toContain('\n');
	});

	it('prefers a valid UTF-8 filename star and falls back safely', () => {
		expect(
			createAttachmentDisposition(
				"attachment; filename=plain.txt; filename*=UTF-8''r%C3%A9sum%C3%A9.pdf",
				'artifact-1'
			)
		).toContain("filename*=UTF-8''r%C3%A9sum%C3%A9.pdf");
		expect(createAttachmentDisposition(null, 'artifact-1')).toContain('filename="artifact-artifact-1"');
	});
});
