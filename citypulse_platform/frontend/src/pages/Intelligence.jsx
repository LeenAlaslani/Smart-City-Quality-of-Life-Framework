// CityPulse AI — City Intelligence: an interactive decision canvas with a
// guided entry flow. Decisions are filtered/relabelled for the SELECTED city;
// the ScenarioPulse morphs current→scenario when the REAL models run; practical
// outcomes show raw model values (with units) before→after; the CityPulse agent
// explains what changed, why it matters, the evidence, and what to consider
// next. All API/model/scenario/workspace logic preserved.
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { api } from '../lib/api'
import { useProfile } from '../lib/store'
import { useWorkspace } from '../lib/workspace'
import { cityName, cityDecisions, cityGoals, cityChallenges, GOAL_DOMAIN, DOMAIN_CATEGORIES, OUTCOME_LABEL, fmtOutcome, PROTOTYPE_NOTE } from '../lib/cityContext'
import { Button, Loading, ErrorState } from '../components/ui'
import { AgentBrief } from '../components/Agent'
import ScenarioPulse from '../components/ScenarioPulse'
import Reveal from '../components/Reveal'
import Icon, { DOMAIN_ICON } from '../components/icons'

const NEUTRAL = { traffic: 0, demand: 0, transit: 0 }
const DOMS = [
  { id: 'mobility', label: 'Transportation & Mobility' },
  { id: 'energy', label: 'Energy & Buildings' },
  { id: 'governance', label: 'Public Services' },
  { id: 'waste', label: 'Environment & Waste' },
]

export default function Intelligence() {
  const nav = useNavigate()
  const loc = useLocation()
  const { profile } = useProfile()
  const ws = useWorkspace()
  const [opts, setOpts] = useState(null)
  const [decision, setDecision] = useState(null)
  const [adj, setAdj] = useState(NEUTRAL)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)
  const [saved, setSaved] = useState({})
  const [guided, setGuided] = useState(() => new URLSearchParams(loc.search).get('guided') === '1')

  useEffect(() => { api.options().then(setOpts).catch((e) => setErr(e.message)) }, [])
  // Re-open the guided flow if "New decision" is pressed while already here.
  useEffect(() => { if (new URLSearchParams(loc.search).get('guided') === '1') setGuided(true) }, [loc.search])

  const decisions = useMemo(() => opts ? cityDecisions(profile, opts.decisions) : [], [opts, profile])

  const run = (dk = decision, a = adj) => {
    if (!dk) return
    setLoading(true); setErr(null)
    const ov = { traffic_mult: 1 + a.traffic / 100, demand_mult: 1 + a.demand / 100, transit_delta: a.transit }
    api.analyze(profile, dk, ov).then((r) => { setResult(r); setLoading(false) }).catch((e) => { setErr(e.message); setLoading(false) })
  }
  const pick = (dk) => { setDecision(dk); setAdj(NEUTRAL); run(dk, NEUTRAL) }

  // Default decision = first applicable one for this city (never a hidden one).
  useEffect(() => {
    if (opts && !decision && decisions.length && !guided) pick(decisions[0].id)
  }, [opts, decisions, guided])

  const dirty = adj.traffic || adj.demand || adj.transit
  const flash = (k) => { setSaved((s) => ({ ...s, [k]: true })); setTimeout(() => setSaved((s) => ({ ...s, [k]: false })), 1600) }
  const createAction = (a) => {
    ws.createAction({ title: a.title, type: 'Decision', domain: result.impact.focus_domain, department: a.department, priority: 'High', relatedArea: 'Citywide', source: `Scenario: ${result.decision.title}` })
    flash('act' + a.title)
  }
  const addRoadmap = () => { ws.addRoadmap({ title: result.decision.title, objective: result.impact.recommended_response, department: result.next_actions[0].department, horizon: 'near', priority: 'High', domain: result.impact.focus_domain, dependency: 'Scenario review', next: 'Approve scope' }); flash('road') }
  const saveScenario = () => { ws.saveScenario({ decisionId: decision, title: result.decision.title, city: result.city, summary: result.impact.what_changes, focus: result.impact.focus_label, movers: result.movers?.slice(0, 3) || [] }); flash('scn') }

  const curIdx = result ? Math.round(result.baseline_reading?.overall_pressure ?? result.reading.overall_pressure) : 0
  const scIdx = result ? Math.round(result.reading.overall_pressure) : 0
  const city = cityName(profile)

  // Practical outcome deltas (raw model values, before → after).
  const outcomes = useMemo(() => {
    if (!result?.baseline_reading) return []
    return Object.values(result.reading.signals).map((s) => {
      const b = result.baseline_reading.signals[s.domain]
      // only show rows whose formatted outcome visibly changes
      const changed = b && Math.abs(s.pressure - b.pressure) >= 1 && fmtOutcome(s) !== fmtOutcome(b)
      return { s, b, changed }
    }).sort((a, z) => Math.abs((z.s.pressure - (z.b?.pressure ?? 0))) - Math.abs((a.s.pressure - (a.b?.pressure ?? 0))))
  }, [result])

  const topMover = result?.movers?.[0]

  return (
    <div className="intel2">
      <div className="pg">
        <div>
          <div className="pg-eyebrow">Intelligence · {city}</div>
          <h1>Test a decision. See the consequences.</h1>
        </div>
        <div className="pg-r">
          {result?.decision?.is_scenario && <span className="chip chip-info"><Icon name="layers" size={13} /> Planning scenario</span>}
          <Button size="sm" variant="secondary" icon="spark" onClick={() => setGuided(true)}>Guided start</Button>
        </div>
      </div>

      {guided && opts && (
        <GuidedFlow profile={profile} decisions={decisions}
          onClose={() => setGuided(false)}
          onPick={(dk) => { setGuided(false); pick(dk) }} />
      )}

      {err && <ErrorState onRetry={() => run(decision)}>{err}</ErrorState>}

      {!err && !guided && (
        <div className="canvasx">
          {/* ── 1 · CHOOSE (city-specific) ─────────────────────────────── */}
          <div className="choose">
            <div className="col-k"><span className="col-n">1</span> Choose a decision</div>
            <div className="dlist">
              {decisions.map((d) => (
                <button key={d.id} className={`drow${decision === d.id ? ' on' : ''}`} onClick={() => pick(d.id)}>
                  <span className="di"><Icon name={d.icon || 'scenarios'} size={16} /></span>
                  <span className="dtx"><span className="dcat">{d.category}</span><span className="dt">{d.title}</span></span>
                </button>
              ))}
            </div>
          </div>

          {/* ── 2 · COMPARE (canvas) ───────────────────────────────────── */}
          <div className="canvas-col">
            <div className="col-k on-nav"><span className="col-n">2</span> Current vs scenario</div>
            <section className="panel canvasp">
              {!result ? <div className="canvas-load"><Loading label="Running the connected models…" /></div> : (
                <div style={{ opacity: loading ? 0.5 : 1, transition: 'opacity .2s' }}>
                  <div className="cvp-q">{result.decision.question}</div>
                  <ScenarioPulse
                    baseSignals={result.baseline_reading?.signals} scenSignals={result.reading.signals}
                    baseOverall={result.baseline_reading?.overall_pressure ?? result.reading.overall_pressure}
                    scenOverall={result.reading.overall_pressure} />
                  <div className="cvp-legend">
                    <span><i className="lg-ghost" /> Today {curIdx}</span>
                    <span><i className="lg-solid" /> Scenario {scIdx}</span>
                    <span><i className="lg-up" /> worsens</span>
                    <span><i className="lg-dn" /> improves</span>
                    <span className="cvp-note">node size = level · halo = size of change</span>
                  </div>
                  {/* practical outcomes: raw model values before → after */}
                  {outcomes.some((o) => o.changed) && (
                    <div className="cvp-outs">
                      {outcomes.filter((o) => o.changed).slice(0, 3).map(({ s, b }) => (
                        <div className="cvo" key={s.domain}>
                          <span className="cvo-l"><Icon name={DOMAIN_ICON[s.domain]} size={13} /> {OUTCOME_LABEL[s.domain]}</span>
                          <span className="cvo-v">
                            <s>{fmtOutcome(b)}</s>
                            <Icon name="arrowRight" size={12} />
                            <b style={{ color: s.pressure > b.pressure ? '#e6a06a' : '#7fdbb0' }}>{fmtOutcome(s)}</b>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* ── 3 · ADJUST & ACT ───────────────────────────────────────── */}
          <div className="act-col">
            <div className="col-k"><span className="col-n">3</span> Adjust &amp; act</div>

            <section className="card asm-card">
              <div className="asm-h">Assumptions <span>real models recompute</span></div>
              <Range label="Traffic on corridors" value={adj.traffic} min={-30} max={50} suffix="%" onChange={(v) => setAdj((s) => ({ ...s, traffic: v }))} />
              <Range label="Overall demand" value={adj.demand} min={-20} max={50} suffix="%" onChange={(v) => setAdj((s) => ({ ...s, demand: v }))} />
              <Range label="Transit coverage" value={adj.transit} min={0} max={40} suffix=" pts" onChange={(v) => setAdj((s) => ({ ...s, transit: v }))} />
              <div className="asm-run">
                <Button variant="primary" className="btn-cyan btn-block" icon="intelligence" onClick={() => run()} disabled={loading || !decision}>{loading ? 'Running models…' : 'Run scenario'}</Button>
                {dirty ? <button className="asm-reset" onClick={() => { setAdj(NEUTRAL); run(decision, NEUTRAL) }}>Reset assumptions</button> : null}
              </div>
            </section>

            {result && (
              <>
                <div className="act-list">
                  {result.next_actions.slice(0, 2).map((a, i) => (
                    <div className="act-row" key={i}>
                      <div className="ar-t">{a.title}<span>{a.department}</span></div>
                      <button className={`ar-btn${saved['act' + a.title] ? ' ok' : ''}`} onClick={() => createAction(a)}>
                        <Icon name={saved['act' + a.title] ? 'check' : 'plus'} size={14} />{saved['act' + a.title] ? 'Added' : 'Create'}
                      </button>
                    </div>
                  ))}
                </div>
                <div className="act-more">
                  <button className={`am-btn${saved.road ? ' ok' : ''}`} onClick={addRoadmap}><Icon name={saved.road ? 'check' : 'roadmap'} size={14} />{saved.road ? 'On roadmap' : 'Add to roadmap'}</button>
                  <button className={`am-btn${saved.scn ? ' ok' : ''}`} onClick={saveScenario}><Icon name={saved.scn ? 'check' : 'scenarios'} size={14} />{saved.scn ? 'Saved' : 'Save'}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── agent explanation + cross-domain consequences ───────────────── */}
      {result && !guided && (
        <Reveal>
          <div className="intel-low">
            <AgentBrief
              lines={[
                { k: 'What changed', v: result.impact.what_changes },
                { k: 'Why it matters', v: result.impact.why },
                topMover && { k: 'Evidence', v: `${topMover.label} moved most (${topMover.delta > 0 ? '+' : ''}${topMover.delta} index): ${fmtOutcome(result.baseline_reading?.signals[topMover.domain])} → ${fmtOutcome(result.reading.signals[topMover.domain])}.` },
                !topMover && { k: 'Evidence', v: `${result.impact.focus_label}: ${fmtOutcome(result.reading.signals[result.impact.focus_domain])} under these assumptions.` },
                { k: 'Consider next', v: `${result.impact.recommended_response} Start with “${result.next_actions[0]?.title}”.` },
              ].filter(Boolean)}
              actions={[{ label: 'Create the recommended action', icon: 'plus', fn: () => createAction(result.next_actions[0]) }]} />

            <div className="conseq">
              <div className="cq-h">What this means across the city</div>
              <div className="cq-grid">
                <Facet icon="pin" k="Areas likely affected" v={result.impact.affected.join(', ')} />
                <Facet icon="alert" k="Main pressure points" v={result.impact.pressure_points.map((p) => p.label).join(', ')} />
                <Facet icon="staffing" k="Resource implications" v={result.impact.resource_implications} />
                <Facet icon="target" k="Key risk" v={result.impact.risks} />
              </div>
              <button className="cq-note" onClick={() => nav('/app/evidence')}>
                <Icon name="info" size={14} /> {PROTOTYPE_NOTE}
              </button>
            </div>
          </div>
        </Reveal>
      )}

      <style>{intelStyles}</style>
    </div>
  )
}

// ── Guided flow: goal → domain → decision (city-specific, real options) ────
function GuidedFlow({ profile, decisions, onClose, onPick }) {
  const [step, setStep] = useState(0)
  const [goal, setGoal] = useState(null)
  const [dom, setDom] = useState(null)
  const goals = [
    ...(profile.priorities || []).map((id) => ({ id, label: cityGoals({ priorities: [id] })[0], kind: 'goal' })),
    ...(profile.challenges || []).map((id) => ({ id, label: cityChallenges({ challenges: [id] })[0], kind: 'challenge' })),
  ]
  const suggested = dom ? decisions.filter((d) => (DOMAIN_CATEGORIES[dom] || []).includes(d.category)) : decisions
  const rest = dom ? decisions.filter((d) => !(DOMAIN_CATEGORIES[dom] || []).includes(d.category)) : []
  const pickGoal = (g) => { setGoal(g); const d = GOAL_DOMAIN[g.id]; if (d) setDom(d); setStep(1) }

  return (
    <div className="gw">
      <div className="gw-head">
        <span className="gw-mark"><Icon name="spark" size={15} /></span>
        <div>
          <div className="gw-t">Guided decision · {cityName(profile)}</div>
          <div className="gw-s">{['Which city goal or problem are you addressing?', 'Which domain is most affected?', 'Which decision is being considered?'][step]}</div>
        </div>
        <button className="gw-x" onClick={onClose} aria-label="Close guided flow"><Icon name="plus" size={16} style={{ transform: 'rotate(45deg)' }} /></button>
      </div>
      <div className="gw-steps">
        {['Goal', 'Domain', 'Decision'].map((s, i) => (
          <span key={s} className={`gw-st${i === step ? ' on' : ''}${i < step ? ' done' : ''}`}>{i < step ? <Icon name="check" size={11} /> : i + 1}<em>{s}</em></span>
        ))}
      </div>

      {step === 0 && (
        <div className="gw-grid">
          {goals.length ? goals.map((g) => (
            <button key={g.kind + g.id} className="gw-opt" onClick={() => pickGoal(g)}>
              <span className={`gw-tag ${g.kind}`}>{g.kind === 'goal' ? 'City goal' : 'Challenge'}</span>{g.label}
            </button>
          )) : <div className="gw-none">No goals set in the city profile — pick a domain instead.<Button size="sm" variant="secondary" onClick={() => setStep(1)}>Choose domain</Button></div>}
          <button className="gw-skip" onClick={() => setStep(1)}>Skip — choose a domain directly</button>
        </div>
      )}

      {step === 1 && (
        <div className="gw-grid doms">
          {DOMS.map((d) => (
            <button key={d.id} className={`gw-opt dom${dom === d.id ? ' on' : ''}`} onClick={() => { setDom(d.id); setStep(2) }}>
              <span className="gw-di"><Icon name={DOMAIN_ICON[d.id]} size={18} /></span>{d.label}
            </button>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="gw-grid decs">
          {suggested.map((d) => (
            <button key={d.id} className="gw-opt dec" onClick={() => onPick(d.id)}>
              <span className="gw-di"><Icon name={d.icon || 'scenarios'} size={16} /></span>
              <span><span className="dcat">{d.category}</span><span className="dt">{d.title}</span></span>
              <Icon name="arrowRight" size={14} className="gw-go" />
            </button>
          ))}
          {rest.length > 0 && <div className="gw-restk">Other decisions for {cityName(profile)}</div>}
          {rest.map((d) => (
            <button key={d.id} className="gw-opt dec dim" onClick={() => onPick(d.id)}>
              <span className="gw-di"><Icon name={d.icon || 'scenarios'} size={16} /></span>
              <span><span className="dcat">{d.category}</span><span className="dt">{d.title}</span></span>
              <Icon name="arrowRight" size={14} className="gw-go" />
            </button>
          ))}
        </div>
      )}
      <div className="gw-foot">Next: adjust the assumptions to test, run the real models, review impact, evidence and the recommended action.</div>
    </div>
  )
}

function Range({ label, value, min, max, suffix = '', onChange }) {
  return (
    <div className="rng">
      <div className="rng-h"><span>{label}</span><b>{value > 0 ? '+' : ''}{value}{suffix}</b></div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  )
}
const Facet = ({ icon, k, v }) => (
  <div className="facet"><div className="fk"><Icon name={icon} size={14} /> {k}</div><div className="fv">{v}</div></div>
)

const intelStyles = `
.intel-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:20px}
.intel-head h1{font-size:clamp(22px,2.3vw,28px);font-weight:700;letter-spacing:-.02em;margin-top:3px}
.canvasx{display:grid;grid-template-columns:196px 1fr 284px;gap:16px;align-items:start}
.col-k{font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--cp-muted);display:flex;align-items:center;gap:8px;margin-bottom:12px}
.col-n{width:20px;height:20px;border-radius:50%;background:var(--cp-navy-600);color:#fff;font-size:11px;display:grid;place-items:center;font-weight:800}
.dlist{display:flex;flex-direction:column;gap:7px}
.drow{display:flex;align-items:center;gap:10px;text-align:left;background:var(--cp-surface);border:1px solid var(--cp-border);
  border-radius:11px;padding:9px 11px;cursor:pointer;font:inherit;transition:.14s}
.drow:hover{border-color:var(--cp-navy-500);box-shadow:var(--sh-1)}
.drow.on{border-color:transparent;background:linear-gradient(var(--cp-surface),var(--cp-surface)) padding-box,linear-gradient(135deg,var(--cp-teal-500),var(--cp-navy-600)) border-box;box-shadow:0 6px 16px rgba(20,131,154,.12)}
.drow .di{width:30px;height:30px;border-radius:8px;display:grid;place-items:center;background:var(--cp-surface-2);color:var(--cp-navy-600);flex:0 0 auto}
.drow.on .di{background:var(--grad-brand);color:#fff}
.drow .dtx{display:flex;flex-direction:column;min-width:0}
.drow .dcat,.gw-opt .dcat{font-size:9.5px;text-transform:uppercase;letter-spacing:.05em;color:var(--cp-muted);font-weight:700;display:block}
.drow .dt,.gw-opt .dt{font-size:13px;font-weight:600;color:var(--cp-ink);line-height:1.2;display:block}
.on-nav .col-n{background:var(--cp-teal-600)}
.canvasp{padding:16px 18px 18px;min-height:360px}
.canvas-load{min-height:340px;display:grid;place-items:center}
.cvp-q{color:#fff;font-size:15px;font-weight:600;text-align:center;margin-bottom:2px}
.cvp-legend{display:flex;align-items:center;justify-content:center;gap:14px;font-size:11.5px;color:var(--cp-on-panel-2);margin-top:4px;flex-wrap:wrap}
.cvp-legend i{display:inline-block;width:11px;height:11px;border-radius:50%;margin-right:5px;vertical-align:-1px}
.cvp-legend .lg-ghost{border:1.5px dashed rgba(255,255,255,.5)}
.cvp-legend .lg-solid{background:var(--cp-cyan)}
.cvp-legend .lg-up{background:#e6a06a}
.cvp-legend .lg-dn{background:#7fdbb0}
.cvp-legend .cvp-note{font-size:10.5px;opacity:.75}
.cvp-outs{margin-top:12px;display:flex;flex-direction:column;gap:6px}
.cvo{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 12px;border-radius:10px;
  background:rgba(255,255,255,.05);border:1px solid var(--cp-panel-border);font-size:12px}
.cvo-l{display:flex;align-items:center;gap:7px;color:var(--cp-on-panel-2);font-weight:600}
.cvo-v{display:flex;align-items:center;gap:7px;color:var(--cp-on-panel)}
.cvo-v s{color:rgba(169,192,221,.75);text-decoration-color:rgba(169,192,221,.5)}
.cvo-v svg{color:var(--cp-cyan-soft)}
.cvo-v b{font-weight:700}
/* act column */
.asm-card{padding:15px 16px}
.asm-h{font-size:14px;font-weight:700;color:var(--cp-ink);margin-bottom:12px;display:flex;justify-content:space-between;align-items:baseline}
.asm-h span{font-size:11px;font-weight:500;color:var(--cp-muted)}
.rng{margin-bottom:13px}
.rng-h{display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:6px}
.rng-h span{color:var(--cp-ink-2);font-weight:500}
.rng-h b{color:var(--cp-navy-700)}
.rng input[type=range]{width:100%}
.asm-run{margin-top:14px}
.asm-reset{display:block;width:100%;text-align:center;margin-top:9px;background:none;border:none;color:var(--cp-muted);font:inherit;font-size:12.5px;cursor:pointer}
.asm-reset:hover{color:var(--cp-ink-2)}
.act-list{margin-top:14px;display:flex;flex-direction:column;gap:8px}
.act-row{display:flex;align-items:center;gap:10px;border:1px solid var(--cp-border);border-radius:10px;padding:9px 11px;background:var(--cp-surface)}
.ar-t{flex:1;font-size:12.5px;font-weight:600;color:var(--cp-ink);line-height:1.25}
.ar-t span{display:block;font-size:11px;font-weight:400;color:var(--cp-muted);margin-top:1px}
.ar-btn,.am-btn{display:inline-flex;align-items:center;gap:5px;background:var(--cp-surface);border:1px solid var(--cp-border-strong);border-radius:8px;padding:6px 10px;font:inherit;font-size:12px;font-weight:600;color:var(--cp-navy-700);cursor:pointer;transition:.14s;white-space:nowrap}
.ar-btn:hover,.am-btn:hover{border-color:var(--cp-navy-500);background:var(--cp-surface-2)}
.ar-btn.ok,.am-btn.ok{color:var(--cp-stable);border-color:var(--cp-stable)}
.act-more{display:flex;gap:8px;margin-top:10px}
.act-more .am-btn{flex:1;justify-content:center}
/* lower band */
.intel-low{margin-top:20px;display:grid;grid-template-columns:1fr 1.2fr;gap:16px;align-items:start}
.conseq{background:var(--cp-surface);border:1px solid var(--cp-border);border-radius:16px;padding:20px 22px;box-shadow:0 1px 2px rgba(16,42,77,.04)}
.cq-h{font-size:15px;font-weight:700;color:var(--cp-ink);margin-bottom:14px}
.cq-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px 24px}
.cq-note{display:flex;align-items:center;gap:8px;margin-top:16px;padding-top:14px;border-top:1px solid var(--cp-border);
  background:none;border-left:none;border-right:none;border-bottom:none;font:inherit;font-size:12px;color:var(--cp-muted);cursor:pointer;text-align:left}
.cq-note:hover{color:var(--cp-teal-600)}
/* guided flow */
.gw{background:var(--cp-surface);border:1px solid var(--cp-border);border-radius:18px;padding:20px 22px;box-shadow:0 14px 40px rgba(16,42,77,.10);margin-bottom:20px}
.gw-head{display:flex;align-items:flex-start;gap:12px}
.gw-mark{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,#1aa6c0,#14839a);box-shadow:0 4px 12px rgba(20,131,154,.28);flex:0 0 auto}
.gw-t{font-size:11px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--cp-teal-600)}
.gw-s{font-size:17px;font-weight:700;color:var(--cp-ink);margin-top:3px;letter-spacing:-.01em}
.gw-x{margin-inline-start:auto;background:none;border:none;color:var(--cp-muted);cursor:pointer;padding:6px;border-radius:8px}
.gw-x:hover{background:var(--cp-surface-2);color:var(--cp-ink)}
.gw-steps{display:flex;gap:14px;margin:16px 0 14px}
.gw-st{display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:700;color:var(--cp-muted)}
.gw-st em{font-style:normal}
.gw-st::before{content:none}
.gw-st{border:1px solid var(--cp-border);border-radius:999px;padding:5px 12px}
.gw-st.on{border-color:var(--cp-teal-500);color:var(--cp-navy-700);background:var(--cp-teal-050)}
.gw-st.done{color:var(--cp-stable);border-color:var(--cp-stable)}
.gw-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.gw-grid.doms{grid-template-columns:repeat(4,1fr)}
.gw-grid.decs{grid-template-columns:repeat(3,1fr)}
.gw-opt{display:flex;align-items:center;gap:10px;text-align:left;background:var(--cp-surface);border:1px solid var(--cp-border);
  border-radius:12px;padding:13px 15px;font:inherit;font-size:13.5px;font-weight:600;color:var(--cp-ink);cursor:pointer;transition:.14s}
.gw-opt:hover{border-color:var(--cp-teal-500);box-shadow:var(--sh-1);transform:translateY(-1px)}
.gw-opt.on{border-color:var(--cp-teal-500);background:var(--cp-teal-050)}
.gw-opt.dim{opacity:.72}
.gw-tag{font-size:9px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;border-radius:6px;padding:3px 7px;flex:0 0 auto}
.gw-tag.goal{background:var(--cp-teal-050);color:var(--cp-teal-600)}
.gw-tag.challenge{background:var(--cp-elevated-bg);color:var(--cp-elevated)}
.gw-di{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;background:var(--cp-surface-2);color:var(--cp-navy-600);flex:0 0 auto}
.gw-opt.dom.on .gw-di{background:var(--grad-brand);color:#fff}
.gw-go{margin-inline-start:auto;color:var(--cp-muted)}
.gw-skip{grid-column:1/-1;background:none;border:none;font:inherit;font-size:12.5px;color:var(--cp-muted);cursor:pointer;text-align:center;padding:6px}
.gw-skip:hover{color:var(--cp-ink-2)}
.gw-restk{grid-column:1/-1;font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--cp-muted);margin-top:6px}
.gw-none{grid-column:1/-1;display:flex;align-items:center;gap:12px;font-size:13px;color:var(--cp-ink-2)}
.gw-foot{margin-top:14px;padding-top:12px;border-top:1px solid var(--cp-border);font-size:12px;color:var(--cp-muted)}
@media(max-width:1080px){.canvasx{grid-template-columns:1fr}.choose .dlist{flex-direction:row;flex-wrap:wrap}.drow{flex:1;min-width:150px}.intel-low{grid-template-columns:1fr}.gw-grid,.gw-grid.doms,.gw-grid.decs{grid-template-columns:1fr 1fr}}
@media(max-width:760px){.cq-grid{grid-template-columns:1fr}.gw-grid,.gw-grid.doms,.gw-grid.decs{grid-template-columns:1fr}}
`
