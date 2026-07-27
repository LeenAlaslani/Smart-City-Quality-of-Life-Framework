// CityPulse AI — the signature interactive "City Pulse": the four connected
// domains as nodes around a living core that reads overall operational pressure.
// This is the dominant visual of City Overview and the motif carried from the
// Orb landing. Hovering a node lifts it and emits the domain for a live readout;
// clicking selects it. All values are real model output. Respects reduced-motion.
import { useState } from 'react'

// Stable domain positions (diamond) so the layout is recognisable run-to-run.
const POS = {
  governance: [180, 44], mobility: [312, 158], waste: [180, 272], energy: [48, 158],
}
const CENTER = [180, 158]

export default function CityPulse({ signals, overall, priority, onHover, onSelect, size = 340,
  centerValue, centerLabel = 'PRESSURE', centerSub }) {
  const [hover, setHover] = useState(null)
  const doms = Object.values(signals)
  const R = 130
  const ring = 2 * Math.PI * 64
  const arc = Math.max(0, Math.min(1, overall / 100))

  const emit = (d) => { setHover(d); onHover && onHover(d) }
  const [cx, cy] = CENTER

  return (
    <svg viewBox={`0 0 360 316`} width="100%" style={{ maxWidth: size, display: 'block', margin: '0 auto' }}
      className="citypulse" role="img" aria-label={`City pressure index ${Math.round(overall)} of 100`}>
      <defs>
        <radialGradient id="cp-core" cx="50%" cy="46%" r="60%">
          <stop offset="0" stopColor="#3fd0e6" stopOpacity=".5" />
          <stop offset=".5" stopColor="#159bb3" stopOpacity=".14" />
          <stop offset="1" stopColor="#159bb3" stopOpacity="0" />
        </radialGradient>
        <filter id="cp-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* faint domain-to-domain web */}
      {doms.map((a, i) => doms.slice(i + 1).map((b) => (
        <line key={a.domain + b.domain} x1={POS[a.domain][0]} y1={POS[a.domain][1]} x2={POS[b.domain][0]} y2={POS[b.domain][1]}
          stroke="rgba(127,219,232,.10)" strokeWidth="1" />
      )))}

      {/* spokes core→node (highlight the hovered one) */}
      {doms.map((d) => {
        const [x, y] = POS[d.domain]; const active = hover === d.domain || (!hover && priority && d.domain === priority.domain)
        return <line key={'s' + d.domain} x1={cx} y1={cy} x2={x} y2={y}
          stroke={active ? d.color : 'rgba(127,219,232,.18)'} strokeWidth={active ? 2 : 1}
          style={{ transition: 'stroke .2s' }} opacity={active ? .9 : .6} />
      })}

      {/* rotating accent ring */}
      <g className="cp-rot" style={{ transformOrigin: `${cx}px ${cy}px` }}>
        <circle cx={cx} cy={cy} r="86" fill="none" stroke="rgba(127,219,232,.12)" strokeDasharray="2 8" strokeWidth="1.5" />
      </g>

      {/* core */}
      <circle cx={cx} cy={cy} r="70" fill="url(#cp-core)" className="cp-breathe" style={{ transformOrigin: `${cx}px ${cy}px` }} />
      <circle cx={cx} cy={cy} r="64" fill="none" stroke="rgba(255,255,255,.10)" strokeWidth="8" />
      <circle cx={cx} cy={cy} r="64" fill="none" stroke="#3fd0e6" strokeWidth="8" strokeLinecap="round"
        strokeDasharray={`${ring * arc} ${ring}`} transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dasharray .9s cubic-bezier(.2,.8,.2,1)' }} />
      <circle cx={cx} cy={cy} r="50" fill="#0c2547" stroke="rgba(127,219,232,.35)" strokeWidth="1" />
      <text x={cx} y={cy - (centerSub ? 8 : 2)} textAnchor="middle" fontSize="38" fontWeight="800" fill="#fff" fontFamily="IBM Plex Sans">{centerValue != null ? centerValue : Math.round(overall)}</text>
      <text x={cx} y={cy + (centerSub ? 10 : 18)} textAnchor="middle" fontSize="10" letterSpacing="1.5" fill="#7fdbe8" fontFamily="IBM Plex Sans">{centerLabel}</text>
      {centerSub && <text x={cx} y={cy + 26} textAnchor="middle" fontSize="9" letterSpacing="1" fill="rgba(169,192,221,.9)" fontFamily="IBM Plex Sans">{centerSub}</text>}

      {/* nodes */}
      {doms.map((d) => {
        const [x, y] = POS[d.domain]
        const isPri = priority && d.domain === priority.domain
        const isHot = hover === d.domain
        const base = 9 + (d.pressure / 100) * 7
        const r = isHot ? base + 3 : base
        return (
          <g key={d.domain} transform={`translate(${x},${y})`} style={{ cursor: 'pointer' }}
            tabIndex={0} role="button" aria-label={`${d.domain_label}: ${d.status}`}
            onMouseEnter={() => emit(d.domain)} onMouseLeave={() => emit(null)}
            onFocus={() => emit(d.domain)} onBlur={() => emit(null)}
            onClick={() => onSelect && onSelect(d.domain)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect && onSelect(d.domain)}>
            {(isPri || isHot) && <circle r={r + 9} fill={d.color} opacity=".16" className={isPri ? 'cp-ping' : ''} />}
            <circle r={r + 4} fill={d.color} opacity=".22" />
            <circle r={r} fill={d.color} stroke="#0b2038" strokeWidth="2" filter={isHot ? 'url(#cp-glow)' : undefined}
              style={{ transition: 'r .18s' }} />
            {/* label chip appears on hover / priority */}
            <g opacity={isHot || isPri ? 1 : 0} style={{ transition: 'opacity .18s' }} transform={`translate(0,${y > cy ? r + 22 : -(r + 14)})`}>
              <text textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#fff" fontFamily="IBM Plex Sans">
                {d.domain_label.split(' & ')[0]}
              </text>
              <text y="13" textAnchor="middle" fontSize="10" fontWeight="600" fill={d.color} fontFamily="IBM Plex Sans">{d.status}</text>
            </g>
          </g>
        )
      })}
      <style>{`
        .citypulse text{user-select:none}
        .cp-breathe{animation:cpB 4.5s ease-in-out infinite}
        .cp-rot{animation:cpR 60s linear infinite}
        .cp-ping{animation:cpP 2.6s ease-out infinite}
        @keyframes cpB{0%,100%{opacity:.85;transform:scale(1)}50%{opacity:1;transform:scale(1.05)}}
        @keyframes cpR{to{transform:rotate(360deg)}}
        @keyframes cpP{0%{transform:scale(.9);opacity:.28}70%{opacity:0}100%{transform:scale(1.7);opacity:0}}
        @media(prefers-reduced-motion:reduce){.cp-breathe,.cp-rot,.cp-ping{animation:none}}
      `}</style>
    </svg>
  )
}
