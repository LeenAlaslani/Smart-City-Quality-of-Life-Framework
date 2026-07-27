// CityPulse AI — premium data-viz (dependency-free SVG): donut, trend, KPI
// tile, interactive district map, and before/after comparison. Calm palette.
import { useState } from 'react'
import Icon, { DOMAIN_ICON } from './icons'

const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v))

// deterministic gentle sparkline points (indicative texture, not a data claim)
function sparkPts(seed, n = 14, dir = 0) {
  let x = seed * 9301 % 233
  const out = []
  for (let i = 0; i < n; i++) {
    x = (x * 9301 + 49297) % 233280
    const noise = (x / 233280 - 0.5) * 22
    out.push(50 + noise + dir * (i - n / 2) * 1.6)
  }
  return out.map((v) => clamp(v, 8, 92))
}

export function Sparkline({ seed = 3, color = 'var(--cp-teal-600)', dir = 0, w = 108, h = 34, area = true }) {
  const pts = sparkPts(seed, 16, dir)
  const step = w / (pts.length - 1)
  const d = pts.map((p, i) => `${i ? 'L' : 'M'} ${(i * step).toFixed(1)} ${(h - (p / 100) * h).toFixed(1)}`).join(' ')
  const gid = 'sp' + seed + Math.round(w)
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={color} stopOpacity="0.22" /><stop offset="1" stopColor={color} stopOpacity="0" />
      </linearGradient></defs>
      {area && <path d={`${d} L ${w} ${h} L 0 ${h} Z`} fill={`url(#${gid})`} />}
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Donut({ value, color = 'var(--cp-navy-600)', size = 128, label, sub, thickness = 11 }) {
  const v = clamp(value), r = size / 2 - thickness, c = 2 * Math.PI * r, dash = (c * v) / 100
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef2f7" strokeWidth={thickness} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={thickness}
          strokeLinecap="round" strokeDasharray={`${dash} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <animate attributeName="stroke-dasharray" from={`0 ${c}`} to={`${dash} ${c}`} dur="0.9s" fill="freeze" />
        </circle>
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--cp-ink)', lineHeight: 1 }}>{label}</div>
          {sub && <div style={{ fontSize: 11, color: 'var(--cp-muted)', marginTop: 3 }}>{sub}</div>}
        </div>
      </div>
    </div>
  )
}

// Premium KPI tile with mini trend.
export function Kpi({ icon, label, value, chip, chipTone, seed = 3, dir = 0, color = 'var(--cp-teal-600)' }) {
  return (
    <div className="kpi">
      <div className="kpi-top">
        <span className="kpi-ic"><Icon name={icon} size={17} /></span>
        {chip && <span className={`chip chip-${chipTone || 'neutral'}`} style={{ fontSize: 11 }}>{chip}</span>}
      </div>
      <div className="kpi-val">{value}</div>
      <div className="kpi-lbl">{label}</div>
      <div className="kpi-spark"><Sparkline seed={seed} dir={dir} color={color} w={132} h={30} /></div>
      <style>{`
        .kpi { background:var(--cp-surface); border:1px solid var(--cp-border); border-radius:16px; padding:16px 18px; box-shadow:0 1px 2px rgba(16,42,77,.04); position:relative; overflow:hidden; }
        .kpi-top { display:flex; align-items:center; justify-content:space-between; }
        .kpi-ic { width:34px; height:34px; border-radius:10px; display:grid; place-items:center; background:var(--cp-teal-050); color:var(--cp-teal-600); }
        .kpi-val { font-size:26px; font-weight:800; color:var(--cp-ink); margin-top:12px; line-height:1; letter-spacing:-0.02em; }
        .kpi-lbl { font-size:13px; color:var(--cp-muted); margin-top:5px; }
        .kpi-spark { margin-top:10px; opacity:.9; }
      `}</style>
    </div>
  )
}

// Interactive district / city map. Premium spatial context; the priority area
// is highlighted. District tints are soft and illustrative.
const DISTRICTS = [
  { id: 'central', name: 'Central', x: 96, y: 118, w: 96, h: 74 },
  { id: 'north', name: 'North', x: 118, y: 34, w: 78, h: 56 },
  { id: 'east', name: 'East', x: 226, y: 96, w: 74, h: 60 },
  { id: 'west', name: 'West', x: 30, y: 78, w: 56, h: 60 },
  { id: 'south', name: 'South', x: 120, y: 210, w: 84, h: 56 },
  { id: 'industrial', name: 'Industrial', x: 232, y: 196, w: 66, h: 56 },
]
export function DistrictMap({ focusColor = 'var(--cp-elevated)', focusName = 'Central', height = 260 }) {
  const [hover, setHover] = useState(null)
  return (
    <div className="dmap">
      <svg viewBox="0 0 330 290" width="100%" height={height} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="dmbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f4f8fc" /><stop offset="1" stopColor="#eaf1f8" /></linearGradient>
          <linearGradient id="dmfocus" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#1d4a82" /><stop offset="1" stopColor="#1c6e8c" /></linearGradient>
        </defs>
        <rect width="330" height="290" rx="14" fill="url(#dmbg)" />
        {Array.from({ length: 9 }).map((_, i) => <line key={'v' + i} x1={i * 40} y1="0" x2={i * 40} y2="290" stroke="#e5edf5" />)}
        {Array.from({ length: 8 }).map((_, i) => <line key={'h' + i} x1="0" y1={i * 40} x2="330" y2={i * 40} stroke="#e5edf5" />)}
        <path d="M20 250 C90 250 120 150 190 150 260 150 300 110 320 70" fill="none" stroke="#cfdded" strokeWidth="6" strokeLinecap="round" />
        <path d="M50 30 C110 80 100 200 200 210 300 218 300 250 320 250" fill="none" stroke="#d9e6f1" strokeWidth="5" strokeLinecap="round" />
        {DISTRICTS.map((d) => {
          const isFocus = d.name === focusName
          const isHover = hover === d.id
          return (
            <g key={d.id} onMouseEnter={() => setHover(d.id)} onMouseLeave={() => setHover(null)} style={{ cursor: 'pointer' }}>
              <rect x={d.x} y={d.y} width={d.w} height={d.h} rx={11}
                fill={isFocus ? 'url(#dmfocus)' : (isHover ? '#d3e0ee' : '#e0e9f3')}
                stroke={isFocus ? 'none' : (isHover ? 'var(--cp-navy-500)' : 'transparent')} strokeWidth="1.5" />
              {isFocus && <rect x={d.x - 5} y={d.y - 5} width={d.w + 10} height={d.h + 10} rx={14} fill="none" stroke={focusColor} strokeWidth="2.5" strokeDasharray="5 5" />}
              <text x={d.x + d.w / 2} y={d.y + d.h / 2 + 4} textAnchor="middle" fontSize="12" fontWeight={isFocus ? 700 : 500}
                fill={isFocus ? '#fff' : 'var(--cp-ink-2)'}>{d.name}</text>
            </g>
          )
        })}
      </svg>
      <div className="dmap-legend">
        <span><span className="ld" style={{ background: focusColor }} /> Priority area · <b>{focusName} District</b></span>
        {hover && <span className="dmap-h">{DISTRICTS.find((d) => d.id === hover)?.name} District</span>}
      </div>
      <style>{`
        .dmap { position:relative; }
        .dmap-legend { display:flex; align-items:center; justify-content:space-between; margin-top:10px; font-size:12px; color:var(--cp-ink-2); }
        .dmap-legend .ld { display:inline-block; width:8px; height:8px; border-radius:50%; margin-inline-end:5px; }
        .dmap-h { color:var(--cp-muted); }
      `}</style>
    </div>
  )
}

// Before / after dumbbell comparison — elegant, replaces plain ghost bars.
export function Compare({ signals, baseline }) {
  const rows = Object.values(signals).sort((a, b) => b.pressure - a.pressure)
  return (
    <div className="cmp2">
      {rows.map((s) => {
        const b = baseline?.[s.domain]?.pressure ?? s.pressure
        const a = s.pressure, lo = Math.min(a, b), hi = Math.max(a, b)
        const delta = Math.round(a - b), improved = delta < 0
        return (
          <div className="cmp2-row" key={s.domain}>
            <span className="cmp2-name"><Icon name={DOMAIN_ICON[s.domain]} size={16} /> {s.domain_label}</span>
            <div className="cmp2-track">
              <span className="cmp2-line" style={{ left: lo + '%', width: (hi - lo) + '%', background: improved ? 'var(--cp-stable)' : 'var(--cp-high)' }} />
              <span className="cmp2-dot ghost" style={{ left: b + '%' }} title="Current" />
              <span className="cmp2-dot" style={{ left: a + '%', background: s.color }} title="Scenario" />
            </div>
            <span className={`cmp2-delta ${delta === 0 ? 'flat' : improved ? 'down' : 'up'}`}>
              {delta === 0 ? '—' : <><Icon name={improved ? 'down' : 'up'} size={12} /> {Math.abs(delta)}</>}
            </span>
          </div>
        )
      })}
      <div className="cmp2-key"><span><i className="ghost" /> Current</span><span><i /> After decision</span></div>
      <style>{`
        .cmp2 { display:flex; flex-direction:column; gap:15px; }
        .cmp2-row { display:grid; grid-template-columns:180px 1fr 46px; align-items:center; gap:14px; }
        .cmp2-name { display:flex; align-items:center; gap:8px; font-size:13px; font-weight:500; color:var(--cp-ink); }
        .cmp2-name svg { color:var(--cp-ink-2); }
        .cmp2-track { position:relative; height:16px; }
        .cmp2-track::before { content:''; position:absolute; left:0; right:0; top:7px; height:2px; background:#eef2f7; border-radius:2px; }
        .cmp2-line { position:absolute; top:7px; height:2px; border-radius:2px; }
        .cmp2-dot { position:absolute; top:2px; width:12px; height:12px; margin-left:-6px; border-radius:50%; border:2px solid #fff; box-shadow:0 1px 3px rgba(16,42,77,.2); }
        .cmp2-dot.ghost { background:#fff; border:2px solid var(--cp-border-strong); }
        .cmp2-delta { font-size:12px; font-weight:700; display:inline-flex; align-items:center; gap:2px; justify-content:flex-end; }
        .cmp2-delta.down { color:var(--cp-stable); } .cmp2-delta.up { color:var(--cp-high); } .cmp2-delta.flat { color:var(--cp-muted); }
        .cmp2-key { display:flex; gap:18px; margin-top:4px; font-size:11px; color:var(--cp-muted); }
        .cmp2-key i { display:inline-block; width:9px; height:9px; border-radius:50%; background:var(--cp-navy-600); margin-inline-end:5px; vertical-align:middle; }
        .cmp2-key i.ghost { background:#fff; border:2px solid var(--cp-border-strong); }
      `}</style>
    </div>
  )
}
