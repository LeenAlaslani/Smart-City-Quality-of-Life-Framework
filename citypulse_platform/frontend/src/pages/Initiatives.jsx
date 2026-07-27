// CityPulse AI — Initiatives: one lifecycle for strategic work. Proposals (from
// model signals or the Decision Workspace) move Proposed → In review → Approved
// → In delivery → Delivered, each with a named owner and reviewer and its own
// task checklist. The AI proposes; a human reviews and approves; delivery is
// team-reported. Pipeline and timeline are two views of the same records.
// Operational tasks (not tied to an initiative) live in a compact list below.
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useProfile } from '../lib/store'
import { useWorkspace, STAGES, ARCHIVED, HORIZONS, DEPARTMENTS, TASK_STATES, PRIORITIES } from '../lib/workspace'
import { classify } from '../lib/cityStatus'
import { cityName, OUTCOME_LABEL, fmtOutcome } from '../lib/cityContext'
import { PageHead, Sect, Button, EmptyState } from '../components/ui'
import Icon, { DOMAIN_ICON } from '../components/icons'

const STAGE_TONE = { Proposed: 'neutral', 'In review': 'info', Approved: 'watch', 'In delivery': 'elevated', Delivered: 'stable', Deferred: 'neutral', Rejected: 'critical' }
const NEXT = { Proposed: 'In review', 'In review': 'Approved', Approved: 'In delivery', 'In delivery': 'Delivered' }
const NEXT_LABEL = { Proposed: 'Send for review', 'In review': 'Approve', Approved: 'Start delivery', 'In delivery': 'Mark delivered' }

export default function Initiatives() {
  const nav = useNavigate()
  const { profile } = useProfile()
  const ws = useWorkspace()
  const [base, setBase] = useState(null)
  const [view, setView] = useState('pipeline')
  const [open, setOpen] = useState(null)

  useEffect(() => { api.analyze(profile, 'baseline').then(setBase).catch(() => {}) }, [])

  // Auto-propose from live signals (idempotent by key) — only genuine attention.
  useEffect(() => {
    if (!base) return
    classify(base.reading).attention.forEach((s) => {
      const act = base.next_actions.find((a) => a.domain === s.domain)
      ws.upsertInitiative({
        key: `sig-${s.domain}`,
        title: act ? act.title : `Address ${s.domain_label.toLowerCase()} pressure`,
        domain: s.domain,
        why: `${s.domain_label} is in the ${s.status} band — ${s.driver}`,
        evidence: `${OUTCOME_LABEL[s.domain]}: ${fmtOutcome(s)} (live model reading)`,
        expected: base.impact.focus_domain === s.domain ? base.impact.recommended_response : `Bring ${OUTCOME_LABEL[s.domain].toLowerCase()} back toward the normal band.`,
        risks: base.impact.focus_domain === s.domain ? base.impact.risks : 'Capacity not added before peak periods.',
        requiredData: base.integrity.data_gap,
        owner: act?.department || 'City Strategy', reviewer: 'City Strategy',
        source: 'Model signal',
      })
    })
  }, [base])

  const inits = ws.initiatives || []
  const counts = [...STAGES, ...ARCHIVED].reduce((m, st) => ({ ...m, [st]: inits.filter((i) => i.status === st).length }), {})
  const city = cityName(profile)

  const advance = (i) => {
    const next = NEXT[i.status]
    if (!next) return
    const patch = { status: next }
    if (next === 'In delivery' && (!i.tasks || i.tasks.length === 0)) patch.tasks = [{ id: Math.random().toString(36).slice(2, 9), title: 'Confirm scope with owner', status: 'To do' }]
    ws.updateInitiative(i.id, patch)
  }

  return (
    <>
      <PageHead eyebrow={`Initiatives · ${city}`} title="Initiatives & delivery"
        purpose="Proposals move through review and approval, then delivery — each with an owner and reviewer.">
        <div className="seg">
          <button className={view === 'pipeline' ? 'on' : ''} onClick={() => setView('pipeline')}>Pipeline</button>
          <button className={view === 'timeline' ? 'on' : ''} onClick={() => setView('timeline')}>Timeline</button>
        </div>
      </PageHead>

      <div className="in-sum">
        {STAGES.map((st) => (
          <div className={`in-st ${STAGE_TONE[st]}`} key={st}><b>{counts[st]}</b><span>{st}</span></div>
        ))}
      </div>

      {inits.length === 0 && (
        <div className="card flat"><EmptyState icon="target" title="No initiatives yet">
          Proposals appear here from live model signals, or when you submit a decision from the Workspace.
          <div className="mt-4"><Button variant="secondary" iconRight="arrowRight" onClick={() => nav('/app/workspace')}>Open Decision Workspace</Button></div>
        </EmptyState></div>
      )}

      {/* ── PIPELINE VIEW ─────────────────────────────────────────────────── */}
      {view === 'pipeline' && inits.length > 0 && STAGES.map((st) => {
        const items = inits.filter((i) => i.status === st)
        if (!items.length) return null
        return (
          <div key={st}>
            <Sect label={`${st} · ${items.length}`} />
            <div className="in-list">
              {items.map((i) => (
                <Row key={i.id} i={i} open={open === i.id} onToggle={() => setOpen(open === i.id ? null : i.id)}
                  ws={ws} advance={advance} />
              ))}
            </div>
          </div>
        )
      })}

      {/* ── TIMELINE VIEW ─────────────────────────────────────────────────── */}
      {view === 'timeline' && inits.length > 0 && (
        <div className="in-cols">
          {HORIZONS.map((h) => {
            const items = inits.filter((i) => (i.horizon || 'near') === h.id && !ARCHIVED.includes(i.status))
            return (
              <div className="in-col" key={h.id}>
                <div className="in-colh">{h.label}<span className="chip chip-neutral">{items.length}</span></div>
                {items.length === 0 && <div className="in-empty">—</div>}
                {items.map((i) => (
                  <div className="in-card" key={i.id} onClick={() => { setView('pipeline'); setOpen(i.id) }}>
                    <span className="in-cic"><Icon name={DOMAIN_ICON[i.domain] || 'target'} size={14} /></span>
                    <div className="in-ct">{i.title}</div>
                    <span className={`chip chip-${STAGE_TONE[i.status]}`}>{i.status}</span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {/* archived */}
      {view === 'pipeline' && ARCHIVED.some((st) => counts[st] > 0) && (
        <>
          <Sect label="Archived" />
          <div className="in-list">
            {inits.filter((i) => ARCHIVED.includes(i.status)).map((i) => (
              <Row key={i.id} i={i} open={open === i.id} onToggle={() => setOpen(open === i.id ? null : i.id)} ws={ws} advance={advance} />
            ))}
          </div>
        </>
      )}

      {/* operational tasks */}
      <Sect label={`Operational tasks · ${ws.tasks.length}`} />
      <OperationalTasks ws={ws} />

      <style>{css}</style>
    </>
  )
}

function Row({ i, open, onToggle, ws, advance }) {
  const [task, setTask] = useState('')
  return (
    <div className={`in-row card flat${open ? ' open' : ''}`}>
      <div className="in-main" onClick={onToggle} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onToggle()}>
        <span className="in-ic"><Icon name={DOMAIN_ICON[i.domain] || 'target'} size={16} /></span>
        <div className="in-t"><b>{i.title}</b><span>{i.owner} · reviewer {i.reviewer}</span></div>
        <span className={`chip chip-${STAGE_TONE[i.status]}`}>{i.status}</span>
        <Icon name={open ? 'up' : 'down'} size={15} className="in-chev" />
      </div>
      {open && (
        <div className="in-detail">
          <div className="in-facts">
            <Fact k="Why proposed" v={i.why} />
            <Fact k="Evidence" v={i.evidence} />
            <Fact k="Expected outcome" v={i.expected} />
            <Fact k="Key risk" v={i.risks} />
            <Fact k="Required data" v={i.requiredData} />
            <Fact k="Source" v={i.source} />
          </div>

          <div className="in-assign">
            <label>Owner
              <select value={i.owner} onChange={(e) => ws.updateInitiative(i.id, { owner: e.target.value })}>
                {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
              </select></label>
            <label>Reviewer
              <select value={i.reviewer} onChange={(e) => ws.updateInitiative(i.id, { reviewer: e.target.value })}>
                {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
              </select></label>
            <label>Horizon
              <select value={i.horizon || 'near'} onChange={(e) => ws.updateInitiative(i.id, { horizon: e.target.value })}>
                {HORIZONS.map((h) => <option key={h.id} value={h.id}>{h.label}</option>)}
              </select></label>
          </div>

          {(i.status === 'In delivery' || i.status === 'Approved') && (
            <div className="in-tasks">
              <div className="in-tk">Delivery checklist <em>team-reported</em></div>
              {(i.tasks || []).map((t) => (
                <button key={t.id} className={`in-task ${t.status === 'Done' ? 'done' : ''}`} onClick={() => ws.cycleInitTask(i.id, t.id)}>
                  <span className={`in-box ${t.status === 'Done' ? 'c' : t.status === 'In progress' ? 'h' : ''}`}>
                    {t.status === 'Done' ? <Icon name="check" size={11} /> : t.status === 'In progress' ? '…' : ''}
                  </span>
                  <span className="in-tt">{t.title}</span><em>{t.status}</em>
                </button>
              ))}
              <div className="in-addt">
                <input value={task} placeholder="Add a delivery task…" onChange={(e) => setTask(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && task.trim()) { ws.addInitTask(i.id, task.trim()); setTask('') } }} />
              </div>
            </div>
          )}

          <div className="in-acts">
            {NEXT[i.status] && <Button size="sm" className="btn-cyan" icon="arrowRight" onClick={() => advance(i)}>{NEXT_LABEL[i.status]}</Button>}
            {i.status === 'In review' && <Button size="sm" variant="secondary" onClick={() => ws.updateInitiative(i.id, { status: 'Proposed' })}>Request changes</Button>}
            {!ARCHIVED.includes(i.status) && i.status !== 'Delivered' && <Button size="sm" variant="ghost" onClick={() => ws.updateInitiative(i.id, { status: 'Deferred' })}>Defer</Button>}
            {!ARCHIVED.includes(i.status) && <Button size="sm" variant="ghost" onClick={() => ws.updateInitiative(i.id, { status: 'Rejected' })}>Reject</Button>}
            {ARCHIVED.includes(i.status) && <Button size="sm" variant="secondary" onClick={() => ws.updateInitiative(i.id, { status: 'Proposed' })}>Reopen</Button>}
            <button className="in-del" title="Remove" onClick={() => ws.removeInitiative(i.id)}><Icon name="waste" size={14} /></button>
          </div>
        </div>
      )}
    </div>
  )
}

function OperationalTasks({ ws }) {
  const [adding, setAdding] = useState('')
  return (
    <div className="card flat op">
      <div className="op-list">
        {ws.tasks.map((t) => (
          <div className="op-row" key={t.id}>
            <span className="op-ic"><Icon name={DOMAIN_ICON[t.domain] || 'actions'} size={14} /></span>
            <span className="op-t">{t.title}</span>
            <select className="mini" value={t.department} onChange={(e) => ws.updateTask(t.id, { department: e.target.value })}>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</select>
            <select className="mini" value={t.priority} onChange={(e) => ws.updateTask(t.id, { priority: e.target.value })}>{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select>
            <select className="mini st" value={t.status} onChange={(e) => ws.updateTask(t.id, { status: e.target.value })}>{TASK_STATES.map((s) => <option key={s}>{s}</option>)}</select>
            <input type="date" className="mini" value={t.due || ''} onChange={(e) => ws.updateTask(t.id, { due: e.target.value })} />
            <button className="in-del" onClick={() => ws.removeTask(t.id)}><Icon name="waste" size={13} /></button>
          </div>
        ))}
        {ws.tasks.length === 0 && <div className="op-empty">No operational tasks.</div>}
      </div>
      <div className="op-add">
        <input value={adding} placeholder="Add an operational task…" onChange={(e) => setAdding(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && adding.trim()) { ws.createTask({ title: adding.trim(), department: DEPARTMENTS[0], priority: 'Medium', domain: 'governance', due: '', source: 'Manual' }); setAdding('') } }} />
      </div>
    </div>
  )
}

const Fact = ({ k, v }) => v ? <div className="in-fact"><span>{k}</span><p>{v}</p></div> : null

const css = `
.seg{display:inline-flex;background:var(--cp-surface-2);border:1px solid var(--cp-border);border-radius:10px;padding:3px}
.seg button{background:none;border:none;font:inherit;font-size:12.5px;font-weight:600;color:var(--cp-ink-2);padding:6px 14px;border-radius:8px;cursor:pointer}
.seg button.on{background:#fff;color:var(--cp-navy-700);box-shadow:var(--sh-1)}
.in-sum{display:flex;gap:10px;margin-bottom:8px;flex-wrap:wrap}
.in-st{display:flex;flex-direction:column;gap:1px;background:var(--cp-surface);border:1px solid var(--cp-border);border-radius:12px;padding:11px 16px;min-width:96px}
.in-st b{font-size:20px;font-weight:800;color:var(--cp-ink);line-height:1}
.in-st span{font-size:11.5px;color:var(--cp-muted);font-weight:600}
.in-st.stable b{color:var(--cp-stable)}.in-st.elevated b{color:var(--cp-elevated)}.in-st.info b{color:var(--cp-info)}.in-st.watch b{color:var(--cp-watch)}
.in-list{display:flex;flex-direction:column;gap:9px}
.in-row{padding:0;overflow:hidden}
.in-main{display:flex;align-items:center;gap:13px;padding:14px 18px;cursor:pointer}
.in-main:hover{background:var(--cp-surface-2)}
.in-ic{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:var(--cp-teal-050);color:var(--cp-teal-600);flex:0 0 auto}
.in-t{flex:1;min-width:0}
.in-t b{display:block;font-size:14.5px;font-weight:700;color:var(--cp-ink);letter-spacing:-.01em}
.in-t span{display:block;font-size:12px;color:var(--cp-muted);margin-top:2px}
.in-chev{color:var(--cp-muted);flex:0 0 auto}
.in-detail{border-top:1px solid var(--cp-border);padding:16px 18px;background:var(--cp-surface-2)}
.in-facts{display:grid;grid-template-columns:1fr 1fr;gap:12px 24px;margin-bottom:16px}
.in-fact span{display:block;font-size:9.5px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--cp-teal-600)}
.in-fact p{font-size:12.5px;color:var(--cp-ink);line-height:1.5;margin-top:3px}
.in-assign{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:14px}
.in-assign label{font-size:10.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--cp-muted);display:flex;flex-direction:column;gap:5px}
.in-assign select{font:inherit;font-size:13px;font-weight:500;color:var(--cp-ink);border:1px solid var(--cp-border-strong);border-radius:8px;padding:6px 9px;background:#fff}
.in-tasks{background:#fff;border:1px solid var(--cp-border);border-radius:11px;padding:12px 14px;margin-bottom:14px}
.in-tk{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--cp-muted);margin-bottom:8px}
.in-tk em{font-style:normal;font-weight:600;color:var(--cp-muted);text-transform:none;letter-spacing:0;margin-inline-start:6px}
.in-task{display:flex;align-items:center;gap:10px;width:100%;background:none;border:none;font:inherit;padding:6px 2px;cursor:pointer;text-align:left}
.in-box{width:18px;height:18px;border-radius:6px;border:1.6px solid var(--cp-border-strong);display:grid;place-items:center;color:#fff;font-size:11px;flex:0 0 auto}
.in-box.c{background:var(--cp-stable);border-color:var(--cp-stable)}
.in-box.h{background:var(--cp-elevated);border-color:var(--cp-elevated);color:#fff;font-weight:800;line-height:1}
.in-tt{flex:1;font-size:13px;color:var(--cp-ink)}
.in-task.done .in-tt{color:var(--cp-muted);text-decoration:line-through}
.in-task em{font-style:normal;font-size:11px;color:var(--cp-muted)}
.in-addt input,.op-add input{width:100%;font:inherit;font-size:12.5px;border:1px dashed var(--cp-border-strong);border-radius:8px;padding:8px 11px;margin-top:8px;background:none}
.in-addt input:focus,.op-add input:focus{outline:none;border-color:var(--cp-teal-500)}
.in-acts{display:flex;align-items:center;gap:9px;flex-wrap:wrap}
.in-del{margin-inline-start:auto;background:none;border:none;color:var(--cp-muted);cursor:pointer;padding:5px;border-radius:7px}
.in-del:hover{color:var(--cp-high)}
/* timeline */
.in-cols{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;align-items:start}
.in-col{background:var(--cp-surface-2);border:1px solid var(--cp-border);border-radius:14px;padding:12px;min-height:120px}
.in-colh{display:flex;align-items:center;justify-content:space-between;font-size:13px;font-weight:700;color:var(--cp-ink);padding:2px 4px 10px}
.in-empty{font-size:12px;color:var(--cp-muted);padding:8px 4px}
.in-card{display:flex;align-items:center;gap:9px;background:#fff;border:1px solid var(--cp-border);border-radius:11px;padding:11px;margin-bottom:9px;cursor:pointer;transition:.14s}
.in-card:hover{border-color:var(--cp-border-strong);box-shadow:var(--sh-1)}
.in-cic{width:26px;height:26px;border-radius:7px;display:grid;place-items:center;background:var(--cp-teal-050);color:var(--cp-teal-600);flex:0 0 auto}
.in-ct{flex:1;font-size:12.5px;font-weight:600;color:var(--cp-ink);line-height:1.3}
/* operational tasks */
.op{padding:8px 10px}
.op-row{display:flex;align-items:center;gap:10px;padding:9px 8px;border-bottom:1px solid var(--cp-border)}
.op-row:last-child{border-bottom:none}
.op-ic{color:var(--cp-ink-2);display:inline-flex;flex:0 0 auto}
.op-t{flex:1;font-size:13.5px;color:var(--cp-ink);min-width:0}
.op .mini{font:inherit;font-size:12px;color:var(--cp-ink);background:#fff;border:1px solid var(--cp-border);border-radius:7px;padding:5px 8px;cursor:pointer}
.op .mini.st{font-weight:600}
.op-empty{padding:14px 8px;font-size:13px;color:var(--cp-muted)}
.op-add{padding:8px}
@media(max-width:900px){.in-facts{grid-template-columns:1fr}.in-cols{grid-template-columns:1fr 1fr}.op-row{flex-wrap:wrap}}
@media(max-width:640px){.in-cols{grid-template-columns:1fr}}
`
