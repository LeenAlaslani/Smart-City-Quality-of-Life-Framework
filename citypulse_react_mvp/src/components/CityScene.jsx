// CityPulse AI — the living city (React SVG). Grows with the profile and glows
// with the reading; echoes the logo's heartbeat pulse line along the ground.
import { SYSTEMS, SYSTEM_META, healthColor } from '../engine/cityModel'

const W = 460, H = 240, GROUND = 176

// deterministic RNG seeded by city name (stable across renders)
function seeded(name) {
  let h = 1779033703 ^ name.length
  for (let i = 0; i < name.length; i++) {
    h = Math.imul(h ^ name.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  let a = h >>> 0
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const skies = {
  Summer: ['#0b2a4a', '#123f63', '#f6b26b'],
  Spring: ['#0a2340', '#123a5c', '#8fd3c7'],
  Autumn: ['#0a1f38', '#123151', '#d98a4e'],
  Winter: ['#0a1d33', '#102a49', '#a9c7e8'],
}

export default function CityScene({ profile, reading, height = 210 }) {
  const rnd = seeded(profile.name || 'city')
  const health = reading ? reading.health : 62
  const glow = healthColor(health)
  const [top, mid, orb] = skies[profile.season] || skies.Summer

  // skyline geometry from the profile
  const n = Math.min(24, Math.max(7, Math.round(7 + profile.population / 60000)))
  const dens = { Compact: 0.9, Balanced: 1.0, 'Spread out': 1.25 }[profile.density] || 1
  const gap = 5 * dens
  const bw = (W - 60 - gap * (n - 1)) / n
  const popH = Math.min(1, profile.population / 900000)

  const buildings = []
  let x = 30
  for (let i = 0; i < n; i++) {
    const bh = 34 + rnd() * 108 * (0.55 + 0.6 * popH)
    const wdt = bw * (0.8 + rnd() * 0.4)
    const y = GROUND - bh
    const wins = []
    const cols = Math.max(1, Math.floor(wdt / 10))
    const rows = Math.max(1, Math.floor(bh / 13))
    for (let c = 0; c < cols; c++)
      for (let r = 0; r < rows; r++)
        if (rnd() < 0.5) {
          const lit = rnd() < 0.5
          wins.push(
            <rect key={`${c}-${r}`} x={x + 4 + c * 10} y={y + 6 + r * 13} width="4" height="5.5" rx="1"
              fill={lit ? '#3ad6e6' : 'rgba(159,182,212,.25)'} opacity={lit ? 0.9 : 0.5}>
              {lit && <animate attributeName="opacity" values="0.9;0.25;0.9" dur={`${2.5 + rnd() * 3}s`} repeatCount="indefinite" />}
            </rect>
          )
        }
    buildings.push(
      <g key={i} className="bld" style={{ animationDelay: `${i * 0.04}s` }}>
        <rect x={x} y={y} width={wdt} height={bh} rx="3" fill="url(#bg)" stroke="rgba(58,214,230,.18)" />
        {wins}
      </g>
    )
    x += wdt + gap
  }

  // greenery
  const trees = []
  const nTrees = Math.round(profile.green / 8)
  for (let i = 0; i < nTrees; i++) {
    const tx = 30 + rnd() * (W - 60), th = 8 + rnd() * 8
    trees.push(
      <g key={i} opacity="0.9">
        <rect x={tx} y={GROUND - th} width="2" height={th} fill="#3b6f4a" />
        <circle cx={tx + 1} cy={GROUND - th} r={5 + th * 0.3} fill="#2f8f5b" opacity="0.85" />
      </g>
    )
  }

  // heartbeat pulse line
  const amp = 6 + (100 - health) * 0.14
  const py = GROUND + 26
  const seg = `M 12 ${py} L 140 ${py} l 9 -4 l 8 ${amp} l 9 -${amp * 1.6} l 8 ${amp * 1.1} l 8 -${amp * 0.4} L 330 ${py} l 9 -4 l 8 ${amp} l 9 -${amp * 1.4} l 8 ${amp * 0.8} L 452 ${py}`

  // system beacons (after models run)
  const beacons = reading
    ? SYSTEMS.map((s, i) => {
        const sr = reading.systems[s]
        const bx = 46 + ((W - 92) * (i + 0.5)) / SYSTEMS.length
        const by = 40 + (i % 2) * 18
        const r = 7 + sr.pressure / 14
        const dur = Math.max(0.7, 2.6 - sr.pressure / 45)
        return (
          <g key={s}>
            <circle cx={bx} cy={by} r={r} fill={sr.color} opacity="0.28" filter="url(#soft)">
              <animate attributeName="r" values={`${r};${r + 5};${r}`} dur={`${dur}s`} repeatCount="indefinite" />
            </circle>
            <circle cx={bx} cy={by} r="5" fill={sr.color} />
            <text x={bx} y={by + 3} textAnchor="middle" fontSize="8">{SYSTEM_META[s].icon}</text>
          </g>
        )
      })
    : null

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={height} style={{ display: 'block', borderRadius: 16 }}>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={top} /><stop offset="70%" stopColor={mid} /><stop offset="100%" stopColor="#0a1c39" />
        </linearGradient>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1c477e" /><stop offset="100%" stopColor="#0e2a4f" />
        </linearGradient>
        <radialGradient id="halo" cx="50%" cy="90%" r="70%">
          <stop offset="0%" stopColor={glow} stopOpacity="0.35" /><stop offset="100%" stopColor={glow} stopOpacity="0" />
        </radialGradient>
        <filter id="soft"><feGaussianBlur stdDeviation="5" /></filter>
      </defs>
      <rect x="0" y="0" width={W} height={H} rx="16" fill="url(#sky)" />
      <circle cx="392" cy="52" r="24" fill={orb} opacity="0.75" filter="url(#soft)" />
      <rect x="0" y="70" width={W} height={H - 70} fill="url(#halo)" />
      <rect x="0" y={GROUND} width={W} height={H - GROUND} fill="#0a1830" />
      <line x1="0" y1={GROUND} x2={W} y2={GROUND} stroke="rgba(58,214,230,.25)" />
      {buildings}
      {trees}
      {beacons}
      <path d={seg} fill="none" stroke={glow} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" filter="url(#soft)" />
      <path d={seg} fill="none" stroke={glow} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="12 300" opacity="0.95">
        <animate attributeName="stroke-dashoffset" from="0" to="-1100" dur="4s" repeatCount="indefinite" />
      </path>
      <style>{`.bld{transform-box:fill-box;transform-origin:bottom;animation:rise .7s cubic-bezier(.2,.8,.2,1) both}@keyframes rise{from{transform:scaleY(0);opacity:0}to{transform:scaleY(1);opacity:1}}`}</style>
    </svg>
  )
}
