// CityPulse AI — Roadmap. Approved work organised by time horizon. Concise
// cards; deeper detail and status/horizon are editable inline.
import { useState } from 'react'
import { useWorkspace, HORIZONS, PRIORITIES, DEPARTMENTS } from '../lib/workspace'
import { Card, Button, EmptyState } from '../components/ui'
import Icon, { DOMAIN_ICON } from '../components/icons'

const RSTATUS = ['Planned', 'Approved', 'In progress', 'Delivered']

export default function Roadmap() {
  const ws = useWorkspace()
  const [adding, setAdding] = useState(false)
  return (
    <>
      <div className="pagehead between">
        <div><div className="eyebrow">Roadmap</div><h1>City transformation roadmap</h1>
          <p className="lead">Approved initiatives across immediate to long-term horizons.</p></div>
        <Button icon="plus" onClick={() => setAdding(true)}>New initiative</Button>
      </div>

      {adding && <NewInitiative onClose={() => setAdding(false)} onCreate={(r) => { ws.addRoadmap(r); setAdding(false) }} />}

      <div className="road-cols">
        {HORIZONS.map((h) => {
          const items = ws.roadmap.filter((r) => r.horizon === h.id)
          return (
            <div className="road-col" key={h.id}>
              <div className="road-head"><span>{h.label}</span><span className="chip chip-neutral">{items.length}</span></div>
              {items.length === 0 && <div className="road-empty">No initiatives</div>}
              {items.map((r) => (
                <div className="road-card" key={r.id}>
                  <div className="rc-top">
                    <span className="rc-ic"><Icon name={DOMAIN_ICON[r.domain] || 'roadmap'} size={15} /></span>
                    <span className={`chip chip-${r.priority === 'High' ? 'high' : r.priority === 'Medium' ? 'elevated' : 'neutral'}`}>{r.priority}</span>
                    <button className="linkbtn" style={{ marginInlineStart: 'auto' }} onClick={() => ws.removeRoadmap(r.id)}><Icon name="alert" size={14} /></button>
                  </div>
                  <div className="rc-title">{r.title}</div>
                  <div className="rc-obj">{r.objective}</div>
                  <div className="rc-meta"><Icon name="staffing" size={12} /> {r.department}</div>
                  {r.next && <div className="rc-next">Next: {r.next}</div>}
                  <div className="rc-controls">
                    <select className="mini" value={r.status} onChange={(e) => ws.updateRoadmap(r.id, { status: e.target.value })}>{RSTATUS.map((s) => <option key={s}>{s}</option>)}</select>
                    <select className="mini" value={r.horizon} onChange={(e) => ws.updateRoadmap(r.id, { horizon: e.target.value })}>{HORIZONS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</select>
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </div>

      <style>{`
        .road-cols { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; align-items:start; }
        .road-col { background:var(--cp-surface-2); border:1px solid var(--cp-border); border-radius:14px; padding:12px; min-height:120px; }
        .road-head { display:flex; align-items:center; justify-content:space-between; font-size:13px; font-weight:700; color:var(--cp-ink); padding:2px 4px 10px; }
        .road-empty { font-size:12px; color:var(--cp-muted); padding:12px 4px; }
        .road-card { background:var(--cp-surface); border:1px solid var(--cp-border); border-radius:12px; padding:13px; margin-bottom:10px; box-shadow:var(--sh-1); }
        .rc-top { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
        .rc-ic { width:26px; height:26px; border-radius:7px; display:grid; place-items:center; background:var(--cp-teal-050); color:var(--cp-teal-600); }
        .rc-title { font-size:13.5px; font-weight:600; color:var(--cp-ink); line-height:1.3; }
        .rc-obj { font-size:12.5px; color:var(--cp-ink-2); margin-top:4px; line-height:1.4; }
        .rc-meta { font-size:11.5px; color:var(--cp-muted); margin-top:8px; display:flex; align-items:center; gap:5px; }
        .rc-next { font-size:11.5px; color:var(--cp-navy-700); margin-top:5px; }
        .rc-controls { display:flex; gap:6px; margin-top:10px; }
        .rc-controls .mini { flex:1; font-size:12px; padding:5px 7px; border:1px solid var(--cp-border); border-radius:7px; background:#fff; color:var(--cp-ink); }
        .linkbtn { background:none; border:none; color:var(--cp-muted); cursor:pointer; padding:2px; border-radius:6px; }
        .linkbtn:hover { color:var(--cp-high); }
        @media (max-width:1100px){ .road-cols{ grid-template-columns:repeat(2,1fr);} }
        @media (max-width:640px){ .road-cols{ grid-template-columns:1fr;} }
      `}</style>
    </>
  )
}

function NewInitiative({ onClose, onCreate }) {
  const [f, setF] = useState({ title: '', objective: '', department: DEPARTMENTS[0], horizon: 'near', priority: 'Medium', domain: 'governance', next: 'Approve scope' })
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))
  return (
    <Card title="New initiative" icon="plus" style={{ marginBottom: 16 }}>
      <div className="grid" style={{ gridTemplateColumns: '1.4fr 1.4fr 1fr 1fr', gap: 12, marginTop: 8 }}>
        <div className="field" style={{ margin: 0 }}><label>Initiative</label><input type="text" value={f.title} onChange={set('title')} placeholder="Name" /></div>
        <div className="field" style={{ margin: 0 }}><label>Objective</label><input type="text" value={f.objective} onChange={set('objective')} placeholder="Intended outcome" /></div>
        <div className="field" style={{ margin: 0 }}><label>Horizon</label><select className="control" value={f.horizon} onChange={set('horizon')}>{HORIZONS.map((h) => <option key={h.id} value={h.id}>{h.label}</option>)}</select></div>
        <div className="field" style={{ margin: 0 }}><label>Priority</label><select className="control" value={f.priority} onChange={set('priority')}>{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select></div>
      </div>
      <div className="row mt-3" style={{ justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button icon="check" disabled={!f.title.trim()} onClick={() => onCreate(f)}>Add initiative</Button>
      </div>
    </Card>
  )
}
