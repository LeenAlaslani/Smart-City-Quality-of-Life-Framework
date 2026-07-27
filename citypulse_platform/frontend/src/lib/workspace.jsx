// CityPulse AI — workspace state (actions, roadmap, scenarios). Persisted to
// localStorage so navigating/refreshing never loses project state.
import { createContext, useContext, useEffect, useState } from 'react'

const KEY = 'citypulse.workspace'
const Ctx = createContext(null)

const uid = () => Math.random().toString(36).slice(2, 9)
const now = () => new Date().toISOString()

const seed = () => ({
  actions: [
    { id: uid(), title: 'Review corridor congestion on the eastern ring road', type: 'Decision',
      domain: 'mobility', department: 'Transportation Operations', priority: 'High',
      status: 'To review', due: dplus(5), relatedArea: 'Central District', source: 'Intelligence', createdAt: now() },
    { id: uid(), title: 'Confirm summer peak-load plan with the grid operator', type: 'Task',
      domain: 'energy', department: 'Energy & Sustainability', priority: 'Medium',
      status: 'In progress', due: dplus(12), relatedArea: 'Citywide', source: 'Overview', createdAt: now() },
  ],
  roadmap: [
    { id: uid(), title: 'City mobility readiness programme', objective: 'Cut peak-hour congestion risk',
      department: 'Transportation', horizon: 'near', priority: 'High', status: 'Planned',
      dependency: 'Transit capacity study', next: 'Approve scope', domain: 'mobility' },
    { id: uid(), title: 'Building-efficiency retrofit wave 1', objective: 'Reduce peak energy strain',
      department: 'Energy & Sustainability', horizon: 'medium', priority: 'Medium', status: 'Planned',
      dependency: 'Budget confirmation', next: 'Shortlist buildings', domain: 'energy' },
  ],
  scenarios: [],
})

function dplus(d) { const t = new Date(); t.setDate(t.getDate() + d); return t.toISOString().slice(0, 10) }

export function WorkspaceProvider({ children }) {
  const [ws, setWs] = useState(() => {
    try {
      const raw = localStorage.getItem(KEY)
      return raw ? JSON.parse(raw) : seed()
    } catch { return seed() }
  })
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(ws)) }, [ws])

  const api = {
    ...ws,
    createAction: (a) => setWs((s) => ({ ...s, actions: [{ id: uid(), status: 'To review', createdAt: now(), ...a }, ...s.actions] })),
    updateAction: (id, patch) => setWs((s) => ({ ...s, actions: s.actions.map((x) => x.id === id ? { ...x, ...patch } : x) })),
    removeAction: (id) => setWs((s) => ({ ...s, actions: s.actions.filter((x) => x.id !== id) })),
    addRoadmap: (r) => setWs((s) => ({ ...s, roadmap: [{ id: uid(), status: 'Planned', horizon: 'near', ...r }, ...s.roadmap] })),
    updateRoadmap: (id, patch) => setWs((s) => ({ ...s, roadmap: s.roadmap.map((x) => x.id === id ? { ...x, ...patch } : x) })),
    removeRoadmap: (id) => setWs((s) => ({ ...s, roadmap: s.roadmap.filter((x) => x.id !== id) })),
    saveScenario: (sc) => setWs((s) => ({ ...s, scenarios: [{ id: uid(), savedAt: now(), ...sc }, ...s.scenarios.filter(x => x.decisionId !== sc.decisionId)] })),
    removeScenario: (id) => setWs((s) => ({ ...s, scenarios: s.scenarios.filter((x) => x.id !== id) })),
    resetWorkspace: () => setWs(seed()),
  }
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export const useWorkspace = () => useContext(Ctx)

export const STATUSES = ['To review', 'Approved', 'In progress', 'Done']
export const PRIORITIES = ['Low', 'Medium', 'High']
export const HORIZONS = [
  { id: 'immediate', label: 'Immediate' }, { id: 'near', label: 'Near-term' },
  { id: 'medium', label: 'Medium-term' }, { id: 'long', label: 'Long-term' },
]
export const DEPARTMENTS = [
  'Transportation Operations', 'Energy & Sustainability', 'Public-Service Operations',
  'Environment Operations', 'City Strategy', 'City Data',
]
