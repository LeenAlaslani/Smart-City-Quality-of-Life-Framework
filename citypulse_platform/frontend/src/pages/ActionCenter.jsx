// CityPulse AI — Action Center. Track real decisions & tasks created across the
// platform. Editable status / owner / priority / due date. Jira-like clarity.
import { useState } from 'react'
import { useWorkspace, STATUSES, PRIORITIES, DEPARTMENTS } from '../lib/workspace'
import { Card, Button, EmptyState, StatusChip } from '../components/ui'
import Icon, { DOMAIN_ICON } from '../components/icons'

const STATUS_TONE = { 'To review': 'info', Approved: 'stable', 'In progress': 'elevated', Done: 'neutral' }
const PRIO_TONE = { High: 'high', Medium: 'elevated', Low: 'neutral' }

export default function ActionCenter() {
  const ws = useWorkspace()
  const [filter, setFilter] = useState('All')
  const [adding, setAdding] = useState(false)

  const filtered = filter === 'All' ? ws.actions : ws.actions.filter((a) => a.status === filter)
  const counts = STATUSES.reduce((m, s) => ({ ...m, [s]: ws.actions.filter((a) => a.status === s).length }), {})

  return (
    <>
      <div className="pagehead between">
        <div>
          <div className="eyebrow">Action Center</div>
          <h1>Decisions &amp; tasks</h1>
          <p className="lead">Track and move real work created across the platform.</p>
        </div>
        <Button icon="plus" onClick={() => setAdding(true)}>New action</Button>
      </div>

      <div className="row" style={{ gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['All', ...STATUSES].map((s) => (
          <button key={s} className={`choice${filter === s ? ' on' : ''}`} onClick={() => setFilter(s)}>
            {s}{s !== 'All' && <span className="muted"> · {counts[s]}</span>}
          </button>
        ))}
      </div>

      {adding && <NewAction onClose={() => setAdding(false)} onCreate={(a) => { ws.createAction(a); setAdding(false) }} />}

      {filtered.length === 0 ? (
        <Card><EmptyState icon="check" title="Nothing here yet">Create an action, or generate one from a City Intelligence scenario.</EmptyState></Card>
      ) : (
        <Card style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead><tr>
                <th>Action</th><th>Owner</th><th>Priority</th><th>Status</th><th>Due</th><th></th>
              </tr></thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id}>
                    <td style={{ maxWidth: 360 }}>
                      <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                        <span style={{ color: 'var(--cp-ink-2)', marginTop: 1 }}><Icon name={DOMAIN_ICON[a.domain] || 'actions'} size={16} /></span>
                        <div>
                          <div style={{ fontWeight: 500, color: 'var(--cp-ink)' }}>{a.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--cp-muted)' }}>{a.type} · {a.relatedArea || 'Citywide'} · {a.source}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <select className="mini" value={a.department} onChange={(e) => ws.updateAction(a.id, { department: e.target.value })}>
                        {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                      </select>
                    </td>
                    <td>
                      <select className="mini" value={a.priority} onChange={(e) => ws.updateAction(a.id, { priority: e.target.value })}>
                        {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
                      </select>
                    </td>
                    <td>
                      <select className="mini status" value={a.status} onChange={(e) => ws.updateAction(a.id, { status: e.target.value })}>
                        {STATUSES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td><input type="date" className="mini" value={a.due || ''} onChange={(e) => ws.updateAction(a.id, { due: e.target.value })} /></td>
                    <td><button className="linkbtn" onClick={() => ws.removeAction(a.id)} title="Remove"><Icon name="alert" size={15} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <style>{`
        select.mini, input.mini { font-family:var(--font); font-size:13px; color:var(--cp-ink); background:var(--cp-surface);
          border:1px solid var(--cp-border); border-radius:8px; padding:6px 9px; cursor:pointer; }
        select.mini:hover, input.mini:hover { border-color:var(--cp-border-strong); }
        select.mini.status { font-weight:600; }
        .linkbtn { background:none; border:none; color:var(--cp-muted); cursor:pointer; padding:4px; border-radius:6px; }
        .linkbtn:hover { color:var(--cp-high); background:var(--cp-high-bg); }
      `}</style>
    </>
  )
}

function NewAction({ onClose, onCreate }) {
  const [f, setF] = useState({ title: '', department: DEPARTMENTS[0], priority: 'Medium', type: 'Task', domain: 'governance', due: '', relatedArea: 'Citywide', source: 'Manual' })
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))
  return (
    <Card className="mt-1" style={{ marginBottom: 16 }} title="New action" icon="plus">
      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr 1fr', gap: 12, marginTop: 8 }}>
        <div className="field" style={{ margin: 0 }}><label>Title</label><input type="text" value={f.title} onChange={set('title')} placeholder="What needs to happen?" /></div>
        <div className="field" style={{ margin: 0 }}><label>Owner</label><select className="control" value={f.department} onChange={set('department')}>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</select></div>
        <div className="field" style={{ margin: 0 }}><label>Priority</label><select className="control" value={f.priority} onChange={set('priority')}>{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select></div>
      </div>
      <div className="row mt-3" style={{ justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button icon="check" disabled={!f.title.trim()} onClick={() => onCreate(f)}>Create</Button>
      </div>
    </Card>
  )
}
