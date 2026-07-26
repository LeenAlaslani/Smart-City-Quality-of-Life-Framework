// CityPulse AI — scenarios & actions (React MVP). Mirrors the Streamlit logic.

export const DENSITY_LEVELS = ['Compact', 'Balanced', 'Spread out']
export const BUDGET_LEVELS = ['Tight', 'Moderate', 'Strong']
export const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter']

export const defaultProfile = () => ({
  name: 'New Haven',
  population: 250000,
  density: 'Balanced',
  green: 35,
  transit: 45,
  budget: 'Moderate',
  season: 'Summer',
  demand: 1.0,
  traffic: 1.0,
  service: 1.0,
  heat: 0.0,
  actions: [],
})

export const SCENARIOS = [
  {
    key: 'boom', title: 'Population Boom', icon: '📈',
    tagline: '40% more residents arrive over three years.',
    apply: (b) => ({ ...b, population: Math.round(b.population * 1.4), demand: b.demand * 1.18, traffic: b.traffic * 1.25, service: b.service * 1.3 }),
  },
  {
    key: 'heatwave', title: 'Heat Wave', icon: '🔥',
    tagline: 'A record summer pushes cooling and tempers to the limit.',
    apply: (b) => ({ ...b, season: 'Summer', heat: b.heat + 0.6, demand: b.demand * 1.12, traffic: b.traffic * 1.1, service: b.service * 1.15 }),
  },
  {
    key: 'budget', title: 'Budget Squeeze', icon: '✂️',
    tagline: 'Funding is cut — every service must do more with less.',
    apply: (b) => ({ ...b, budget: 'Tight', service: b.service * 1.2, demand: b.demand * 1.05 }),
  },
  {
    key: 'festival', title: 'Big Event Weekend', icon: '🎉',
    tagline: 'A festival brings a surge of visitors and demand downtown.',
    apply: (b) => ({ ...b, population: Math.round(b.population * 1.05), demand: b.demand * 1.25, traffic: b.traffic * 1.5, service: b.service * 1.4 }),
  },
]

export const ACTIONS = [
  {
    key: 'transit', title: 'Expand transit lines', icon: '🚈',
    blurb: 'More buses and rail take cars off the road.', helps: ['mobility'],
    apply: (p) => ({ ...p, transit: Math.min(100, p.transit + 20), traffic: p.traffic * 0.82, actions: addAction(p, 'transit') }),
  },
  {
    key: 'smart_signals', title: 'Smart traffic signals', icon: '🚥',
    blurb: 'Adaptive signals smooth flow and cut congestion.', helps: ['mobility', 'energy'],
    apply: (p) => ({ ...p, traffic: p.traffic * 0.9, demand: p.demand * 0.98, actions: addAction(p, 'smart_signals') }),
  },
  {
    key: 'staffing', title: 'Add service capacity', icon: '👷',
    blurb: 'Extra staff clears requests before they pile up.', helps: ['services'],
    apply: (p) => ({ ...p, service: p.service * 0.82, actions: addAction(p, 'staffing') }),
  },
  {
    key: 'recycling', title: 'Boost recycling & routes', icon: '♻️',
    blurb: 'Better routes and recycling ease the waste load.', helps: ['waste'],
    apply: (p) => ({ ...p, green: Math.min(100, p.green + 8), actions: addAction(p, 'recycling') }),
  },
  {
    key: 'retrofit', title: 'Retrofit buildings', icon: '🏢',
    blurb: 'Efficient, greener buildings cut energy strain.', helps: ['energy'],
    apply: (p) => ({ ...p, heat: p.heat * 0.6, green: Math.min(100, p.green + 6), actions: addAction(p, 'retrofit') }),
  },
]

function addAction(p, key) {
  return p.actions?.includes(key) ? p.actions : [...(p.actions ?? []), key]
}

export const scenarioByKey = (k) => SCENARIOS.find((s) => s.key === k)
export const actionByKey = (k) => ACTIONS.find((a) => a.key === k)

export function recommendedActionsFor(system) {
  const scored = ACTIONS.filter((a) => a.helps.includes(system)).map((a) => ({
    primary: a.helps[0] === system ? 0 : 1, key: a.key,
  }))
  scored.sort((x, y) => x.primary - y.primary || x.key.localeCompare(y.key))
  const out = scored.map((s) => s.key)
  return out.length ? out : ACTIONS.slice(0, 2).map((a) => a.key)
}
