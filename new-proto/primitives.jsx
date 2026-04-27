// Shared visual primitives for Osimi Archive ingestion
// Imported into window for use across all screen components

const { useState, useEffect, useRef, useMemo, useCallback, Fragment } = React;

/* ------------ ICONS (minimal hairline set) ------------ */
const Icon = ({ name, size = 16, stroke = 1.4 }) => {
  const props = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor',
    strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round',
  };
  switch (name) {
    case 'archive':   return <svg {...props}><rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8"/><path d="M10 12h4"/></svg>;
    case 'plus':      return <svg {...props}><path d="M12 5v14M5 12h14"/></svg>;
    case 'search':    return <svg {...props}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>;
    case 'arrow-r':   return <svg {...props}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    case 'arrow-l':   return <svg {...props}><path d="M19 12H5M11 6l-6 6 6 6"/></svg>;
    case 'check':     return <svg {...props}><path d="m5 12 5 5L20 7"/></svg>;
    case 'x':         return <svg {...props}><path d="M6 6l12 12M18 6l-12 12"/></svg>;
    case 'upload':    return <svg {...props}><path d="M12 16V4M6 10l6-6 6 6"/><path d="M4 20h16"/></svg>;
    case 'file':      return <svg {...props}><path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5"/></svg>;
    case 'image':     return <svg {...props}><rect x="3" y="3" width="18" height="18" rx="1"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>;
    case 'audio':     return <svg {...props}><path d="M9 18V6l11-2v12"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>;
    case 'video':     return <svg {...props}><rect x="3" y="6" width="13" height="12" rx="1"/><path d="m16 10 5-3v10l-5-3z"/></svg>;
    case 'book':      return <svg {...props}><path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z"/><path d="M20 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z"/></svg>;
    case 'manuscript':return <svg {...props}><path d="M5 4h11l3 3v13a1 1 0 0 1-1 1H5z"/><path d="M8 9h6M8 13h8M8 17h5"/></svg>;
    case 'eye':       return <svg {...props}><path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'pencil':    return <svg {...props}><path d="M14 4l6 6L9 21H3v-6z"/></svg>;
    case 'trash':     return <svg {...props}><path d="M4 7h16M9 7V4h6v3M6 7v13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7"/></svg>;
    case 'cog':       return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>;
    case 'chevron-r': return <svg {...props}><path d="m9 6 6 6-6 6"/></svg>;
    case 'chevron-d': return <svg {...props}><path d="m6 9 6 6 6-6"/></svg>;
    case 'info':      return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 8h0M11 12h1v5h1"/></svg>;
    case 'warn':      return <svg {...props}><path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h0"/></svg>;
    case 'sparkle':   return <svg {...props}><path d="M12 3v6M12 15v6M3 12h6M15 12h6M5.5 5.5l4 4M14.5 14.5l4 4M5.5 18.5l4-4M14.5 9.5l4-4"/></svg>;
    case 'lock':      return <svg {...props}><rect x="4" y="11" width="16" height="10" rx="1"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>;
    case 'users':     return <svg {...props}><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M15 20a6 6 0 0 1 6-6"/></svg>;
    case 'pages':     return <svg {...props}><rect x="4" y="3" width="14" height="18" rx="1"/><path d="M8 8h6M8 12h6M8 16h4"/></svg>;
    case 'clock':     return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case 'globe':     return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>;
    case 'folder':    return <svg {...props}><path d="M3 6a1 1 0 0 1 1-1h5l2 2h8a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/></svg>;
    case 'grip':      return <svg {...props}><circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/></svg>;
    default: return null;
  }
};

const KIND_ICON = {
  newspaper: 'pages', photo: 'image', audio: 'audio', video: 'video',
  book: 'book', manuscript: 'manuscript', other: 'file',
};

/* ------------ FORMAT HELPERS ------------ */
const fmtSize = (b) => {
  if (b < 1024) return b + ' B';
  if (b < 1024 ** 2) return (b / 1024).toFixed(1) + ' KB';
  if (b < 1024 ** 3) return (b / 1024 ** 2).toFixed(1) + ' MB';
  return (b / 1024 ** 3).toFixed(2) + ' GB';
};

/* ------------ STAMP (peach corner mark for "draft" / "review" framing) ------------ */
const Stamp = ({ children }) => (
  <span style={{
    display: 'inline-block',
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: 'var(--peach-ink)',
    border: '1px solid var(--peach)',
    padding: '2px 8px',
    borderRadius: '2px',
    background: 'var(--peach-wash)',
  }}>{children}</span>
);

/* ------------ STEP INDICATOR ------------ */
const Stepper = ({ steps, current, onJump }) => (
  <ol style={{
    display: 'flex', alignItems: 'center', gap: '14px',
    listStyle: 'none', margin: 0, padding: 0,
  }}>
    {steps.map((s, i) => {
      const state = i < current ? 'done' : i === current ? 'current' : 'todo';
      return (
        <React.Fragment key={s.id}>
          <li
            onClick={() => state === 'done' && onJump?.(i)}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              cursor: state === 'done' ? 'pointer' : 'default',
              opacity: state === 'todo' ? 0.45 : 1,
            }}>
            <span style={{
              width: 22, height: 22, borderRadius: '50%',
              border: state === 'todo' ? '1px solid var(--rule-strong)' : '1px solid var(--ink)',
              background: state === 'done' ? 'var(--ink)' : state === 'current' ? 'var(--peach)' : 'transparent',
              color: state === 'todo' ? 'var(--ink-3)' : state === 'current' ? 'oklch(0.99 0 0)' : 'var(--paper)',
              fontFamily: 'var(--font-mono)', fontSize: '10.5px', fontWeight: 500,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              lineHeight: 1,
            }}>
              {state === 'done' ? <Icon name="check" size={11} stroke={2}/> : String(i + 1).padStart(2, '0')}
            </span>
            <span style={{
              fontFamily: 'var(--font-body)', fontSize: '11px',
              textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)',
              fontWeight: state === 'current' ? 600 : 400,
              color: state === 'current' ? 'var(--ink)' : 'var(--ink-3)',
            }}>{s.label}</span>
          </li>
          {i < steps.length - 1 && (
            <li aria-hidden style={{
              flex: '0 0 32px', height: 1, background: 'var(--rule-strong)',
              opacity: 0.6,
            }} />
          )}
        </React.Fragment>
      );
    })}
  </ol>
);

/* ------------ TOGGLE / RADIO CARDS ------------ */
const ChoiceCard = ({ icon, title, sub, selected, onClick, badge, native, compact }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={selected}
    style={{
      textAlign: 'left',
      display: 'flex', flexDirection: 'column', gap: compact ? '4px' : '8px',
      padding: compact ? '10px 12px' : '14px 16px',
      background: selected ? 'var(--paper)' : 'var(--bg-2)',
      border: '1px solid ' + (selected ? 'var(--ink)' : 'var(--rule)'),
      borderRadius: 'var(--radius-card)',
      cursor: 'pointer',
      transition: 'all var(--dur-short) var(--ease-soft)',
      position: 'relative',
      outline: 'none',
      fontFamily: 'inherit',
      color: 'var(--ink)',
      boxShadow: selected ? '0 0 0 1px var(--ink) inset' : 'none',
    }}
  >
    <div className="flex items-center gap-2" style={{ width: '100%' }}>
      {icon && <Icon name={icon} size={16} />}
      <span style={{
        fontFamily: 'var(--display-family)',
        fontWeight: 'var(--display-weight)',
        fontSize: compact ? '15px' : '17px',
        letterSpacing: 'var(--display-tracking)',
        flex: 1,
      }}>{title}</span>
      {native && <span className="farsi" style={{ fontSize: '12px', color: 'var(--ink-3)' }}>{native}</span>}
      {badge && <span className="chip chip-peach">{badge}</span>}
    </div>
    {sub && <span style={{ fontSize: '12.5px', color: 'var(--ink-3)', lineHeight: 1.4 }}>{sub}</span>}
  </button>
);

/* ------------ SEGMENTED CONTROL ------------ */
const Segmented = ({ options, value, onChange }) => (
  <div style={{
    display: 'inline-flex',
    background: 'var(--bg-3)',
    border: '1px solid var(--rule)',
    borderRadius: 'var(--radius-pill)',
    padding: '3px',
  }}>
    {options.map((o) => (
      <button
        key={o.id}
        onClick={() => onChange(o.id)}
        type="button"
        style={{
          padding: '6px 14px',
          fontFamily: 'var(--font-body)',
          fontSize: '10.5px', textTransform: 'uppercase',
          letterSpacing: 'var(--tracking-wide)', fontWeight: 500,
          border: 'none', cursor: 'pointer',
          background: value === o.id ? 'var(--paper)' : 'transparent',
          color: value === o.id ? 'var(--ink)' : 'var(--ink-3)',
          borderRadius: 'var(--radius-pill)',
          transition: 'all var(--dur-short) var(--ease-soft)',
          boxShadow: value === o.id ? '0 1px 0 var(--rule)' : 'none',
        }}
      >{o.label}</button>
    ))}
  </div>
);

/* ------------ TOAST / FOOTNOTE BAR ------------ */
const FootnoteBar = ({ left, right }) => (
  <footer style={{
    position: 'sticky', bottom: 0, zIndex: 30,
    background: 'var(--bg)',
    borderTop: '1px solid var(--rule)',
    padding: '14px var(--pad-xl)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: '20px',
  }}>
    <div className="flex items-center gap-4">{left}</div>
    <div className="flex items-center gap-3">{right}</div>
  </footer>
);

/* ------------ THIN PROGRESS BAR ------------ */
const ThinProgress = ({ value, total, tone = 'ink' }) => {
  const pct = total ? Math.min(100, (value / total) * 100) : 0;
  const color = tone === 'peach' ? 'var(--peach)' : tone === 'sky' ? 'var(--slate)' : 'var(--ink)';
  return (
    <div style={{
      height: '2px', background: 'var(--bg-3)',
      borderRadius: '1px', overflow: 'hidden', position: 'relative',
    }}>
      <div style={{
        height: '100%', width: pct + '%',
        background: color,
        transition: 'width 400ms var(--ease-soft)',
      }}/>
    </div>
  );
};

/* ------------ EMPTY-STATE PLACEHOLDER (striped) ------------ */
const StripedPlaceholder = ({ width = '100%', height = 80, label }) => (
  <div style={{
    width, height,
    backgroundImage: 'repeating-linear-gradient(135deg, var(--bg-3) 0 6px, var(--bg-2) 6px 12px)',
    border: '1px dashed var(--rule-strong)',
    borderRadius: '2px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--ink-3)',
    letterSpacing: '0.04em',
  }}>{label}</div>
);

Object.assign(window, {
  Icon, KIND_ICON, fmtSize, Stamp, Stepper,
  ChoiceCard, Segmented, FootnoteBar, ThinProgress, StripedPlaceholder,
});
