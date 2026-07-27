// CityPulse AI — City Intelligence: an interactive decision-exploration tool.
// Pick a decision, adjust assumptions (which re-run the real models), compare
// current vs scenario, see the affected area, and turn results into real work.
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useProfile } from '../lib/store'
import { useWorkspace } from '../lib/workspace'
import { Card, Button, Loading, ErrorState, Alert, Insight, StatusChip } from '../components/ui'
import { Compare, DistrictMap, Donut } from '../components/viz'
import Icon from '../components/icons'

const NEUTRAL = { traffic: 0, demand: 0, transit: 0 }

export default function Intelligence() {
  const nav = useNavigate()
  const { profile } = useProfile()
  const ws = useWorkspace()
  const [opts, setOpts] = useState(null)
  const [decision, setDecision] = useState('metro_line')
  const [adj, setAdj] = useState(NEUTRAL)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)
  const [saved, setSaved] = useState({})

  useEffect(() => { api.options().then(setOpts).catch((e) => setErr(e.message)) }, [])

  const overrides = useMemo(() => ({
    traffic_mult: 1 + adj.traffic / 100, demand_mult: 1 + adj.demand / 100, transit_delta: adj.transit,
  }), [adj])

  const run = (dk = decision, a = adj) => {
    setLoading(true); setErr(null)
    const ov = { traffic_mult: 1 + a.traffic / 100, demand_mult: 1 + a.demand / 100, transit_delta: a.transit }
    api.analyze(profile, dk, ov).then((r) => { setResult(r); setLoading(false) }).catch((e) => { setErr(e.message); setLoading(false) })
  }
  const pick = (dk) => { setDecision(dk); setAdj(NEUTRAL); run(dk, NEUTRAL) }
  useEffect(() => { if (opts) run('metro_line', NEUTRAL) }, [opts])

  const decisions = (opts?.decisions || []).filter((d) => d.id !== 'baseline')

  // actions
  const flash = (k) => { setSaved((s) => ({ ...s, [k]: true })); setTimeout(() => setSaved((s) => ({ ...s, [k]: false })), 1600) }
  const createAction = (a) => {
    ws.createAction({ title: a.title, type: 'Decision', domain: result.impact.focus_domain, department: a.department,
      priority: 'High', relatedArea: 'Central District', source: `Scenario: ${result.decision.title}` })
    flash('act' + a.title)
  }
  const addRoadmap = () => {
    ws.addRoadmap({ title: result.decision.title, objective: result.impact.recommended_response,
      department: result.next_actions[0].department, horizon: 'near', priority: 'High',
      domain: result.impact.focus_domain, dependency: 'Scenario review', next: 'Approve scope' })
    flash('road')
  }
  const saveScenario = () => {
    ws.saveScenario({ decisionId: decision, title: result.decision.title, city: result.city,
      summary: result.impact.what_changes, focus: result.impact.focus_label,
      movers: result.movers?.slice(0, 3) || [] })
    flash('scn')
  }

  return (
    <>
      <div className="pagehead">
        <div className="eyebrow">City Intelligence</div>
        <h1>Explore a city decision</h1>
        <p className="lead">Choose a decision, adjust its assumptions, and see the cross-domain impact.</p>
      </div>

      <div className="dtiles">
        {decisions.map((d) => (
          <button key={d.id} className={`dtile${decision === d.id ? ' on' : ''}`} onClick={() => pick(d.id)}>
            <span className="dic"><Icon name={d.icon || 'scenarios'} size={20} /></span>
            <div><div className="dcat">{d.category}</div><div className="dt">{d.title}</div></div>
          </button>
        ))}
      </div>

      {err && <div className="mt-6"><ErrorState onRetry={() => run()}>{err}</ErrorState></div>}
      {!result && loading && <div className="mt-6"><Loading /></div>}

      {result && (
        <div className="mt-6" style={{ opacity: loading ? 0.55 : 1, transition: 'opacity .2s' }}>
          <div className="sec-head" style={{ marginTop: 0 }}>
            <div><span className="eyebrow">{result.decision.category}</span><h2>{result.decision.question}</h2></div>
            {result.decision.is_scenario && <span className="chip chip-info"><Icon name="layers" size={13} /> Planning scenario</span>}
          </div>

          {/* adjust + response */}
          <div className="dash r-2a">
            <Card title="Assumptions" sub="Adjust to explore — running re-computes the impact" icon="scenarios">
              <div className="asm mt-3" style={{ marginBottom: 16 }}>
                {result.assumptions.map((a, i) => <span className="asm-chip" key={i}><span className="k">{a.label}</span><span className="v">{a.value}</span></span>)}
              </div>
              <Range label="Traffic on affected corridors" value={adj.traffic} min={-30} max={50} suffix="%" onChange={(v) => setAdj((s) => ({ ...s, traffic: v }))} />
              <Range label="Overall demand" value={adj.demand} min={-20} max={50} suffix="%" onChange={(v) => setAdj((s) => ({ ...s, demand: v }))} />
              <Range label="Transit coverage added" value={adj.transit} min={0} max={40} suffix=" pts" onChange={(v) => setAdj((s) => ({ ...s, transit: v }))} />
              <div className="row mt-3">
                <Button variant="primary" icon="intelligence" onClick={() => run()} disabled={loading}>{loading ? 'Running…' : 'Run scenario'}</Button>
                {(adj.traffic || adj.demand || adj.transit) ? <Button variant="ghost" onClick={() => { setAdj(NEUTRAL); run(decision, NEUTRAL) }}>Reset</Button> : null}
              </div>
            </Card>

            <div className="grid" style={{ gap: 16 }}>
              <Card className="accent" title="Recommended response" icon="target">
                <p style={{ fontSize: 14, lineHeight: 1.5, margin: '2px 0 14px' }}>{result.impact.recommended_response}</p>
                <div className="grid" style={{ gap: 8 }}>
                  {result.next_actions.map((a, i) => (
                    <div className="action-row between" key={i}>
                      <div><div className="t">{a.title}</div><div className="dept">{a.department}</div></div>
                      <Button size="sm" variant={saved['act' + a.title] ? 'secondary' : 'secondary'} icon={saved['act' + a.title] ? 'check' : 'plus'} onClick={() => createAction(a)}>
                        {saved['act' + a.title] ? 'Added' : 'Create action'}
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
              <div className="row" style={{ gap: 8 }}>
                <Button variant="secondary" icon={saved.road ? 'check' : 'roadmap'} onClick={addRoadmap}>{saved.road ? 'Added to roadmap' : 'Add to roadmap'}</Button>
                <Button variant="ghost" icon={saved.scn ? 'check' : 'scenarios'} onClick={saveScenario}>{saved.scn ? 'Saved' : 'Save scenario'}</Button>
              </div>
            </div>
          </div>

          {/* comparison + affected area */}
          <div className="dash r-2a mt-4">
            <Card title="Current vs. scenario" sub="How each connected domain responds" icon="layers">
              <div className="mt-3"><Compare signals={result.reading.signals} baseline={result.baseline_reading?.signals} /></div>
              <Insight>{result.impact.what_changes}</Insight>
            </Card>
            <Card title="Most affected area" icon="pin">
              <div className="mt-2"><DistrictMap focusColor={result.impact.focus_color} focusName="Central" height={210} /></div>
            </Card>
          </div>

          {/* what it means */}
          <Card title="What this means for operations" icon="intelligence" className="mt-4">
            <div className="facets mt-3">
              <Facet icon="pin" k="Areas likely affected" v={result.impact.affected.join(', ')} />
              <Facet icon="alert" k="Main pressure points" v={result.impact.pressure_points.map((p) => p.label).join(', ')} />
              <Facet icon="staffing" k="Resource implications" v={result.impact.resource_implications} />
              <Facet icon="target" k="Key risk" v={result.impact.risks} />
            </div>
          </Card>

          <div className="grid mt-4" style={{ gridTemplateColumns: result.decision.external ? '1fr 1fr' : '1fr' }}>
            <Alert tone="limit" icon={<Icon name="info" size={16} />}>{result.integrity.limitation}</Alert>
            {result.decision.external && <Alert tone="warn" icon={<Icon name="alert" size={16} />}>{result.integrity.data_gap}</Alert>}
          </div>
        </div>
      )}
    </>
  )
}

function Range({ label, value, min, max, suffix = '', onChange }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
        <span style={{ color: 'var(--cp-ink-2)', fontWeight: 500 }}>{label}</span>
        <b style={{ color: 'var(--cp-navy-700)' }}>{value > 0 ? '+' : ''}{value}{suffix}</b>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ width: '100%' }} />
    </div>
  )
}
const Facet = ({ icon, k, v }) => (
  <div className="facet"><div className="fk"><Icon name={icon} size={14} /> {k}</div><div className="fv">{v}</div></div>
)
