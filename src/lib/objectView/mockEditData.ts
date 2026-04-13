export type DocumentEditPage = {
	id: string;
	label: string;
	ocrText: string;
	curatedText: string;
	confidence: number;
};

export type DocumentEditData = {
	mediaType: 'document';
	editMode: 'per-page' | 'whole-document';
	pages: DocumentEditPage[];
	wholeDocumentCuratedText: string;
};

export type AudioEditSegment = {
	id: string;
	startSeconds: number;
	endSeconds: number;
	speaker: string;
	curatedText: string;
};

export type AudioEditData = {
	mediaType: 'audio';
	curatedTranscript: AudioEditSegment[];
};

export type VideoEditSegment = {
	id: string;
	startSeconds: number;
	endSeconds: number;
	curatedText: string;
};

export type VideoEditCaption = {
	id: string;
	startSeconds: number;
	endSeconds: number;
	curatedText: string;
};

export type VideoEditData = {
	mediaType: 'video';
	curatedTranscript: VideoEditSegment[];
	curatedCaptions: VideoEditCaption[];
};

export type EditableMetadata = {
	title: string;
	publicationDate: string;
	datePrecision: 'none' | 'year' | 'month' | 'day';
	dateApproximate: boolean;
	language: string;
	tags: string[];
	people: string[];
	description: string;
};

export type EditableRights = {
	accessLevel: 'Private' | 'Family' | 'Public';
	rightsNote: string;
	sensitivityNote: string;
};

export type ObjectEditData =
	| ({ id: string; metadata: EditableMetadata; rights: EditableRights } & DocumentEditData)
	| ({ id: string; metadata: EditableMetadata; rights: EditableRights } & AudioEditData)
	| ({ id: string; metadata: EditableMetadata; rights: EditableRights } & VideoEditData)
	| { id: string; mediaType: 'image'; metadata: EditableMetadata; rights: EditableRights };

const formatTimestamp = (totalSeconds: number): string => {
	const m = Math.floor(totalSeconds / 60);
	const s = Math.floor(totalSeconds % 60);
	return `${m}:${s.toString().padStart(2, '0')}`;
};

export { formatTimestamp };

const documentEditData: ObjectEditData = {
	id: 'samarkand-ledger-1928',
	mediaType: 'document',
	editMode: 'per-page',
	pages: [
		{
			id: 'doc-page-1',
			label: 'Page 1',
			ocrText: 'The article traces migration routes, family names, and editorial notes gathered from period newspapers. Text is shown as a read-only OCR excerpt.',
			curatedText: 'This article documents historical migration routes and family lineages across the Samarkand region, with editorial annotations preserved from the original newspaper issue.',
			confidence: 93
		},
		{
			id: 'doc-page-2',
			label: 'Page 2',
			ocrText: 'Marginal notes mention publication gaps, issue numbering, and preservation remarks from the original bound volume. OCR remains visible but never editable in view mode.',
			curatedText: '',
			confidence: 87
		},
		{
			id: 'doc-page-3',
			label: 'Page 3',
			ocrText: 'The article traces migration routes, family names, and editorial notes gathered from period newspapers. Text is shown as a read-only OCR excerpt.',
			curatedText: '',
			confidence: 78
		},
		{
			id: 'doc-page-4',
			label: 'Page 4',
			ocrText: 'Marginal notes mention publication gaps, issue numbering, and preservation remarks from the original bound volume. OCR remains visible but never editable in view mode.',
			curatedText: 'Preservation notes from the bound volume indicate intermittent publication between 1927 and 1929, with issue numbering inconsistencies during the editorial transition period.',
			confidence: 91
		},
		{
			id: 'doc-page-5',
			label: 'Page 5',
			ocrText: 'The article traces migration routes, family names, and editorial notes gathered from period newspapers. Text is shown as a read-only OCR excerpt.',
			curatedText: '',
			confidence: 72
		},
		{
			id: 'doc-page-6',
			label: 'Page 6',
			ocrText: 'Marginal notes mention publication gaps, issue numbering, and preservation remarks from the original bound volume. OCR remains visible but never editable in view mode.',
			curatedText: '',
			confidence: 85
		},
		{
			id: 'doc-page-7',
			label: 'Page 7',
			ocrText: 'The article traces migration routes, family names, and editorial notes gathered from period newspapers. Text is shown as a read-only OCR excerpt.',
			curatedText: '',
			confidence: 68
		},
		{
			id: 'doc-page-8',
			label: 'Page 8',
			ocrText: 'Marginal notes mention publication gaps, issue numbering, and preservation remarks from the original bound volume. OCR remains visible but never editable in view mode.',
			curatedText: '',
			confidence: 89
		},
		{
			id: 'doc-page-9',
			label: 'Page 9',
			ocrText: 'The article traces migration routes, family names, and editorial notes gathered from period newspapers. Text is shown as a read-only OCR excerpt.',
			curatedText: '',
			confidence: 76
		},
		{
			id: 'doc-page-10',
			label: 'Page 10',
			ocrText: 'Marginal notes mention publication gaps, issue numbering, and preservation remarks from the original bound volume. OCR remains visible but never editable in view mode.',
			curatedText: '',
			confidence: 82
		},
		{
			id: 'doc-page-11',
			label: 'Page 11',
			ocrText: 'The article traces migration routes, family names, and editorial notes gathered from period newspapers. Text is shown as a read-only OCR excerpt.',
			curatedText: '',
			confidence: 70
		},
		{
			id: 'doc-page-12',
			label: 'Page 12',
			ocrText: 'Marginal notes mention publication gaps, issue numbering, and preservation remarks from the original bound volume. OCR remains visible but never editable in view mode.',
			curatedText: '',
			confidence: 84
		}
	],
	wholeDocumentCuratedText: '',
	metadata: {
		title: 'Samarkand Community Ledger, Spring 1928',
		publicationDate: '1928-04',
		datePrecision: 'month',
		dateApproximate: false,
		language: 'Persian and Russian',
		tags: ['Newspaper', 'Community history', 'OCR ready'],
		people: ['A. Rahimov', 'N. Karimova'],
		description:
			'Bound issue with local announcements, serialized essays, and handwritten catalog notes captured along the page margins.'
	},
	rights: {
		accessLevel: 'Family',
		rightsNote: 'Reading access permitted. Derivative reuse requires curator confirmation.',
		sensitivityNote: ''
	}
};

const imageEditData: ObjectEditData = {
	id: 'studio-portrait-1931',
	mediaType: 'image',
	metadata: {
		title: 'Studio Portrait with Embroidered Coat',
		publicationDate: '1931',
		datePrecision: 'year',
		dateApproximate: true,
		language: 'No language',
		tags: ['Portrait', 'Textile history', 'Studio print'],
		people: ['Unknown subject', 'Photographer: V. Petrov'],
		description:
			'Formal portrait print showing layered costume details, studio lighting, and a partially stamped reverse side.'
	},
	rights: {
		accessLevel: 'Public',
		rightsNote: 'Open for study and exhibition with attribution to the Osimi collection.',
		sensitivityNote: 'Subject identity under review'
	}
};

const audioEditData: ObjectEditData = {
	id: 'oral-history-reel-07',
	mediaType: 'audio',
	curatedTranscript: [
		{
			id: 'audio-segment-1',
			startSeconds: 0,
			endSeconds: 46,
			speaker: 'Zarina T.',
			curatedText: 'I remember the courtyard first, because everyone gathered there before the market opened.'
		},
		{
			id: 'audio-segment-2',
			startSeconds: 46,
			endSeconds: 132,
			speaker: 'Zarina T.',
			curatedText: 'The newspapers arrived folded in cloth, and my uncle always read the headlines aloud before breakfast.'
		},
		{
			id: 'audio-segment-3',
			startSeconds: 132,
			endSeconds: 248,
			speaker: 'Zarina T.',
			curatedText: 'When we moved, the family kept only the photographs, the prayer books, and two notebooks with addresses.'
		},
		{
			id: 'audio-segment-4',
			startSeconds: 248,
			endSeconds: 382,
			speaker: 'Zarina T.',
			curatedText: 'Listening back now, I want the young people to know the names of the streets, even if the buildings changed.'
		}
	],
	metadata: {
		title: 'Oral History Interview with Zarina T.',
		publicationDate: '1987-06-14',
		datePrecision: 'day',
		dateApproximate: false,
		language: 'Tajik',
		tags: ['Oral history', 'Migration', 'Interview'],
		people: ['Zarina T.', 'Interviewer: M. Davlatov'],
		description:
			'Interview segment covering family displacement, school memories, and naming traditions from the late Soviet period.'
	},
	rights: {
		accessLevel: 'Family',
		rightsNote: 'Listening allowed for approved researchers. Public quotation remains restricted.',
		sensitivityNote: 'Personal names mentioned; verify consent before public access'
	}
};

const videoEditData: ObjectEditData = {
	id: 'khorog-visit-1974',
	mediaType: 'video',
	curatedTranscript: [
		{
			id: 'video-segment-1',
			startSeconds: 0,
			endSeconds: 58,
			curatedText: ''
		},
		{
			id: 'video-segment-2',
			startSeconds: 58,
			endSeconds: 148,
			curatedText: 'Conversation continues under the vine canopy as the camera settles on the table setting.'
		},
		{
			id: 'video-segment-3',
			startSeconds: 148,
			endSeconds: 264,
			curatedText: ''
		}
	],
	curatedCaptions: [
		{ id: 'cue-1', startSeconds: 4, endSeconds: 20, curatedText: 'They have arrived from the upper valley.' },
		{ id: 'cue-2', startSeconds: 64, endSeconds: 89, curatedText: 'Bring the tea over here, in the shade.' },
		{ id: 'cue-3', startSeconds: 176, endSeconds: 202, curatedText: 'Do not forget to write down the names.' }
	],
	metadata: {
		title: 'Khorog Visit and Courtyard Gathering',
		publicationDate: '1974',
		datePrecision: 'year',
		dateApproximate: true,
		language: 'Mixed speech',
		tags: ['Home movie', 'Courtyard life', '16mm transfer'],
		people: [],
		description:
			'Color footage of a family visit, domestic ritual, and street arrival sequences transferred from a worn amateur reel.'
	},
	rights: {
		accessLevel: 'Public',
		rightsNote: 'May be screened for teaching and non-commercial research with source credit.',
		sensitivityNote: ''
	}
};

const editDataMap: Record<string, ObjectEditData> = {
	'samarkand-ledger-1928': documentEditData,
	'studio-portrait-1931': imageEditData,
	'oral-history-reel-07': audioEditData,
	'khorog-visit-1974': videoEditData
};

export const getMockEditData = (id: string): ObjectEditData | undefined => editDataMap[id];

export const deepCloneEditData = (data: ObjectEditData): ObjectEditData =>
	JSON.parse(JSON.stringify(data));

export const isDocumentEditData = (
	data: ObjectEditData
): data is { id: string; metadata: EditableMetadata; rights: EditableRights } & DocumentEditData =>
	data.mediaType === 'document';

export const isAudioEditData = (
	data: ObjectEditData
): data is { id: string; metadata: EditableMetadata; rights: EditableRights } & AudioEditData =>
	data.mediaType === 'audio';

export const isVideoEditData = (
	data: ObjectEditData
): data is { id: string; metadata: EditableMetadata; rights: EditableRights } & VideoEditData =>
	data.mediaType === 'video';