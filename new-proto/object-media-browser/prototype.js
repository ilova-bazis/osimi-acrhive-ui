/* Object Media Browser — standalone visual prototype (mock-only). */
(function () {
  'use strict';

  var root = document.getElementById('root');

  /* ---------- mock data ---------- */

  function makeFile(id, name, kind, type, size, status, note) {
    return { id: id, name: name, kind: kind, type: type, size: size, status: status, note: note || null };
  }

  var OBJECTS = [
    {
      id: 'obj-issue80',
      title: 'NoorMags Issue 80 — full issue',
      sub: 'Cover, spreads, back page, supplements',
      complete: false,
      files: [
        makeFile('f01', 'NoorMags_80_cover.tif', 'image', 'image/tiff', '24.4 MB', 'ready'),
        makeFile('f02', 'NoorMags_80_p02-03.tif', 'image', 'image/tiff', '38.2 MB', 'ready'),
        makeFile('f03', 'NoorMags_80_p04-05.tif', 'image', 'image/tiff', '36.9 MB', 'ready'),
        makeFile('f04', 'NoorMags_80_p06-07.tif', 'image', 'image/tiff', '37.5 MB', 'preparing'),
        makeFile('f05', 'NoorMags_80_p08-back.tif', 'image', 'image/tiff', '28.1 MB', 'failed', 'Rendering timed out after 30 seconds.'),
        makeFile('f06', 'editorial_board_1972.tif', 'image', 'image/tiff', '41.8 MB', 'purged', 'Preview removed to save storage.'),
        makeFile('f07', 'cover_proof_80_versions.pdf', 'pdf', 'application/pdf', '12.4 MB', 'none', 'PDF — no visual preview.'),
        makeFile('f08', 'editor_voiceover_80.wav', 'audio', 'audio/wav', '96.0 MB', 'none', 'Audio — waveform only.'),
      ],
    },
    {
      id: 'obj-interview',
      title: 'Editor interview — Dushanbe 1972',
      sub: 'Reel-to-reel transfer and transcript scans',
      complete: true,
      files: [
        makeFile('i01', 'editor_interview_master.wav', 'audio', 'audio/wav', '412 MB', 'none', 'Audio — waveform only.'),
        makeFile('i02', 'transcript_scan_p1.tif', 'image', 'image/tiff', '21.7 MB', 'ready'),
        makeFile('i03', 'transcript_scan_p2.tif', 'image', 'image/tiff', '22.1 MB', 'purged', 'Preview removed to save storage.'),
      ],
    },
  ];

  var FILE_INDEX = {};
  var INITIAL_STATE = {};
  OBJECTS.forEach(function (obj) {
    obj.files.forEach(function (f, i) {
      FILE_INDEX[f.id] = { obj: obj, idx: i };
      INITIAL_STATE[f.id] = { status: f.status, note: f.note };
    });
  });

  var STATE_LABEL = {
    ready: 'Ready',
    preparing: 'Preparing',
    failed: 'Failed',
    purged: 'Purged',
    none: 'No preview',
  };

  var LEGEND = [
    ['ready', 'Ready'],
    ['preparing', 'Preparing'],
    ['failed', 'Failed — needs attention'],
    ['purged', 'Purged'],
    ['none', 'No visual preview'],
  ];

  /* ---------- helpers ---------- */

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function hashSeed(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  function mulberry(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- deterministic svg artwork ---------- */

  function svgArtwork(seed, kind) {
    if (kind === 'audio') return svgWaveform(seed);
    if (kind === 'pdf') return svgDoc(seed);
    return svgPage(seed);
  }

  function svgPage(seed) {
    var r = mulberry(seed);
    var v = [];
    v.push('<svg viewBox="0 0 200 260" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">');
    v.push('<rect width="200" height="260" fill="var(--paper)"/>');
    v.push('<rect width="200" height="260" fill="none" stroke="var(--rule-strong)" stroke-width="2"/>');
    v.push('<rect x="12" y="12" width="176" height="18" fill="var(--slate)" opacity="0.85"/>');
    v.push('<rect x="12" y="36" width="120" height="4" fill="var(--ink)" opacity="0.75"/>');
    v.push('<rect x="12" y="44" width="88" height="4" fill="var(--ink)" opacity="0.75"/>');
    v.push('<rect x="12" y="52" width="104" height="3" fill="var(--ink)" opacity="0.5"/>');
    var imgLeft = r() > 0.5;
    var ix = imgLeft ? 12 : 108;
    var iw = 80;
    var ih = 46;
    var iy = 62;
    v.push('<rect x="' + ix + '" y="' + iy + '" width="' + iw + '" height="' + ih + '" fill="var(--sky)"/>');
    v.push('<rect x="' + (ix + 8) + '" y="' + (iy + 8) + '" width="' + (iw - 16) + '" height="' + (ih - 16) + '" fill="none" stroke="var(--slate)" stroke-width="1.5" opacity="0.7"/>');
    v.push('<circle cx="' + (ix + iw / 2) + '" cy="' + (iy + ih / 2) + '" r="5" fill="var(--peach)" opacity="0.8"/>');
    var colX = imgLeft ? 108 : 12;
    for (var c = 0; c < 2; c++) {
      var x = colX + c * 40;
      for (var l = 0; l < 9; l++) {
        v.push('<rect x="' + x + '" y="' + (62 + l * 6) + '" width="' + (28 - r() * 14) + '" height="2.6" fill="var(--ink-3)" opacity="' + (0.35 + r() * 0.25) + '"/>');
      }
    }
    for (var c2 = 0; c2 < 3; c2++) {
      var x2 = 12 + c2 * 60;
      for (var l2 = 0; l2 < 12; l2++) {
        v.push('<rect x="' + x2 + '" y="' + (118 + l2 * 5) + '" width="' + (44 - r() * 22) + '" height="2.2" fill="var(--ink-3)" opacity="' + (0.3 + r() * 0.3) + '"/>');
      }
    }
    var hy = 182 + r() * 10;
    v.push('<rect x="12" y="' + hy + '" width="' + (60 + r() * 40) + '" height="7" fill="var(--ink)" opacity="0.7"/>');
    v.push('<rect x="12" y="' + (hy + 12) + '" width="176" height="2" fill="var(--rule-strong)" opacity="0.6"/>');
    v.push('</svg>');
    return v.join('');
  }

  function svgWaveform(seed) {
    var r = mulberry(seed);
    var v = [];
    v.push('<svg viewBox="0 0 200 260" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">');
    v.push('<rect width="200" height="260" fill="var(--bg-2)"/>');
    v.push('<rect width="200" height="260" fill="none" stroke="var(--rule-strong)" stroke-width="2"/>');
    v.push('<rect x="12" y="12" width="176" height="18" fill="var(--slate)" opacity="0.85"/>');
    v.push('<circle cx="100" cy="110" r="52" fill="none" stroke="var(--slate)" stroke-width="2.5"/>');
    v.push('<circle cx="100" cy="110" r="34" fill="none" stroke="var(--ink-4)" stroke-width="1.5"/>');
    v.push('<circle cx="100" cy="110" r="8" fill="var(--peach)"/>');
    for (var i = 0; i < 24; i++) {
      var h = 8 + r() * 46;
      v.push('<rect x="' + (18 + i * 7) + '" y="' + (200 - h) + '" width="4" height="' + h + '" fill="var(--slate)" opacity="' + (0.5 + r() * 0.4) + '"/>');
    }
    v.push('<rect x="12" y="238" width="176" height="2" fill="var(--rule-strong)" opacity="0.6"/>');
    v.push('</svg>');
    return v.join('');
  }

  function svgDoc(seed) {
    var r = mulberry(seed);
    var v = [];
    v.push('<svg viewBox="0 0 200 260" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">');
    v.push('<rect width="200" height="260" fill="var(--paper)"/>');
    v.push('<rect width="200" height="260" fill="none" stroke="var(--rule-strong)" stroke-width="2"/>');
    v.push('<path d="M152 12 H188 V48 Z" fill="var(--bg-3)" stroke="var(--rule-strong)" stroke-width="1.5"/>');
    v.push('<rect x="12" y="12" width="176" height="18" fill="var(--slate)" opacity="0.85"/>');
    v.push('<rect x="12" y="44" width="150" height="5" fill="var(--ink)" opacity="0.7"/>');
    v.push('<rect x="12" y="54" width="110" height="5" fill="var(--ink)" opacity="0.7"/>');
    for (var l = 0; l < 16; l++) {
      v.push('<rect x="12" y="' + (74 + l * 9) + '" width="' + (130 + r() * 40) + '" height="3" fill="var(--ink-3)" opacity="' + (0.3 + r() * 0.3) + '"/>');
    }
    v.push('<rect x="52" y="196" width="96" height="34" fill="none" stroke="var(--peach)" stroke-width="2" transform="rotate(-4 100 213)"/>');
    v.push('<text x="100" y="218" text-anchor="middle" font-family="var(--font-mono)" font-size="11" fill="var(--peach-ink)" transform="rotate(-4 100 213)">PROOF</text>');
    v.push('</svg>');
    return v.join('');
  }

  function iconWarn() {
    return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 4 L21 20 H3 Z"/><path d="M12 10 v5"/><circle cx="12" cy="17.6" r="0.5" fill="currentColor"/></svg>';
  }

  function iconArchive() {
    return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="4" width="18" height="5"/><path d="M5 9 V20 H19 V9"/><path d="M10 13 h4"/></svg>';
  }

  function iconDoc() {
    return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 3 H15 L19 7 V21 H6 Z"/><path d="M15 3 V7 H19"/><path d="M9 12 h6 M9 16 h6"/></svg>';
  }

  function iconAudio() {
    return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="4" y="9" width="3" height="6" rx="1"/><rect x="9" y="6" width="3" height="12" rx="1"/><rect x="14" y="3" width="3" height="18" rx="1"/><rect x="19" y="8" width="2" height="8" rx="1"/></svg>';
  }

  function artHtml(f, seed, mode) {
    var stage = mode === 'stage';
    var cls = 'art-state' + (stage ? ' art-state-stage' : '');
    if (f.status === 'preparing') {
      return '<div class="' + cls + ' art-preparing" aria-hidden="true">' +
        '<span class="spinner"></span>' +
        '<span class="art-state-label">' + (stage ? 'Preparing preview…' : 'Preparing') + '</span>' +
        (stage ? '<span class="art-state-note">Preview renders in the background — usually under a minute.</span>' : '') +
        '</div>';
    }
    if (f.status === 'failed') {
      return '<div class="' + cls + ' art-failed" aria-hidden="true">' +
        iconWarn() +
        '<span class="art-state-label">' + (stage ? 'Preview failed' : 'Failed') + '</span>' +
        (stage ? '<span class="art-state-note">' + esc(f.note || 'Rendering failed. Retry to generate a fresh preview.') + '</span>' : '') +
        '</div>';
    }
    if (f.status === 'purged') {
      return '<div class="' + cls + ' art-purged" aria-hidden="true">' +
        iconArchive() +
        '<span class="art-state-label">' + (stage ? 'Preview purged' : 'Purged') + '</span>' +
        (stage ? '<span class="art-state-note">The original file is intact. Previews were removed to save storage.</span>' : '') +
        '</div>';
    }
    if (f.status === 'none') {
      return '<div class="' + cls + ' art-none" aria-hidden="true">' +
        (f.kind === 'audio' ? iconAudio() : iconDoc()) +
        '<span class="art-state-label">' + (stage ? 'No visual preview' : 'No preview') + '</span>' +
        (stage ? '<span class="art-state-note">' + esc(f.note || 'This file type has no visual preview.') + '</span>' : '') +
        '</div>';
    }
    return svgArtwork(seed, f.kind);
  }

  /* ---------- app state ---------- */

  var state = {
    expandedIds: { 'obj-issue80': true },
    density: 'comfortable',
    mobileSim: false,
    panelCollapsed: false,
    viewerTarget: '',
  };

  var viewer = { open: false, objId: null, idx: 0, lastFocusFile: null };
  var timers = {};

  function objectById(id) {
    for (var i = 0; i < OBJECTS.length; i++) if (OBJECTS[i].id === id) return OBJECTS[i];
    return null;
  }

  function viewerFiles() {
    var obj = objectById(viewer.objId);
    return obj ? obj.files : [];
  }

  function currentFile() {
    var files = viewerFiles();
    return files[viewer.idx] || null;
  }

  /* ---------- card / tile markup ---------- */

  function tileHtml(obj, f, idx, isCurrent) {
    var seed = hashSeed(f.id);
    var aria = 'Preview ' + f.name + ', ' + (idx + 1) + ' of ' + obj.files.length;
    return '<div class="file-tile' + (isCurrent ? ' is-current' : '') + '" data-file="' + f.id + '">' +
      '<div class="file-art">' +
        '<button type="button" class="file-art-open" data-action="open-viewer" data-file="' + f.id + '" aria-label="' + esc(aria) + '">' +
          artHtml(f, seed, 'tile') +
        '</button>' +
        (f.status === 'failed'
          ? '<button type="button" class="file-art-retry btn btn-sm btn-peach" data-action="retry" data-file="' + f.id + '" aria-label="Retry preview for ' + esc(f.name) + '">Retry</button>'
          : '') +
      '</div>' +
      '<div class="file-meta">' +
        '<span class="file-seq">' + pad(idx + 1) + '</span>' +
        '<span class="file-name" title="' + esc(f.name) + '">' + esc(f.name) + '</span>' +
        '<span class="file-state state-' + f.status + '"><i class="dot"></i>' + STATE_LABEL[f.status] + '</span>' +
        '<span class="file-size">' + esc(f.size) + '</span>' +
      '</div>' +
    '</div>';
  }

  function metaFormHtml(obj) {
    return '<div class="obj-meta">' +
      '<div class="field-row">' +
        '<label for="mb-title-' + obj.id + '">Object title</label>' +
        '<input id="mb-title-' + obj.id + '" class="input" type="text" value="' + esc(obj.title) + '"/>' +
      '</div>' +
      '<div class="field-row">' +
        '<label for="mb-kind-' + obj.id + '">Document type</label>' +
        '<select id="mb-kind-' + obj.id + '" class="select">' +
          '<option>Newspaper</option><option>Photograph</option><option>Manuscript</option><option>Audio</option>' +
        '</select>' +
      '</div>' +
      '<div class="field-row field-full">' +
        '<label for="mb-desc-' + obj.id + '">Description</label>' +
        '<textarea id="mb-desc-' + obj.id + '" class="textarea" placeholder="Provenance, context, condition notes…"></textarea>' +
      '</div>' +
      '<div class="field-row field-full">' +
        '<label>Tags</label>' +
        '<div class="tag-row">' +
          '<span class="chip">noor-mags</span>' +
          '<span class="chip">tajikistan</span>' +
          '<span class="chip">1972</span>' +
          '<button type="button" class="btn btn-sm">+ Add tag</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function cardHtml(obj) {
    var expanded = !!state.expandedIds[obj.id];
    var thumbs = obj.files.slice(0, 3).map(function (f) {
      return '<div class="mini">' + svgArtwork(hashSeed(f.id), f.kind) + '</div>';
    }).join('');
    var filesLabel = obj.files.length + (obj.files.length === 1 ? ' file' : ' files');
    var statusChip = obj.complete
      ? '<span class="chip chip-sky">Metadata complete</span>'
      : '<span class="chip chip-peach">Needs info</span>';
    var body = '';
    if (expanded) {
      var currentId = (viewer.open && viewer.objId === obj.id) ? currentFile().id : null;
      body = '<div class="obj-body" id="body-' + obj.id + '">' +
        '<div class="rail-head"><span class="rail-label">Object files</span><span class="rail-count">' + obj.files.length + ' items</span></div>' +
        '<div class="rail" data-obj="' + obj.id + '" tabindex="0" role="group" aria-label="Object files for ' + esc(obj.title) + '">' +
          obj.files.map(function (f, i) { return tileHtml(obj, f, i, f.id === currentId); }).join('') +
        '</div>' +
        metaFormHtml(obj) +
      '</div>';
    }
    return '<article class="obj-card' + (expanded ? ' is-expanded' : '') + '" data-obj="' + obj.id + '">' +
      '<button type="button" class="obj-head" data-action="toggle-collapse" data-obj="' + obj.id + '" aria-expanded="' + (expanded ? 'true' : 'false') + '" aria-controls="body-' + obj.id + '">' +
        '<span class="obj-chevron" aria-hidden="true">▾</span>' +
        '<span class="obj-stack" aria-hidden="true">' + thumbs + '</span>' +
        '<span class="obj-titles">' +
          '<span class="obj-title">' + esc(obj.title) + '</span>' +
          '<span class="obj-sub">' + esc(obj.sub) + '</span>' +
        '</span>' +
        '<span class="obj-badges">' +
          '<span class="chip">' + filesLabel + '</span>' + statusChip +
        '</span>' +
      '</button>' +
      body +
    '</article>';
  }

  /* ---------- panel markup ---------- */

  function panelToggle(action, label, on) {
    return '<button type="button" class="btn btn-sm' + (on ? ' is-on' : '') + '" data-action="' + action + '" aria-pressed="' + (on ? 'true' : 'false') + '">' + label + '</button>';
  }

  function panelGroup(title, inner) {
    return '<div class="proto-group"><span class="proto-group-title">' + title + '</span>' + inner + '</div>';
  }

  function panelHtml() {
    var cardA = objectById('obj-issue80');
    var expanded = !!state.expandedIds['obj-issue80'];
    var options = '<option value="">— closed —</option>' +
      cardA.files.map(function (f, i) {
        return '<option value="' + f.id + '">' + pad(i + 1) + ' · ' + esc(f.name) + '</option>';
      }).join('');
    var body = panelGroup('Demo object card', '<div class="proto-row">' +
        panelToggle('panel-expand', 'Expanded', expanded) +
        panelToggle('panel-collapse', 'Collapsed', !expanded) +
      '</div>') +
      panelGroup('Density', '<div class="proto-row">' +
        panelToggle('panel-density-comfort', 'Comfortable', state.density === 'comfortable') +
        panelToggle('panel-density-compact', 'Compact', state.density === 'compact') +
      '</div>') +
      panelGroup('Stage width', '<div class="proto-row">' +
        panelToggle('panel-width-desktop', 'Desktop', !state.mobileSim) +
        panelToggle('panel-width-mobile', 'Mobile 400px', state.mobileSim) +
      '</div>') +
      panelGroup('Open viewer at', '<select class="select" data-action="panel-viewer-select" aria-label="Open viewer at file">' + options + '</select>') +
      panelGroup('Simulate', '<div class="proto-row">' +
        '<button type="button" class="btn btn-sm" data-action="panel-finish">Finish pending previews</button>' +
        '<button type="button" class="btn btn-sm" data-action="panel-reset">Reset demo states</button>' +
      '</div>') +
      '<p class="proto-note">Mock data only — nothing is saved. Click any tile to open the viewer; use ← → Home End and Esc. Expand a card to see every file as an actionable tile.</p>';
    return '<aside class="proto-panel" aria-label="Prototype controls">' +
      '<button type="button" class="proto-panel-head" data-action="panel-toggle" aria-expanded="' + (!state.panelCollapsed ? 'true' : 'false') + '">' +
        'Prototype controls<span aria-hidden="true">' + (state.panelCollapsed ? '▴' : '▾') + '</span>' +
      '</button>' +
      (state.panelCollapsed ? '' : '<div class="proto-panel-body">' + body + '</div>') +
    '</aside>';
  }

  /* ---------- page markup ---------- */

  function pageHtml() {
    var totalFiles = OBJECTS.reduce(function (s, o) { return s + o.files.length; }, 0);
    var legend = LEGEND.map(function (item) {
      return '<span class="legend-item"><i class="dot dot-' + item[0] + '"></i>' + item[1] + '</span>';
    }).join('');
    return '<div class="page">' +
      '<header class="page-head">' +
        '<div>' +
          '<span class="crumb">Ingestion · Setup · b-2407 · NoorMags Issue 80–82</span>' +
          '<h1>Per-object metadata</h1>' +
          '<span class="head-meta">' + OBJECTS.length + ' objects · ' + totalFiles + ' files</span>' +
        '</div>' +
        '<span class="chip">Prototype</span>' +
      '</header>' +
      '<p class="page-note">Each object groups the files that will be published together. Expand an object to browse every one of its files; click a tile to preview it. Previews are mock illustrations.</p>' +
      '<div class="legend">' + legend + '</div>' +
      '<div class="objects">' + OBJECTS.map(cardHtml).join('') + '</div>' +
    '</div>';
  }

  function renderApp() {
    root.innerHTML = pageHtml() + panelHtml();
    syncPanelSelect();
  }

  /* ---------- viewer ---------- */

  var viewerEl = document.createElement('div');
  viewerEl.className = 'viewer';
  viewerEl.innerHTML =
    '<div class="viewer-inner" role="dialog" aria-modal="true" aria-label="File preview">' +
      '<div class="viewer-top">' +
        '<div class="viewer-title">' +
          '<span class="viewer-name"></span>' +
          '<span class="viewer-count"></span>' +
        '</div>' +
        '<div class="viewer-top-right">' +
          '<span class="viewer-meta"></span>' +
          '<button type="button" class="viewer-close btn" data-action="close">Close</button>' +
        '</div>' +
      '</div>' +
      '<div class="viewer-stage">' +
        '<button type="button" class="viewer-nav" data-action="prev" aria-label="Previous file">‹</button>' +
        '<div class="viewer-art"></div>' +
        '<button type="button" class="viewer-nav" data-action="next" aria-label="Next file">›</button>' +
      '</div>' +
      '<div class="viewer-filmstrip"></div>' +
    '</div>';
  document.body.appendChild(viewerEl);

  var nameEl = viewerEl.querySelector('.viewer-name');
  var countEl = viewerEl.querySelector('.viewer-count');
  var metaEl = viewerEl.querySelector('.viewer-meta');
  var artEl = viewerEl.querySelector('.viewer-art');
  var stripEl = viewerEl.querySelector('.viewer-filmstrip');
  var prevBtn = viewerEl.querySelector('[data-action="prev"]');
  var nextBtn = viewerEl.querySelector('[data-action="next"]');
  var closeBtn = viewerEl.querySelector('[data-action="close"]');

  function filmstripHtml(files, idx) {
    return files.map(function (f, i) {
      var inner = f.status === 'ready'
        ? svgArtwork(hashSeed(f.id), f.kind)
        : '<span class="fs-state fs-' + f.status + '">' + (f.status === 'preparing' ? '<span class="spinner"></span>' : '') + '</span>';
      return '<button type="button" class="fs-item' + (i === idx ? ' is-current' : '') + '" data-action="jump" data-idx="' + i + '" aria-label="' + (i + 1) + ' of ' + files.length + ': ' + esc(f.name) + '" aria-current="' + (i === idx ? 'true' : 'false') + '">' + inner + '</button>';
    }).join('');
  }

  function updateViewer() {
    var files = viewerFiles();
    var f = files[viewer.idx];
    if (!f) return;
    nameEl.textContent = f.name;
    countEl.textContent = (viewer.idx + 1) + ' of ' + files.length;
    metaEl.textContent = f.type + ' · ' + f.size;
    artEl.innerHTML = artHtml(f, hashSeed(f.id), 'stage') +
      (f.status === 'failed'
        ? '<div class="viewer-art-actions"><button type="button" class="btn btn-sm btn-peach" data-action="retry" data-file="' + f.id + '">Retry preview</button><span class="hint">Renders a fresh preview from the original file</span></div>'
        : '');
    prevBtn.disabled = viewer.idx === 0;
    nextBtn.disabled = viewer.idx === files.length - 1;
    stripEl.innerHTML = filmstripHtml(files, viewer.idx);
    viewerEl.querySelector('.viewer-inner').setAttribute('aria-label', 'Preview: ' + f.name);
    var current = stripEl.querySelector('.is-current');
    if (current && current.scrollIntoView) current.scrollIntoView({ inline: 'nearest', block: 'nearest' });
  }

  function syncPanelSelect() {
    var sel = root.querySelector('[data-action="panel-viewer-select"]');
    if (sel) sel.value = state.viewerTarget;
  }

  function syncCurrentTiles() {
    var tiles = root.querySelectorAll('.file-tile[data-file]');
    for (var i = 0; i < tiles.length; i++) {
      var id = tiles[i].getAttribute('data-file');
      var isCurrent = viewer.open && currentFile() && currentFile().id === id;
      tiles[i].classList.toggle('is-current', isCurrent);
    }
  }

  function openViewer(fileId) {
    var loc = FILE_INDEX[fileId];
    if (!loc) return;
    viewer.open = true;
    viewer.objId = loc.obj.id;
    viewer.idx = loc.idx;
    viewer.lastFocusFile = fileId;
    state.viewerTarget = fileId;
    renderApp();
    viewerEl.classList.add('is-open');
    document.body.classList.add('viewer-open');
    updateViewer();
    closeBtn.focus();
  }

  function closeViewer() {
    if (!viewer.open) return;
    viewer.open = false;
    viewerEl.classList.remove('is-open');
    document.body.classList.remove('viewer-open');
    state.viewerTarget = '';
    syncPanelSelect();
    syncCurrentTiles();
    var restore = root.querySelector('.file-tile[data-file="' + viewer.lastFocusFile + '"] [data-action="open-viewer"]');
    if (restore) restore.focus();
  }

  function setViewerIdx(idx) {
    var files = viewerFiles();
    viewer.idx = Math.max(0, Math.min(files.length - 1, idx));
    state.viewerTarget = files[viewer.idx].id;
    updateViewer();
    syncPanelSelect();
    syncCurrentTiles();
  }

  function moveViewer(delta) {
    if (!viewer.open) return;
    setViewerIdx(viewer.idx + delta);
  }

  function trapFocus(e) {
    var focusables = viewerEl.querySelectorAll('button:not(:disabled), select, input, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusables.length === 0) return;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  /* ---------- actions ---------- */

  function retryFile(fileId) {
    var loc = FILE_INDEX[fileId];
    if (!loc) return;
    var f = loc.obj.files[loc.idx];
    if (!f || f.status === 'preparing') return;
    f.status = 'preparing';
    f.note = null;
    renderApp();
    if (viewer.open) updateViewer();
    var timer = window.setTimeout(function () {
      f.status = 'ready';
      delete timers[fileId];
      renderApp();
      if (viewer.open) updateViewer();
    }, 1600);
    timers[fileId] = timer;
  }

  function finishPending() {
    var changed = false;
    OBJECTS.forEach(function (obj) {
      obj.files.forEach(function (f) {
        if (f.status === 'preparing') {
          f.status = 'ready';
          changed = true;
        }
      });
    });
    Object.keys(timers).forEach(function (id) { window.clearTimeout(timers[id]); delete timers[id]; });
    if (changed) {
      renderApp();
      if (viewer.open) updateViewer();
    }
  }

  function resetDemo() {
    OBJECTS.forEach(function (obj) {
      obj.files.forEach(function (f) {
        f.status = INITIAL_STATE[f.id].status;
        f.note = INITIAL_STATE[f.id].note;
      });
    });
    Object.keys(timers).forEach(function (id) { window.clearTimeout(timers[id]); delete timers[id]; });
    viewer.open = false;
    viewerEl.classList.remove('is-open');
    document.body.classList.remove('viewer-open');
    viewer.objId = null;
    viewer.idx = 0;
    state.expandedIds = { 'obj-issue80': true };
    state.viewerTarget = '';
    renderApp();
  }

  function toggleCollapse(objId) {
    if (state.expandedIds[objId]) delete state.expandedIds[objId];
    else state.expandedIds[objId] = true;
    renderApp();
  }

  function setDensity(d) {
    state.density = d;
    document.documentElement.setAttribute('data-density', d);
    renderApp();
  }

  function setMobileSim(on) {
    state.mobileSim = on;
    document.body.classList.toggle('stage--mobile', on);
    renderApp();
  }

  function handleAction(action, el) {
    switch (action) {
      case 'toggle-collapse':
        toggleCollapse(el.getAttribute('data-obj'));
        break;
      case 'open-viewer':
        openViewer(el.getAttribute('data-file'));
        break;
      case 'retry':
        retryFile(el.getAttribute('data-file'));
        break;
      case 'prev':
        moveViewer(-1);
        break;
      case 'next':
        moveViewer(1);
        break;
      case 'close':
        closeViewer();
        break;
      case 'jump':
        setViewerIdx(parseInt(el.getAttribute('data-idx'), 10));
        break;
      case 'panel-toggle':
        state.panelCollapsed = !state.panelCollapsed;
        renderApp();
        break;
      case 'panel-expand':
        state.expandedIds['obj-issue80'] = true;
        renderApp();
        break;
      case 'panel-collapse':
        delete state.expandedIds['obj-issue80'];
        renderApp();
        break;
      case 'panel-density-comfort':
        setDensity('comfortable');
        break;
      case 'panel-density-compact':
        setDensity('compact');
        break;
      case 'panel-width-desktop':
        setMobileSim(false);
        break;
      case 'panel-width-mobile':
        setMobileSim(true);
        break;
      case 'panel-finish':
        finishPending();
        break;
      case 'panel-reset':
        resetDemo();
        break;
      default:
        break;
    }
  }

  /* ---------- wiring ---------- */

  document.addEventListener('click', function (e) {
    if (!(e.target instanceof Element)) return;
    var el = e.target.closest('[data-action]');
    if (el) {
      handleAction(el.getAttribute('data-action'), el);
      return;
    }
  });

  viewerEl.addEventListener('click', function (e) {
    if (e.target === viewerEl) closeViewer();
  });

  document.addEventListener('change', function (e) {
    if (!(e.target instanceof Element)) return;
    var sel = e.target.closest('[data-action="panel-viewer-select"]');
    if (!sel) return;
    var value = sel.value;
    if (!value) {
      closeViewer();
      return;
    }
    openViewer(value);
  });

  document.addEventListener('keydown', function (e) {
    if (!viewer.open) return;
    if (e.key === 'Escape') {
      closeViewer();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      moveViewer(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      moveViewer(1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setViewerIdx(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      var files = viewerFiles();
      setViewerIdx(files.length - 1);
    } else if (e.key === 'Tab') {
      trapFocus(e);
    }
  });

  renderApp();
})();
