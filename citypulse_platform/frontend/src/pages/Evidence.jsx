// CityPulse AI — Model & Data Evidence. For technical evaluators / data teams.
// This is the ONLY place datasets, algorithms, origins, versions and
// limitations are shown. Kept out of the executive experience.
import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useProfile } from '../lib/store'
import { Card, Button, Loading, ErrorState, StatusChip } from '../components/ui'
import Icon, { DOMAIN_ICON } from '../components/icons'

export default function Evidence() {
  const { profile } = useProfile()
  const [models, setModels] = useState(null)
  const [health, setHealth] = useState(null)
  const [err, setErr] = useState(null)
  const [test, setTest] = useState(null)
  const [testing, setTesting] = useState(false)

  const load = () => {
    setErr(null)
    Promise.all([api.models(), api.health()]).then(([m, h]) => { setModels(m.models); setHealth(h) }).catch((e) => setErr(e.message))
  }
  useEffect(load, [])

  const runTest = () => {
    setTesting(true)
    api.analyze(profile || {}, 'baseline').then((r) => {
      setTest({ ok: true, provenance: r._provenance, at: new Date().toLocaleTimeString() }); setTesting(false)
    }).catch((e) => { setTest({ ok: false, error: e.message }); setTesting(false) })
  }

  if (err) return <><Head /><ErrorState onRetry={load}>{err}</ErrorState></>
  if (!models) return <><Head /><Loading label="Loading model registry…" /></>

  return (
    <>
      <Head />

      {/* validation status — stated plainly, once, at the top */}
      <div className="ev-banner">
        <Icon name="alert" size={18} />
        <div>
          <b>Internationally trained prototype models.</b> The four models are trained on open datasets
          from London, New York and international building stock. They have <b>not yet been calibrated or
          validated with local Saudi municipal datasets</b> — local validation is required before any
          production or operational use. Platform outputs are decision-support signals, not verified forecasts.
        </div>
      </div>

      <div className="grid cols-2" style={{ marginBottom: 16 }}>
        <Card>
          <div className="between">
            <div><div className="card-title">Deployment status</div><div className="card-sub">Live Python inference service</div></div>
            <span className={`chip chip-${health?.models_available?.length === 4 ? 'stable' : 'elevated'}`}>
              {health?.models_available?.length || 0} / {health?.models_total || 4} models live
            </span>
          </div>
          <div className="mt-4 row" style={{ gap: 8 }}>
            <Button variant="secondary" icon="intelligence" onClick={runTest} disabled={testing}>{testing ? 'Running…' : 'Run inference test'}</Button>
            {test && (test.ok
              ? <span className="chip chip-stable"><Icon name="check" size={13} /> {test.provenance.live ? 'Live' : 'Fallback'} · {test.provenance.exec_ms} ms · {test.at}</span>
              : <span className="chip chip-critical">Failed: {test.error}</span>)}
          </div>
        </Card>
        <Card>
          <div className="card-title">Architecture</div>
          <p className="mt-2" style={{ fontSize: 13.5, color: 'var(--cp-ink-2)', lineHeight: 1.55 }}>
            React platform → lightweight Python (FastAPI) inference service running the four trained
            <b> joblib</b> model bundles through one shared integration layer (validation, feature
            preparation, category mapping, prediction, normalisation, provenance).
          </p>
        </Card>
      </div>

      <div className="grid cols-2">
        {models.map((m) => (
          <Card key={m.domain} title={m.display_name} sub={m.domain_label} icon={DOMAIN_ICON[m.domain]}
            right={<StatusChip status={m.deployed ? 'Stable' : 'Critical'} color={m.deployed ? 'var(--cp-stable)' : 'var(--cp-critical)'} />}>
            <table className="table" style={{ fontSize: 13 }}>
              <tbody>
                <Row k="Algorithm" v={m.algorithm} />
                <Row k="Task" v={m.task} />
                <Row k="Prediction target" v={`${m.target} (${m.target_unit})`} />
                <Row k="Dataset" v={m.dataset_name} />
                <Row k="Dataset origin" v={m.dataset_origin} />
                <Row k="Features" v={`${m.n_features} (key: ${m.key_features.slice(0, 4).join(', ')}…)`} />
                {m.threshold != null && <Row k="Threshold" v={m.threshold} />}
                <Row k="Model version" v={m.version} />
                <Row k="Deployment" v={m.deployed ? 'Deployed · live inference' : `Unavailable (${m.load_error})`} />
                <Row k="Local validation" v="Not validated with Saudi data — required before production use" />
              </tbody>
            </table>
            <div className="mt-3">
              <div className="fk" style={{ marginBottom: 6 }}><Icon name="info" size={13} /> Limitations</div>
              <ul style={{ margin: 0, paddingInlineStart: 18, fontSize: 12.5, color: 'var(--cp-ink-2)', lineHeight: 1.5 }}>
                {m.limitations.map((l, i) => <li key={i} style={{ marginBottom: 3 }}>{l}</li>)}
                <li>{m.dataset_note}</li>
              </ul>
            </div>
            <p className="muted mt-3" style={{ fontSize: 11.5 }}>Source notebook: {m.notebook}</p>
          </Card>
        ))}
      </div>

      {/* what local validation would require — the honest data-readiness list */}
      <Card title="Local data readiness" sub="What is needed to calibrate and validate these models for a Saudi city" icon="layers" className="mt-4">
        <div className="ev-ready">
          <ReadyRow dom="mobility" need="Traffic counts, road-incident records, weather & air-quality feeds by corridor" />
          <ReadyRow dom="energy" need="Building electricity meter data (hourly) by building type and district" />
          <ReadyRow dom="governance" need="Municipal service-request (311-style) logs with categories and resolution times" />
          <ReadyRow dom="waste" need="Waste tonnage by zone and month, plus collection-capacity records" />
        </div>
        <p className="muted mt-3" style={{ fontSize: 12.5, lineHeight: 1.5 }}>
          Each layer above separates cleanly in the platform today: model-training provenance (this page) ·
          selected-city profile inputs (onboarding) · scenario assumptions (City Intelligence sliders) ·
          model output (live inference) · local validation status (not yet started).
        </p>
      </Card>

      <style>{`
        .ev-banner{display:flex;gap:12px;align-items:flex-start;background:var(--cp-elevated-bg);border:1px solid #ecd9ae;
          border-radius:14px;padding:15px 17px;margin-bottom:16px;font-size:13.5px;line-height:1.55;color:#6b4c12}
        .ev-banner svg{color:var(--cp-elevated);flex:0 0 auto;margin-top:2px}
        .ev-ready{display:grid;grid-template-columns:1fr 1fr;gap:10px 20px;margin-top:4px}
        .ev-rr{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border:1px solid var(--cp-border);border-radius:11px;background:var(--cp-surface-2)}
        .ev-rr .ic{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;background:#fff;color:var(--cp-teal-600);border:1px solid var(--cp-border);flex:0 0 auto}
        .ev-rr .t{font-size:12.5px;color:var(--cp-ink-2);line-height:1.45}
        @media(max-width:820px){.ev-ready{grid-template-columns:1fr}}
      `}</style>
    </>
  )
}

const ReadyRow = ({ dom, need }) => (
  <div className="ev-rr"><span className="ic"><Icon name={DOMAIN_ICON[dom]} size={15} /></span><span className="t">{need}</span></div>
)

const Row = ({ k, v }) => (
  <tr><td style={{ color: 'var(--cp-muted)', width: '38%', padding: '7px 0', verticalAlign: 'top' }}>{k}</td>
    <td style={{ padding: '7px 0', color: 'var(--cp-ink)' }}>{v}</td></tr>
)
const Head = () => (
  <div className="pg"><div><div className="pg-eyebrow">Model &amp; Data Evidence</div><h1>Models, data &amp; validation</h1>
    <p className="pg-purpose">For technical evaluators — datasets, algorithms, limitations, validation status and local data readiness.</p></div></div>
)
