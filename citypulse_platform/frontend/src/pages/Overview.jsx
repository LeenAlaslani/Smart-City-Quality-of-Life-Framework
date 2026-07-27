// CityPulse AI — Overview: the executive City Command Brief. One story, top to
// bottom: situation → recommended decision (with real expected impact from a
// second live model run) → priority domains → service outcomes → delivery.
// The composite index is a small secondary diagnostic; no dominant score.
// Every value is real (models, profile, workspace); expected impact is an
// actual scenario run of the recommended decision, never an estimate.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useProfile } from '../lib/store'
import { useWorkspace } from '../lib/workspace'
import { classify } from '../lib/cityStatus'
import { greeting, cityName, OUTCOME_LABEL, fmtOutcome, fmtOutcomeShort, OUTCOME_UNIT, INDEX_DOC } from '../lib/cityContext'
import { recommendDecision, cityStatusLine, deliveryRisk } from '../lib/agent'
import { Loading, ErrorState, Tooltip } from '../components/ui'
import { Constellation } from '../components/viz2'
import Reveal from '../components/Reveal'
import Icon, { DOMAIN_ICON } from '../components/icons'

export default function Overview() {
  const nav = useNavigate()
  const { profile } = useProfile()
  const ws = useWorkspace()
  const [base, setBase] = useState(null)
  const [rec, setRec] = useState(null)        // recommendation meta
  const [recRun, setRecRun] = useState(null)  // real scenario run of the recommendation
  const [err, setErr] = useState(null)

  const load = () => {
    setErr(null); setBase(null); setRec(null); setRecRun(null)
    Promise.all([api.analyze(profile, 'baseline'), api.options()])
      .then(([b, o]) => {
        setBase(b)
        const r = recommendDecision(profile, b.reading, o.decisions)
        setRec(r)
        if (r) api.analyze(profile, r.decision.id).then(setRecRun).catch(() => {})
      })
      .catch((e) => setErr(e.message || String(e)))
  }
  useEffect(load, [])

  const city = base?.city || cityName(profile)
  if (err) return <ErrorState onRetry={load}>{err}</ErrorState>
  if (!base) return <Loading label={`Preparing the ${city} brief…`} />

  const cls = classify(base.reading)
  const status = cityStatusLine(base.reading)
  const risk = deliveryRisk(ws)
  const toReview = ws.actions.filter((a) => a.status === 'To review')
  const inProgress = ws.actions.filter((a) => a.status === 'In progress' || a.status === 'Approved')
  const roadActive = ws.roadmap.filter((r) => r.status !== 'Delivered')
  const idx = Math.round(base.reading.overall_pressure)

  // Expected impact of the recommended decision — from the real second run.
  let impact = null
  if (rec && recRun?.baseline_reading) {
    const dIdx = Math.round(recRun.reading.overall_pressure - recRun.baseline_reading.overall_pressure)
    const s = recRun.reading.signals[rec.domain]
    const b = recRun.baseline_reading.signals[rec.domain]
    impact = { dIdx, before: fmtOutcome(b), after: fmtOutcome(s), better: s.pressure <= b.pressure }
  }

  const createRec = () => {
    const a = base.next_actions?.[0]
    if (a && !ws.actions.some((x) => x.title === a.title))
      ws.createAction({ ...a, type: 'Decision', priority: 'High', status: 'To review', due: '' })
    nav('/app/actions')
  }

  return (
    <div className="ov3">
      <div className="ov3-greet">{greeting()} — the {city} brief.</div>

      {/* ── 1 · COMMAND BRIEF ─────────────────────────────────────────────── */}
      <Reveal>
        <section className="panel brief">
          <div className="brief-grid">
            {/* situation */}
            <div className="b-col b-sit">
              <div className="b-k">City status</div>
              <div className="b-status">
                <span className={`b-badge ${status.label === 'Steady' ? 'ok' : status.label === 'Act now' ? 'hot' : 'watch'}`}>{status.label}</span>
                <p>{status.detail}</p>
              </div>
              <div className="b-k" style={{ marginTop: 18 }}>Priorities</div>
              <div className="b-prios">
                {(cls.attention.length ? cls.attention : cls.ordered.slice(0, 1)).slice(0, 3).map((s) => (
                  <button className="b-prio" key={s.domain} onClick={() => nav('/app/intelligence')}>
                    <span className="sdot" style={{ background: s.color }} />
                    <span className="bp-n">{s.domain_label.split(' & ')[0]}</span>
                    <span className="bp-d">{s.driver}</span>
                    <Icon name="arrowRight" size={13} />
                  </button>
                ))}
                {cls.allStable && <div className="b-clear"><Icon name="check" size={14} /> No domain requires escalation today.</div>}
              </div>
              <div className={`b-risk ${risk.level}`}>
                <Icon name={risk.level === 'none' ? 'check' : 'alert'} size={13} /> {risk.text}
              </div>
            </div>

            {/* recommended decision */}
            <div className="b-col b-rec">
              <div className="b-k">Recommended next decision</div>
              {rec ? (
                <>
                  <h2>{rec.decision.title}</h2>
                  <p className="b-why">{rec.why}</p>
                  <div className="b-impact">
                    <span className="bi-k">Expected impact</span>
                    {impact ? (
                      <>
                        <span className={`bi-idx ${impact.dIdx <= 0 ? 'good' : 'bad'}`}>{impact.dIdx > 0 ? '+' : ''}{impact.dIdx} index</span>
                        <span className="bi-out">{impact.before} <Icon name="arrowRight" size={12} /> <b>{impact.after}</b></span>
                      </>
                    ) : <span className="bi-run"><span className="spinner sm" /> running the models…</span>}
                  </div>
                  <div className="b-cta">
                    <button className="btn btn-cyan" onClick={() => nav(`/app/studio?d=${rec.decision.id}`)}>Compare in Studio</button>
                    <button className="b-lnk" onClick={createRec}>Create action <Icon name="arrowRight" size={14} /></button>
                  </div>
                </>
              ) : <p className="b-why">No applicable decision found for this profile.</p>}
            </div>

            {/* signals */}
            <div className="b-col b-sig">
              <Constellation signals={base.reading.signals} size={124} />
              <div className="b-sigs">
                <span><span className="live-dot sm" /> Live model run</span>
                <span className="b-idx"><Tooltip text={INDEX_DOC} /> Index {idx}/100</span>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── 2 · SERVICE OUTCOMES ──────────────────────────────────────────── */}
      <div className="sect"><span>Service outcomes · live readings</span>
        <button className="sect-link" onClick={() => nav('/app/evidence')}>How these are computed <Icon name="arrowRight" size={13} /></button></div>
      <div className="ovo-grid">
        {cls.ordered.map((s, i) => (
          <Reveal key={s.domain} delay={i * 50}>
            <button className="ovo-tile" onClick={() => nav('/app/intelligence')} title={s.driver}>
              <div className="ovo-top">
                <span className="ovo-ic"><Icon name={DOMAIN_ICON[s.domain]} size={16} /></span>
                <span className="ovo-st" style={{ color: s.color }}>{s.status}</span>
              </div>
              <div className="ovo-v">{fmtOutcomeShort(s)}<small> {OUTCOME_UNIT[s.domain]}</small></div>
              <div className="ovo-l">{OUTCOME_LABEL[s.domain]}</div>
              <div className="ovo-bar"><i style={{ width: `${Math.min(100, s.pressure)}%`, background: s.color }} /></div>
            </button>
          </Reveal>
        ))}
      </div>

      {/* ── 3 · DELIVERY ──────────────────────────────────────────────────── */}
      <div className="sect"><span>Delivery</span></div>
      <Reveal>
        <div className="ov-del">
          <button className="ovd" onClick={() => nav('/app/actions')}>
            <Icon name="clock" size={16} /><b>{toReview.length}</b> to review
          </button>
          <button className="ovd" onClick={() => nav('/app/actions')}>
            <Icon name="actions" size={16} /><b>{inProgress.length}</b> in delivery
          </button>
          <button className="ovd" onClick={() => nav('/app/roadmap')}>
            <Icon name="roadmap" size={16} /><b>{roadActive.length}</b> roadmap active
          </button>
          <button className="ovd" onClick={() => nav('/app/blueprint')}>
            <Icon name="target" size={16} /><b>{ws.blueprint.length}</b> blueprint items
          </button>
          <button className="ovd ghost" onClick={() => nav('/app/reports')}>
            Executive report <Icon name="arrowRight" size={14} />
          </button>
        </div>
      </Reveal>

      <style>{ovStyles}</style>
    </div>
  )
}

const ovStyles = `
.ov3-greet{font-size:13px;font-weight:600;color:var(--cp-muted);margin-bottom:14px;letter-spacing:.01em}
/* brief */
.brief{padding:26px 28px}
.brief-grid{display:grid;grid-template-columns:1.15fr 1fr 148px;gap:28px;align-items:start}
.b-k{font-size:10.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--cp-cyan-soft)}
.b-status{display:flex;align-items:center;gap:12px;margin-top:10px}
.b-badge{font-size:13px;font-weight:800;padding:5px 13px;border-radius:999px;letter-spacing:.02em}
.b-badge.ok{background:rgba(47,158,123,.18);color:#7fdbb0}
.b-badge.watch{background:rgba(127,219,232,.14);color:#a9d6e8}
.b-badge.hot{background:rgba(230,160,106,.16);color:#e6a06a}
.b-status p{font-size:13.5px;color:var(--cp-on-panel-2);line-height:1.4}
.b-prios{display:flex;flex-direction:column;gap:8px;margin-top:10px}
.b-prio{display:flex;align-items:center;gap:10px;text-align:left;background:rgba(255,255,255,.05);border:1px solid var(--cp-panel-border);
  border-radius:11px;padding:10px 13px;font:inherit;cursor:pointer;transition:.14s;color:var(--cp-on-panel)}
.b-prio:hover{background:rgba(255,255,255,.09)}
.bp-n{font-size:13.5px;font-weight:700;color:#fff;flex:0 0 auto}
.bp-d{font-size:12px;color:var(--cp-on-panel-2);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.b-prio svg{color:var(--cp-cyan-soft);flex:0 0 auto}
.b-clear{display:flex;align-items:center;gap:8px;font-size:13px;color:#7fdbb0;padding:8px 2px}
.b-risk{display:flex;align-items:flex-start;gap:7px;margin-top:14px;font-size:12px;color:var(--cp-on-panel-2);line-height:1.45}
.b-risk.high{color:#e6a06a}
.b-risk svg{flex:0 0 auto;margin-top:1px}
/* recommendation */
.b-rec{border-inline-start:1px solid var(--cp-panel-border);padding-inline-start:28px}
.b-rec h2{color:#fff;font-size:20px;letter-spacing:-.015em;margin-top:10px;line-height:1.2}
.b-why{font-size:12.5px;color:var(--cp-on-panel-2);line-height:1.5;margin-top:8px}
.b-impact{margin-top:14px;background:rgba(255,255,255,.05);border:1px solid var(--cp-panel-border);border-radius:11px;padding:11px 13px;
  display:flex;flex-direction:column;gap:6px}
.bi-k{font-size:9.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--cp-cyan-soft)}
.bi-idx{font-size:15px;font-weight:800}
.bi-idx.good{color:#7fdbb0}.bi-idx.bad{color:#e6a06a}
.bi-out{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--cp-on-panel-2)}
.bi-out b{color:#fff}
.bi-out svg{color:var(--cp-cyan-soft)}
.bi-run{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--cp-on-panel-2)}
.spinner.sm{width:13px;height:13px;border-width:2px}
.b-cta{display:flex;align-items:center;gap:14px;margin-top:14px;flex-wrap:wrap}
.b-lnk{background:none;border:none;color:var(--cp-cyan-soft);font:inherit;font-size:13px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px}
.b-lnk:hover{color:#fff}
/* signals mini */
.b-sig{display:flex;flex-direction:column;align-items:center;gap:8px}
.b-sigs{display:flex;flex-direction:column;gap:5px;align-items:center}
.b-sigs span{display:inline-flex;align-items:center;gap:6px;font-size:11px;color:var(--cp-on-panel-2)}
.b-idx .tip .dot{border-color:rgba(255,255,255,.3);color:var(--cp-on-panel-2)}
.live-dot.sm{width:6px;height:6px}
/* outcomes (flat) */
.ovo-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.ovo-tile{text-align:left;background:var(--cp-surface);border:1px solid var(--cp-border);border-radius:14px;padding:16px 17px;
  cursor:pointer;font:inherit;transition:border-color .16s,transform .16s}
.ovo-tile:hover{border-color:var(--cp-border-strong);transform:translateY(-2px)}
.ovo-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.ovo-ic{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;background:var(--cp-teal-050);color:var(--cp-teal-600)}
.ovo-st{font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.05em}
.ovo-v{font-size:23px;font-weight:800;color:var(--cp-ink);letter-spacing:-.02em;line-height:1}
.ovo-v small{font-size:11px;font-weight:600;color:var(--cp-muted);letter-spacing:0}
.ovo-l{font-size:12.5px;font-weight:600;color:var(--cp-ink-2);margin-top:5px}
.ovo-bar{height:4px;border-radius:3px;background:var(--cp-surface-2);margin-top:12px;overflow:hidden}
.ovo-bar i{display:block;height:100%;border-radius:3px;opacity:.7;transition:width .7s cubic-bezier(.2,.8,.2,1)}
/* delivery */
.ov-del{display:flex;gap:12px;flex-wrap:wrap}
.ovd{display:inline-flex;align-items:center;gap:9px;background:var(--cp-surface);border:1px solid var(--cp-border);
  border-radius:12px;padding:11px 16px;font:inherit;font-size:13px;color:var(--cp-ink-2);cursor:pointer;transition:.15s}
.ovd svg{color:var(--cp-teal-600)}
.ovd b{color:var(--cp-ink);font-weight:800}
.ovd:hover{border-color:var(--cp-border-strong)}
.ovd.ghost{margin-inline-start:auto;color:var(--cp-navy-700);font-weight:600}
@media(max-width:1080px){.brief-grid{grid-template-columns:1fr 1fr}.b-sig{display:none}.ovo-grid{grid-template-columns:1fr 1fr}}
@media(max-width:760px){.brief-grid{grid-template-columns:1fr}.b-rec{border:none;padding-inline-start:0;border-top:1px solid var(--cp-panel-border);padding-top:18px}
  .ovo-grid{grid-template-columns:1fr}.ovd.ghost{margin-inline-start:0}}
`
