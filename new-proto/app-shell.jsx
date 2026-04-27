// App shell — sidebar nav, top bar, route container
const { useState: useStateShell } = React;

function AppShell({ children, currentScreen, onNav, batch }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '232px 1fr',
      background: 'var(--bg)',
    }}>
      {/* SIDEBAR */}
      <aside style={{
        background: 'var(--bg-2)',
        borderRight: '1px solid var(--rule)',
        padding: '24px 18px',
        display: 'flex', flexDirection: 'column', gap: '28px',
        position: 'sticky', top: 0, height: '100vh',
      }}>
        <div className="flex items-center gap-3" style={{ paddingLeft: '4px' }}>
          {/* Mark — drawn rectangle/diamond, not figurative */}
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1" style={{ color: 'var(--ink)' }}>
            <rect x="3" y="3" width="16" height="16" />
            <rect x="6.5" y="6.5" width="9" height="9" />
            <line x1="3" y1="11" x2="19" y2="11" />
            <line x1="11" y1="3" x2="11" y2="19" />
          </svg>
          <div className="flex-col" style={{ lineHeight: 1.1 }}>
            <span style={{
              fontFamily: 'var(--display-family)',
              fontWeight: 'var(--display-weight)',
              fontSize: '17px', letterSpacing: '0.005em',
            }}>Osimi</span>
            <span className="label" style={{ fontSize: '9.5px' }}>Archive · Ingest</span>
          </div>
        </div>

        <nav className="flex-col gap-1">
          <SideNav label="Overview" icon="archive" />
          <SideNav label="New Batch" icon="plus" active={['create','setup','review'].includes(currentScreen)} />
          <SideNav label="Drafts" icon="folder" badge="3"/>
          <SideNav label="Search" icon="search" />
        </nav>

        <hr className="rule" />

        <div className="flex-col gap-3" style={{ paddingLeft: '4px' }}>
          <span className="label">Active batches</span>
          <div className="flex-col gap-3">
            {window.OSIMI.RECENT_BATCHES.map((b) => (
              <div key={b.id} className="flex-col gap-1" style={{ cursor: 'default' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--ink-2)', lineHeight: 1.3 }}>{b.name}</span>
                <div className="flex items-center gap-2 tabular" style={{ fontSize: '10.5px', color: 'var(--ink-3)' }}>
                  <span className="mono">{b.done}/{b.total}</span>
                  <span style={{ width: 1, height: 8, background: 'var(--rule)' }}/>
                  <span style={{ textTransform: 'capitalize' }}>{b.status}</span>
                </div>
                <ThinProgress value={b.done} total={b.total} tone={b.status === 'completed' ? 'ink' : b.status === 'review' ? 'peach' : 'sky'} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
          <div className="flex items-center gap-3" style={{ fontSize: '11.5px', color: 'var(--ink-3)' }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--display-family)', fontWeight: 600, fontSize: '12px',
              color: 'var(--ink-2)', border: '1px solid var(--rule)',
            }}>NM</div>
            <div className="flex-col">
              <span style={{ color: 'var(--ink-2)', fontSize: '12px' }}>N. Mahmoudi</span>
              <span style={{ fontSize: '10px' }}>Archivist · Tehran</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN COLUMN */}
      <main style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top bar */}
        <header style={{
          padding: '16px var(--pad-xl)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid var(--rule)',
          background: 'var(--bg)',
          position: 'sticky', top: 0, zIndex: 20,
        }}>
          <div className="flex-col gap-1">
            <div className="flex items-center gap-2" style={{ fontSize: '11px', color: 'var(--ink-3)' }}>
              <span className="label" style={{ fontSize: '10px' }}>Ingestion</span>
              <Icon name="chevron-r" size={12} />
              <span style={{ fontSize: '11.5px', color: 'var(--ink-2)' }}>New batch</span>
              {batch && (
                <>
                  <Icon name="chevron-r" size={12} />
                  <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-2)' }}>{batch.id}</span>
                </>
              )}
            </div>
            <h1 className="display" style={{ fontSize: '26px', margin: 0 }}>
              {batch?.name || 'Bring new material into the archive'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {batch && <Stamp>Draft · not yet submitted</Stamp>}
            <button className="btn btn-ghost"><Icon name="x" size={14}/> Discard</button>
          </div>
        </header>

        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </main>
    </div>
  );
}

function SideNav({ label, icon, active, badge, onClick }) {
  return (
    <a
      href="#" onClick={(e) => { e.preventDefault(); onClick?.(); }}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '8px 10px',
        borderRadius: '2px',
        background: active ? 'var(--paper)' : 'transparent',
        border: '1px solid ' + (active ? 'var(--rule)' : 'transparent'),
        color: active ? 'var(--ink)' : 'var(--ink-2)',
        fontSize: '13px', textDecoration: 'none',
        fontWeight: active ? 500 : 400,
        transition: 'all var(--dur-short) var(--ease-soft)',
      }}
    >
      <Icon name={icon} size={15} />
      <span style={{ flex: 1 }}>{label}</span>
      {badge && (
        <span className="mono" style={{
          fontSize: '10px', color: 'var(--ink-3)',
          background: 'var(--bg-3)', padding: '1px 6px', borderRadius: '999px',
        }}>{badge}</span>
      )}
    </a>
  );
}

window.AppShell = AppShell;
