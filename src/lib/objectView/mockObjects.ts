import type {
	DocumentObjectView,
	ImageObjectView,
	AudioObjectView,
	VideoObjectView,
	ObjectViewRecord
} from './types';

const toSvgDataUri = (svg: string): string => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

const documentPageSvg = (pageNumber: number, totalPages: number): string =>
	toSvgDataUri(`
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1280">
			<rect width="900" height="1280" fill="#efe8d7"/>
			<rect x="62" y="54" width="776" height="1172" rx="24" fill="#fcfaf4" stroke="#c7b89a" stroke-width="3"/>
			<rect x="110" y="120" width="340" height="18" rx="9" fill="#6f8791" opacity="0.9"/>
			<rect x="110" y="160" width="210" height="10" rx="5" fill="#dd6e42" opacity="0.5"/>
			<rect x="540" y="146" width="160" height="30" rx="15" fill="#e8dab2"/>
			<text x="620" y="166" text-anchor="middle" font-family="Georgia, serif" font-size="18" fill="#4f6d7a">Vol. 8 Issue ${pageNumber}</text>
			<rect x="110" y="228" width="300" height="8" rx="4" fill="#6e6e6e" opacity="0.55"/>
			<rect x="110" y="252" width="300" height="8" rx="4" fill="#6e6e6e" opacity="0.55"/>
			<rect x="110" y="276" width="270" height="8" rx="4" fill="#6e6e6e" opacity="0.55"/>
			<rect x="472" y="228" width="318" height="8" rx="4" fill="#6e6e6e" opacity="0.55"/>
			<rect x="472" y="252" width="318" height="8" rx="4" fill="#6e6e6e" opacity="0.55"/>
			<rect x="472" y="276" width="290" height="8" rx="4" fill="#6e6e6e" opacity="0.55"/>
			${Array.from({ length: 24 }, (_, index) => {
				const row = 344 + index * 30;
				return `<rect x="110" y="${row}" width="300" height="7" rx="3.5" fill="#777" opacity="${index % 4 === 0 ? '0.44' : '0.33'}"/><rect x="472" y="${row}" width="318" height="7" rx="3.5" fill="#777" opacity="${index % 5 === 0 ? '0.46' : '0.34'}"/>`;
			}).join('')}
			<rect x="110" y="1112" width="680" height="44" rx="14" fill="#c0d6df" opacity="0.35"/>
			<text x="450" y="1140" text-anchor="middle" font-family="Georgia, serif" font-size="20" fill="#4f6d7a">Read-only OCR available for page ${pageNumber} of ${totalPages}</text>
			<text x="450" y="1210" text-anchor="middle" font-family="Georgia, serif" font-size="24" fill="#4f6d7a">${pageNumber}</text>
		</svg>
	`);

const imageSvg = (): string =>
	toSvgDataUri(`
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1100">
			<defs>
				<linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0%" stop-color="#1f3138"/>
					<stop offset="55%" stop-color="#4f6d7a"/>
					<stop offset="100%" stop-color="#c0d6df"/>
				</linearGradient>
			</defs>
			<rect width="1600" height="1100" fill="url(#sky)"/>
			<circle cx="1110" cy="220" r="140" fill="#e8dab2" opacity="0.7"/>
			<path d="M0 860C180 790 296 710 454 670C592 634 720 650 854 616C1015 575 1144 468 1312 492C1458 512 1536 580 1600 628V1100H0Z" fill="#20353d"/>
			<path d="M120 810C250 690 410 570 598 552C756 538 884 600 1038 584C1224 565 1364 448 1510 390V1100H120Z" fill="#2c4650" opacity="0.88"/>
			<rect x="288" y="244" width="512" height="642" rx="18" fill="#efe8d7" opacity="0.22" stroke="#efe8d7" stroke-width="2"/>
			<rect x="328" y="284" width="432" height="562" rx="10" fill="#eaeaea" opacity="0.15" stroke="#c0d6df" stroke-width="1.5" stroke-dasharray="10 12"/>
			<text x="360" y="790" font-family="Georgia, serif" font-size="34" fill="#fcfaf4">Portrait Studio, Dushanbe, c. 1931</text>
		</svg>
	`);

const videoPosterSvg = (): string =>
	toSvgDataUri(`
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
			<rect width="1600" height="900" fill="#16252b"/>
			<rect x="80" y="80" width="1440" height="740" rx="32" fill="#243942" stroke="#4f6d7a" stroke-width="3"/>
			<rect x="128" y="128" width="1344" height="644" rx="24" fill="#314d58"/>
			<circle cx="802" cy="450" r="110" fill="#e8dab2" opacity="0.88"/>
			<path d="M762 390L872 452L762 514Z" fill="#1e3138"/>
			<rect x="128" y="708" width="1344" height="64" rx="18" fill="#1d2f36"/>
			<text x="164" y="748" font-family="Arial, sans-serif" font-size="28" fill="#eaeaea">Field interview footage - restoration preview</text>
		</svg>
	`);

const buildDocumentPages = (count: number) =>
	Array.from({ length: count }, (_, index) => ({
		id: `doc-page-${index + 1}`,
		label: `Page ${index + 1}`,
		imageUrl: documentPageSvg(index + 1, count),
		ocrText:
			index % 2 === 0
				? 'The article traces migration routes, family names, and editorial notes gathered from period newspapers. Text is shown as a read-only OCR excerpt.'
				: 'Marginal notes mention publication gaps, issue numbering, and preservation remarks from the original bound volume. OCR remains visible but never editable in view mode.'
	}));

const documentObject: DocumentObjectView = {
	id: 'samarkand-ledger-1928',
	title: 'Samarkand Community Ledger, Spring 1928',
	status: 'READY',
	mediaType: 'document',
	subtitle: 'Scanned periodical issue with OCR available for quick reading.',
	reviewLabel: '12 pages preserved',
	metadata: {
		title: 'Samarkand Community Ledger, Spring 1928',
		publicationDate: '1928-04',
		language: 'Persian and Russian',
		tags: [{ label: 'Newspaper' }, { label: 'Community history' }, { label: 'OCR ready' }],
		description:
			'Bound issue with local announcements, serialized essays, and handwritten catalog notes captured along the page margins.',
		accessLevel: 'Family',
		rightsNote: 'Reading access permitted. Derivative reuse requires curator confirmation.',
		collection: 'Osimi pilot archive'
	},
	pageCount: 12,
	pages: buildDocumentPages(12),
	hasOcr: true
};

const imageObject: ImageObjectView = {
	id: 'studio-portrait-1931',
	title: 'Studio Portrait with Embroidered Coat',
	status: 'NEEDS_REVIEW',
	mediaType: 'image',
	subtitle: 'Single high-resolution photograph with visual inspection focus.',
	reviewLabel: 'Retouching notes pending',
	metadata: {
		title: 'Studio Portrait with Embroidered Coat',
		publicationDate: '1931',
		language: 'No language',
		tags: [{ label: 'Portrait' }, { label: 'Textile history' }, { label: 'Studio print' }],
		description:
			'Formal portrait print showing layered costume details, studio lighting, and a partially stamped reverse side.',
		accessLevel: 'Public',
		rightsNote: 'Open for study and exhibition with attribution to the Osimi collection.',
		collection: 'Portrait cabinet collection'
	},
	imageUrl: imageSvg(),
	imageAlt: 'Mock archival portrait rendered as a moody studio photograph.',
	hasZoom: true
};

const audioObject: AudioObjectView = {
	id: 'oral-history-reel-07',
	title: 'Oral History Interview with Zarina T.',
	status: 'PROCESSING',
	mediaType: 'audio',
	subtitle: 'Digitized reel transfer with transcript available for reference.',
	reviewLabel: 'Transcript draft attached',
	metadata: {
		title: 'Oral History Interview with Zarina T.',
		publicationDate: '1987-06-14',
		language: 'Tajik',
		tags: [{ label: 'Oral history' }, { label: 'Migration' }, { label: 'Interview' }],
		description:
			'Interview segment covering family displacement, school memories, and naming traditions from the late Soviet period.',
		accessLevel: 'Family',
		rightsNote: 'Listening allowed for approved researchers. Public quotation remains restricted.',
		collection: 'Voices of the archive'
	},
	durationSeconds: 382,
	waveform: [20, 34, 28, 52, 40, 61, 46, 30, 18, 24, 46, 57, 68, 45, 38, 29, 22, 19, 31, 54, 62, 48, 34, 26, 16, 24, 42, 50, 64, 59, 44, 28],
	transcript: [
		{
			id: 'audio-segment-1',
			startSeconds: 0,
			endSeconds: 46,
			text: 'I remember the courtyard first, because everyone gathered there before the market opened.',
			speaker: 'Zarina T.'
		},
		{
			id: 'audio-segment-2',
			startSeconds: 46,
			endSeconds: 132,
			text: 'The newspapers arrived folded in cloth, and my uncle always read the headlines aloud before breakfast.',
			speaker: 'Zarina T.'
		},
		{
			id: 'audio-segment-3',
			startSeconds: 132,
			endSeconds: 248,
			text: 'When we moved, the family kept only the photographs, the prayer books, and two notebooks with addresses.',
			speaker: 'Zarina T.'
		},
		{
			id: 'audio-segment-4',
			startSeconds: 248,
			endSeconds: 382,
			text: 'Listening back now, I want the young people to know the names of the streets, even if the buildings changed.',
			speaker: 'Zarina T.'
		}
	]
};

const videoObject: VideoObjectView = {
	id: 'khorog-visit-1974',
	title: 'Khorog Visit and Courtyard Gathering',
	status: 'READY',
	mediaType: 'video',
	subtitle: 'Short moving-image record with optional subtitles and transcript.',
	reviewLabel: 'Captions synchronized',
	metadata: {
		title: 'Khorog Visit and Courtyard Gathering',
		publicationDate: '1974',
		language: 'Mixed speech',
		tags: [{ label: 'Home movie' }, { label: 'Courtyard life' }, { label: '16mm transfer' }],
		description:
			'Color footage of a family visit, domestic ritual, and street arrival sequences transferred from a worn amateur reel.',
		accessLevel: 'Public',
		rightsNote: 'May be screened for teaching and non-commercial research with source credit.',
		collection: 'Moving image shelf'
	},
	durationSeconds: 264,
	posterUrl: videoPosterSvg(),
	transcript: [
		{
			id: 'video-segment-1',
			startSeconds: 0,
			endSeconds: 58,
			text: 'Arrival at the courtyard; children run toward the camera while adults carry trays of tea.'
		},
		{
			id: 'video-segment-2',
			startSeconds: 58,
			endSeconds: 148,
			text: 'Conversation continues under the vine canopy as the camera settles on the table setting.'
		},
		{
			id: 'video-segment-3',
			startSeconds: 148,
			endSeconds: 264,
			text: 'Closing sequence follows the visitors through the lane at dusk, ending on a slow pan back to the doorway.'
		}
	],
	subtitles: [
		{ id: 'cue-1', startSeconds: 4, endSeconds: 20, text: 'They have arrived from the upper valley.' },
		{ id: 'cue-2', startSeconds: 64, endSeconds: 89, text: 'Bring the tea over here, in the shade.' },
		{ id: 'cue-3', startSeconds: 176, endSeconds: 202, text: 'Do not forget to write down the names.' }
	]
};

export const mockObjectViews: ObjectViewRecord[] = [documentObject, imageObject, audioObject, videoObject];

export const mockObjectViewIds = mockObjectViews.map((item) => item.id);

export const getMockObjectView = (id: string): ObjectViewRecord | undefined =>
	mockObjectViews.find((item) => item.id === id);
