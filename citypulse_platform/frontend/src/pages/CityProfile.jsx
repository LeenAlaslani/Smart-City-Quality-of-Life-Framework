// CityPulse AI — City Profile: the discovery layer the agent and
// recommendations read. The city confirms, edits and extends its own context —
// goals, challenges, sectors, maturity, infrastructure, authorities, events,
// and (critically) which datasets exist vs are missing. Stored with the
// profile; nothing is assumed silently.
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useProfile } from '../lib/store'
import { cityName } from '../lib/cityContext'
import { PageHead, Sect, Button, ChoiceGroup } from '../components/ui'
import Icon from '../components/icons'

const GOALS = [
  { id: 'mobility', label: 'Improve mobility' }, { id: 'sustainability', label: 'Sustainability & efficiency' },
  { id: 'digital_gov', label: 'Digital government services' }, { id: 'quality_of_life', label: 'Quality of life' },
  { id: 'resource_mgmt', label: 'Resource management' },
]
const CHALLENGES = [
  { id: 'congestion', label: 'Traffic congestion' }, { id: 'peak_energy', label: 'Peak energy demand' },
  { id: 'service_backlog', label: 'Service request backlog' }, { id: 'waste_capacity', label: 'Waste collection capacity' },
  { id: 'seasonal_surge', label: 'Seasonal population surge' }, { id: 'sustainability', label: 'Sustainability targets' },
]
const SECTORS = [
  { id: 'transport', label: 'Transport' }, { id: 'energy', label: 'Energy' }, { id: 'municipal', label: 'Municipal services' },
  { id: 'environment', label: 'Environment' }, { id: 'housing', label: 'Housing & development' }, { id: 'tourism', label: 'Tourism & events' },
]
const MATURITY = [
  { id: 'basic', label: 'Basic — few digital services' }, { id: 'developing', label: 'Developing — partial systems' },
  { id: 'advanced', label: 'Advanced — integrated platforms' },
]
const INFRA = [
  { id: 'bus', label: 'Bus network' }, { id: 'metro', label: 'Metro / rail' }, { id: 'smart_meters', label: 'Smart meters' },
  { id: 'sensors', label: 'City sensors' }, { id: 'service_portal', label: 'Digital service portal' }, { id: 'waste_fleet', label: 'Managed waste fleet' },
]
const DATASETS = [
  { id: 'traffic', label: 'Traffic counts' }, { id: 'energy_meters', label: 'Building energy meters' },
  { id: 'service_logs', label: 'Service-request logs' }, { id: 'waste_tonnage', label: 'Waste tonnage by zone' },
  { id: 'air_quality', label: 'Air quality' }, { id: 'events', label: 'Event calendars' },
]

export default function CityProfile() {
  const nav = useNavigate()
  const { profile, update } = useProfile()
  const [saved, setSaved] = useState(false)
  const flash = () => { setSaved(true); setTimeout(() => setSaved(false), 1500) }
  const set = (k) => (v) => { update({ [k]: v }); flash() }

  const missing = DATASETS.filter((d) => !(profile.datasets_available || []).includes(d.id)).map((d) => d.label)

  return (
    <>
      <PageHead eyebrow="City Profile" title={`${cityName(profile)} — context & discovery`}
        purpose="The agent and every recommendation read this profile. Confirm what's true, correct what isn't.">
        <span className={`chip ${saved ? 'chip-stable' : 'chip-neutral'}`}>{saved ? 'Saved' : 'Auto-saves'}</span>
        <Button variant="secondary" onClick={() => nav('/onboarding')}>Change city</Button>
      </PageHead>

      <div className="cpf">
        <div className="card flat">
          <Sect label="Identity" />
          <div className="cpf-id">
            <Fact k="City" v={cityName(profile)} />
            <Fact k="Type" v={label(profile.city_type)} />
            <Fact k="Population" v={label(profile.population_range)} />
            <Fact k="Budget level" v={label(profile.budget_level)} />
          </div>
          <p className="cpf-hint">Core identity comes from onboarding — use “Change city” to redo it.</p>
        </div>

        <div className="card flat">
          <Sect label="Strategic goals" />
          <ChoiceGroup options={GOALS} value={profile.priorities || []} onChange={set('priorities')} />
          <Sect label="Main urban challenges" />
          <ChoiceGroup options={CHALLENGES} value={profile.challenges || []} onChange={set('challenges')} />
          <Sect label="Priority sectors" />
          <ChoiceGroup options={SECTORS} value={profile.sectors || []} onChange={set('sectors')} />
        </div>

        <div className="card flat">
          <Sect label="Digital maturity" />
          <ChoiceGroup single options={MATURITY} value={profile.digital_maturity || null} onChange={set('digital_maturity')} />
          <Sect label="Existing infrastructure" />
          <ChoiceGroup options={INFRA} value={profile.infrastructure || []} onChange={set('infrastructure')} />
          <Sect label="Seasonal pressures / major events" />
          <input className="control" type="text" placeholder="e.g. Riyadh Season · school year peak · summer cooling"
            defaultValue={profile.events_note || ''} onBlur={(e) => set('events_note')(e.target.value)} />
        </div>

        <div className="card flat cpf-data">
          <Sect label="Available datasets" />
          <ChoiceGroup options={DATASETS} value={profile.datasets_available || []} onChange={(v) => {
            update({ datasets_available: v, datasets_missing: DATASETS.filter((d) => !v.includes(d.id)).map((d) => d.label) }); flash()
          }} />
          <div className="cpf-missing">
            <Icon name="alert" size={14} />
            <div>
              <b>Missing for local validation:</b> {missing.length ? missing.join(', ') : 'nothing — all core datasets marked available'}
              <span>The agent uses this to say what data to request next. Details in Evidence.</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .cpf{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start}
        .cpf .sect{margin:18px 0 10px}
        .cpf .sect:first-child{margin-top:0}
        .cpf-id{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .cpf-hint{font-size:11.5px;color:var(--cp-muted);margin-top:14px}
        .cpf-f span{display:block;font-size:9.5px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--cp-muted)}
        .cpf-f b{display:block;font-size:14px;color:var(--cp-ink);margin-top:3px}
        .cpf-missing{display:flex;gap:9px;margin-top:14px;padding:12px 14px;background:var(--cp-elevated-bg);border:1px solid #ecd9ae;border-radius:11px;font-size:12.5px;color:#6b4c12;line-height:1.5}
        .cpf-missing svg{color:var(--cp-elevated);flex:0 0 auto;margin-top:2px}
        .cpf-missing span{display:block;font-size:11px;margin-top:3px;color:#8a6a2a}
        @media(max-width:900px){.cpf{grid-template-columns:1fr}}
      `}</style>
    </>
  )
}

const label = (id) => id ? String(id).replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase()) : '—'
const Fact = ({ k, v }) => <div className="cpf-f"><span>{k}</span><b>{v}</b></div>
