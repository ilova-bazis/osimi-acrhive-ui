// Screen 3 — Review & confirm
function ScreenReview({ form, files, onBack, onConfirm, pipelineVizStyle }) {
  const { LANGUAGE_OPTIONS, KIND_OPTIONS, PIPELINE_DEFS, PIPELINE_PRESETS, OCR_SAMPLE } = window.OSIMI;
  const preset = PIPELINE_PRESETS.find(p => p.id === form.preset);
  const defaultPipelines = preset?.pipelines || [];
  const [confirmed, setConfirmed] = React.useState(false);

  const enabled = files.filter(f => f.enabled);
  const skipped = files.filter(f => !f.enabled);

  // Aggregate pipeline counts
  const pipelineCounts = {};
  enabled.forEach(f => {
    const ps = f.pipelines || defaultPipelines;
    ps.forEach(p => { pipelineCounts[p] = (pipelineCounts[p] || 0) + 1; });
  });

  // Language summary
  const langCounts = {};
  enabled.forEach(f => { langCounts[f.lang] = (langCounts[f.lang] || 0) + 1; });

  // Warnings
  const warnings = [];
  enabled.forEach(f => {
    if (f.warn) warnings.push({ file: f.name, msg: f.warn });
  });
  if (enabled.some(f => f.kind === 'manuscript' && (f.pipelines || defaultPipelines).includes('ocr'))) {
    warnings.push({ file: 'Hand-lettered manuscripts', msg: 'OCR may have low confidence on calligraphic content. Consider disabling OCR for these.' });
  }

  return (
    <div className="fade-in" style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 380px', minHeight: 0 }}>
      <section style={{ padding: 'var(--pad-xl)', overflowY: 'auto' }}>
        <div style={{ maxWidth: 880, display: 'flex', flexDirection: 'column', gap: '36px' }}>

          <div className="flex-col gap-3">
            <span className="label">Step 03 — Review what will run</span>
            <p style={{ margin: 0, fontSize: '15px', color: 'var(--ink-2)', lineHeight: 1.55, maxWidth: 600 }}>
              Nothing has been processed yet. The archive will only begin once you confirm at the bottom of this page.
            </p>
          </div>

          {/* Headline numbers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'var(--rule)', border: '1px solid var(--rule)' }}>
            <Stat label="Files included" value={enabled.length} sub={skipped.length ? `${skipped.length} excluded` : 'all selected'} />
            <Stat label="Total volume" value={fmtSize(enabled.reduce((s, f) => s + f.size, 0))} sub="will be uploaded" />
            <Stat label="Languages" value={Object.keys(langCounts).length} sub={Object.keys(langCounts).map(k => LANGUAGE_OPTIONS.find(l => l.id === k)?.label).join(' · ')} />
            <Stat label="Est. processing" value="≈ 38 min" sub="across all pipelines" />
          </div>

          {/* Pipeline flow diagram */}
          <div className="flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="label">Pipeline flow</span>
              <span className="chip chip-ai"><Icon name="sparkle" size={10}/> machine processing</span>
            </div>
            <PipelineFlow
              pipelineCounts={pipelineCounts}
              totalFiles={enabled.length}
              style={pipelineVizStyle}
            />
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--ink-3)', maxWidth: 580 }}>
              Each row shows how many of the {enabled.length} included files will run that step. A file may skip a step if you disabled it during setup.
            </p>
          </div>

          {/* Files breakdown */}
          <div className="flex-col gap-3">
            <span className="label">Files — by pipeline</span>
            <div style={{
              border: '1px solid var(--rule)',
              borderRadius: '2px', overflow: 'hidden',
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 70px 90px 1fr',
                background: 'var(--bg-2)', padding: '10px 16px',
                borderBottom: '1px solid var(--rule)',
              }}>
                <span className="label">File</span>
                <span className="label">Size</span>
                <span className="label">Lang</span>
                <span className="label">Pipelines</span>
              </div>
              {enabled.slice(0, 8).map(f => (
                <div key={f.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 70px 90px 1fr',
                  padding: '10px 16px',
                  borderBottom: '1px solid var(--rule)',
                  fontSize: '12.5px', alignItems: 'center', gap: '8px',
                }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                  <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-3)' }}>{fmtSize(f.size)}</span>
                  <span style={{ fontSize: '12px', color: 'var(--ink-3)' }}>{LANGUAGE_OPTIONS.find(l => l.id === f.lang)?.label}</span>
                  <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                    {(f.pipelines || defaultPipelines).length === 0
                      ? <span className="chip">Catalog only</span>
                      : (f.pipelines || defaultPipelines).map(p => (
                        <span key={p} className="chip chip-ai">{PIPELINE_DEFS[p].label.toLowerCase()}</span>
                      ))
                    }
                  </div>
                </div>
              ))}
              {enabled.length > 8 && (
                <div style={{ padding: '10px 16px', fontSize: '11.5px', color: 'var(--ink-3)', background: 'var(--bg-2)' }}>
                  + {enabled.length - 8} more files with the same configuration
                </div>
              )}
            </div>
          </div>

          {/* Sample output preview */}
          <div className="flex-col gap-3">
            <span className="label">Sample output — what OCR will produce</span>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px',
            }}>
              <div style={{
                padding: '16px',
                border: '1px solid var(--rule)',
                borderRadius: '2px', background: 'var(--paper)',
              }}>
                <div className="flex items-center justify-between" style={{ marginBottom: '10px' }}>
                  <span className="label" style={{ fontSize: '9.5px' }}>Source — Persian</span>
                  <span className="chip">Human content</span>
                </div>
                <p className="farsi" style={{ margin: 0, fontSize: '14px', lineHeight: 1.7, color: 'var(--ink)', whiteSpace: 'pre-wrap' }}>
                  {OCR_SAMPLE.source}
                </p>
              </div>
              <div className="machine-region" style={{
                padding: '16px', borderRadius: '2px',
                border: '1px solid var(--ai-rule)',
              }}>
                <div className="flex items-center justify-between" style={{ marginBottom: '10px' }}>
                  <span className="label" style={{ fontSize: '9.5px', color: 'var(--ai-ink)' }}>Translation — English mirror</span>
                  <span className="chip chip-ai"><Icon name="sparkle" size={9}/> machine</span>
                </div>
                <p className="machine-content" style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: 'var(--ink-2)', whiteSpace: 'pre-wrap' }}>
                  {OCR_SAMPLE.english}
                </p>
                <hr className="rule" style={{ margin: '12px 0' }}/>
                <div className="flex items-center gap-4 mono" style={{ fontSize: '10.5px', color: 'var(--ai-ink)' }}>
                  <span>confidence {(OCR_SAMPLE.confidence * 100).toFixed(0)}%</span>
                  <span>·</span>
                  <span>flags 0</span>
                  <span>·</span>
                  <span>review queue: low</span>
                </div>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--ink-3)' }}>
              Machine-generated content lives on a tinted ground throughout the archive, so it never blends with material a human entered or transcribed.
            </p>
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="flex-col gap-3">
              <span className="label">Worth a second look</span>
              <div className="flex-col gap-2">
                {warnings.map((w, i) => (
                  <div key={i} style={{
                    padding: '12px 14px',
                    border: '1px solid var(--rule)',
                    borderLeft: '3px solid var(--peach)',
                    background: 'var(--peach-wash)',
                    display: 'flex', alignItems: 'flex-start', gap: '10px',
                  }}>
                    <Icon name="warn" size={14}/>
                    <div className="flex-col" style={{ flex: 1 }}>
                      <span style={{ fontSize: '12.5px', color: 'var(--ink)' }}>{w.file}</span>
                      <span style={{ fontSize: '12px', color: 'var(--ink-2)', lineHeight: 1.45 }}>{w.msg}</span>
                    </div>
                    <button className="btn btn-sm btn-ghost">Adjust</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confirm */}
          <div style={{
            padding: '20px',
            border: '1px solid var(--rule-strong)',
            background: 'var(--paper)',
            borderRadius: '2px',
            display: 'flex', flexDirection: 'column', gap: '14px',
          }}>
            <div className="flex items-start gap-3">
              <input
                type="checkbox" id="confirm" checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                style={{ accentColor: 'var(--ink)', width: 16, height: 16, marginTop: '2px' }}
              />
              <label htmlFor="confirm" className="flex-col gap-1" style={{ cursor: 'pointer', flex: 1 }}>
                <span style={{ fontFamily: 'var(--display-family)', fontWeight: 'var(--display-weight)', fontSize: '17px' }}>
                  I understand what will be processed and want to begin.
                </span>
                <span style={{ fontSize: '12.5px', color: 'var(--ink-3)', lineHeight: 1.5 }}>
                  Processing starts as soon as you confirm. You can pause or cancel any pipeline from the batch detail view, but already-processed files will keep their machine-generated content.
                </span>
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* Right rail — final summary */}
      <aside style={{
        background: 'var(--bg-2)',
        borderLeft: '1px solid var(--rule)',
        padding: 'var(--pad-xl) var(--pad-lg)',
        display: 'flex', flexDirection: 'column', gap: '24px',
        overflowY: 'auto',
      }}>
        <div className="flex-col gap-2">
          <Stamp>Ready to submit</Stamp>
          <span style={{ fontFamily: 'var(--display-family)', fontWeight: 'var(--display-weight)', fontSize: '24px', lineHeight: 1.15 }}>
            {form.name}
          </span>
        </div>
        <hr className="rule"/>
        <SummaryRowR label="Kind" value={KIND_OPTIONS.find(k => k.id === form.kind)?.label} />
        <SummaryRowR label="Primary language" value={LANGUAGE_OPTIONS.find(l => l.id === form.lang)?.label} />
        <SummaryRowR label="Preset" value={preset?.label} />
        <SummaryRowR label="Visibility" value={form.visibility === 'team' ? 'Team' : 'Private'} />
        <hr className="rule"/>
        <SummaryRowR label="Files included" value={enabled.length} />
        <SummaryRowR label="Files excluded" value={skipped.length} />
        <SummaryRowR label="Total upload" value={fmtSize(enabled.reduce((s, f) => s + f.size, 0))} />
        <SummaryRowR label="Pipelines used" value={Object.keys(pipelineCounts).length} />
        <hr className="rule"/>
        <div className="flex-col gap-2">
          <span className="label">Pipeline footprint</span>
          {Object.entries(pipelineCounts).map(([id, count]) => (
            <div key={id} className="flex items-center justify-between" style={{ fontSize: '12.5px' }}>
              <span style={{ color: 'var(--ink-2)' }}>{PIPELINE_DEFS[id].label}</span>
              <span className="mono tabular" style={{ color: 'var(--ink-3)' }}>{count}/{enabled.length}</span>
            </div>
          ))}
        </div>
      </aside>

      <div style={{ gridColumn: '1 / -1' }}>
        <FootnoteBar
          left={<>
            <span className="label">Step 3 of 3</span>
            <Stepper steps={[
              { id: 'create', label: 'Describe' },
              { id: 'setup', label: 'Upload & tune' },
              { id: 'review', label: 'Review' },
            ]} current={2} onJump={(i) => onBack(i)} />
          </>}
          right={<>
            <button className="btn" onClick={() => onBack(1)}><Icon name="arrow-l" size={13}/> Back to setup</button>
            <button className="btn btn-peach" disabled={!confirmed} onClick={onConfirm}>
              Begin processing <Icon name="arrow-r" size={13}/>
            </button>
          </>}
        />
      </div>
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div style={{ background: 'var(--paper)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span className="label" style={{ fontSize: '9.5px' }}>{label}</span>
      <span style={{ fontFamily: 'var(--display-family)', fontWeight: 'var(--display-weight)', fontSize: '26px', letterSpacing: 'var(--display-tracking)', lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: '11px', color: 'var(--ink-3)', marginTop: '2px' }}>{sub}</span>
    </div>
  );
}

function SummaryRowR({ label, value }) {
  return (
    <div className="flex justify-between items-center" style={{ gap: '12px' }}>
      <span className="label" style={{ fontSize: '10px' }}>{label}</span>
      <span style={{ fontSize: '13px', color: 'var(--ink)' }}>{value}</span>
    </div>
  );
}

/* ---------- PIPELINE FLOW DIAGRAM ---------- */
function PipelineFlow({ pipelineCounts, totalFiles, style }) {
  const { PIPELINE_DEFS } = window.OSIMI;
  const order = ['detect', 'ocr', 'transcribe', 'exif', 'translate', 'index'];
  const active = order.filter(id => pipelineCounts[id]);

  if (style === 'chips') {
    return (
      <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
        <span className="chip">{totalFiles} files</span>
        <Icon name="arrow-r" size={14}/>
        {active.map((id, i) => (
          <React.Fragment key={id}>
            <span className="chip chip-sky">{PIPELINE_DEFS[id].label} · {pipelineCounts[id]}</span>
            {i < active.length - 1 && <Icon name="arrow-r" size={14}/>}
          </React.Fragment>
        ))}
        <Icon name="arrow-r" size={14}/>
        <span className="chip chip-peach">{totalFiles} archive objects</span>
      </div>
    );
  }

  if (style === 'rows') {
    return (
      <div className="flex-col gap-1" style={{ border: '1px solid var(--rule)', borderRadius: '2px', overflow: 'hidden' }}>
        {active.map(id => {
          const pct = (pipelineCounts[id] / totalFiles) * 100;
          return (
            <div key={id} style={{
              display: 'grid', gridTemplateColumns: '120px 1fr 80px',
              alignItems: 'center', gap: '12px',
              padding: '10px 14px', background: 'var(--paper)',
              borderBottom: '1px solid var(--rule)',
            }}>
              <span style={{ fontSize: '13px' }}>{PIPELINE_DEFS[id].label}</span>
              <div style={{ position: 'relative', height: '16px', background: 'var(--bg-3)' }}>
                <div style={{ position: 'absolute', inset: 0, width: pct + '%', background: 'var(--slate)' }}/>
              </div>
              <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-3)', textAlign: 'right' }}>
                {pipelineCounts[id]}/{totalFiles}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  // default — flow diagram (input → stages → output) with hairline connectors
  return (
    <div style={{
      padding: '24px',
      background: 'var(--paper)',
      border: '1px solid var(--rule)',
      borderRadius: '2px',
      overflowX: 'auto',
    }}>
      <div style={{
        display: 'flex', alignItems: 'stretch', gap: '0',
        minWidth: 'min-content',
      }}>
        {/* Input node */}
        <FlowNode title="Upload" count={`${totalFiles} files`} kind="input" />
        <FlowConnector />
        {active.map((id, i) => (
          <React.Fragment key={id}>
            <FlowNode title={PIPELINE_DEFS[id].label} count={`${pipelineCounts[id]}/${totalFiles}`} kind="stage" sub={PIPELINE_DEFS[id].dur} />
            <FlowConnector />
          </React.Fragment>
        ))}
        <FlowNode title="Archive" count={`${totalFiles} objects`} kind="output" />
      </div>
    </div>
  );
}

function FlowNode({ title, count, sub, kind }) {
  const isInput = kind === 'input';
  const isOutput = kind === 'output';
  return (
    <div style={{
      flex: '0 0 130px',
      padding: '14px 12px',
      background: isInput ? 'var(--bg-2)' : isOutput ? 'var(--peach-wash)' : 'var(--ai-bg)',
      border: '1px solid ' + (isOutput ? 'var(--peach)' : isInput ? 'var(--rule-strong)' : 'var(--ai-rule)'),
      borderRadius: '2px',
      display: 'flex', flexDirection: 'column', gap: '4px',
      textAlign: 'center',
    }}>
      <span className="label" style={{ fontSize: '9.5px', color: isInput ? 'var(--ink-3)' : isOutput ? 'var(--peach-ink)' : 'var(--ai-ink)' }}>
        {isInput ? 'Input' : isOutput ? 'Output' : 'Stage'}
      </span>
      <span style={{
        fontFamily: 'var(--display-family)',
        fontWeight: 'var(--display-weight)',
        fontSize: '15px',
        letterSpacing: 'var(--display-tracking)',
      }}>{title}</span>
      <span className="mono" style={{ fontSize: '10.5px', color: 'var(--ink-3)' }}>{count}</span>
      {sub && <span className="mono" style={{ fontSize: '9.5px', color: 'var(--ink-4)' }}>{sub}</span>}
    </div>
  );
}

function FlowConnector() {
  return (
    <div style={{
      flex: '0 0 36px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative',
    }}>
      <div style={{ flex: 1, height: 1, background: 'var(--rule-strong)' }}/>
      <Icon name="chevron-r" size={14} stroke={1.4}/>
    </div>
  );
}

window.ScreenReview = ScreenReview;
