import type { IngestionSetupService } from './ingestionSetup';

export const mockIngestionSetupService: IngestionSetupService = {
	presignFile: async ({ filename, contentType, sizeBytes }) => ({
		fileId: `mock-${filename}-${Date.now()}`,
		storageKey: `mock/${filename}`,
		uploadUrl: 'https://example.test/mock-upload',
		expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
		headers: {
			contentType,
			contentLength: String(sizeBytes)
		}
	}),
	commitFile: async () => undefined,
	submit: async () => undefined,
	deleteFile: async () => undefined
};
