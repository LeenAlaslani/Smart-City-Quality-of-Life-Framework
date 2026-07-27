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
    </>
  )
}

const Row = ({ k, v }) => (
  <tr><td style={{ color: 'var(--cp-muted)', width: '38%', padding: '7px 0', verticalAlign: 'top' }}>{k}</td>
    <td style={{ padding: '7px 0', color: 'var(--cp-ink)' }}>{v}</td></tr>
)
const Head = () => (
  <div className="pagehead"><div className="eyebrow">Model &amp; Data Evidence</div><h1>Technical evidence</h1>
    <p className="lead">For technical evaluators and data teams — datasets, algorithms, metrics and limitations behind the platform.</p></div>
)
