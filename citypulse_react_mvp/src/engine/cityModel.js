// CityPulse AI — demo city model (React MVP, NO backend).
//
// This mirrors the *shape* and behaviour of the Streamlit app's shared model
// adapter, but produces realistic DEMO outputs with plain heuristics instead of
// running the real joblib models (which need Python). The public surface is a
// single async `readCity(profile)` returning one unified reading — exactly the
// contract a real integration would keep.
//
// ── Wiring in the real models later ───────────────────────────────────────
// Replace the body of `readCity` with, e.g.:
//     const res = await fetch(`${API}/city`, { method:'POST',
//                    body: JSON.stringify(profile) });
//     return await res.json();
// The four ML models (transportation / energy / public services / waste) would
// live behind that endpoint and return the same {systems, health, ...} shape.

export const SYSTEMS = ['mobility', 'energy', 'services', 'waste']

export const SYSTEM_META = {
  mobility: { label: 'Mobility', icon: '🚦', model: 'Transportation' },
  energy: { label: 'Energy', icon: '⚡', model: 'Energy' },
  services: { label: 'Public Services', icon: '🏛️', model: 'Public Services' },
  waste: { label: 'Waste', icon: '♻️', model: 'Waste Management' },
}

const clamp = (v, lo = 3, hi = 99) => Math.max(lo, Math.min(hi, v))

const STATUS_BANDS = [
  [0, 34, 'Calm', '#22c55e'],
  [34, 55, 'Steady', '#84cc16'],
  [55, 72, 'Strained', '#f59e0b'],
  [72, 86, 'Under pressure', '#f97316'],
  [86, 101, 'Critical', '#ef4444'],
]

export function statusFor(p) {
  const v = clamp(p, 0, 100)
  for (const [lo, hi, label, color] of STATUS_BANDS)
    if (v >= lo && v < hi) return { label, color }
  return { label: 'Critical', color: '#ef4444' }
}

export function healthColor(health) {
  if (health >= 70) return '#22c55e'
  if (health >= 55) return '#84cc16'
  if (health >= 42) return '#f59e0b'
  if (health >= 28) return '#f97316'
  return '#ef4444'
}

const densityFactor = (d) => ({ Compact: 1.15, Balanced: 1.0, 'Spread out': 0.85 }[d] ?? 1)
const budgetFactor = (b) => ({ Tight: 0.8, Moderate: 1.0, Strong: 1.2 }[b] ?? 1)
const seasonTemp = (s) => ({ Spring: 14, Summer: 26, Autumn: 13, Winter: 4 }[s] ?? 18)

// ── the four "models" as demo signals (each returns 0-100 pressure) ────────
function energyPressure(p) {
  const temp = seasonTemp(p.season) + (p.heat ?? 0) * 6
  const sizeF = Math.pow(p.population / 250000, 0.6)
  const raw = (28 + 2.3 * Math.abs(temp - 18)) * sizeF * (p.demand ?? 1)
  // reference band ~ [40, 150] -> 22..82
  return clamp(22 + ((raw - 40) / 110) * 60)
}

function wastePressure(p) {
  const sizeF = Math.pow(p.population / 250000, 0.6)
  const recycling = 1 - 0.12 * (p.actions?.includes('recycling') ? 1 : 0) - 0.05 * ((p.green - 35) / 100)
  const raw = 2500 * (p.demand ?? 1) * sizeF * Math.max(0.6, recycling)
  return clamp(22 + ((raw - 1600) / 3400) * 60)
}

function servicesPressure(p) {
  const load = (p.service ?? 1) * (p.demand ?? 1) / budgetFactor(p.budget)
  // model delay-risk roughly 0.30..0.75 over load 0.5..2.6
  const raw = 0.30 + 0.22 * clamp((load - 0.6) / 1.6, 0, 1) + 0.05 * (load > 1.4 ? 1 : 0)
  return clamp(22 + ((raw - 0.34) / 0.34) * 60)
}

function mobilityPressure(p) {
  const heat = (p.heat ?? 0) && p.season === 'Summer' ? p.heat : 0
  let ti = (p.traffic ?? 1) * densityFactor(p.density) * (p.demand ?? 1)
  ti *= 1 - 0.35 * (p.transit / 100)
  const exposure = ti * Math.pow(p.population / 250000, 0.3)
  // heat sharply raises collision risk (mirrors the London hurdle model)
  const raw = exposure * (1 + 1.9 * heat)
  return clamp(22 + ((raw - 0.35) / 3.6) * 60)
}

function detailFor(system, p) {
  const heat = (p.heat ?? 0) > 0.3 && p.season === 'Summer'
  switch (system) {
    case 'energy':
      if (heat || p.season === 'Summer') return 'Cooling demand is high as temperatures climb.'
      if (p.season === 'Winter') return 'Heating load rises across buildings in the cold.'
      return 'Building energy demand is moderate this season.'
    case 'waste':
      if ((p.demand ?? 1) > 1.1) return 'More people and activity means more waste to collect.'
      if (p.actions?.includes('recycling')) return 'Recycling upgrades are easing the collection load.'
      return 'Waste generation is tracking population steadily.'
    case 'services':
      if (p.budget === 'Tight') return 'Tight budgets slow how fast requests get resolved.'
      if ((p.service ?? 1) > 1.1) return 'A surge in requests is stretching response times.'
      return 'Requests are being resolved close to target times.'
    case 'mobility':
      if (heat) return 'Extreme heat is pushing collision and congestion risk up.'
      if (p.transit < 35) return 'Low transit coverage keeps traffic and risk high.'
      if ((p.traffic ?? 1) > 1.2) return 'Heavy traffic raises congestion and collision risk.'
      return 'Traffic conditions are steady across the network.'
    default:
      return ''
  }
}

const PRESSURE_FN = {
  energy: energyPressure,
  waste: wastePressure,
  services: servicesPressure,
  mobility: mobilityPressure,
}

// ── the single public method ───────────────────────────────────────────────
export async function readCity(profile) {
  // (demo) synchronous compute wrapped in a promise so callers already await —
  // swap the body for a real fetch() when the models are hosted.
  const systems = {}
  for (const s of SYSTEMS) {
    const pressure = PRESSURE_FN[s](profile)
    const { label: status, color } = statusFor(pressure)
    systems[s] = {
      system: s,
      ...SYSTEM_META[s],
      pressure,
      status,
      color,
      live: false, // demo outputs
      detail: detailFor(s, profile),
    }
  }
  const vals = SYSTEMS.map((s) => systems[s].pressure)
  const overall = 0.6 * Math.max(...vals) + 0.4 * (vals.reduce((a, b) => a + b, 0) / vals.length)
  const health = Math.round(100 - overall)
  const priority = SYSTEMS.reduce((a, b) => (systems[a].pressure >= systems[b].pressure ? a : b))
  const sorted = [...SYSTEMS].sort((a, b) => systems[b].pressure - systems[a].pressure)
  return { systems, sorted, overall, health, priority, profile }
}
