// CityPulse AI — Signals: the read-only evidence layer. What each live model is
// reading for the selected city, its status band, the driver, and the model
// behind it. No simulation here — the one action is "Investigate", which opens
// the Decision Workspace. Foreign dataset names stay in Evidence.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useProfile } from '../lib/store'
import { classify } from '../lib/cityStatus'
import { cityName, OUTCOME_LABEL, fmtOutcome } from '../lib/cityContext'
import { PageHead, Button, Loading, ErrorState } from '../components/ui'
import Icon, { DOMAIN_ICON } from '../components/icons'

const DOMAIN_LABEL = {
  mobility: 'Transportation & Mobility', energy: 'Energy & Buildings',
  waste: 'Environment & Waste', governance: 'Governance & Public Services',
}
const band = (s) => ({ Stable: 'stable', Watch: 'watch', Elevated: 'elevated', High: 'high', Critical: 'critical' }[s] || 'neutral')

export default function Signals() {
  const nav = useNavigate()
  const { profile } = useProfile()
  const [base, setBase] = useState(null)
  const [models, setModels] = useState({})
  const [err, setErr] = useState(null)

  const load = () => {
    setErr(null); setBase(null)
    Promise.all([api.analyze(profile, 'baseline'), api.models().catch(() => ({ models: [] }))])
      .then(([b, m]) => { setBase(b); setModels(Object.fromEntries((m.models || []).map((x) => [x.domain, x]))) })
      .catch((e) => setErr(e.message))
  }
  useEffect(load, [])

  const city = cityName(profile)
  if (err) return <><Head city={city} /><ErrorState onRetry={load}>{err}</ErrorState></>
  if (!base) return <><Head city={city} /><Loading label={`Reading ${city}…`} /></>

  const cls = classify(base.reading)
  const ordered = cls.ordered

  return (
    <>
      <Head city={city} />
      <div className="sg-grid">
        {ordered.map((s) => {
          const m = models[s.domain]
          return (
            <section className="card flat sg" key={s.domain}>
              <div className="sg-top">
                <span className="sg-ic"><Icon name={DOMAIN_ICON[s.domain]} size={18} /></span>
                <div className="sg-name">{DOMAIN_LABEL[s.domain]}</div>
                <span className={`chip chip-${band(s.status)}`}>{s.status}</span>
              </div>
              <div className="sg-read">
                <div className="sg-v">{fmtOutcome(s)}</div>
                <div className="sg-l">{OUTCOME_LABEL[s.domain]}</div>
              </div>
              {/* position on this domain's own model scale — not compared across domains */}
              <Track pressure={s.pressure} color={s.color} status={s.status} />
              <p className="sg-driver">{s.driver}</p>
              <div className="sg-ev">
                <span>Model</span>{m ? m.display_name : 'Live model'} · {m ? m.algorithm.split('(')[0].trim() : 'live inference'}
              </div>
              <button className="sg-inv" onClick={() => nav('/app/workspace')}>Investigate in Workspace <Icon name="arrowRight" size={14} /></button>
            </section>
          )
        })}
      </div>

      <button className="sg-note" onClick={() => nav('/app/evidence')}>
        <Icon name="info" size={13} /> Prototype · local validation pending — datasets, limitations and readiness in Evidence
      </button>
      <style>{css}</style>
    </>
  )
}

const Head = ({ city }) => (
  <PageHead eyebrow={`Signals · ${city}`} title="City signals & evidence"
    purpose="What the live models are reading now, on each domain's own scale. Read-only — investigate in the Workspace." />
)

// Per-domain status track: current band highlighted on this model's own scale.
function Track({ pressure, color, status }) {
  const zones = [['Normal', 0, 34], ['Watch', 34, 55], ['Attention', 55, 100]]
  const pos = Math.max(2, Math.min(98, pressure))
  return (
    <div className="sg-track" aria-label={`Currently ${status}`}>
      <div className="sg-zones">
        {zones.map(([n, a, b]) => <span key={n} className="sg-z" style={{ flex: b - a }}><em>{n}</em></span>)}
      </div>
      <div className="sg-bar"><span className="sg-fill" style={{ width: `${pos}%`, background: color }} /><span className="sg-mk" style={{ left: `${pos}%`, borderColor: color }} /></div>
    </div>
  )
}

const css = `
.sg-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.sg{padding:18px 20px}
.sg-top{display:flex;align-items:center;gap:11px;margin-bottom:14px}
.sg-ic{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;background:var(--cp-teal-050);color:var(--cp-teal-600)}
.sg-name{flex:1;font-size:14.5px;font-weight:700;color:var(--cp-ink);letter-spacing:-.01em}
.sg-read{display:flex;align-items:baseline;gap:12px;margin-bottom:14px}
.sg-v{font-size:26px;font-weight:800;color:var(--cp-ink);letter-spacing:-.02em;line-height:1}
.sg-l{font-size:13px;font-weight:600;color:var(--cp-ink-2)}
.sg-track{margin-bottom:14px}
.sg-zones{display:flex;gap:3px;margin-bottom:5px}
.sg-z{position:relative;height:5px}
.sg-z em{position:absolute;top:8px;left:0;font-style:normal;font-size:9px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--cp-muted)}
.sg-bar{position:relative;height:8px;background:var(--cp-surface-2);border:1px solid var(--cp-border);border-radius:5px;margin-top:18px}
.sg-fill{position:absolute;left:0;top:0;bottom:0;border-radius:5px;opacity:.35}
.sg-mk{position:absolute;top:50%;width:12px;height:12px;border-radius:50%;background:#fff;border:2.5px solid;transform:translate(-50%,-50%);box-shadow:0 1px 3px rgba(16,42,77,.2)}
.sg-driver{font-size:13px;color:var(--cp-ink-2);line-height:1.5;margin-bottom:12px}
.sg-ev{font-size:12px;color:var(--cp-muted);padding:10px 0;border-top:1px solid var(--cp-border)}
.sg-ev span{font-size:9.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--cp-teal-600);margin-inline-end:8px}
.sg-inv{display:inline-flex;align-items:center;gap:6px;background:none;border:none;font:inherit;font-size:13px;font-weight:700;color:var(--cp-navy-700);cursor:pointer;padding:4px 0}
.sg-inv svg{transition:transform .16s}.sg-inv:hover svg{transform:translateX(3px)}
.sg-note{display:inline-flex;align-items:center;gap:7px;background:none;border:none;font:inherit;font-size:12px;color:var(--cp-muted);cursor:pointer;margin-top:16px;padding:4px}
.sg-note:hover{color:var(--cp-teal-600)}.sg-note svg{color:var(--cp-elevated)}
@media(max-width:820px){.sg-grid{grid-template-columns:1fr}}
`
