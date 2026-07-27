// CityPulse AI — Decision Studio: compare strategic options side-by-side.
// Pick up to two city-applicable decisions; the REAL models run for each and
// the columns show impact vs today by domain, changed outcomes (with units),
// assumptions, breadth of impact, risks and required data. Preferring an
// option sends it to the Blueprint with full provenance. Saved studies below.
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { api } from '../lib/api'
import { useProfile } from '../lib/store'
import { useWorkspace } from '../lib/workspace'
import { cityName, cityDecisions, fmtOutcome, OUTCOME_LABEL, PROTOTYPE_NOTE } from '../lib/cityContext'
import { PageHead, Sect, Button, Loading, ErrorState, EmptyState } from '../components/ui'
import Icon, { DOMAIN_ICON } from '../components/icons'

export default function Studio() {
  const nav = useNavigate()
  const loc = useLocation()
  const { profile } = useProfile()
  const ws = useWorkspace()
  const [opts, setOpts] = useState(null)
  const [picked, setPicked] = useState([])          // decision ids (max 2)
  const [runs, setRuns] = useState({})              // id -> analyze result
  const [busy, setBusy] = useState({})
  const [err, setErr] = useState(null)
  const [sent, setSent] = useState({})

  useEffect(() => { api.options().then(setOpts).catch((e) => setErr(e.message)) }, [])
  const decisions = useMemo(() => opts ? cityDecisions(profile, opts.decisions) : [], [opts, profile])

  // Preselect from ?d= (e.g. from the Overview recommendation)
  useEffect(() => {
    const d = new URLSearchParams(loc.search).get('d')
    if (d && opts && !picked.includes(d)) toggle(d)
  }, [opts])

  const runOne = (id) => {
    setBusy((b) => ({ ...b, [id]: true }))
    api.analyze(profile, id).then((r) => {
      setRuns((m) => ({ ...m, [id]: r })); setBusy((b) => ({ ...b, [id]: false }))
    }).catch((e) => { setErr(e.message); setBusy((b) => ({ ...b, [id]: false })) })
  }
  const toggle = (id) => {
    setPicked((p) => {
      if (p.includes(id)) return p.filter((x) => x !== id)
      const next = p.length >= 2 ? [p[1], id] : [...p, id]
      if (!runs[id]) runOne(id)
      return next
    })
  }

  const prefer = (r) => {
    const key = `bp-${r.decision.id}`
    ws.upsertBlueprint({
      key, title: r.decision.title, domain: r.impact.focus_domain,
      why: r.impact.why, evidence: `${OUTCOME_LABEL[r.impact.focus_domain]}: ${fmtOutcome(r.reading.signals[r.impact.focus_domain])}`,
      kpi: OUTCOME_LABEL[r.impact.focus_domain], expected: r.impact.what_changes,
      risks: r.impact.risks, requiredData: r.integrity.data_gap,
      owner: r.next_actions[0]?.department || 'City Strategy',
      source: `Decision Studio · ${new Date().toLocaleDateString()}`, status: 'Proposed',
    })
    setSent((s) => ({ ...s, [r.decision.id]: true }))
    setTimeout(() => setSent((s) => ({ ...s, [r.decision.id]: false })), 1800)
  }

  const city = cityName(profile)
  const cols = picked.map((id) => ({ id, r: runs[id], busy: busy[id] }))

  return (
    <>
      <PageHead eyebrow={`Decision Studio · ${city}`} title="Compare strategic options"
        purpose="Pick up to two decisions — the real models run for each, side by side.">
        <Button variant="secondary" icon="spark" onClick={() => nav('/app/intelligence?guided=1')}>Guided start</Button>
      </PageHead>

      {err && <ErrorState onRetry={() => picked.forEach(runOne)}>{err}</ErrorState>}

      {/* option picker */}
      <div className="st-pick">
        {decisions.map((d) => (
          <button key={d.id} className={`st-chip${picked.includes(d.id) ? ' on' : ''}`} onClick={() => toggle(d.id)}>
            <Icon name={d.icon || 'scenarios'} size={14} /> {d.title}
          </button>
        ))}
      </div>

      {/* comparison columns */}
      {cols.length > 0 && (
        <div className={`st-cols n${cols.length}`}>
          {cols.map(({ id, r, busy }) => (
            <div className="st-col card flat" key={id}>
              {!r || busy ? <Loading label="Running models…" /> : (
                <>
                  <div className="st-h">
                    <div>
                      <div className="st-cat">{r.decision.category}</div>
                      <h3>{r.decision.title}</h3>
                    </div>
                    <span className={`st-d ${dIdx(r) <= 0 ? 'good' : 'bad'}`}>{dIdx(r) > 0 ? '+' : ''}{dIdx(r)}<small>index vs today</small></span>
                  </div>

                  <div className="st-k">Impact by domain</div>
                  <div className="st-doms">
                    {Object.values(r.reading.signals).map((s) => {
                      const b = r.baseline_reading?.signals[s.domain]
                      const d = b ? Math.round(s.pressure - b.pressure) : 0
                      return (
                        <div className="st-dom" key={s.domain}>
                          <span className="sd-n"><Icon name={DOMAIN_ICON[s.domain]} size={13} /> {s.domain_label.split(' & ')[0]}</span>
                          <div className="sd-track">
                            <i className="sd-base" style={{ width: `${Math.min(100, b?.pressure ?? s.pressure)}%` }} />
                            <i className="sd-now" style={{ width: `${Math.min(100, s.pressure)}%`, background: s.color }} />
                          </div>
                          <span className={`sd-d ${d < 0 ? 'good' : d > 0 ? 'bad' : ''}`}>{d === 0 ? '—' : (d > 0 ? '+' : '') + d}</span>
                        </div>
                      )
                    })}
                  </div>

                  <ChangedOutcomes r={r} />

                  <div className="st-k">Assumptions</div>
                  <div className="st-asm">{r.assumptions.map((a, i) => <span key={i}>{a.label}: <b>{a.value}</b></span>)}</div>

                  <div className="st-facts">
                    <div><Icon name="layers" size={13} /><span><b>{r.impact.affected.length}</b> domain{r.impact.affected.length === 1 ? '' : 's'} affected — breadth of change</span></div>
                    <div><Icon name="alert" size={13} /><span>{r.impact.risks}</span></div>
                    <div><Icon name="evidence" size={13} /><span>{r.integrity.data_gap}</span></div>
                  </div>

                  <div className="st-cta">
                    <Button size="sm" className="btn-cyan" icon={sent[id] ? 'check' : 'target'} onClick={() => prefer(r)}>
                      {sent[id] ? 'Sent to Blueprint' : 'Prefer this option'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => nav('/app/intelligence')}>Tune assumptions</Button>
                  </div>
                </>
              )}
            </div>
          ))}
          {cols.length === 1 && (
            <div className="st-col st-empty">
              <EmptyState icon="scenarios" title="Add a second option">Select another decision above to compare them side by side.</EmptyState>
            </div>
          )}
        </div>
      )}

      {cols.length === 0 && (
        <div className="card flat"><EmptyState icon="scenarios" title="Choose options to compare">
          Select one or two decisions above — the connected models will run for each.
        </EmptyState></div>
      )}

      {/* saved studies */}
      {ws.scenarios.length > 0 && (
        <>
          <Sect label="Saved studies" />
          <div className="st-saved">
            {ws.scenarios.map((s) => (
              <div className="st-sv card flat" key={s.id}>
                <div className="sv-t"><Icon name="scenarios" size={15} /> {s.title}
                  <button className="sv-x" title="Delete" onClick={() => ws.removeScenario(s.id)}><Icon name="waste" size={14} /></button></div>
                <p>{s.summary}</p>
                <div className="sv-m">{s.city} · {new Date(s.savedAt).toLocaleDateString()} · focus {s.focus}</div>
                <button className="sect-link" onClick={() => { toggle(s.decisionId) }}>Load into comparison <Icon name="arrowRight" size={13} /></button>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="st-note">{PROTOTYPE_NOTE}</p>
      <style>{css}</style>
    </>
  )
}

const dIdx = (r) => Math.round(r.reading.overall_pressure - (r.baseline_reading?.overall_pressure ?? r.reading.overall_pressure))

function ChangedOutcomes({ r }) {
  const rows = Object.values(r.reading.signals).map((s) => {
    const b = r.baseline_reading?.signals[s.domain]
    return b && fmtOutcome(s) !== fmtOutcome(b) ? { s, b } : null
  }).filter(Boolean)
  if (!rows.length) return null
  return (
    <>
      <div className="st-k">Changed outcomes</div>
      <div className="st-outs">
        {rows.slice(0, 3).map(({ s, b }) => (
          <div key={s.domain}><span>{OUTCOME_LABEL[s.domain]}</span>
            <em>{fmtOutcome(b)} → <b style={{ color: s.pressure > b.pressure ? 'var(--cp-high)' : 'var(--cp-stable)' }}>{fmtOutcome(s)}</b></em></div>
        ))}
      </div>
    </>
  )
}

const css = `
.st-pick{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px}
.st-chip{display:inline-flex;align-items:center;gap:7px;background:var(--cp-surface);border:1px solid var(--cp-border);
  border-radius:999px;padding:8px 14px;font:inherit;font-size:12.5px;font-weight:600;color:var(--cp-ink-2);cursor:pointer;transition:.14s}
.st-chip svg{color:var(--cp-teal-600)}
.st-chip:hover{border-color:var(--cp-border-strong)}
.st-chip.on{background:var(--cp-teal-050);border-color:var(--cp-teal-500);color:var(--cp-navy-700)}
.st-cols{display:grid;gap:16px;align-items:start}
.st-cols.n1,.st-cols.n2{grid-template-columns:1fr 1fr}
.st-col{min-height:200px}
.st-empty{display:grid;place-items:center;border:1px dashed var(--cp-border-strong);border-radius:14px;background:none}
.st-h{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}
.st-cat{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--cp-muted)}
.st-h h3{font-size:17px;font-weight:700;letter-spacing:-.01em;margin-top:3px}
.st-d{text-align:right;font-size:20px;font-weight:800;line-height:1}
.st-d small{display:block;font-size:9.5px;font-weight:600;color:var(--cp-muted);letter-spacing:.04em;margin-top:3px}
.st-d.good{color:var(--cp-stable)}.st-d.bad{color:var(--cp-high)}
.st-k{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--cp-muted);margin:16px 0 8px}
.st-doms{display:flex;flex-direction:column;gap:8px}
.st-dom{display:grid;grid-template-columns:118px 1fr 32px;align-items:center;gap:10px}
.sd-n{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--cp-ink-2)}
.sd-track{position:relative;height:10px;background:var(--cp-surface-2);border-radius:5px;overflow:hidden}
.sd-track i{position:absolute;left:0;top:0;bottom:0;border-radius:5px}
.sd-base{background:var(--cp-border-strong);opacity:.55}
.sd-now{opacity:.85;top:2px;bottom:2px}
.sd-d{font-size:12px;font-weight:800;text-align:right;color:var(--cp-muted)}
.sd-d.good{color:var(--cp-stable)}.sd-d.bad{color:var(--cp-high)}
.st-outs{display:flex;flex-direction:column;gap:6px}
.st-outs > div{display:flex;justify-content:space-between;gap:10px;font-size:12.5px;padding:7px 10px;background:var(--cp-surface-2);border-radius:8px}
.st-outs span{color:var(--cp-ink-2);font-weight:600}
.st-outs em{font-style:normal;color:var(--cp-ink)}
.st-asm{display:flex;flex-wrap:wrap;gap:6px}
.st-asm span{font-size:11.5px;color:var(--cp-ink-2);background:var(--cp-surface-2);border:1px solid var(--cp-border);border-radius:7px;padding:4px 9px}
.st-asm b{color:var(--cp-navy-700)}
.st-facts{display:flex;flex-direction:column;gap:8px;margin-top:16px}
.st-facts > div{display:flex;gap:8px;align-items:flex-start;font-size:12px;color:var(--cp-ink-2);line-height:1.45}
.st-facts svg{color:var(--cp-teal-600);flex:0 0 auto;margin-top:1px}
.st-facts b{color:var(--cp-ink)}
.st-cta{display:flex;gap:10px;margin-top:16px}
.st-saved{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.st-sv p{font-size:12.5px;color:var(--cp-ink-2);line-height:1.45;margin:8px 0}
.sv-t{display:flex;align-items:center;gap:8px;font-size:13.5px;font-weight:700;color:var(--cp-ink)}
.sv-t svg{color:var(--cp-teal-600)}
.sv-x{margin-inline-start:auto;background:none;border:none;color:var(--cp-muted);cursor:pointer;padding:4px;border-radius:6px}
.sv-x:hover{color:var(--cp-high)}
.sv-m{font-size:11px;color:var(--cp-muted);margin-bottom:8px}
.st-note{font-size:11.5px;color:var(--cp-muted);margin-top:22px}
@media(max-width:980px){.st-cols.n1,.st-cols.n2{grid-template-columns:1fr}.st-saved{grid-template-columns:1fr}}
`
