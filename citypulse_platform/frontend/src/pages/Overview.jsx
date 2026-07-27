// CityPulse AI — Overview: an integrated city-operations dashboard. Four unified
// domain KPIs (real outcomes + units), one comparison visual (each domain on its
// OWN model scale — the four models use unrelated units, so they are never ranked
// on one hidden score), a compact alerts panel, one recommended decision (impact
// from a real second model run, labelled ESTIMATED), and a delivery summary from
// the real workspace. No composite index, no constellation, no invented trends.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useProfile } from '../lib/store'
import { useWorkspace, STAGES } from '../lib/workspace'
import { classify } from '../lib/cityStatus'
import { cityName, OUTCOME_LABEL, fmtOutcome, fmtOutcomeShort, OUTCOME_UNIT } from '../lib/cityContext'
import { recommendDecision, cityStatusLine } from '../lib/agent'
import { Loading, ErrorState } from '../components/ui'
import Reveal from '../components/Reveal'
import Icon, { DOMAIN_ICON } from '../components/icons'

const ORDER = ['mobility', 'energy', 'waste', 'governance']
const DLABEL = { mobility: 'Transportation & Mobility', energy: 'Energy & Buildings', waste: 'Environment & Waste', governance: 'Governance & Public Services' }
const band = (s) => ({ Stable: 'stable', Watch: 'watch', Elevated: 'elevated', High: 'high', Critical: 'critical' }[s] || 'neutral')
const STAGE_TONE = { Proposed: '#6b7a90', 'In review': '#1d4a82', Approved: '#5a86ad', 'In delivery': '#b98f3f', Delivered: '#2f9e7b' }

export default function Overview() {
  const nav = useNavigate()
  const { profile } = useProfile()
  const ws = useWorkspace()
  const [base, setBase] = useState(null)
  const [rec, setRec] = useState(null)
  const [recRun, setRecRun] = useState(null)
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
  if (!base) return <Loading label={`Preparing the ${city} operations view…`} />

  const cls = classify(base.reading)
  const status = cityStatusLine(base.reading)
  const inits = ws.initiatives || []
  const stageCounts = STAGES.map((st) => ({ st, n: inits.filter((i) => i.status === st).length }))
  const totalStage = stageCounts.reduce((a, b) => a + b.n, 0) || 1

  // estimated impact of the recommendation, from the real second run
  let impact = null
  if (rec && recRun?.baseline_reading) {
    const s = recRun.reading.signals[rec.domain], b = recRun.baseline_reading.signals[rec.domain]
    impact = { before: fmtOutcome(b), after: fmtOutcome(s), better: s.pressure <= b.pressure }
  }

  return (
    <div className="ops">
      {/* header */}
      <div className="ops-head">
        <div>
          <div className="ops-eyebrow">City Operations</div>
          <h1>{city}</h1>
        </div>
        <div className="ops-hr">
          <span className={`ops-status ${status.label === 'Steady' ? 'ok' : status.label === 'Act now' ? 'hot' : 'watch'}`}>{status.label}</span>
          <button className="ops-proto" onClick={() => nav('/app/evidence')} title="Model validation status">Prototype · validation pending</button>
        </div>
      </div>
      <div className="ops-sub">Current snapshot · {status.detail}</div>

      {/* KPI row */}
      <div className="kpi-row">
        {ORDER.map((d, i) => {
          const s = base.reading.signals[d]
          return (
            <Reveal key={d} delay={i * 45}>
              <button className="kpi" onClick={() => nav('/app/signals')}>
                <div className="kpi-top"><span className="kpi-ic"><Icon name={DOMAIN_ICON[d]} size={16} /></span>
                  <span className={`sdot chip chip-${band(s.status)}`}><span className="led" style={{ background: s.color }} />{s.status}</span></div>
                <div className="kpi-v">{fmtOutcomeShort(s)}<small> {OUTCOME_UNIT[d]}</small></div>
                <div className="kpi-l">{DLABEL[d]}</div>
              </button>
            </Reveal>
          )
        })}
      </div>

      {/* main row */}
      <div className="ops-main">
        {/* comparison visual: per-domain status tracks */}
        <Reveal className="ops-tracks-w">
          <section className="card flat ops-tracks">
            <div className="ops-ch">Domain status <em>each domain on its own model scale — not ranked against the others</em></div>
            <div className="tks">
              {ORDER.map((d) => {
                const s = base.reading.signals[d]
                return (
                  <div className="tk" key={d}>
                    <span className="tk-n"><Icon name={DOMAIN_ICON[d]} size={14} /> {DLABEL[d].split(' & ')[0]}</span>
                    <div className="tk-bar">
                      <span className="tk-z z1" /><span className="tk-z z2" /><span className="tk-z z3" />
                      <span className="tk-mk" style={{ left: `${Math.max(3, Math.min(97, s.pressure))}%`, borderColor: s.color }} />
                    </div>
                    <span className="tk-s" style={{ color: s.color }}>{s.status}</span>
                  </div>
                )
              })}
            </div>
            <div className="tk-key"><span><i className="k1" /> Normal</span><span><i className="k2" /> Watch</span><span><i className="k3" /> Attention</span></div>
          </section>
        </Reveal>

        {/* right column */}
        <div className="ops-right">
          {/* recommended decision */}
          <Reveal delay={60}>
            <section className="card flat rec">
              <div className="rec-k"><Icon name="spark" size={13} /> Recommended decision</div>
              {rec ? (
                <>
                  <h3>{rec.decision.title}</h3>
                  <p className="rec-why">{rec.why}</p>
                  <div className="rec-imp">
                    <span className="rec-il">Estimated impact <em>scenario, not a forecast</em></span>
                    {impact ? <span className="rec-iv">{impact.before} → <b className={impact.better ? 'g' : 'b'}>{impact.after}</b></span>
                            : <span className="rec-iv muted"><span className="spinner sm" /> estimating…</span>}
                  </div>
                  <button className="btn btn-cyan rec-btn" onClick={() => nav(`/app/workspace?d=${rec.decision.id}`)}>Review this decision <Icon name="arrowRight" size={15} /></button>
                </>
              ) : <p className="rec-why">No applicable decision for this city profile.</p>}
            </section>
          </Reveal>

          {/* needs attention */}
          <Reveal delay={110}>
            <section className="card flat alerts">
              <div className="al-k">Needs attention</div>
              {cls.attention.length ? cls.attention.map((s) => (
                <button className="al-row" key={s.domain} onClick={() => nav('/app/signals')}>
                  <span className="sdot" style={{ background: s.color }} />
                  <div className="al-t"><b>{DLABEL[s.domain].split(' & ')[0]}</b><span>{s.driver}</span></div>
                  <span className={`chip chip-${band(s.status)}`}>{s.status}</span>
                </button>
              )) : <div className="al-clear"><Icon name="check" size={16} /> All domains within normal range.</div>}
            </section>
          </Reveal>
        </div>
      </div>

      {/* delivery strip */}
      <Reveal delay={80}>
        <section className="card flat deliv">
          <div className="dv-l">
            <div className="dv-k">Delivery <em>team-reported</em></div>
            <div className="dv-bar">
              {stageCounts.map(({ st, n }) => n > 0 && (
                <span key={st} className="dv-seg" style={{ flex: n, background: STAGE_TONE[st] }} title={`${n} ${st}`} />
              ))}
              {totalStage === 1 && stageCounts.every((s) => s.n === 0) && <span className="dv-seg empty" style={{ flex: 1 }} />}
            </div>
            <div className="dv-leg">{stageCounts.map(({ st, n }) => n > 0 && (
              <span key={st}><i style={{ background: STAGE_TONE[st] }} />{n} {st}</span>
            ))}</div>
          </div>
          <div className="dv-r">
            <button className="dv-go" onClick={() => nav('/app/initiatives')}>Open Initiatives <Icon name="arrowRight" size={14} /></button>
            <button className="dv-go ghost" onClick={() => nav('/app/reports')}>Executive report <Icon name="arrowRight" size={14} /></button>
          </div>
        </section>
      </Reveal>

      <style>{css}</style>
    </div>
  )
}

const css = `
.ops-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
.ops-eyebrow{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--cp-teal-600);margin-bottom:4px}
.ops-head h1{font-size:clamp(22px,2.3vw,28px);font-weight:700;letter-spacing:-.02em}
.ops-hr{display:flex;align-items:center;gap:10px}
.ops-status{font-size:13px;font-weight:800;padding:6px 14px;border-radius:999px;letter-spacing:.01em}
.ops-status.ok{background:var(--cp-stable-bg);color:var(--cp-stable)}
.ops-status.watch{background:var(--cp-watch-bg);color:var(--cp-watch)}
.ops-status.hot{background:var(--cp-elevated-bg);color:var(--cp-elevated)}
.ops-proto{font-size:11.5px;font-weight:600;color:var(--cp-muted);background:var(--cp-surface-2);border:1px solid var(--cp-border);border-radius:999px;padding:6px 12px;cursor:pointer}
.ops-proto:hover{border-color:var(--cp-border-strong);color:var(--cp-ink-2)}
.ops-sub{font-size:13px;color:var(--cp-muted);margin:6px 0 20px}
/* kpi */
.kpi-row{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px}
.kpi{text-align:left;background:var(--cp-surface);border:1px solid var(--cp-border);border-radius:14px;padding:16px 17px;cursor:pointer;font:inherit;transition:border-color .16s,transform .16s}
.kpi:hover{border-color:var(--cp-border-strong);transform:translateY(-2px)}
.kpi-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.kpi-ic{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;background:var(--cp-teal-050);color:var(--cp-teal-600)}
.kpi .sdot{gap:6px;font-size:10.5px;font-weight:700;padding:3px 9px}
.kpi .sdot .led{width:6px;height:6px;border-radius:50%}
.kpi-v{font-size:24px;font-weight:800;color:var(--cp-ink);letter-spacing:-.02em;line-height:1}
.kpi-v small{font-size:11px;font-weight:600;color:var(--cp-muted);letter-spacing:0}
.kpi-l{font-size:12.5px;font-weight:600;color:var(--cp-ink-2);margin-top:5px}
/* main */
.ops-main{display:grid;grid-template-columns:1.6fr 1fr;gap:16px;align-items:start;margin-bottom:16px}
.ops-tracks-w{display:flex}
.ops-tracks{flex:1;padding:18px 20px}
.ops-ch{font-size:14px;font-weight:700;color:var(--cp-ink);margin-bottom:16px;display:flex;flex-direction:column;gap:3px}
.ops-ch em{font-style:normal;font-size:11.5px;font-weight:500;color:var(--cp-muted)}
.tks{display:flex;flex-direction:column;gap:14px}
.tk{display:grid;grid-template-columns:150px 1fr 78px;align-items:center;gap:14px}
.tk-n{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:var(--cp-ink)}
.tk-n svg{color:var(--cp-ink-2)}
.tk-bar{position:relative;height:9px;border-radius:5px;overflow:hidden;display:flex;gap:0}
.tk-z{height:100%}
.tk-z.z1{flex:34;background:#e9f5f0}.tk-z.z2{flex:21;background:#eef3f9}.tk-z.z3{flex:45;background:#f7f1e4}
.tk-mk{position:absolute;top:50%;width:13px;height:13px;border-radius:50%;background:#fff;border:3px solid;transform:translate(-50%,-50%);box-shadow:0 1px 3px rgba(16,42,77,.25)}
.tk-s{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.03em;text-align:right}
.tk-key{display:flex;gap:18px;margin-top:16px;padding-top:12px;border-top:1px solid var(--cp-border)}
.tk-key span{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;color:var(--cp-muted)}
.tk-key i{width:11px;height:8px;border-radius:2px;display:inline-block}
.tk-key .k1{background:#cfeadd}.tk-key .k2{background:#d8e4f2}.tk-key .k3{background:#eaddbf}
/* right column */
.ops-right{display:flex;flex-direction:column;gap:16px}
.rec{border:1px solid #cfe7ec;border-inline-start:3px solid var(--cp-teal-500)}
.rec-k{display:flex;align-items:center;gap:7px;font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--cp-teal-600)}
.rec-k svg{color:var(--cp-teal-600)}
.rec h3{font-size:16.5px;font-weight:700;letter-spacing:-.01em;margin:9px 0 5px;line-height:1.2}
.rec-why{font-size:12.5px;color:var(--cp-ink-2);line-height:1.45}
.rec-imp{margin:12px 0;padding:10px 12px;background:var(--cp-surface-2);border-radius:10px}
.rec-il{display:block;font-size:9.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--cp-muted)}
.rec-il em{font-style:normal;font-weight:600;color:var(--cp-elevated);text-transform:none;letter-spacing:0;margin-inline-start:6px}
.rec-iv{display:inline-flex;align-items:center;gap:5px;font-size:13.5px;color:var(--cp-ink-2);margin-top:5px}
.rec-iv b{font-weight:800}.rec-iv b.g{color:var(--cp-stable)}.rec-iv b.b{color:var(--cp-high)}
.rec-iv.muted{color:var(--cp-muted)}
.spinner.sm{width:13px;height:13px;border-width:2px}
.rec-btn{width:100%;justify-content:center;margin-top:2px}
/* alerts */
.al-k{font-size:11px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--cp-muted);margin-bottom:10px}
.al-row{display:flex;align-items:center;gap:11px;width:100%;text-align:left;background:none;border:none;font:inherit;padding:10px 4px;border-bottom:1px solid var(--cp-border);cursor:pointer}
.al-row:last-child{border-bottom:none}
.al-row:hover{background:var(--cp-surface-2)}
.al-row .sdot{width:9px;height:9px;border-radius:50%;flex:0 0 auto}
.al-t{flex:1;min-width:0}
.al-t b{display:block;font-size:13px;font-weight:700;color:var(--cp-ink)}
.al-t span{display:block;font-size:11.5px;color:var(--cp-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.al-clear{display:flex;align-items:center;gap:9px;font-size:13px;color:var(--cp-stable);padding:10px 2px}
/* delivery */
.deliv{display:flex;align-items:center;gap:24px;padding:16px 20px}
.dv-l{flex:1;min-width:0}
.dv-k{font-size:11px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--cp-muted);margin-bottom:9px}
.dv-k em{font-style:normal;font-weight:600;color:var(--cp-muted);text-transform:none;letter-spacing:0;margin-inline-start:6px}
.dv-bar{display:flex;gap:3px;height:12px;border-radius:6px;overflow:hidden}
.dv-seg{border-radius:3px}
.dv-seg.empty{background:var(--cp-surface-2)}
.dv-leg{display:flex;gap:16px;margin-top:10px;flex-wrap:wrap}
.dv-leg span{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;color:var(--cp-ink-2)}
.dv-leg i{width:9px;height:9px;border-radius:3px}
.dv-r{display:flex;flex-direction:column;gap:8px;flex:0 0 auto}
.dv-go{display:inline-flex;align-items:center;gap:6px;justify-content:flex-end;background:none;border:none;font:inherit;font-size:13px;font-weight:700;color:var(--cp-navy-700);cursor:pointer}
.dv-go.ghost{color:var(--cp-muted);font-weight:600}
.dv-go:hover{color:var(--cp-teal-600)}
@media(max-width:1080px){.kpi-row{grid-template-columns:1fr 1fr}.ops-main{grid-template-columns:1fr}}
@media(max-width:640px){.kpi-row{grid-template-columns:1fr}.tk{grid-template-columns:110px 1fr 64px}.deliv{flex-direction:column;align-items:stretch}.dv-r{flex-direction:row}}
`
