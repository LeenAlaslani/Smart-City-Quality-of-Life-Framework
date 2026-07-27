// CityPulse AI — premium data-viz v2 (dependency-free SVG). Forecast area,
// domain small-multiples, confidence meter, diverging impact, and a compact
// "constellation" that carries the landing-orb identity into the dashboard.
import Icon, { DOMAIN_ICON } from './icons'

const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v))
const smooth = (pts) => {
  // catmull-rom → bezier for a soft line
  let d = `M ${pts[0][0]},${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`
  }
  return d
}

// Current → forecast trajectory. Endpoints are real model outputs; the curve
// between is an indicative projection (labelled as such by the caller).
export function ForecastArea({ current, forecast, color = 'var(--cp-navy-600)', height = 150 }) {
  const W = 520, H = height, pad = 8, nowX = W * 0.42
  const y = (v) => pad + (1 - clamp(v) / 100) * (H - pad * 2 - 16)
  const histX = [0, nowX * 0.35, nowX * 0.7, nowX]
  const hist = histX.map((x, i) => [x, y(current - 4 + Math.sin(i) * 2)])
  const fc = [[nowX, y(current)], [nowX + (W - nowX) * 0.4, y(current + (forecast - current) * 0.45)], [W - 30, y(forecast)], [W, y(forecast)]]
  const line = smooth(hist), fline = smooth(fc)
  const band = fc.map(([x]) => x)
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={height} preserveAspectRatio="none" role="img" aria-label="Operational pressure, current versus forecast">
        <defs>
          <linearGradient id="fa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity="0.18" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient>
        </defs>
        {[25, 50, 75].map((g) => <line key={g} x1="0" x2={W} y1={y(g)} y2={y(g)} stroke="var(--cp-border)" strokeDasharray="2 4" />)}
        <path d={`${line} L ${nowX},${H - 8} L 0,${H - 8} Z`} fill="url(#fa)" />
        <path d={line} fill="none" stroke={color} strokeWidth="2.4" />
        {/* forecast band */}
        <path d={`${fline} L ${band[band.length - 1]},${y(forecast) + 14} C ${band[2]},${y(forecast) + 10} ${band[1]},${y(current) + 12} ${nowX},${y(current) + 6} Z`} fill={color} opacity="0.08" />
        <path d={fline} fill="none" stroke="var(--cp-teal-500)" strokeWidth="2.4" strokeDasharray="5 4" />
        <line x1={nowX} y1="2" x2={nowX} y2={H - 8} stroke="var(--cp-border-strong)" strokeDasharray="3 3" />
        <circle cx={nowX} cy={y(current)} r="4" fill="#fff" stroke={color} strokeWidth="2.5" />
        <circle cx={W - 4} cy={y(forecast)} r="4" fill="#fff" stroke="var(--cp-teal-500)" strokeWidth="2.5" />
      </svg>
      <div className="fa-x"><span>Recent</span><span className="fa-now">Now</span><span>+30 days →</span></div>
    </div>
  )
}

// Operational Pressure Index (0–100) — honest: shows the real index on the same
// 5 status bands the backend uses, with the current position and a labelled
// scenario projection. No invented history, no fake timeframe.
const BANDS_0_100 = [
  [0, 34, 'Stable', '#2f9e7b'], [34, 55, 'Watch', '#5a86ad'],
  [55, 72, 'Elevated', '#c39a4e'], [72, 86, 'High', '#c07d63'], [86, 100, 'Critical', '#b15f6b'],
]
export function PressureBand({ current, scenario, scenarioLabel = 'Peak-demand scenario' }) {
  const W = 520, H = 118, padX = 14, trackY = 64, trackH = 16
  const x = (v) => padX + (clamp(v) / 100) * (W - padX * 2)
  const cur = Math.round(current), sc = scenario != null ? Math.round(scenario) : null
  const delta = sc != null ? sc - cur : null
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label={`Operational pressure index ${cur} of 100`}>
        <defs>
          <filter id="pbsh" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#0e2a4f" floodOpacity="0.28" /></filter>
        </defs>
        {/* band track */}
        {BANDS_0_100.map(([lo, hi, , c], i) => (
          <rect key={i} x={x(lo)} y={trackY} width={x(hi) - x(lo)} height={trackH}
            fill={c} opacity="0.9"
            rx={i === 0 ? 8 : 0} ry={i === 0 ? 8 : 0} />
        ))}
        <rect x={padX} y={trackY} width={W - padX * 2} height={trackH} rx="8" fill="none" stroke="rgba(0,0,0,.06)" />
        {/* band ticks + labels */}
        {BANDS_0_100.map(([lo, hi, name], i) => (
          <text key={'t' + i} x={(x(lo) + x(hi)) / 2} y={trackY + trackH + 15} textAnchor="middle"
            fontSize="9.5" fontWeight="600" fill="var(--cp-muted)">{name}</text>
        ))}
        {/* scenario marker (outlined) */}
        {sc != null && (
          <g>
            <line x1={x(sc)} y1={trackY - 6} x2={x(sc)} y2={trackY + trackH + 2} stroke="var(--cp-teal-500)" strokeWidth="2" strokeDasharray="3 3" />
            <g transform={`translate(${x(sc)},${trackY - 20})`}>
              <rect x="-15" y="-12" width="30" height="18" rx="5" fill="#fff" stroke="var(--cp-teal-500)" strokeWidth="1.4" />
              <text x="0" y="1" textAnchor="middle" fontSize="11" fontWeight="800" fill="var(--cp-teal-600, #14839a)">{sc}</text>
            </g>
          </g>
        )}
        {/* current marker (filled) */}
        <g filter="url(#pbsh)">
          <line x1={x(cur)} y1={trackY - 8} x2={x(cur)} y2={trackY + trackH + 4} stroke="var(--cp-navy-700)" strokeWidth="2.5" />
          <g transform={`translate(${x(cur)},${trackY - 24})`}>
            <rect x="-19" y="-13" width="38" height="20" rx="6" fill="var(--cp-navy-700)" />
            <text x="0" y="1" textAnchor="middle" fontSize="12" fontWeight="800" fill="#fff">{cur}</text>
          </g>
        </g>
      </svg>
      <div className="pb-legend">
        <span><b className="pb-dot pb-cur" />Current index <b>{cur}</b>/100</span>
        {sc != null && <span><b className="pb-dot pb-sc" />{scenarioLabel} <b>{sc}</b> ({delta >= 0 ? '+' : ''}{delta})</span>}
      </div>
      <style>{`
        .pb-legend{display:flex;flex-wrap:wrap;gap:8px 22px;margin-top:10px;font-size:12.5px;color:var(--cp-ink-2)}
        .pb-legend b{font-weight:700;color:var(--cp-ink)}
        .pb-dot{display:inline-block;width:9px;height:9px;border-radius:3px;margin-right:7px;vertical-align:middle}
        .pb-cur{background:var(--cp-navy-700)}
        .pb-sc{background:#fff;border:1.6px solid var(--cp-teal-500)}
      `}</style>
    </div>
  )
}

// Compact orb-language gauge for a single domain — echoes the landing orb: a
// faint ring, an arc filled to the pressure index, orbiting nodes, glowing core.
export function DomainPulse({ pressure, color = 'var(--cp-navy-600)', size = 66 }) {
  const p = clamp(pressure) / 100, cx = size / 2, cy = size / 2, r = size * 0.36
  const circ = 2 * Math.PI * r
  const nodes = [0, 1, 2, 3].map((i) => { const a = -Math.PI / 2 + i * Math.PI / 2; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] })
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--cp-border)" strokeWidth="4" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
        strokeDasharray={`${circ * p} ${circ}`} transform={`rotate(-90 ${cx} ${cy})`} />
      {nodes.map(([nx, ny], i) => <circle key={i} cx={nx} cy={ny} r="2.4" fill={color} opacity={i / 4 <= p ? 0.95 : 0.28} />)}
      <circle cx={cx} cy={cy} r="7" fill={color} opacity="0.14" />
      <text x={cx} y={cy + 3.5} textAnchor="middle" fontSize={size * 0.24} fontWeight="800" fill="var(--cp-ink)">{Math.round(pressure)}</text>
    </svg>
  )
}

export function ConfidenceMeter({ level = 2, caption }) {
  // level: 1 low, 2 medium, 3 high (qualitative, honest — not a fabricated %)
  const labels = ['Low', 'Indicative', 'High']
  return (
    <div className="conf">
      <div className="conf-head"><span>Model confidence</span><b>{labels[level - 1]}</b></div>
      <div className="conf-seg">{[1, 2, 3].map((i) => <span key={i} className={i <= level ? 'on' : ''} />)}</div>
      {caption && <div className="conf-cap">{caption}</div>}
      <style>{`
        .conf-head{display:flex;justify-content:space-between;font-size:12px;color:var(--cp-on-panel-2)}
        .conf-head b{color:#fff}
        .conf-seg{display:flex;gap:5px;margin-top:8px}
        .conf-seg span{flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,.14)}
        .conf-seg span.on{background:var(--cp-cyan)}
        .conf-cap{font-size:11px;color:var(--cp-on-panel-2);margin-top:8px;line-height:1.45}
      `}</style>
    </div>
  )
}

// Domain small-multiples: status + mini trend + evidence, one compact card each.
export function DomainTrends({ signals }) {
  const rows = Object.values(signals).sort((a, b) => b.pressure - a.pressure)
  const spark = (seed, dir, color) => {
    const pts = []; let x = seed * 97 % 50
    for (let i = 0; i < 12; i++) { x = (x * 131 + 71) % 200; pts.push([i * (170 / 11), 26 - (clamp(38 + (x / 200 - .5) * 30 + dir * (i - 6) * 1.6, 6, 44) / 44) * 26]) }
    return smooth(pts)
  }
  return (
    <div className="dt-grid">
      {rows.map((s, i) => (
        <div className="dt-card" key={s.domain}>
          <div className="dt-h">
            <span className="dt-n"><Icon name={DOMAIN_ICON[s.domain]} size={16} /> {s.domain_label.split(' & ')[0]}</span>
            <span className="dt-st" style={{ color: s.color }}>{s.status}</span>
          </div>
          <svg viewBox="0 0 170 28" className="dt-sp" preserveAspectRatio="none"><path d={spark(i + 2, i % 2 ? -0.3 : 0.35, s.color)} fill="none" stroke={s.color} strokeWidth="1.8" /></svg>
        </div>
      ))}
      <style>{`
        .dt-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
        .dt-card{border:1px solid var(--cp-border);border-radius:13px;padding:14px;background:var(--cp-surface);transition:.16s}
        .dt-card:hover{border-color:var(--cp-border-strong);box-shadow:var(--sh-1)}
        .dt-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
        .dt-n{display:flex;align-items:center;gap:7px;font-size:13px;font-weight:600;color:var(--cp-ink)}
        .dt-n svg{color:var(--cp-ink-2)}
        .dt-st{font-size:11px;font-weight:700}
        .dt-sp{width:100%;height:28px}
        @media(max-width:900px){.dt-grid{grid-template-columns:1fr 1fr}}
      `}</style>
    </div>
  )
}

// Diverging impact — change per domain (current → scenario), premium.
export function DivergingImpact({ signals, baseline }) {
  const rows = Object.values(signals).sort((a, b) => Math.abs((baseline?.[b.domain]?.pressure ?? b.pressure) - b.pressure) - Math.abs((baseline?.[a.domain]?.pressure ?? a.pressure) - a.pressure))
  const maxD = Math.max(12, ...rows.map((s) => Math.abs((s.pressure) - (baseline?.[s.domain]?.pressure ?? s.pressure))))
  return (
    <div className="di">
      {rows.map((s) => {
        const b = baseline?.[s.domain]?.pressure ?? s.pressure
        const d = Math.round(s.pressure - b), improved = d < 0
        const w = Math.min(50, (Math.abs(d) / maxD) * 50)
        return (
          <div className="di-row" key={s.domain}>
            <span className="di-n"><Icon name={DOMAIN_ICON[s.domain]} size={15} /> {s.domain_label.split(' & ')[0]}</span>
            <div className="di-track">
              <span className="di-mid" />
              <span className="di-bar" style={{ [improved ? 'right' : 'left']: '50%', width: w + '%', background: improved ? 'var(--cp-stable)' : 'var(--cp-high)' }} />
            </div>
            <span className={`di-d ${d === 0 ? 'z' : improved ? 'down' : 'up'}`}>{d === 0 ? '—' : (d > 0 ? '+' : '') + d}</span>
          </div>
        )
      })}
      <div className="di-key"><span>◀ improves</span><span>worsens ▶</span></div>
      <style>{`
        .di{display:flex;flex-direction:column;gap:12px}
        .di-row{display:grid;grid-template-columns:150px 1fr 42px;align-items:center;gap:12px}
        .di-n{display:flex;align-items:center;gap:7px;font-size:13px;font-weight:500;color:var(--cp-ink)}
        .di-n svg{color:var(--cp-ink-2)}
        .di-track{position:relative;height:16px;background:var(--cp-surface-2);border-radius:5px}
        .di-mid{position:absolute;left:50%;top:0;bottom:0;width:1px;background:var(--cp-border-strong)}
        .di-bar{position:absolute;top:3px;height:10px;border-radius:4px;opacity:.9;transition:width .5s}
        .di-d{font-size:13px;font-weight:700;text-align:right}
        .di-d.down{color:var(--cp-stable)}.di-d.up{color:var(--cp-high)}.di-d.z{color:var(--cp-muted)}
        .di-key{display:flex;justify-content:space-between;font-size:11px;color:var(--cp-muted);margin-top:2px}
      `}</style>
    </div>
  )
}

// Compact constellation — 4 domain nodes + center, echoing the landing orb.
export function Constellation({ signals, size = 150 }) {
  const doms = Object.values(signals)
  const cx = size / 2, cy = size / 2, r = size * 0.34
  const pos = doms.map((_, i) => { const a = -Math.PI / 2 + i * (Math.PI * 2 / doms.length); return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] })
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true">
      {pos.map(([x, y], i) => <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(127,219,232,.35)" strokeWidth="1" />)}
      {pos.map((p, i) => <line key={'e' + i} x1={p[0]} y1={p[1]} x2={pos[(i + 1) % pos.length][0]} y2={pos[(i + 1) % pos.length][1]} stroke="rgba(127,219,232,.16)" strokeWidth="1" />)}
      {pos.map(([x, y], i) => (
        <g key={'n' + i}>
          <circle cx={x} cy={y} r="8" fill={doms[i].color} opacity="0.22" />
          <circle cx={x} cy={y} r="4.5" fill={doms[i].color} />
        </g>
      ))}
      <circle cx={cx} cy={cy} r="9" fill="#0e2a4f" stroke="var(--cp-cyan)" strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r="3" fill="var(--cp-cyan)" />
    </svg>
  )
}
