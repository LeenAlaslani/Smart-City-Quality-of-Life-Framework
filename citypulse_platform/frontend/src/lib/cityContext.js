// CityPulse AI — city context layer. The selected city (from the real profile)
// controls greeting, applicable decisions, scenario labels, goals and framing.
// No invented data: everything derives from the profile the user set at
// onboarding plus the backend's decision catalogue.

export const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export const cityName = (profile) =>
  profile?.city ? profile.city === 'neom' ? 'NEOM' : profile.city[0].toUpperCase() + profile.city.slice(1) : 'your city'

// ── Decision applicability & city-specific labels ──────────────────────────
// Rules are conservative and explainable: a decision is hidden only when it is
// clearly city-specific (e.g. Riyadh Season outside Riyadh); labels adapt where
// the same underlying scenario has a natural local name.
const HIDE = {
  riyadh_season: (p) => p.city !== 'riyadh',            // Riyadh-only event
  metro_line: (p) => p.population_range === 'lt_250k',  // no metro case in small towns
}
// Clear operational government language for every decision (overrides the
// backend's shorter titles). City-specific overrides layer on top.
export const DECISION_OP_LABEL = {
  metro_line: 'Open a new metro line',
  riyadh_season: 'Prepare city services for a major event season',
  prioritise_district: 'Prioritise a high-demand district',
  visitor_surge: 'Plan for a visitor / pilgrimage surge',
  waste_capacity: 'Increase waste-collection capacity',
  energy_demand: 'Add capacity for higher energy demand',
  staffing: 'Increase service-desk staffing for peak hours',
  new_development: 'Plan a new development phase',
}
const RELABEL = {
  visitor_surge: (p) => (p.city === 'makkah' || p.city === 'madinah')
    ? { title: 'Prepare for pilgrimage season', category: 'Pilgrimage' } : null,
  new_development: (p) => p.city === 'neom'
    ? { title: 'Plan the next development phase', category: 'New city' } : null,
  metro_line: (p) => p.city === 'neom'
    ? { title: 'Plan the transit spine', category: 'Mobility' } : null,
}

export function cityDecisions(profile, decisions) {
  return (decisions || [])
    .filter((d) => d.id !== 'baseline')
    .filter((d) => !(HIDE[d.id] && HIDE[d.id](profile)))
    .map((d) => {
      const op = DECISION_OP_LABEL[d.id] ? { title: DECISION_OP_LABEL[d.id] } : null
      const patch = RELABEL[d.id] && RELABEL[d.id](profile)
      return { ...d, ...op, ...patch }
    })
}

// ── City goals from the real onboarding profile ────────────────────────────
const PRIORITY_LABEL = {
  mobility: 'Improve mobility', sustainability: 'Sustainability & efficiency',
  digital_gov: 'Digital government services', quality_of_life: 'Quality of life',
  resource_mgmt: 'Resource management',
}
const CHALLENGE_LABEL = {
  congestion: 'Traffic congestion', peak_energy: 'Peak energy demand',
  service_backlog: 'Service request backlog', waste_capacity: 'Waste collection capacity',
  seasonal_surge: 'Seasonal population surge', sustainability: 'Sustainability targets',
}
const humanise = (id) => id ? id.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase()) : id
export const cityGoals = (profile) => (profile?.priorities || []).map((p) => PRIORITY_LABEL[p] || humanise(p))
export const cityChallenges = (profile) => (profile?.challenges || []).map((c) => CHALLENGE_LABEL[c] || humanise(c))

// Map a goal/challenge id to the domain it most concerns (for the guided flow).
export const GOAL_DOMAIN = {
  mobility: 'mobility', congestion: 'mobility', seasonal_surge: 'mobility',
  sustainability: 'energy', peak_energy: 'energy',
  digital_gov: 'governance', service_backlog: 'governance', quality_of_life: 'governance',
  resource_mgmt: 'waste', waste_capacity: 'waste',
}
// Which decision categories serve each domain (used to suggest decisions).
export const DOMAIN_CATEGORIES = {
  mobility: ['Mobility', 'Major event', 'Demand', 'Districts', 'Pilgrimage', 'New city'],
  energy: ['Energy', 'New city'],
  governance: ['Services', 'Districts', 'Major event', 'Pilgrimage'],
  waste: ['Environment', 'Demand'],
}

// ── Concrete model outcomes (real raw values, formatted honestly) ──────────
export const OUTCOME_LABEL = {
  governance: 'Service-delay risk', mobility: 'Road-safety risk',
  energy: 'Energy demand', waste: 'Waste load',
}
export function fmtOutcome(sig) {
  if (!sig || sig.raw == null) return '—'
  const r = sig.raw
  switch (sig.domain) {
    case 'governance': return `${Math.round(r * 100)}% delayed-resolution risk`
    case 'mobility': return `${r.toFixed(1)} expected collisions`
    case 'energy': return `${r.toFixed(1)} kWh / building·hr`
    case 'waste': return r >= 1000 ? `${(r / 1000).toFixed(1)}k tons / month` : `${r.toFixed(0)} tons / month`
    default: return `${r} ${sig.raw_unit || ''}`
  }
}
export function fmtOutcomeShort(sig) {
  if (!sig || sig.raw == null) return '—'
  const r = sig.raw
  switch (sig.domain) {
    case 'governance': return `${Math.round(r * 100)}%`
    case 'mobility': return r.toFixed(1)
    case 'energy': return r.toFixed(1)
    case 'waste': return r >= 1000 ? `${(r / 1000).toFixed(1)}k` : r.toFixed(0)
    default: return String(r)
  }
}
export const OUTCOME_UNIT = {
  governance: 'delay risk', mobility: 'expected collisions', energy: 'kWh/bldg·hr', waste: 'tons/mo',
}

// Documented meaning of the composite index (matches backend integration.py).
export const INDEX_DOC =
  'Diagnostic index 0–100: each model output is normalised against the city-profile baseline; the composite is 0.6 × worst domain + 0.4 × average of all four. It ranks pressure — it is not a validated forecast.'

// One shared honesty line for executive pages (details live in Evidence).
export const PROTOTYPE_NOTE =
  'Prototype models trained on international open data — not yet validated with Saudi municipal datasets. See Model & Data Evidence.'
