// CityPulse AI — Living Smart City Blueprint: the strategic layer that connects
// vision (profile goals) → live model signals → proposed initiatives → KPIs →
// decisions (approve / defer / reject) → roadmap delivery. Proposals are
// generated from the REAL current model reading with full provenance ("why"),
// and approving one moves it onto the roadmap. Nothing here is invented: every
// row traces to a model signal, a Studio comparison, or the user.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useProfile } from '../lib/store'
import { useWorkspace } from '../lib/workspace'
import { classify } from '../lib/cityStatus'
import { cityName, cityGoals, OUTCOME_LABEL, fmtOutcome } from '../lib/cityContext'
import { PageHead, Sect, Button, Loading, EmptyState } from '../components/ui'
import Icon, { DOMAIN_ICON } from '../components/icons'

const ST = ['Proposed', 'Approved', 'Deferred', 'Rejected']

export default function Blueprint() {
  const nav = useNavigate()
  const { profile } = useProfile()
  const ws = useWorkspace()
  const [base, setBase] = useState(null)
  const [open, setOpen] = useState(null)

  useEffect(() => { api.analyze(profile, 'baseline').then(setBase).catch(() => {}) }, [])

  // Generate proposals from the live reading (idempotent via key).
  useEffect(() => {
    if (!base) return
    const cls = classify(base.reading)
    cls.attention.forEach((s) => {
      const act = base.next_actions.find((a) => a.domain === s.domain)
      ws.upsertBlueprint({
        key: `sig-${s.domain}`,
        title: act ? act.title : `Address ${s.domain_label.toLowerCase()} pressure`,
        domain: s.domain,
        why: `${s.domain_label} is in the ${s.status} band — ${s.driver}`,
        evidence: `${OUTCOME_LABEL[s.domain]}: ${fmtOutcome(s)} (live model reading)`,
        kpi: OUTCOME_LABEL[s.domain],
        expected: base.impact.focus_domain === s.domain ? base.impact.recommended_response : `Reduce ${OUTCOME_LABEL[s.domain].toLowerCase()} toward the stable band.`,
        risks: base.impact.focus_domain === s.domain ? base.impact.risks : 'Capacity not added before peak periods.',
        requiredData: base.integrity.data_gap,
        owner: act?.department || 'City Strategy',
        source: `Model signal · ${new Date().toLocaleDateString()}`,
      })
    })
  }, [base])

  const goals = cityGoals(profile)
  const city = cityName(profile)
  const groups = ST.map((s) => ({ s, items: ws.blueprint.filter((b) => (b.status || 'Proposed') === s) }))
  const approve = (b) => {
    ws.updateBlueprint(b.id, { status: 'Approved' })
    if (!ws.roadmap.some((r) => r.title === b.title))
      ws.addRoadmap({ title: b.title, objective: b.expected, department: b.owner, horizon: 'near', priority: 'High', domain: b.domain, dependency: b.requiredData ? 'Local data validation' : '—', next: 'Approve scope' })
  }

  if (!base && ws.blueprint.length === 0) return <><Head city={city} goals={goals} nav={nav} /><Loading label="Reading city signals…" /></>

  return (
    <>
      <Head city={city} goals={goals} nav={nav} />

      {groups.map(({ s, items }) => items.length > 0 && (
        <div key={s}>
          <Sect label={`${s} · ${items.length}`} />
          <div className="bp-list">
            {items.map((b) => (
              <div className={`bp-row card flat${open === b.id ? ' open' : ''}`} key={b.id}>
                <div className="bp-main" onClick={() => setOpen(open === b.id ? null : b.id)} role="button" tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setOpen(open === b.id ? null : b.id)}>
                  <span className="bp-ic"><Icon name={DOMAIN_ICON[b.domain] || 'target'} size={16} /></span>
                  <div className="bp-t">
                    <b>{b.title}</b>
                    <span>{b.kpi} · {b.owner}</span>
                  </div>
                  {s === 'Approved' && <span className="chip chip-stable">On roadmap</span>}
                  <Icon name={open === b.id ? 'up' : 'down'} size={15} className="bp-chev" />
                </div>
                {open === b.id && (
                  <div className="bp-detail">
                    <div className="bp-facts">
                      <Fact k="Why this was proposed" v={b.why} />
                      <Fact k="Evidence" v={b.evidence} />
                      <Fact k="Expected outcome" v={b.expected} />
                      <Fact k="Key risk" v={b.risks} />
                      <Fact k="Required data" v={b.requiredData} />
                      <Fact k="Source" v={b.source} />
                    </div>
                    <div className="bp-acts">
                      {s !== 'Approved' && <Button size="sm" className="btn-cyan" icon="check" onClick={() => approve(b)}>Approve → roadmap</Button>}
                      {s === 'Proposed' && <Button size="sm" variant="secondary" icon="clock" onClick={() => ws.updateBlueprint(b.id, { status: 'Deferred' })}>Defer</Button>}
                      {s !== 'Rejected' && <Button size="sm" variant="ghost" onClick={() => ws.updateBlueprint(b.id, { status: 'Rejected' })}>Reject</Button>}
                      {s !== 'Proposed' && <Button size="sm" variant="ghost" onClick={() => ws.updateBlueprint(b.id, { status: 'Proposed' })}>Reopen</Button>}
                      <button className="bp-del" title="Remove" onClick={() => ws.removeBlueprint(b.id)}><Icon name="waste" size={14} /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {ws.blueprint.length === 0 && (
        <div className="card flat"><EmptyState icon="target" title="No initiatives yet">
          Proposals appear here automatically from live model signals, or from “Prefer this option” in the Decision Studio.
        </EmptyState></div>
      )}

      <style>{css}</style>
    </>
  )
}

const Head = ({ city, goals, nav }) => (
  <PageHead eyebrow={`Blueprint · ${city}`} title="Living Smart City Blueprint"
    purpose={goals.length ? `City vision: ${goals.join(' · ')}` : 'Connects goals, live signals, initiatives, KPIs and delivery.'}>
    <Button variant="secondary" icon="scenarios" onClick={() => nav('/app/studio')}>Open Studio</Button>
  </PageHead>
)
const Fact = ({ k, v }) => v ? <div className="bp-fact"><span>{k}</span><p>{v}</p></div> : null

const css = `
.bp-list{display:flex;flex-direction:column;gap:10px}
.bp-row{padding:0;overflow:hidden}
.bp-main{display:flex;align-items:center;gap:13px;padding:15px 18px;cursor:pointer}
.bp-main:hover{background:var(--cp-surface-2)}
.bp-ic{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:var(--cp-teal-050);color:var(--cp-teal-600);flex:0 0 auto}
.bp-t{flex:1;min-width:0}
.bp-t b{display:block;font-size:14.5px;font-weight:700;color:var(--cp-ink);letter-spacing:-.01em}
.bp-t span{display:block;font-size:12px;color:var(--cp-muted);margin-top:2px}
.bp-chev{color:var(--cp-muted);flex:0 0 auto}
.bp-detail{border-top:1px solid var(--cp-border);padding:16px 18px;background:var(--cp-surface-2)}
.bp-facts{display:grid;grid-template-columns:1fr 1fr;gap:12px 24px}
.bp-fact span{display:block;font-size:9.5px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--cp-teal-600)}
.bp-fact p{font-size:12.5px;color:var(--cp-ink);line-height:1.5;margin-top:3px}
.bp-acts{display:flex;align-items:center;gap:9px;margin-top:14px;flex-wrap:wrap}
.bp-del{margin-inline-start:auto;background:none;border:none;color:var(--cp-muted);cursor:pointer;padding:5px;border-radius:7px}
.bp-del:hover{color:var(--cp-high)}
@media(max-width:760px){.bp-facts{grid-template-columns:1fr}}
`
