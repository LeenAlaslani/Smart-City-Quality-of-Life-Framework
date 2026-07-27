// CityPulse AI — city onboarding. Max 10 essential, structured questions.
// Optional detail is deferred (progressive disclosure).
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useProfile } from '../lib/store'
import { Button, Field, Select, ChoiceGroup, Loading, ErrorState, Tooltip } from '../components/ui'

const DISTRICTS = [
  { id: 'lt10', label: 'Fewer than 10' }, { id: '10_30', label: '10 – 30' },
  { id: '30_60', label: '30 – 60' }, { id: 'gt60', label: 'More than 60' },
]
const DATA = [
  { id: 'limited', label: 'Limited / starting out' },
  { id: 'partial', label: 'Some operational data' },
  { id: 'rich', label: 'Rich, connected data' },
]

export default function Onboarding() {
  const nav = useNavigate()
  const { profile, update } = useProfile()
  const [opts, setOpts] = useState(null)
  const [err, setErr] = useState(null)
  const [showOptional, setShowOptional] = useState(false)

  useEffect(() => { api.options().then(setOpts).catch((e) => setErr(e.message)) }, [])

  if (err) return <CenterCard><ErrorState onRetry={() => location.reload()}>{err}</ErrorState></CenterCard>
  if (!opts) return <CenterCard><Loading label="Preparing onboarding…" /></CenterCard>

  const set = (k) => (v) => update({ [k]: v })
  const ready = profile.city && profile.population_range && profile.city_type && profile.budget_level

  return (
    <div className="ob">
      <header className="ob-top">
        <img src="/citypulse-logo.png" alt="CityPulse AI" />
        <span className="muted" style={{ fontSize: 13 }}>Set up your city · about 1 minute</span>
      </header>

      <main className="ob-main">
        <div className="pagehead">
          <div className="eyebrow">City onboarding</div>
          <h1>Tell us about your city</h1>
          <p className="lead">Only the essentials to create your first decision workspace. You can refine details later.</p>
        </div>

        <div className="card pad-lg">
          <div className="grid cols-2">
            <Field label="City" tip="Choose the Saudi city or municipality this workspace is for.">
              <Select value={profile.city} onChange={set('city')} options={opts.cities} placeholder="Select a city…" />
            </Field>
            <Field label="Country" tip="The platform is configured for Saudi municipalities in this release.">
              <Select value={'sa'} onChange={() => {}} options={[{ id: 'sa', label: 'Saudi Arabia' }]} />
            </Field>
            <Field label="Population range" tip="Approximate resident population. Used to scale demand across models.">
              <Select value={profile.population_range} onChange={set('population_range')} options={opts.population_ranges} />
            </Field>
            <Field label="City type" tip="The city's character. Affects density and seasonal-demand assumptions.">
              <Select value={profile.city_type} onChange={set('city_type')} options={opts.city_types} />
            </Field>
            <Field label="Municipal zones / districts" tip="Rough number of administrative districts.">
              <Select value={profile.districts} onChange={set('districts')} options={DISTRICTS} />
            </Field>
            <Field label="Budget / resource level" tip="Overall resourcing. Affects service-capacity assumptions.">
              <Select value={profile.budget_level} onChange={set('budget_level')} options={opts.budget_levels} />
            </Field>
          </div>

          <div className="divider" />

          <Field label="Main current challenges" tip="Pick the pressures that matter most right now.">
            <ChoiceGroup options={opts.challenges} value={profile.challenges} onChange={set('challenges')} />
          </Field>
          <Field label="Strategic priorities" tip="Your transformation focus. Guides recommendations.">
            <ChoiceGroup options={opts.priorities} value={profile.priorities} onChange={set('priorities')} />
          </Field>

          {!showOptional ? (
            <button className="btn btn-ghost btn-sm" style={{ paddingInline: 0 }} onClick={() => setShowOptional(true)}>
              + Add optional details
            </button>
          ) : (
            <div className="grid cols-2 mt-2">
              <Field label="Transformation timeline" tip="Your planning horizon.">
                <Select value={profile.timeline} onChange={set('timeline')} options={opts.timelines} />
              </Field>
              <Field label="Available city data" tip="How much connected operational data you have today.">
                <Select value={profile.data_availability} onChange={set('data_availability')} options={DATA} />
              </Field>
            </div>
          )}
        </div>

        <div className="between mt-6">
          <Button variant="ghost" onClick={() => nav('/')}>Cancel</Button>
          <div className="row">
            <span className="muted" style={{ alignSelf: 'center', fontSize: 13 }}>
              {ready ? 'Ready' : 'City, population, type and budget required'}
            </span>
            <Button disabled={!ready} onClick={() => nav('/app/overview')}>Create workspace →</Button>
          </div>
        </div>
      </main>

      <style>{`
        .ob { min-height:100dvh; background:var(--cp-bg); }
        .ob-top { height:var(--header-h); display:flex; align-items:center; justify-content:space-between;
          padding:0 var(--sp-8); border-bottom:1px solid var(--cp-border); background:var(--cp-surface); }
        .ob-top img { height:42px; }
        .ob-main { max-width:820px; margin:0 auto; padding:var(--sp-10) var(--sp-6) var(--sp-12); }
      `}</style>
    </div>
  )
}

const CenterCard = ({ children }) => (
  <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', background: 'var(--cp-bg)' }}>
    <div className="card pad-lg" style={{ width: 380 }}>{children}</div>
  </div>
)
