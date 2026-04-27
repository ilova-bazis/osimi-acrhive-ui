// Screen 2 — Setup / file upload (drag-drop, list, per-file settings)
function ScreenSetup({ form, files, setFiles, onBack, onContinue, pipelineVizStyle }) {
  const { LANGUAGE_OPTIONS, KIND_OPTIONS, PIPELINE_DEFS, PIPELINE_PRESETS } = window.OSIMI;
  const preset = PIPELINE_PRESETS.find(p => p.id === form.preset);
  const defaultPipelines = preset?.pipelines || [];

  const [dragOver, setDragOver] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState(files[0]?.id);
  const [groupBy, setGroupBy] = React.useState('issue'); // issue | kind | none
  const [notes, setNotes] = React.useState('');

  const selected = files.find(f => f.id === selectedId);

  const updateFile = (id, patch) => {
    setFiles(files.map(f => f.id === id ? { ...f, ...patch } : f));
  };

  const removeFile = (id) => {
    setFiles(files.filter(f => f.id !== id));
    if (selectedId === id) setSelectedId(files[0]?.id);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    // Mock: pretend dropped files added two more entries
    const next = [...files,
      { id: 'new-' + Date.now(), name: e.dataTransfer.files?.[0]?.name || 'NoorMags_83_cover.tif', size: 25_400_000, type: 'image/tiff', kind: 'newspaper', lang: form.lang, enabled: true, status: 'ready', isNew: true },
    ];
    setFiles(next);
  };

  const enabledCount = files.filter(f => f.enabled).length;
  const totalSize = files.filter(f => f.enabled).reduce((s, f) => s + f.size, 0);

  // group files
  const groups = React.useMemo(() => {
    if (groupBy === 'none') return [{ key: 'all', label: 'All files', files }];
    if (groupBy === 'kind') {
      const map = {};
      files.forEach(f => { (map[f.kind] = map[f.kind] || []).push(f); });
      return Object.entries(map).map(([k, fs]) => ({
        key: k, label: KIND_OPTIONS.find(o => o.id === k)?.label || k, files: fs,
      }));
    }
    // by issue (parse from name) or fallback
    const map = {};
    files.forEach(f => {
      const m = f.name.match(/_(\d{2,3})/);
      const key = m ? 'Issue ' + m[1] : 'Other';
      (map[key] = map[key] || []).push(f);
    });
    return Object.entries(map).map(([k, fs]) => ({ key: k, label: k, files: fs }));
  }, [files, groupBy]);

  return (
    <div className="fade-in" style={{ flex: 1, display: 'grid', gridTemplateColumns: '300px 1fr 360px', minHeight: 0 }}>
      {/* LEFT — batch defaults + drop zone */}
      <aside style={{
        background: 'var(--bg-2)',
        borderRight: '1px solid var(--rule)',
        padding: 'var(--pad-lg)',
        display: 'flex', flexDirection: 'column', gap: '20px',
        overflowY: 'auto',
      }}>
        <div className="flex-col gap-2">
          <span className="label">Batch defaults</span>
          <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ink-3)', lineHeight: 1.5 }}>
            Inherited by every file unless overridden.
          </p>
        </div>
        <DefaultRow label="Kind" value={KIND_OPTIONS.find(k => k.id === form.kind)?.label} icon={KIND_ICON[form.kind]} />
        <DefaultRow label="Language" value={LANGUAGE_OPTIONS.find(l => l.id === form.lang)?.label} icon="globe" />
        <DefaultRow label="Preset" value={preset?.label} icon="cog" />
        <DefaultRow label="Pipelines" value={defaultPipelines.map(p => PIPELINE_DEFS[p].label).join(', ') || 'None'} icon="sparkle" />

        <hr className="rule"/>

        <div className="flex-col gap-3">
          <span className="label">Add files</span>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              padding: '24px 16px',
              border: '1.5px dashed ' + (dragOver ? 'var(--ink)' : 'var(--rule-strong)'),
              borderRadius: 'var(--radius-card)',
              background: dragOver ? 'var(--paper)' : 'transparent',
              textAlign: 'center',
              transition: 'all var(--dur-short) var(--ease-soft)',
              cursor: 'pointer',
            }}
            onClick={() => {
              const newId = 'new-' + Date.now();
              setFiles([...files, { id: newId, name: 'editorial_letter_draft.docx', size: 480_000, type: 'application/msword', kind: form.kind, lang: form.lang, enabled: true, status: 'ready', isNew: true }]);
            }}
          >
            <Icon name="upload" size={22} stroke={1.2}/>
            <p style={{ margin: '8px 0 4px', fontSize: '13px', color: 'var(--ink-2)' }}>Drag files here</p>
            <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--ink-3)' }}>or click to browse</p>
            <hr className="rule" style={{ margin: '14px 0' }}/>
            <p className="mono" style={{ margin: 0, fontSize: '10.5px', color: 'var(--ink-4)', lineHeight: 1.5 }}>
              .tif .pdf .jpg .png<br/>.wav .mp3 .mp4 .mov<br/>.doc .docx .txt
            </p>
          </div>
        </div>

        <div className="flex-col gap-2">
          <span className="label">Notes</span>
          <textarea
            className="textarea"
            placeholder="Provenance, donor, condition, anything the next archivist should know."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </aside>

      {/* CENTER — file list */}
      <section style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{
          padding: 'var(--pad-md) var(--pad-lg)',
          borderBottom: '1px solid var(--rule)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '16px',
        }}>
          <div className="flex items-center gap-3">
            <span style={{ fontFamily: 'var(--display-family)', fontWeight: 'var(--display-weight)', fontSize: '20px' }}>
              {files.length} files
            </span>
            <span className="chip">{enabledCount} included</span>
            <span className="chip">{fmtSize(totalSize)} total</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="label" style={{ fontSize: '10px' }}>Group by</span>
            <Segmented
              value={groupBy} onChange={setGroupBy}
              options={[
                { id: 'issue', label: 'Issue' },
                { id: 'kind', label: 'Kind' },
                { id: 'none', label: 'None' },
              ]}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
          {groups.map((g) => (
            <div key={g.key}>
              {groupBy !== 'none' && (
                <div style={{
                  position: 'sticky', top: 0, zIndex: 5,
                  padding: '10px var(--pad-lg)',
                  background: 'var(--bg)',
                  borderBottom: '1px solid var(--rule)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span className="label" style={{ fontSize: '10px' }}>{g.label}</span>
                  <span className="mono" style={{ fontSize: '10.5px', color: 'var(--ink-3)' }}>
                    {g.files.length} files · {fmtSize(g.files.reduce((s, f) => s + f.size, 0))}
                  </span>
                </div>
              )}
              {g.files.map((f) => (
                <FileRow
                  key={f.id} f={f}
                  selected={selectedId === f.id}
                  onSelect={() => setSelectedId(f.id)}
                  onToggle={() => updateFile(f.id, { enabled: !f.enabled, status: !f.enabled ? 'ready' : 'excluded' })}
                  onRemove={() => removeFile(f.id)}
                  defaultLang={form.lang}
                />
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* RIGHT — per-file inspector */}
      <aside style={{
        background: 'var(--bg-2)',
        borderLeft: '1px solid var(--rule)',
        padding: 'var(--pad-lg)',
        display: 'flex', flexDirection: 'column', gap: '20px',
        overflowY: 'auto', minWidth: 0,
      }}>
        {selected ? (
          <FileInspector
            file={selected}
            onUpdate={(p) => updateFile(selected.id, p)}
            defaultPipelines={defaultPipelines}
            form={form}
            pipelineVizStyle={pipelineVizStyle}
          />
        ) : (
          <p style={{ fontSize: '13px', color: 'var(--ink-3)' }}>Select a file to configure.</p>
        )}
      </aside>

      <div style={{ gridColumn: '1 / -1' }}>
        <FootnoteBar
          left={<>
            <span className="label">Step 2 of 3</span>
            <Stepper steps={[
              { id: 'create', label: 'Describe' },
              { id: 'setup', label: 'Upload & tune' },
              { id: 'review', label: 'Review' },
            ]} current={1} onJump={onBack} />
          </>}
          right={<>
            <button className="btn" onClick={onBack}><Icon name="arrow-l" size={13}/> Back</button>
            <button className="btn btn-primary" onClick={onContinue} disabled={enabledCount === 0}>
              Review {enabledCount} files <Icon name="arrow-r" size={13}/>
            </button>
          </>}
        />
      </div>
    </div>
  );
}

function DefaultRow({ label, value, icon }) {
  return (
    <div className="flex items-center gap-3" style={{
      padding: '10px 12px',
      background: 'var(--paper)',
      border: '1px solid var(--rule)',
      borderRadius: '2px',
    }}>
      <Icon name={icon} size={14} />
      <div className="flex-col" style={{ flex: 1, minWidth: 0 }}>
        <span className="label" style={{ fontSize: '9.5px' }}>{label}</span>
        <span style={{ fontSize: '13px', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value || '—'}</span>
      </div>
    </div>
  );
}

function FileRow({ f, selected, onSelect, onToggle, onRemove, defaultLang }) {
  const { LANGUAGE_OPTIONS } = window.OSIMI;
  const langLabel = LANGUAGE_OPTIONS.find(l => l.id === f.lang)?.label || '—';
  const overridden = f.lang !== defaultLang;

  return (
    <div
      onClick={onSelect}
      style={{
        display: 'grid',
        gridTemplateColumns: '20px 22px 1fr 80px 90px 110px auto',
        alignItems: 'center', gap: '12px',
        padding: '12px var(--pad-lg)',
        borderBottom: '1px solid var(--rule)',
        background: selected ? 'var(--paper)' : 'transparent',
        cursor: 'pointer',
        opacity: f.enabled ? 1 : 0.55,
        transition: 'background var(--dur-short) var(--ease-soft)',
      }}
    >
      <input
        type="checkbox" checked={f.enabled}
        onChange={(e) => { e.stopPropagation(); onToggle(); }}
        onClick={(e) => e.stopPropagation()}
        style={{ accentColor: 'var(--ink)', cursor: 'pointer' }}
      />
      <Icon name={KIND_ICON[f.kind]} size={15} />
      <div className="flex-col" style={{ minWidth: 0 }}>
        <span style={{ fontSize: '13px', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {f.name}
        </span>
        {f.note && (
          <span style={{ fontSize: '11px', color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {f.note}
          </span>
        )}
        {f.warn && (
          <span className="flex items-center gap-1" style={{ fontSize: '11px', color: 'var(--warn)' }}>
            <Icon name="warn" size={11}/> {f.warn}
          </span>
        )}
      </div>
      <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-3)' }}>{fmtSize(f.size)}</span>
      <span style={{ fontSize: '11.5px', color: overridden ? 'var(--peach-ink)' : 'var(--ink-3)' }}>
        {langLabel}{overridden && <span style={{ marginLeft: 4 }}>•</span>}
      </span>
      <div>
        {f.enabled
          ? <span className="chip chip-sky">Will process</span>
          : <span className="chip">Excluded</span>}
      </div>
      <button
        className="btn-ghost btn"
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        style={{ padding: '6px', border: 'none' }}
        aria-label="Remove file"
      >
        <Icon name="trash" size={13}/>
      </button>
    </div>
  );
}

function FileInspector({ file, onUpdate, defaultPipelines, form, pipelineVizStyle }) {
  const { LANGUAGE_OPTIONS, KIND_OPTIONS, PIPELINE_DEFS } = window.OSIMI;
  const [pipelines, setPipelines] = React.useState(file.pipelines || defaultPipelines);

  React.useEffect(() => { setPipelines(file.pipelines || defaultPipelines); }, [file.id]);

  const togglePipeline = (id) => {
    const next = pipelines.includes(id) ? pipelines.filter(p => p !== id) : [...pipelines, id];
    setPipelines(next);
    onUpdate({ pipelines: next });
  };

  return (
    <div className="flex-col gap-5" style={{ minWidth: 0 }}>
      <div className="flex-col gap-2">
        <span className="label">File</span>
        <div className="flex items-center gap-3">
          <Icon name={KIND_ICON[file.kind]} size={18}/>
          <span style={{ fontSize: '14px', color: 'var(--ink)', wordBreak: 'break-all', lineHeight: 1.3 }}>{file.name}</span>
        </div>
        <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-3)' }}>
          {fmtSize(file.size)} · {file.type}
        </span>
      </div>

      <StripedPlaceholder height={140} label={file.kind === 'audio' ? 'audio waveform preview' : file.kind === 'video' ? 'video thumb preview' : 'page preview'} />

      <div className="field-row">
        <label>Document type override</label>
        <select className="select" value={file.kind} onChange={(e) => onUpdate({ kind: e.target.value })}>
          {KIND_OPTIONS.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}
        </select>
      </div>

      <div className="field-row">
        <label>Language override</label>
        <select className="select" value={file.lang} onChange={(e) => onUpdate({ lang: e.target.value })}>
          {LANGUAGE_OPTIONS.map(l => <option key={l.id} value={l.id}>{l.label} · {l.native}</option>)}
        </select>
      </div>

      <div className="flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="label">Pipelines for this file</span>
          <span className="chip chip-ai"><Icon name="sparkle" size={9}/> ai processing</span>
        </div>
        <div className="flex-col gap-2">
          {Object.entries(PIPELINE_DEFS).map(([id, def]) => {
            const on = pipelines.includes(id);
            return (
              <button
                key={id} type="button" onClick={() => togglePipeline(id)}
                style={{
                  textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 12px',
                  background: on ? 'var(--paper)' : 'var(--bg-3)',
                  border: '1px solid ' + (on ? 'var(--ink)' : 'var(--rule)'),
                  borderRadius: '2px', cursor: 'pointer',
                  fontFamily: 'inherit', color: 'inherit',
                }}
              >
                <span style={{
                  width: 14, height: 14, borderRadius: '2px',
                  border: '1px solid ' + (on ? 'var(--ink)' : 'var(--rule-strong)'),
                  background: on ? 'var(--ink)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--paper)', flexShrink: 0,
                }}>{on && <Icon name="check" size={9} stroke={2.4}/>}</span>
                <div className="flex-col" style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '13px' }}>{def.label}</span>
                  <span style={{ fontSize: '11px', color: 'var(--ink-3)', lineHeight: 1.4 }}>{def.desc}</span>
                </div>
                <span className="mono" style={{ fontSize: '10.5px', color: 'var(--ink-4)' }}>{def.dur}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

window.ScreenSetup = ScreenSetup;
