// CityPulse AI — small shared UI bits (health ring, cards, guide, chips).
import { healthColor } from '../engine/cityModel'

// render **bold** inside plain strings
export function Rich({ text }) {
  const parts = String(text || '').split(/(\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**') ? <b key={i}>{p.slice(2, -2)}</b> : <span key={i}>{p}</span>
      )}
    </>
  )
}

export function Guide({ text }) {
  return (
    <div className="guide fade">
      <div className="av">🛰️</div>
      <div>
        <div className="who">CityPulse Guide</div>
        <div className="txt"><Rich text={text} /></div>
      </div>
    </div>
  )
}

export function HealthRing({ health, label = 'Quality of Life', size = 150 }) {
  const color = healthColor(health)
  const r = 52, circ = 2 * Math.PI * r, dash = (circ * health) / 100
  return (
    <div className="center">
      <svg viewBox="0 0 130 130" width={size} height={size}>
        <circle cx="65" cy="65" r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="12" />
        <circle cx="65" cy="65" r={r} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`} transform="rotate(-90 65 65)">
          <animate attributeName="stroke-dasharray" from={`0 ${circ}`} to={`${dash} ${circ}`} dur="0.9s" fill="freeze" />
        </circle>
        <text x="65" y="61" textAnchor="middle" fontSize="30" fontWeight="800" fill={color}>{health}</text>
        <text x="65" y="82" textAnchor="middle" fontSize="10" fill="#9fb6d4">/ 100</text>
      </svg>
      <div style={{ color: '#9fb6d4', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: '0.68rem', marginTop: '-0.5rem' }}>{label}</div>
    </div>
  )
}

export function SystemCards({ reading }) {
  return (
    <div className="cards">
      {reading.sorted.map((k) => {
        const s = reading.systems[k]
        return (
          <div className="syscard fade" key={k}>
            <div className="glow" style={{ background: s.color }} />
            <div className="ico">{s.icon}</div>
            <div className="nm">{s.label}</div>
            <div className="st" style={{ color: s.color }}>{s.status}</div>
            <div className="bar"><i style={{ width: `${Math.max(4, Math.min(100, s.pressure))}%`, background: s.color }} /></div>
          </div>
        )
      })}
    </div>
  )
}

export function Chip({ before, after }) {
  const d = after - before
  if (Math.abs(d) < 1.5) return <span className="chip flat">no change</span>
  const good = d < 0
  return <span className={`chip ${good ? 'down' : 'up'}`}>{d < 0 ? '▼' : '▲'} {Math.abs(Math.round(d))}</span>
}

export function CompareRows({ before, after }) {
  return (
    <div style={{ margin: '0.5rem 0' }}>
      {after.sorted.map((k) => {
        const s = after.systems[k], b = before.systems[k]
        return (
          <div className="cmp" key={k}>
            <span className="lab">{s.icon} {s.label}</span>
            <span className="track"><i style={{ width: `${Math.max(4, Math.min(100, s.pressure))}%`, background: s.color }} /></span>
            <Chip before={b.pressure} after={s.pressure} />
          </div>
        )
      })}
    </div>
  )
}

export function ThreeQuestions({ diag }) {
  const Q = ({ n, h, children }) => (
    <div className="q fade"><div className="h">{n} {h}</div><div className="b">{children}</div></div>
  )
  return (
    <>
      <Q n="①" h="What is happening"><Rich text={diag.happening} /><br /><span className="mut"><Rich text={diag.detail} /></span></Q>
      <Q n="②" h="Why it matters"><Rich text={diag.why} /></Q>
      <Q n="③" h="What to do next"><Rich text={diag.doNext} /><br /><span className="mut"><Rich text={diag.connection} /></span></Q>
    </>
  )
}
