// CityPulse AI — professional line-icon set (inline SVG, currentColor).
// Stroke-based, 24x24, consistent weight — no emoji in the government UI.
const P = {
  overview: 'M4 5h7v6H4zM13 5h7v4h-7zM13 12h7v7h-7zM4 14h7v5H4z',
  intelligence: 'M12 3a9 9 0 1 0 9 9M12 3v9l6 3M12 3a9 9 0 0 1 9 9',
  scenarios: 'M4 7h10M18 7h2M4 12h4M12 12h8M4 17h12M18 17h2 M14 5v4 M8 10v4 M16 15v4',
  roadmap: 'M6 20V6a2 2 0 0 1 2-2h5l-2 3 2 3H8M6 20h12',
  actions: 'M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2',
  evidence: 'M12 4c-4 0-7 1-7 3s3 3 7 3 7-1 7-3-3-3-7-3zM5 7v10c0 2 3 3 7 3s7-1 7-3V7',
  mobility: 'M6 16V8a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v8M6 16h13M6 16v2M19 16v2M8 12h9M8.5 19.5h.01M16.5 19.5h.01',
  energy: 'M13 3 4 14h7l-1 7 9-11h-7z',
  governance: 'M4 9h16M5 9l7-5 7 5M6 9v8M10 9v8M14 9v8M18 9v8M4 20h16',
  waste: 'M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M10 11v5M14 11v5',
  transit: 'M7 4h10a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM5 11h14M9 20l-2 2M15 20l2 2M9 14h.01M15 14h.01',
  event: 'M6 4v3M18 4v3M4 9h16M5 7h14a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zM12 12l1 2 2 .3-1.5 1.5.4 2-1.9-1-1.9 1 .4-2L9 14.3l2-.3z',
  district: 'M9 5 4 7v12l5-2 6 2 5-2V5l-5 2zM9 5v12M15 7v12',
  visitors: 'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20a5 5 0 0 1 10 0M16 11a3 3 0 1 0 0-6M14 20a5 5 0 0 1 7-2',
  staffing: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM3 21a6 6 0 0 1 12 0M18 8v6M15 11h6',
  development: 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5M9 10h.01M15 10h.01M9 13h.01M15 13h.01',
  pulse: 'M3 12h4l2-6 4 12 2-6h6',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  alert: 'M12 3 2 20h20L12 3zM12 9v5M12 17h.01',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01',
  check: 'M5 12l5 5 9-11',
  plus: 'M12 5v14M5 12h14',
  pin: 'M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  up: 'M6 15l6-6 6 6',
  down: 'M6 9l6 6 6-6',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  layers: 'M12 3 3 8l9 5 9-5-9-5zM3 13l9 5 9-5M3 18l9 5 9-5',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01',
}

export default function Icon({ name, size = 20, strokeWidth = 1.75, className = '', style }) {
  const d = P[name] || P.info
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round"
      strokeLinejoin="round" className={className} style={style} aria-hidden="true">
      {d.split('M').filter(Boolean).map((seg, i) => <path key={i} d={'M' + seg} />)}
    </svg>
  )
}

export const DOMAIN_ICON = { mobility: 'mobility', energy: 'energy', governance: 'governance', waste: 'waste' }
