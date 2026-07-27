// CityPulse AI — Decision Workspace: the agent-led decision journey. The agent
// frames why you're here (live signal), you pick a decision and adjust
// assumptions, the REAL models run, and current vs proposed is shown per domain
// in real units. Impact is labelled an ESTIMATED scenario outcome, never a
// verified forecast. You can pin one second option to compare. Nothing goes to
// execution: "Submit for review" creates an initiative with a named owner and
// reviewer for a human to approve in Initiatives.
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { api } from '../lib/api'
import { useProfile } from '../lib/store'
import { useWorkspace, DEPARTMENTS } from '../lib/workspace'
import { cityName, cityDecisions, OUTCOME_LABEL, fmtOutcome } from '../lib/cityContext'
import { recommendDecision } from '../lib/agent'
import { classify, bandOf } from '../lib/cityStatus'
import { PageHead, Button, Loading, ErrorState } from '../components/ui'
import Icon, { DOMAIN_ICON } from '../components/icons'

const NEUTRAL = { traffic: 0, demand: 0, transit: 0 }
const ov = (a) => ({ traffic_mult: 1 + a.traffic / 100, demand_mult: 1 + a.demand / 100, transit_delta: a.transit })

export default function Workspace() {
  const nav = useNavigate()
  const loc = useLocation()
  const { profile } = useProfile()
  const ws = useWorkspace()
  const [opts, setOpts] = useState(null)
  const [decisionId, setDecisionId] = useState(null)
  const [adj, setAdj] = useState(NEUTRAL)
  const [result, setResult] = useState(null)
  const [rec, setRec] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  // option B
  const [bId, setBId] = useState('')
  const [bRes, setBRes] = useState(null)
  const [bLoading, setBLoading] = useState(false)
  // submit
  const [owner, setOwner] = useState('City Strategy')
  const [reviewer, setReviewer] = useState('City Strategy')
  const [submitting, setSubmitting] = useState(false)

  const decisions = useMemo(() => opts ? cityDecisions(profile, opts.decisions) : [], [opts, profile])
  const qd = new URLSearchParams(loc.search).get('d')

  useEffect(() => {
    setLoading(true)
    Promise.all([api.options(), api.analyze(profile, 'baseline')])
      .then(([o, b]) => {
        setOpts(o)
        const r = recommendDecision(profile, b.reading, o.decisions)
        setRec(r)
        const start = qd || r?.decision.id || cityDecisions(profile, o.decisions)[0]?.id
        setDecisionId(start)
        run(start, NEUTRAL)
      })
      .catch((e) => { setErr(e.message); setLoading(false) })
  }, [])

  const run = (id = decisionId, a = adj) => {
    if (!id) return
    setLoading(true); setErr(null)
    api.analyze(profile, id, ov(a))
      .then((r) => { setResult(r); setLoading(false); setOwner(r.next_actions?.[0]?.department || 'City Strategy') })
      .catch((e) => { setErr(e.message); setLoading(false) })
  }
  const pick = (id) => { setDecisionId(id); setAdj(NEUTRAL); setBRes(null); setBId(''); run(id, NEUTRAL) }
  const runB = (id) => {
    setBId(id); if (!id) { setBRes(null); return }
    setBLoading(true)
    api.analyze(profile, id).then((r) => { setBRes(r); setBLoading(false) }).catch(() => setBLoading(false))
  }

  const city = cityName(profile)
  const decision = decisions.find((d) => d.id === decisionId)
  const dirty = adj.traffic || adj.demand || adj.transit

  // estimated outcome for the domain the decision actually moves most (falls
  // back to the scenario focus), current → proposed
  const focus = result?.movers?.[0]?.domain || result?.impact?.focus_domain
  const est = result?.baseline_reading && focus ? {
    domain: focus,
    before: fmtOutcome(result.baseline_reading.signals[focus]),
    after: fmtOutcome(result.reading.signals[focus]),
    better: result.reading.signals[focus].pressure <= result.baseline_reading.signals[focus].pressure,
  } : null

  const submit = () => {
    if (!result) return
    ws.addInitiative({
      title: decision?.title || result.decision.title, domain: focus,
      why: rec?.why || result.impact.why,
      evidence: est ? `${OUTCOME_LABEL[focus]}: ${est.before} now → ${est.after} estimated under this decision.` : `${OUTCOME_LABEL[focus]}: ${fmtOutcome(result.reading.signals[focus])} estimated.`,
      expected: result.impact.recommended_response,
      risks: result.impact.risks, requiredData: result.integrity.data_gap,
      owner, reviewer, status: 'In review', source: 'Decision Workspace',
    })
    nav('/app/initiatives')
  }

  if (err) return <><Head city={city} /><ErrorState onRetry={() => run()}>{err}</ErrorState></>

  return (
    <>
      <Head city={city} />

      {/* framing — the agent states why you're here */}
      <div className="wk-frame">
        <span className="wk-mark"><Icon name="spark" size={16} /></span>
        <div className="wk-fx">
          <div className="wk-fk">CityPulse agent · investigation</div>
          <p>{rec ? rec.why : 'Choose a decision to investigate against the live models.'}</p>
        </div>
        <div className="wk-dpick">
          <label>Decision</label>
          <select value={decisionId || ''} onChange={(e) => pick(e.target.value)}>
            {decisions.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
          </select>
        </div>
      </div>

      <div className="wk-grid">
        {/* left — assumptions & option B */}
        <div className="wk-col">
          <section className="card flat">
            <div className="wk-h">Assumptions <em>real models recompute</em></div>
            <Range label="Traffic on corridors" value={adj.traffic} min={-30} max={50} suffix="%" onChange={(v) => setAdj((s) => ({ ...s, traffic: v }))} />
            <Range label="Overall demand" value={adj.demand} min={-20} max={50} suffix="%" onChange={(v) => setAdj((s) => ({ ...s, demand: v }))} />
            <Range label="Transit coverage" value={adj.transit} min={0} max={40} suffix=" pts" onChange={(v) => setAdj((s) => ({ ...s, transit: v }))} />
            <div className="wk-run">
              <Button className="btn-cyan btn-block" icon="pulse" onClick={() => run()} disabled={loading}>{loading ? 'Running models…' : 'Run models'}</Button>
              {dirty ? <button className="wk-reset" onClick={() => { setAdj(NEUTRAL); run(decisionId, NEUTRAL) }}>Reset assumptions</button> : null}
            </div>
          </section>

          <section className="card flat wk-opt">
            <div className="wk-h">Compare a second option <em>optional</em></div>
            <select className="wk-bsel" value={bId} onChange={(e) => runB(e.target.value)}>
              <option value="">Select an option to compare…</option>
              {decisions.filter((d) => d.id !== decisionId).map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
            </select>
            {bLoading && <div className="wk-bwait"><span className="spinner sm" /> running…</div>}
            {bRes && result && <OptionCompare a={result} b={bRes} focus={focus} aName={decision?.title} bName={decisions.find((d) => d.id === bId)?.title} />}
          </section>
        </div>

        {/* right — result + recommendation + submit */}
        <div className="wk-col wk-main">
          {loading && !result ? <div className="card flat"><Loading label="Running the connected models…" /></div> : result && (
            <>
              <section className="card flat" style={{ opacity: loading ? 0.55 : 1, transition: 'opacity .2s' }}>
                <div className="wk-h">Current vs proposed <span className="wk-est">estimated scenario outcome — not a forecast</span></div>
                <div className="wk-cmp">
                  {Object.values(result.reading.signals).map((s) => {
                    const b = result.baseline_reading.signals[s.domain]
                    const changed = b && fmtOutcome(s) !== fmtOutcome(b)
                    return (
                      <div className="wk-dom" key={s.domain}>
                        <span className="wk-dn"><Icon name={DOMAIN_ICON[s.domain]} size={14} /> {s.domain_label.split(' & ')[0]}</span>
                        <span className="wk-dv">
                          <s>{fmtOutcome(b)}</s>
                          {changed ? <><Icon name="arrowRight" size={12} /><b style={{ color: s.pressure > b.pressure ? 'var(--cp-high)' : 'var(--cp-stable)' }}>{fmtOutcome(s)}</b></> : <em>no change</em>}
                        </span>
                        <span className="wk-db"><span className={`chip chip-${band(s.status)}`}>{s.status}</span></span>
                      </div>
                    )
                  })}
                </div>
              </section>

              <section className="card flat wk-rec">
                <div className="wk-h"><span className="wk-recmark"><Icon name="spark" size={13} /></span> Agent recommendation</div>
                <p className="wk-rt">{result.impact.what_changes}</p>
                <div className="wk-rev">
                  <div><span>Evidence</span>{est ? <>{est.before} → <b>{est.after}</b> ({OUTCOME_LABEL[focus].toLowerCase()}), estimated</> : result.impact.why}</div>
                  <div><span>Key risk</span>{result.impact.risks}</div>
                  <div><span>Recommended</span>{result.impact.recommended_response}</div>
                </div>
              </section>

              {/* submit for review — human ownership */}
              <section className="card flat wk-submit">
                {!submitting ? (
                  <div className="wk-sbar">
                    <div className="wk-shint"><Icon name="info" size={14} /> Submitting sends this to <b>Initiatives</b> for human review — it is not executed automatically.</div>
                    <Button className="btn-cyan" icon="arrowRight" onClick={() => setSubmitting(true)}>Submit for review</Button>
                  </div>
                ) : (
                  <div className="wk-sform">
                    <div className="wk-sf">
                      <label>Owner<select value={owner} onChange={(e) => setOwner(e.target.value)}>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</select></label>
                      <label>Reviewer<select value={reviewer} onChange={(e) => setReviewer(e.target.value)}>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</select></label>
                    </div>
                    <div className="wk-sacts">
                      <Button variant="ghost" onClick={() => setSubmitting(false)}>Cancel</Button>
                      <Button className="btn-cyan" icon="check" onClick={submit}>Confirm — send for review</Button>
                    </div>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>

      <button className="wk-note" onClick={() => nav('/app/evidence')}>
        <Icon name="info" size={13} /> Prototype · local validation pending — how these models work
      </button>
      <style>{css}</style>
    </>
  )
}

const Head = ({ city }) => (
  <PageHead eyebrow={`Decision Workspace · ${city}`} title="Investigate a decision"
    purpose="The agent frames the issue from live signals; you test assumptions and submit a recommendation for review." />
)

function OptionCompare({ a, b, focus, aName, bName }) {
  const fa = a.reading.signals[focus], fb = b.reading.signals[focus]
  const aBetter = fa.pressure <= fb.pressure
  return (
    <div className="oc">
      <div className="oc-row"><span className="oc-n">A · {aName}</span><b>{fmtOutcome(fa)}</b>{aBetter && <span className="oc-win">better</span>}</div>
      <div className="oc-row"><span className="oc-n">B · {bName}</span><b>{fmtOutcome(fb)}</b>{!aBetter && <span className="oc-win">better</span>}</div>
      <p className="oc-agent"><Icon name="spark" size={12} /> Agent: for {OUTCOME_LABEL[focus].toLowerCase()}, <b>{aBetter ? 'Option A' : 'Option B'}</b> gives the better estimated outcome.</p>
    </div>
  )
}

function Range({ label, value, min, max, suffix = '', onChange }) {
  return (
    <div className="wk-rng">
      <div className="wk-rh"><span>{label}</span><b>{value > 0 ? '+' : ''}{value}{suffix}</b></div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  )
}
const band = (status) => ({ Stable: 'stable', Watch: 'watch', Elevated: 'elevated', High: 'high', Critical: 'critical' }[status] || 'neutral')

const css = `
.wk-frame{display:flex;align-items:center;gap:14px;background:var(--cp-surface);border:1px solid var(--cp-border);border-radius:14px;padding:15px 18px;margin-bottom:16px}
.wk-mark{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;color:#fff;background:var(--cp-teal-600);flex:0 0 auto}
.wk-fx{flex:1;min-width:0}
.wk-fk{font-size:10px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--cp-teal-600)}
.wk-fx p{font-size:13.5px;color:var(--cp-ink);line-height:1.45;margin-top:3px}
.wk-dpick{display:flex;flex-direction:column;gap:5px;flex:0 0 auto}
.wk-dpick label{font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--cp-muted)}
.wk-dpick select,.wk-bsel{font:inherit;font-size:13px;font-weight:600;color:var(--cp-ink);border:1px solid var(--cp-border-strong);border-radius:9px;padding:8px 11px;background:#fff;max-width:230px}
.wk-grid{display:grid;grid-template-columns:300px 1fr;gap:16px;align-items:start}
.wk-col{display:flex;flex-direction:column;gap:16px}
.wk-h{font-size:14px;font-weight:700;color:var(--cp-ink);margin-bottom:12px;display:flex;align-items:center;gap:8px}
.wk-h em{font-style:normal;font-size:11px;font-weight:500;color:var(--cp-muted)}
.wk-est{font-size:10.5px;font-weight:600;color:var(--cp-elevated);background:var(--cp-elevated-bg);border-radius:6px;padding:2px 8px;margin-inline-start:auto}
.wk-rng{margin-bottom:13px}
.wk-rh{display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:6px}
.wk-rh span{color:var(--cp-ink-2);font-weight:500}.wk-rh b{color:var(--cp-navy-700)}
.wk-rng input[type=range]{width:100%}
.wk-run{margin-top:14px}
.wk-reset{display:block;width:100%;text-align:center;margin-top:9px;background:none;border:none;color:var(--cp-muted);font:inherit;font-size:12.5px;cursor:pointer}
.wk-reset:hover{color:var(--cp-ink-2)}
.wk-bsel{max-width:none;width:100%}
.wk-bwait{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--cp-muted);margin-top:10px}
.spinner.sm{width:13px;height:13px;border-width:2px}
.oc{margin-top:12px}
.oc-row{display:flex;align-items:center;gap:10px;padding:9px 11px;border:1px solid var(--cp-border);border-radius:9px;margin-bottom:7px;font-size:12.5px}
.oc-n{flex:1;color:var(--cp-ink-2);font-weight:600}
.oc-row b{color:var(--cp-ink)}
.oc-win{font-size:10px;font-weight:800;text-transform:uppercase;color:var(--cp-stable);background:var(--cp-stable-bg);border-radius:6px;padding:2px 7px}
.oc-agent{display:flex;align-items:flex-start;gap:6px;font-size:12px;color:var(--cp-ink-2);line-height:1.45;margin-top:6px}
.oc-agent svg{color:var(--cp-teal-600);flex:0 0 auto;margin-top:2px}
/* compare */
.wk-cmp{display:flex;flex-direction:column;gap:2px}
.wk-dom{display:grid;grid-template-columns:150px 1fr 90px;align-items:center;gap:12px;padding:11px 4px;border-bottom:1px solid var(--cp-border)}
.wk-dom:last-child{border-bottom:none}
.wk-dn{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:var(--cp-ink)}
.wk-dn svg{color:var(--cp-ink-2)}
.wk-dv{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--cp-ink-2)}
.wk-dv s{color:var(--cp-muted)}
.wk-dv b{font-weight:700}
.wk-dv em{font-style:normal;color:var(--cp-muted);font-size:12px}
.wk-dv svg{color:var(--cp-teal-600)}
.wk-db{text-align:right}
/* recommendation */
.wk-rec{border:1px solid #cfe7ec;background:linear-gradient(180deg,#f6fbfc,#fff)}
.wk-recmark{width:22px;height:22px;border-radius:7px;display:grid;place-items:center;color:#fff;background:var(--cp-teal-600)}
.wk-rt{font-size:14px;color:var(--cp-ink);line-height:1.5;margin-bottom:12px}
.wk-rev{display:flex;flex-direction:column;gap:9px}
.wk-rev > div{font-size:12.5px;color:var(--cp-ink);line-height:1.45}
.wk-rev span{display:block;font-size:9.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--cp-teal-600);margin-bottom:2px}
.wk-rev b{font-weight:700}
/* submit */
.wk-sbar{display:flex;align-items:center;gap:16px}
.wk-shint{flex:1;display:flex;align-items:flex-start;gap:8px;font-size:12.5px;color:var(--cp-ink-2);line-height:1.45}
.wk-shint svg{color:var(--cp-teal-600);flex:0 0 auto;margin-top:1px}
.wk-sform{display:flex;flex-direction:column;gap:14px}
.wk-sf{display:flex;gap:16px;flex-wrap:wrap}
.wk-sf label{flex:1;min-width:180px;font-size:10.5px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--cp-muted);display:flex;flex-direction:column;gap:5px}
.wk-sf select{font:inherit;font-size:13px;font-weight:500;color:var(--cp-ink);border:1px solid var(--cp-border-strong);border-radius:9px;padding:9px 11px;background:#fff}
.wk-sacts{display:flex;gap:10px;justify-content:flex-end}
.wk-note{display:inline-flex;align-items:center;gap:7px;background:none;border:none;font:inherit;font-size:12px;color:var(--cp-muted);cursor:pointer;margin-top:16px;padding:4px}
.wk-note:hover{color:var(--cp-teal-600)}
.wk-note svg{color:var(--cp-elevated)}
@media(max-width:980px){.wk-grid{grid-template-columns:1fr}.wk-frame{flex-wrap:wrap}.wk-dpick{width:100%}.wk-dpick select{max-width:none;width:100%}}
`
