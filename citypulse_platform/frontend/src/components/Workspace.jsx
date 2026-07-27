// CityPulse AI — premium "city decision workspace" hero visual.
// Abstract coordinated-operations composition: a city map with connected
// districts + floating decision panels. Communicates municipal decision-making,
// not machine learning. Original CityPulse identity (navy/teal on light).
import Icon from './icons'

export default function Workspace() {
  return (
    <div className="ws">
      <div className="ws-bar">
        <span className="ws-dot" /><span className="ws-dot" /><span className="ws-dot" />
        <span className="ws-title"><Icon name="pin" size={13} /> Riyadh — City Decision Workspace</span>
      </div>

      <div className="ws-body">
        <svg viewBox="0 0 420 300" className="ws-map" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="wsg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#f7fafc" /><stop offset="1" stopColor="#eef3f8" />
            </linearGradient>
            <linearGradient id="wpri" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#1d4a82" /><stop offset="1" stopColor="#2a5c9a" />
            </linearGradient>
          </defs>
          <rect width="420" height="300" fill="url(#wsg)" />
          {/* faint grid */}
          {Array.from({ length: 9 }).map((_, i) => <line key={'v' + i} x1={i * 52} y1="0" x2={i * 52} y2="300" stroke="#e4ebf2" strokeWidth="1" />)}
          {Array.from({ length: 7 }).map((_, i) => <line key={'h' + i} x1="0" y1={i * 46} x2="420" y2={i * 46} stroke="#e4ebf2" strokeWidth="1" />)}
          {/* route corridors */}
          <path d="M30 250 C120 250 150 120 240 120 S360 90 400 60" fill="none" stroke="#c6d4e4" strokeWidth="6" strokeLinecap="round" />
          <path d="M60 40 C120 90 120 200 220 210 S350 230 400 210" fill="none" stroke="#d3e0ec" strokeWidth="5" strokeLinecap="round" />
          {/* districts */}
          <g>
            <rect x="46" y="60" width="70" height="52" rx="9" fill="#dfe8f2" />
            <rect x="132" y="44" width="58" height="44" rx="9" fill="#e6eef6" />
            <rect x="150" y="150" width="78" height="60" rx="10" fill="url(#wpri)" />
            <rect x="256" y="70" width="64" height="50" rx="9" fill="#dbe6f1" />
            <rect x="300" y="176" width="66" height="52" rx="9" fill="#e6eef6" />
            <rect x="60" y="196" width="60" height="46" rx="9" fill="#e9f0f7" />
          </g>
          {/* priority ring on central district */}
          <rect x="144" y="144" width="90" height="72" rx="13" fill="none" stroke="#159bb3" strokeWidth="2.5" strokeDasharray="5 5" />
          {/* connective nodes */}
          {[[81, 86], [161, 66], [189, 180], [288, 95], [333, 202], [90, 219]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="4.5" fill="#fff" stroke="#1d4a82" strokeWidth="2" />
          ))}
          <circle cx="189" cy="180" r="6" fill="#159bb3" stroke="#fff" strokeWidth="2" />
        </svg>

        {/* floating decision panels */}
        <div className="ws-card ws-a">
          <div className="ws-k"><span className="led" style={{ background: 'var(--cp-elevated)' }} /> Needs attention</div>
          <div className="ws-v">Central District — Mobility</div>
          <div className="ws-mini"><i style={{ width: '64%', background: 'var(--cp-elevated)' }} /></div>
        </div>

        <div className="ws-card ws-b">
          <div className="ws-k"><Icon name="roadmap" size={13} /> Transformation roadmap</div>
          <div className="ws-steps">
            {['Discovery', 'Near', 'Medium', '2030'].map((s, i) => (
              <span key={s} className={`st${i <= 1 ? ' on' : ''}${i === 1 ? ' now' : ''}`} title={s} />
            ))}
          </div>
          <div className="ws-v" style={{ fontSize: 12, color: 'var(--cp-muted)', fontWeight: 500 }}>4 initiatives · 2 decisions pending</div>
        </div>

        <div className="ws-card ws-c">
          <div className="ws-k"><Icon name="target" size={13} /> Coordinated across</div>
          <div className="ws-tags">
            {['Mobility', 'Energy', 'Services', 'Waste'].map((t) => <span key={t}>{t}</span>)}
          </div>
        </div>
      </div>

      <style>{`
        .ws { position:relative; border-radius:16px; background:#fff; border:1px solid var(--cp-border);
          box-shadow: 0 20px 50px rgba(16,42,77,.14), 0 4px 12px rgba(16,42,77,.06); overflow:hidden; }
        .ws-bar { display:flex; align-items:center; gap:7px; padding:11px 14px; border-bottom:1px solid var(--cp-border); background:var(--cp-surface-2); }
        .ws-dot { width:9px; height:9px; border-radius:50%; background:#d7dee8; }
        .ws-title { margin-inline-start:8px; font-size:12px; color:var(--cp-ink-2); font-weight:600; display:inline-flex; align-items:center; gap:6px; }
        .ws-title svg { color:var(--cp-teal-600); }
        .ws-body { position:relative; height:340px; }
        .ws-map { width:100%; height:100%; display:block; }
        .ws-card { position:absolute; background:#fff; border:1px solid var(--cp-border); border-radius:12px;
          box-shadow: 0 8px 22px rgba(16,42,77,.12); padding:11px 13px; min-width:150px; }
        .ws-card .ws-k { font-size:11px; color:var(--cp-muted); font-weight:600; display:flex; align-items:center; gap:6px; }
        .ws-card .ws-k .led { width:7px; height:7px; border-radius:50%; }
        .ws-card .ws-k svg { color:var(--cp-teal-600); }
        .ws-card .ws-v { font-size:13px; font-weight:600; color:var(--cp-ink); margin-top:5px; }
        .ws-mini { height:6px; background:#eef1f5; border-radius:4px; margin-top:8px; overflow:hidden; }
        .ws-mini > i { display:block; height:100%; border-radius:4px; }
        .ws-a { top:22px; inset-inline-end:20px; }
        .ws-b { bottom:20px; inset-inline-start:20px; }
        .ws-c { top:120px; inset-inline-start:26px; }
        .ws-steps { display:flex; gap:5px; margin:8px 0 6px; }
        .ws-steps .st { width:22px; height:5px; border-radius:3px; background:#e1e8f0; }
        .ws-steps .st.on { background:var(--cp-teal-600); }
        .ws-steps .st.now { background:var(--cp-navy-600); box-shadow:0 0 0 3px rgba(29,74,130,.14); }
        .ws-tags { display:flex; flex-wrap:wrap; gap:5px; margin-top:7px; }
        .ws-tags span { font-size:11px; padding:2px 8px; border-radius:6px; background:var(--cp-teal-050); color:var(--cp-navy-700); font-weight:600; }
        @media (max-width:960px){ .ws-body{ height:300px; } .ws-c{ display:none; } }
      `}</style>
    </div>
  )
}
