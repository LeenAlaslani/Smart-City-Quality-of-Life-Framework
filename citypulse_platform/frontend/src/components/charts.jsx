// CityPulse AI — lightweight SVG data-viz (dependency-free).
import Icon, { DOMAIN_ICON } from './icons'

const clamp = (v) => Math.max(0, Math.min(100, v))

// Semicircular pressure gauge — visual, restrained (status leads, not a score).
export function Gauge({ value, color, label, status, size = 168 }) {
  const v = clamp(value)
  const w = size, h = size * 0.62, cx = w / 2, cy = h - 4, r = w / 2 - 12
  const a0 = Math.PI, a1 = 0
  const ang = a0 + (a1 - a0) * (v / 100)
  const pt = (a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)]
  const [sx, sy] = pt(a0), [ex, ey] = pt(a1), [px, py] = pt(ang)
  const big = v > 50 ? 1 : 0
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={w} height={h + 30} viewBox={`0 0 ${w} ${h + 30}`}>
        <path d={`M ${sx} ${sy} A ${r} ${r} 0 0 1 ${ex} ${ey}`} fill="none" stroke="#eaeef3" strokeWidth="11" strokeLinecap="round" />
        <path d={`M ${sx} ${sy} A ${r} ${r} 0 ${big} 1 ${px} ${py}`} fill="none" stroke={color} strokeWidth="11" strokeLinecap="round" />
        <circle cx={px} cy={py} r="6" fill="#fff" stroke={color} strokeWidth="3" />
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--cp-ink)">{status}</text>
        <text x={cx} y={h + 22} textAnchor="middle" fontSize="12" fill="var(--cp-muted)">{label}</text>
      </svg>
    </div>
  )
}

// Cross-domain comparison — the workhorse visual for connected model outputs.
export function DomainBars({ signals, baseline, showDelta = false }) {
  const rows = Object.values(signals).sort((a, b) => b.pressure - a.pressure)
  return (
    <div className="dbars">
      {rows.map((s) => {
        const base = baseline?.[s.domain]?.pressure
        const delta = base != null ? Math.round(s.pressure - base) : 0
        return (
          <div className="dbar" key={s.domain}>
            <div className="dbar-h">
              <span className="dbar-name"><Icon name={DOMAIN_ICON[s.domain]} size={17} /> {s.domain_label}</span>
              <span className="dbar-status" style={{ color: s.color }}>{s.status}</span>
            </div>
            <div className="dbar-track">
              {base != null && <span className="dbar-ghost" style={{ width: clamp(base) + '%' }} />}
              <span className="dbar-fill" style={{ width: clamp(s.pressure) + '%', background: s.color }} />
            </div>
            {showDelta && Math.abs(delta) >= 2 && (
              <span className={`dbar-delta ${delta > 0 ? 'up' : 'down'}`}>
                <Icon name={delta > 0 ? 'up' : 'down'} size={13} /> {Math.abs(delta)}
              </span>
            )}
          </div>
        )
      })}
      <style>{`
        .dbars { display:flex; flex-direction:column; gap:var(--sp-4); }
        .dbar { display:grid; grid-template-columns:1fr auto; grid-template-areas:'h d' 't d'; gap:2px 12px; align-items:center; }
        .dbar-h { grid-area:h; display:flex; align-items:center; justify-content:space-between; }
        .dbar-name { display:flex; align-items:center; gap:8px; font-size:var(--fs-14); font-weight:500; color:var(--cp-ink); }
        .dbar-name svg { color:var(--cp-ink-2); }
        .dbar-status { font-size:var(--fs-12); font-weight:700; }
        .dbar-track { grid-area:t; position:relative; height:7px; background:#eef2f7; border-radius:6px; }
        .dbar-ghost { position:absolute; left:0; top:0; height:100%; border-radius:6px; background:repeating-linear-gradient(90deg,#dbe2ec,#dbe2ec 3px,transparent 3px,transparent 6px); }
        .dbar-fill { position:absolute; left:0; top:0; height:100%; border-radius:6px; transition:width .7s cubic-bezier(.2,.8,.2,1); opacity:.92; }
        .dbar-delta { grid-area:d; display:inline-flex; align-items:center; gap:2px; font-size:var(--fs-12); font-weight:700; padding:2px 8px; border-radius:6px; }
        .dbar-delta.up { background:var(--cp-high-bg); color:var(--cp-high); }
        .dbar-delta.down { background:var(--cp-stable-bg); color:var(--cp-stable); }
      `}</style>
    </div>
  )
}

// Roadmap / transformation phase strip.
export function PhaseStrip({ stage = 0 }) {
  const phases = ['Discovery', 'Near-term', 'Medium-term', 'Long-term']
  return (
    <div className="phases">
      {phases.map((p, i) => (
        <div key={p} className={`phase${i <= stage ? ' done' : ''}${i === stage ? ' now' : ''}`}>
          <span className="dot" /><span className="lbl">{p}</span>
        </div>
      ))}
      <style>{`
        .phases { display:flex; align-items:center; gap:0; }
        .phase { flex:1; display:flex; flex-direction:column; align-items:flex-start; position:relative; }
        .phase .lbl { font-size:var(--fs-12); color:var(--cp-muted); margin-top:6px; }
        .phase .dot { width:12px; height:12px; border-radius:50%; background:#dbe2ec; border:2px solid #fff; box-shadow:0 0 0 1px #dbe2ec; z-index:1; }
        .phase::before { content:''; position:absolute; top:5px; left:0; right:0; height:2px; background:#e3e8ef; }
        .phase:first-child::before { left:50%; }
        .phase:last-child::before { right:50%; }
        .phase.done .dot { background:var(--cp-teal-600); box-shadow:0 0 0 1px var(--cp-teal-600); }
        .phase.done .lbl { color:var(--cp-ink-2); }
        .phase.now .dot { background:var(--cp-navy-600); box-shadow:0 0 0 4px rgba(29,74,130,.15); }
        .phase.now .lbl { color:var(--cp-navy-700); font-weight:600; }
      `}</style>
    </div>
  )
}

// Small metric tile with icon.
export function Metric({ icon, label, value, tone = 'neutral' }) {
  return (
    <div className={`metric metric-${tone}`}>
      <div className="mi"><Icon name={icon} size={18} /></div>
      <div><div className="mv">{value}</div><div className="ml">{label}</div></div>
      <style>{`
        .metric { display:flex; align-items:center; gap:12px; padding:14px 16px; border:1px solid var(--cp-border); border-radius:var(--r-md); background:var(--cp-surface); }
        .metric .mi { width:38px; height:38px; border-radius:9px; display:grid; place-items:center; background:var(--cp-teal-050); color:var(--cp-teal-600); }
        .metric .mv { font-size:var(--fs-20); font-weight:700; color:var(--cp-ink); line-height:1.1; }
        .metric .ml { font-size:var(--fs-12); color:var(--cp-muted); margin-top:2px; }
        .metric-warn .mi { background:var(--cp-elevated-bg); color:var(--cp-elevated); }
        .metric-alert .mi { background:var(--cp-high-bg); color:var(--cp-high); }
      `}</style>
    </div>
  )
}
