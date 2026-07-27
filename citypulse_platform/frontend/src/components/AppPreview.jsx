// CityPulse AI — premium product preview for the landing hero.
// An elegant, calm app-window mock: abstract intelligent-city visual + a soft
// decision summary. Floats with depth + gradient glow. No ML content.
import Icon from './icons'

const ROWS = [
  { label: 'Mobility', status: 'Elevated', color: 'var(--cp-elevated)', w: 62 },
  { label: 'Energy', status: 'Watch', color: 'var(--cp-watch)', w: 46 },
  { label: 'Services', status: 'Watch', color: 'var(--cp-watch)', w: 44 },
  { label: 'Environment', status: 'Stable', color: 'var(--cp-stable)', w: 31 },
]

export default function AppPreview() {
  return (
    <div className="ap-wrap">
      <div className="ap-glow" />
      <div className="ap">
        <div className="ap-bar">
          <span className="ap-logo"><Icon name="pulse" size={14} /></span>
          <span className="ap-city"><Icon name="pin" size={13} /> Riyadh — City Overview</span>
          <span className="ap-tag">Decision workspace</span>
        </div>

        <div className="ap-body">
          {/* left: intelligent-city visual */}
          <div className="ap-map">
            <svg viewBox="0 0 260 300" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
              <defs>
                <linearGradient id="apg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#1d4a82" /><stop offset="1" stopColor="#159bb3" />
                </linearGradient>
                <linearGradient id="apbg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#f3f8fc" /><stop offset="1" stopColor="#eaf1f8" />
                </linearGradient>
              </defs>
              <rect width="260" height="300" fill="url(#apbg)" />
              {Array.from({ length: 7 }).map((_, i) => <line key={'v' + i} x1={i * 40} y1="0" x2={i * 40} y2="300" stroke="#e2eaf3" />)}
              {Array.from({ length: 8 }).map((_, i) => <line key={'h' + i} x1="0" y1={i * 40} x2="260" y2={i * 40} stroke="#e2eaf3" />)}
              <path d="M20 250 C90 250 110 150 180 140 S250 110 260 90" fill="none" stroke="#cdddec" strokeWidth="6" strokeLinecap="round" />
              <path d="M40 40 C90 90 90 190 170 200 260 210 240 250 260 250" fill="none" stroke="#d9e6f1" strokeWidth="5" strokeLinecap="round" />
              <rect x="34" y="60" width="60" height="46" rx="9" fill="#dbe7f3" />
              <rect x="112" y="46" width="48" height="38" rx="8" fill="#e6eef7" />
              <rect x="96" y="150" width="70" height="56" rx="11" fill="url(#apg)" />
              <rect x="184" y="70" width="52" height="42" rx="9" fill="#dae6f2" />
              <rect x="188" y="196" width="52" height="42" rx="9" fill="#e6eef7" />
              <rect x="90" y="144" width="82" height="68" rx="14" fill="none" stroke="#159bb3" strokeWidth="2.4" strokeDasharray="5 5" />
              {[[64, 83], [136, 65], [131, 178], [210, 91], [214, 217]].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="4.5" fill="#fff" stroke="#1d4a82" strokeWidth="2" />
              ))}
              <circle cx="131" cy="178" r="6.5" fill="#159bb3" stroke="#fff" strokeWidth="2.5" />
            </svg>
          </div>

          {/* right: decision summary */}
          <div className="ap-sum">
            <div className="ap-k">Priority for attention</div>
            <div className="ap-focus">
              <span className="ap-dot" style={{ background: 'var(--cp-elevated)' }} />
              <span>Central District — Mobility</span>
            </div>
            <div className="ap-rows">
              {ROWS.map((r) => (
                <div className="ap-row" key={r.label}>
                  <span className="ap-lbl">{r.label}</span>
                  <span className="ap-track"><i style={{ width: r.w + '%', background: r.color }} /></span>
                  <span className="ap-st" style={{ color: r.color }}>{r.status}</span>
                </div>
              ))}
            </div>
            <div className="ap-rec"><Icon name="target" size={13} /> Recommended · expand transit capacity</div>
          </div>
        </div>
      </div>

      {/* floating accent chips for depth */}
      <div className="ap-chip ap-c1"><Icon name="up" size={13} /> Peak-demand ready</div>
      <div className="ap-chip ap-c2"><span className="ld" /> 4 domains coordinated</div>

      <style>{`
        .ap-wrap { position:relative; width:100%; max-width:720px; margin:0 auto; }
        .ap-glow { position:absolute; inset:-8% -6% -12% -6%; background:
          radial-gradient(40% 55% at 78% 20%, rgba(21,155,179,.28), transparent 70%),
          radial-gradient(45% 55% at 15% 90%, rgba(29,74,130,.20), transparent 70%);
          filter:blur(24px); z-index:0; }
        .ap { position:relative; z-index:1; border-radius:18px; background:#fff; overflow:hidden;
          border:1px solid var(--cp-border); box-shadow:0 30px 70px rgba(16,42,77,.18), 0 8px 20px rgba(16,42,77,.08); }
        .ap-bar { display:flex; align-items:center; gap:10px; padding:13px 16px; border-bottom:1px solid var(--cp-border); background:var(--cp-surface-2); }
        .ap-logo { width:24px; height:24px; border-radius:7px; display:grid; place-items:center; background:var(--grad-brand); color:#fff; }
        .ap-city { font-size:13px; font-weight:600; color:var(--cp-ink); display:inline-flex; align-items:center; gap:6px; }
        .ap-city svg { color:var(--cp-teal-600); }
        .ap-tag { margin-inline-start:auto; font-size:11px; color:var(--cp-muted); border:1px solid var(--cp-border); padding:3px 9px; border-radius:999px; }
        .ap-body { display:grid; grid-template-columns:42% 58%; height:280px; }
        .ap-map { position:relative; border-inline-end:1px solid var(--cp-border); }
        .ap-sum { padding:20px 22px; display:flex; flex-direction:column; }
        .ap-k { font-size:11px; text-transform:uppercase; letter-spacing:.07em; color:var(--cp-muted); font-weight:600; }
        .ap-focus { display:flex; align-items:center; gap:9px; font-size:16px; font-weight:700; color:var(--cp-ink); margin:8px 0 18px; }
        .ap-dot { width:9px; height:9px; border-radius:50%; }
        .ap-rows { display:flex; flex-direction:column; gap:13px; }
        .ap-row { display:grid; grid-template-columns:74px 1fr auto; align-items:center; gap:10px; }
        .ap-lbl { font-size:13px; color:var(--cp-ink-2); font-weight:500; }
        .ap-track { height:6px; background:#eef2f7; border-radius:5px; overflow:hidden; }
        .ap-track > i { display:block; height:100%; border-radius:5px; opacity:.9; }
        .ap-st { font-size:11px; font-weight:700; }
        .ap-rec { margin-top:auto; display:inline-flex; align-items:center; gap:7px; font-size:12px; font-weight:600;
          color:var(--cp-navy-700); background:var(--cp-teal-050); padding:8px 12px; border-radius:10px; align-self:flex-start; }
        .ap-chip { position:absolute; z-index:2; background:#fff; border:1px solid var(--cp-border);
          box-shadow:0 10px 26px rgba(16,42,77,.14); border-radius:11px; padding:9px 13px; font-size:12px;
          font-weight:600; color:var(--cp-ink); display:inline-flex; align-items:center; gap:7px; }
        .ap-chip svg { color:var(--cp-teal-600); }
        .ap-chip .ld { width:7px; height:7px; border-radius:50%; background:var(--cp-stable); }
        .ap-c1 { top:-18px; inset-inline-end:8%; }
        .ap-c2 { bottom:-16px; inset-inline-start:6%; }
        @media (max-width:960px){ .ap-body{ height:auto; grid-template-columns:1fr; } .ap-map{ height:150px; border-inline-end:none; border-bottom:1px solid var(--cp-border);} }
      `}</style>
    </div>
  )
}
