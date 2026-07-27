// CityPulse AI — ScenarioPulse: the connected-domain comparison at the heart of
// City Intelligence. Ghost outlines = current city; solid nodes = the scenario
// the real models just computed. Node size/colour and the core index animate
// (morph) whenever a scenario re-runs; spokes light up for the domains that moved.
// Values are real model output (reading vs baseline_reading).
const POS = { governance: [180, 44], mobility: [312, 158], waste: [180, 272], energy: [48, 158] }
const CENTER = [180, 158]
const rOf = (p) => 9 + (Math.max(0, Math.min(100, p)) / 100) * 7

export default function ScenarioPulse({ baseSignals, scenSignals, baseOverall, scenOverall, size = 360 }) {
  const [cx, cy] = CENTER
  const ring = 2 * Math.PI * 64
  const arc = Math.max(0, Math.min(1, scenOverall / 100))
  const baseArc = Math.max(0, Math.min(1, baseOverall / 100))
  const doms = Object.keys(POS).filter((k) => scenSignals[k])
  const dOverall = Math.round(scenOverall - baseOverall)
  const deltas = Object.fromEntries(doms.map((k) => [k,
    Math.round(scenSignals[k].pressure - (baseSignals?.[k]?.pressure ?? scenSignals[k].pressure))]))
  const maxAbs = Math.max(...doms.map((k) => Math.abs(deltas[k])))
  const largest = maxAbs >= 1 ? doms.find((k) => Math.abs(deltas[k]) === maxAbs) : null

  return (
    <svg viewBox="0 0 360 316" width="100%" style={{ maxWidth: size, display: 'block', margin: '0 auto' }}
      className="scenpulse" role="img" aria-label={`Scenario pressure ${Math.round(scenOverall)} versus current ${Math.round(baseOverall)}`}>
      <defs>
        <radialGradient id="sp-core" cx="50%" cy="46%" r="60%">
          <stop offset="0" stopColor="#3fd0e6" stopOpacity=".45" /><stop offset=".55" stopColor="#159bb3" stopOpacity=".12" /><stop offset="1" stopColor="#159bb3" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* connective web */}
      {doms.map((a, i) => doms.slice(i + 1).map((b) => (
        <line key={a + b} x1={POS[a][0]} y1={POS[a][1]} x2={POS[b][0]} y2={POS[b][1]} stroke="rgba(127,219,232,.09)" strokeWidth="1" />
      )))}

      {/* spokes — lit for movers */}
      {doms.map((k) => {
        const [x, y] = POS[k]; const d = Math.round((scenSignals[k].pressure) - (baseSignals?.[k]?.pressure ?? scenSignals[k].pressure))
        const lit = Math.abs(d) >= 1; const col = d > 0 ? '#e6a06a' : '#7fdbb0'
        return <line key={'s' + k} x1={cx} y1={cy} x2={x} y2={y} stroke={lit ? col : 'rgba(127,219,232,.16)'}
          strokeWidth={lit ? 2 : 1} opacity={lit ? .85 : .5} style={{ transition: 'stroke .4s,opacity .4s' }} />
      })}

      {/* baseline ghost ring for the core */}
      <circle cx={cx} cy={cy} r="72" fill="none" stroke="rgba(127,219,232,.16)" strokeWidth="1.5" strokeDasharray="3 4"
        strokeDashoffset={ring * (1 - baseArc)} />

      {/* core */}
      <circle cx={cx} cy={cy} r="70" fill="url(#sp-core)" />
      <circle cx={cx} cy={cy} r="64" fill="none" stroke="rgba(255,255,255,.10)" strokeWidth="8" />
      <circle cx={cx} cy={cy} r="64" fill="none" stroke="#3fd0e6" strokeWidth="8" strokeLinecap="round"
        strokeDasharray={`${ring * arc} ${ring}`} transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dasharray .8s cubic-bezier(.2,.8,.2,1)' }} />
      <circle cx={cx} cy={cy} r="50" fill="#0c2547" stroke="rgba(127,219,232,.35)" strokeWidth="1" />
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="36" fontWeight="800" fill="#fff" fontFamily="IBM Plex Sans">{Math.round(scenOverall)}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="9.5" letterSpacing="1.4" fill="#7fdbe8" fontFamily="IBM Plex Sans">SCENARIO</text>
      {dOverall !== 0 && (
        <text x={cx} y={cy + 29} textAnchor="middle" fontSize="11" fontWeight="800" fontFamily="IBM Plex Sans"
          fill={dOverall > 0 ? '#e6a06a' : '#7fdbb0'}>{dOverall > 0 ? '▲' : '▼'} {Math.abs(dOverall)} vs now</text>
      )}

      {/* nodes: ghost baseline + solid scenario + delta; halo scales with the
          magnitude of change so the biggest mover reads instantly */}
      {doms.map((k) => {
        const [x, y] = POS[k]; const s = scenSignals[k]; const b = baseSignals?.[k]
        const rB = rOf(b?.pressure ?? s.pressure), rS = rOf(s.pressure)
        const d = deltas[k]
        const below = y > cy
        const halo = Math.abs(d) >= 1 ? rS + 5 + Math.min(10, Math.abs(d) * 0.5) : 0
        const dCol = d > 0 ? '#e6a06a' : '#7fdbb0'
        return (
          <g key={k} transform={`translate(${x},${y})`}>
            {halo > 0 && <circle r={halo} fill={dCol} opacity=".13" style={{ transition: 'r .6s' }} />}
            <circle r={rB} fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="1.4" strokeDasharray="3 3" />
            <circle r={rS + 4} fill={s.color} opacity=".2" style={{ transition: 'r .6s' }} />
            <circle r={rS} fill={s.color} stroke="#0b2038" strokeWidth="2" style={{ transition: 'r .6s cubic-bezier(.2,.8,.2,1),fill .4s' }} />
            <g transform={`translate(0,${below ? rS + 20 : -(rS + 12)})`}>
              <text textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff" fontFamily="IBM Plex Sans">{s.domain_label.split(' & ')[0]}</text>
              {d !== 0 && <text y="13" textAnchor="middle" fontSize="10.5" fontWeight="800" fontFamily="IBM Plex Sans"
                fill={dCol}>{d > 0 ? '+' : ''}{d}</text>}
            </g>
            {k === largest && (
              <g transform={`translate(0,${below ? rS + 48 : -(rS + 34)})`}>
                <rect x="-42" y="-9" width="84" height="16" rx="8" fill="rgba(63,208,230,.15)" stroke="rgba(63,208,230,.5)" strokeWidth="1" />
                <text y="3" textAnchor="middle" fontSize="8.5" fontWeight="800" letterSpacing="1" fill="#7fdbe8" fontFamily="IBM Plex Sans">LARGEST EFFECT</text>
              </g>
            )}
          </g>
        )
      })}
    </svg>
  )
}
