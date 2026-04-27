// Mock data for Osimi Archive ingestion prototype
// 20 files across the batch with Persian/Tajik filenames and authentic samples

const KIND_OPTIONS = [
  { id: 'newspaper', label: 'Newspaper', sub: 'Periodicals, broadsheets, mags' },
  { id: 'photo', label: 'Photograph', sub: 'Prints, slides, negatives' },
  { id: 'audio', label: 'Audio', sub: 'Interviews, music, broadcasts' },
  { id: 'video', label: 'Video', sub: 'Footage, lectures, ceremonies' },
  { id: 'book', label: 'Book', sub: 'Bound volumes, pamphlets' },
  { id: 'manuscript', label: 'Manuscript', sub: 'Handwritten, typescript' },
  { id: 'other', label: 'Other', sub: 'Mixed or uncategorized' },
];

const LANGUAGE_OPTIONS = [
  { id: 'fa', label: 'Persian', native: 'فارسی' },
  { id: 'tg', label: 'Tajik', native: 'Тоҷикӣ' },
  { id: 'en', label: 'English', native: 'English' },
  { id: 'mixed', label: 'Mixed', native: 'Multiple scripts' },
  { id: 'unknown', label: 'Unknown', native: 'Detect from content' },
];

const PIPELINE_PRESETS = [
  {
    id: 'auto',
    label: 'Auto',
    sub: 'Detect content and run appropriate pipelines',
    pipelines: ['detect', 'ocr', 'translate', 'index'],
  },
  {
    id: 'ocr',
    label: 'OCR + Index',
    sub: 'For scanned text: extract characters, build search index',
    pipelines: ['ocr', 'translate', 'index'],
  },
  {
    id: 'transcribe',
    label: 'Transcribe',
    sub: 'For audio/video: speech-to-text, segment by speaker',
    pipelines: ['transcribe', 'translate', 'index'],
  },
  {
    id: 'photo',
    label: 'Photo metadata',
    sub: 'Extract EXIF, run face & object detection, geotag',
    pipelines: ['exif', 'detect', 'index'],
  },
  {
    id: 'none',
    label: 'None',
    sub: 'Store and catalog only — no AI processing',
    pipelines: [],
  },
  {
    id: 'custom',
    label: 'Custom',
    sub: 'Configure pipelines per file in setup',
    pipelines: [],
  },
];

const PIPELINE_DEFS = {
  detect: { label: 'Classify', desc: 'Detect content kind & language', dur: '~6s' },
  ocr: { label: 'OCR', desc: 'Extract text from scanned pages', dur: '~40s/page' },
  transcribe: { label: 'Transcribe', desc: 'Speech-to-text, speaker diarization', dur: '~0.3× runtime' },
  exif: { label: 'EXIF & GPS', desc: 'Read camera, date, location metadata', dur: '<1s' },
  translate: { label: 'Translate', desc: 'Render English mirror of source text', dur: '~15s/page' },
  index: { label: 'Index', desc: 'Build full-text & semantic search', dur: '~5s' },
};

// Twenty files for the demo batch — NoorMags Issue 80–82
const FILES = [
  { id: 'f01', name: 'NoorMags_80_cover.tif', size: 24_400_000, type: 'image/tiff', kind: 'newspaper', lang: 'fa', enabled: true, status: 'ready' },
  { id: 'f02', name: 'NoorMags_80_p02-03.tif', size: 38_200_000, type: 'image/tiff', kind: 'newspaper', lang: 'fa', enabled: true, status: 'ready' },
  { id: 'f03', name: 'NoorMags_80_p04-05.tif', size: 36_900_000, type: 'image/tiff', kind: 'newspaper', lang: 'fa', enabled: true, status: 'ready' },
  { id: 'f04', name: 'NoorMags_80_p06-07.tif', size: 37_500_000, type: 'image/tiff', kind: 'newspaper', lang: 'fa', enabled: true, status: 'ready' },
  { id: 'f05', name: 'NoorMags_80_p08-back.tif', size: 28_100_000, type: 'image/tiff', kind: 'newspaper', lang: 'fa', enabled: true, status: 'ready', warn: 'Low resolution on page 8 — OCR confidence may be reduced' },
  { id: 'f06', name: 'NoorMags_81_cover.tif', size: 25_200_000, type: 'image/tiff', kind: 'newspaper', lang: 'fa', enabled: true, status: 'ready' },
  { id: 'f07', name: 'NoorMags_81_p02-03.tif', size: 39_400_000, type: 'image/tiff', kind: 'newspaper', lang: 'fa', enabled: true, status: 'ready' },
  { id: 'f08', name: 'NoorMags_81_p04-05.tif', size: 38_700_000, type: 'image/tiff', kind: 'newspaper', lang: 'mixed', enabled: true, status: 'ready', note: 'English advertisement on p.5' },
  { id: 'f09', name: 'NoorMags_81_p06-07.tif', size: 37_200_000, type: 'image/tiff', kind: 'newspaper', lang: 'fa', enabled: true, status: 'ready' },
  { id: 'f10', name: 'NoorMags_81_p08-back.tif', size: 27_900_000, type: 'image/tiff', kind: 'newspaper', lang: 'fa', enabled: true, status: 'ready' },
  { id: 'f11', name: 'NoorMags_82_cover.tif', size: 25_600_000, type: 'image/tiff', kind: 'newspaper', lang: 'fa', enabled: true, status: 'ready' },
  { id: 'f12', name: 'NoorMags_82_p02-03.tif', size: 38_900_000, type: 'image/tiff', kind: 'newspaper', lang: 'fa', enabled: true, status: 'ready' },
  { id: 'f13', name: 'NoorMags_82_p04-05.tif', size: 37_100_000, type: 'image/tiff', kind: 'newspaper', lang: 'fa', enabled: true, status: 'ready' },
  { id: 'f14', name: 'NoorMags_82_p06-07.tif', size: 38_300_000, type: 'image/tiff', kind: 'newspaper', lang: 'fa', enabled: true, status: 'ready' },
  { id: 'f15', name: 'NoorMags_82_p08-back.tif', size: 28_400_000, type: 'image/tiff', kind: 'newspaper', lang: 'fa', enabled: true, status: 'ready' },
  { id: 'f16', name: 'editor_interview_dushanbe_1972.wav', size: 412_000_000, type: 'audio/wav', kind: 'audio', lang: 'tg', enabled: true, status: 'ready', note: 'Reel-to-reel transfer, 47 min, single speaker' },
  { id: 'f17', name: 'editorial_meeting_photos_set_a.zip', size: 84_300_000, type: 'application/zip', kind: 'photo', lang: 'unknown', enabled: true, status: 'ready', note: 'Bundle: 12 prints, scanned at 600 dpi' },
  { id: 'f18', name: 'cover_proof_82_versions.pdf', size: 12_400_000, type: 'application/pdf', kind: 'manuscript', lang: 'fa', enabled: true, status: 'ready', note: 'Three pre-press iterations' },
  { id: 'f19', name: 'subscriber_ledger_1971-1972.tif', size: 56_100_000, type: 'image/tiff', kind: 'manuscript', lang: 'mixed', enabled: false, status: 'excluded', note: 'Confidential — needs separate access review' },
  { id: 'f20', name: 'masthead_calligraphy_originals.tif', size: 41_800_000, type: 'image/tiff', kind: 'manuscript', lang: 'fa', enabled: true, status: 'ready', note: 'Hand-lettered, OCR will likely fail; archive only' },
];

// Recent batches for the (off-screen but referenced) overview
const RECENT_BATCHES = [
  { id: 'b-2406', name: 'NoorMags Issue 77–79', kind: 'newspaper', files: 18, status: 'completed', done: 18, total: 18, started: '3 days ago' },
  { id: 'b-2405', name: 'Sarmashq oral histories — Spring \'72', kind: 'audio', files: 9, status: 'review', done: 7, total: 9, started: '5 days ago' },
  { id: 'b-2404', name: 'Editorial board photographs', kind: 'photo', files: 42, status: 'running', done: 31, total: 42, started: '6 hours ago' },
];

// OCR sample for the review screen
const OCR_SAMPLE = {
  source: `سرمقاله نوشتهٔ سردبیر، شمارهٔ ۸۰، بهار ۱۳۵۱
در این شماره به موضوعِ زبان مادری در میان مهاجران پرداخته‌ایم.
چند خاطره از روزهای آغاز نشریه نیز آمده است.`,
  english: `Editorial by the editor-in-chief, Issue 80, Spring 1351 (1972).
This issue takes up the question of the mother tongue among émigrés.
Several recollections from the founding days of the magazine also appear.`,
  confidence: 0.94,
};

window.OSIMI = {
  KIND_OPTIONS,
  LANGUAGE_OPTIONS,
  PIPELINE_PRESETS,
  PIPELINE_DEFS,
  FILES,
  RECENT_BATCHES,
  OCR_SAMPLE,
};
