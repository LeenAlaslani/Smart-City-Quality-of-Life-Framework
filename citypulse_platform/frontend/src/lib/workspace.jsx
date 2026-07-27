// CityPulse AI — workspace state. One strategic lifecycle (initiatives) plus
// operational tasks, persisted to localStorage. Initiatives carry provenance
// (why / evidence) and move through a realistic government lifecycle with a
// named owner and reviewer: the AI proposes, a human reviews and approves, then
// delivery is tracked. Old blueprint/roadmap/actions data migrates in-place.
import { createContext, useContext, useEffect, useState } from 'react'

const KEY = 'citypulse.workspace'
const Ctx = createContext(null)
const uid = () => Math.random().toString(36).slice(2, 9)
const now = () => new Date().toISOString()
function dplus(d) { const t = new Date(); t.setDate(t.getDate() + d); return t.toISOString().slice(0, 10) }

export const STAGES = ['Proposed', 'In review', 'Approved', 'In delivery', 'Delivered']
export const ARCHIVED = ['Deferred', 'Rejected']
export const TASK_STATES = ['To do', 'In progress', 'Done']
export const PRIORITIES = ['Low', 'Medium', 'High']
export const HORIZONS = [
  { id: 'immediate', label: 'Immediate' }, { id: 'near', label: 'Near-term' },
  { id: 'medium', label: 'Medium-term' }, { id: 'long', label: 'Long-term' },
]
export const DEPARTMENTS = [
  'Transportation Operations', 'Energy & Sustainability', 'Public-Service Operations',
  'Environment Operations', 'City Strategy', 'City Data',
]

const seed = () => ({
  initiatives: [
    {
      id: uid(), title: 'City mobility readiness programme', domain: 'mobility',
      why: 'Congestion risk is trending toward the attention threshold on core corridors.',
      evidence: 'Transportation & Mobility — model reading in the Watch band.',
      expected: 'Cut peak-hour congestion risk on the busiest corridors.',
      risks: 'Benefits lag if transit capacity is not added before peak season.',
      requiredData: 'Local traffic counts and incident records for validation.',
      owner: 'Transportation Operations', reviewer: 'City Strategy',
      status: 'In delivery', horizon: 'near', source: 'City Strategy',
      tasks: [
        { id: uid(), title: 'Confirm scope with operations', status: 'Done' },
        { id: uid(), title: 'Shortlist priority corridors', status: 'In progress' },
      ], createdAt: now(),
    },
    {
      id: uid(), title: 'Building-efficiency retrofit — wave 1', domain: 'energy',
      why: 'Summer cooling demand raises building electricity load.',
      evidence: 'Energy & Buildings — demand rising under peak temperatures.',
      expected: 'Reduce peak electricity demand in municipal buildings.',
      risks: 'Requires budget confirmation before procurement.',
      requiredData: 'Building energy-meter data by building type.',
      owner: 'Energy & Sustainability', reviewer: 'City Strategy',
      status: 'Proposed', horizon: 'medium', source: 'Model signal',
      tasks: [], createdAt: now(),
    },
  ],
  tasks: [
    { id: uid(), title: 'Review corridor congestion on the eastern ring road', domain: 'mobility',
      department: 'Transportation Operations', priority: 'High', status: 'To do', due: dplus(5), source: 'Signals' },
    { id: uid(), title: 'Confirm summer peak-load plan with the grid operator', domain: 'energy',
      department: 'Energy & Sustainability', priority: 'Medium', status: 'In progress', due: dplus(12), source: 'Workspace' },
  ],
})

const mapBp = (x) => ({ Proposed: 'Proposed', Approved: 'Approved', Deferred: 'Deferred', Rejected: 'Rejected' }[x] || 'Proposed')
const mapRd = (x) => ({ Planned: 'Approved', Approved: 'Approved', 'In progress': 'In delivery', Delivered: 'Delivered' }[x] || 'Approved')
const mapTask = (x) => ({ 'To review': 'To do', Approved: 'In progress', 'In progress': 'In progress', Done: 'Done' }[x] || 'To do')

function migrate(state) {
  const s = { ...seed(), ...state }
  if (!Array.isArray(state.initiatives)) {
    const bp = (state.blueprint || []).map((b) => ({
      id: b.id || uid(), title: b.title, domain: b.domain, why: b.why, evidence: b.evidence,
      expected: b.expected, risks: b.risks, requiredData: b.requiredData, owner: b.owner || 'City Strategy',
      reviewer: 'City Strategy', status: mapBp(b.status), horizon: 'near', source: b.source || 'Blueprint',
      tasks: [], createdAt: b.createdAt || now(),
    }))
    const rd = (state.roadmap || []).map((r) => ({
      id: r.id || uid(), title: r.title, domain: r.domain, why: r.objective || '', evidence: '',
      expected: r.objective || '', risks: '', requiredData: '', owner: r.department || 'City Strategy',
      reviewer: 'City Strategy', status: mapRd(r.status), horizon: r.horizon || 'near', source: 'Roadmap',
      tasks: r.next ? [{ id: uid(), title: r.next, status: 'To do' }] : [], createdAt: now(),
    }))
    const merged = [...bp, ...rd]
    if (merged.length) s.initiatives = merged
  }
  if (!Array.isArray(state.tasks) && Array.isArray(state.actions)) {
    s.tasks = state.actions.map((a) => ({
      id: a.id || uid(), title: a.title, domain: a.domain, department: a.department,
      priority: a.priority || 'Medium', status: mapTask(a.status), due: a.due || '', source: a.source || 'Manual',
    }))
  }
  delete s.blueprint; delete s.roadmap; delete s.scenarios; delete s.actions
  return s
}

export function WorkspaceProvider({ children }) {
  const [ws, setWs] = useState(() => {
    try { const raw = localStorage.getItem(KEY); return raw ? migrate(JSON.parse(raw)) : seed() }
    catch { return seed() }
  })
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(ws)) }, [ws])

  const api = {
    ...ws,
    // ── initiatives (strategic lifecycle) ──────────────────────────────────
    addInitiative: (i) => setWs((s) => ({ ...s, initiatives: [{ id: uid(), status: 'Proposed', horizon: 'near', tasks: [], reviewer: 'City Strategy', createdAt: now(), ...i }, ...s.initiatives] })),
    upsertInitiative: (i) => setWs((s) => {
      const ex = i.key && s.initiatives.find((x) => x.key === i.key)
      return ex
        ? { ...s, initiatives: s.initiatives.map((x) => x.id === ex.id ? { ...x, ...i } : x) }
        : { ...s, initiatives: [{ id: uid(), status: 'Proposed', horizon: 'near', tasks: [], reviewer: 'City Strategy', createdAt: now(), ...i }, ...s.initiatives] }
    }),
    updateInitiative: (id, patch) => setWs((s) => ({ ...s, initiatives: s.initiatives.map((x) => x.id === id ? { ...x, ...patch } : x) })),
    removeInitiative: (id) => setWs((s) => ({ ...s, initiatives: s.initiatives.filter((x) => x.id !== id) })),
    addInitTask: (id, title) => setWs((s) => ({ ...s, initiatives: s.initiatives.map((x) => x.id === id ? { ...x, tasks: [...(x.tasks || []), { id: uid(), title, status: 'To do' }] } : x) })),
    cycleInitTask: (id, taskId) => setWs((s) => ({ ...s, initiatives: s.initiatives.map((x) => x.id === id ? { ...x, tasks: x.tasks.map((t) => t.id === taskId ? { ...t, status: TASK_STATES[(TASK_STATES.indexOf(t.status) + 1) % 3] } : t) } : x) })),
    // ── operational tasks ──────────────────────────────────────────────────
    createTask: (t) => setWs((s) => ({ ...s, tasks: [{ id: uid(), status: 'To do', ...t }, ...s.tasks] })),
    updateTask: (id, patch) => setWs((s) => ({ ...s, tasks: s.tasks.map((x) => x.id === id ? { ...x, ...patch } : x) })),
    removeTask: (id) => setWs((s) => ({ ...s, tasks: s.tasks.filter((x) => x.id !== id) })),
    resetWorkspace: () => setWs(seed()),
  }
  api.createAction = api.createTask // back-compat alias
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export const useWorkspace = () => useContext(Ctx)
