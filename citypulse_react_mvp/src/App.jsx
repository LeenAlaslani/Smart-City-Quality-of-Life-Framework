// CityPulse AI — mobile-first city-builder journey (React, no backend).
import { useEffect, useMemo, useState } from 'react'
import { readCity } from './engine/cityModel'
import {
  defaultProfile, SCENARIOS, ACTIONS, DENSITY_LEVELS, BUDGET_LEVELS, SEASONS,
  scenarioByKey, actionByKey, recommendedActionsFor,
} from './engine/scenarios'
import * as guide from './engine/guide'
import CityScene from './components/CityScene'
import { Guide, HealthRing, SystemCards, CompareRows, ThreeQuestions, Rich } from './components/Bits'

const STEPS = ['Found', 'Pulse', 'Test', 'Diagnose', 'Improve']
const LOGO = './citypulse-logo.png'

export default function App() {
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState(defaultProfile())
  const [baseline, setBaseline] = useState(null)
  const [scenarioKey, setScenarioKey] = useState(null)
  const [actions, setActions] = useState([])
  const [scenarioReading, setScenarioReading] = useState(null)
  const [improved, setImproved] = useState(null)
  const [busy, setBusy] = useState(false)

  const scenarioProfile = useMemo(() => {
    const sc = scenarioByKey(scenarioKey)
    return sc ? sc.apply(profile) : profile
  }, [scenarioKey, profile])

  const set = (patch) => setProfile((p) => ({ ...p, ...patch }))

  // ---- transitions -----------------------------------------------------
  async function bringToLife() {
    setBusy(true)
    const r = await readCity(profile)
    setBaseline(r); setScenarioKey(null); setScenarioReading(null); setActions([]); setImproved(null)
    setBusy(false); setStep(2)   // → Pulse
  }

  async function runScenario(key) {
    setBusy(true)
    const sc = scenarioByKey(key)
    const r = await readCity(sc.apply(profile))
    setScenarioKey(key); setScenarioReading(r); setActions([]); setImproved(null)
    setBusy(false)
  }

  async function toggleAction(key) {
    const next = actions.includes(key) ? actions.filter((a) => a !== key) : [...actions, key]
    setActions(next)
    if (!next.length) { setImproved(null); return }
    let p = scenarioProfile
    for (const k of next) p = actionByKey(k).apply(p)
    setImproved(await readCity(p))
  }

  const improvedProfile = useMemo(() => {
    let p = scenarioProfile
    for (const k of actions) p = actionByKey(k).apply(p)
    return p
  }, [scenarioProfile, actions])

  // ---- shell -----------------------------------------------------------
  return (
    <div className="shell">
      <div className="phone">
        {step > 0 && (
          <>
            <div className="topbar">
              <img src={LOGO} alt="CityPulse AI" />
              <span className="sp" />
              <span className="live">models: demo</span>
            </div>
            <div className="dots">{STEPS.map((_, i) => <i key={i} className={i <= step - 1 ? 'on' : ''} />)}</div>
          </>
        )}

        <div className="screen" key={step}>
          {step === 0 && <Welcome setStep={setStep} />}
          {step === 1 && <Found profile={profile} set={set} />}
          {step === 2 && <Pulse profile={profile} reading={baseline} />}
          {step === 3 && <Test profile={scenarioProfile} scenarioKey={scenarioKey} baseline={baseline} reading={scenarioReading} runScenario={runScenario} busy={busy} />}
          {step === 4 && <Diagnose reading={scenarioReading || baseline} scenarioKey={scenarioKey} />}
          {step === 5 && <Improve base={scenarioReading || baseline} improved={improved} improvedProfile={improvedProfile} actions={actions} toggleAction={toggleAction} />}
        </div>

        {/* bottom CTA bar per step */}
        <Bar
          step={step} busy={busy}
          setStep={setStep}
          scenarioReady={!!scenarioReading}
          onBringToLife={bringToLife}
          resetToTest={() => { setActions([]); setImproved(null); setStep(3) }}
          startOver={() => { setBaseline(null); setScenarioKey(null); setScenarioReading(null); setActions([]); setImproved(null); setProfile(defaultProfile()); setStep(1) }}
        />
      </div>
    </div>
  )
}

// ============================ screens =================================
function Welcome({ setStep }) {
  return (
    <div className="fade">
      <div className="hero">
        <img src={LOGO} alt="CityPulse AI" />
        <h1>Build a city.<br />Test it. Make it better.</h1>
        <p className="sub">A smart-city planner powered by four AI models — mobility, energy, public services and waste — as one living city.</p>
      </div>
      <Guide text={guide.welcome()} />
      <div style={{ height: 8 }} />
      <button className="cta" style={{ width: '100%' }} onClick={() => setStep(1)}>Start building →</button>
    </div>
  )
}

function Found({ profile, set }) {
  return (
    <div className="fade">
      <h1>🏙️ Found your city</h1>
      <CityScene profile={profile} />
      <div className="field">
        <label>City name</label>
        <input type="text" value={profile.name} onChange={(e) => set({ name: e.target.value })} />
      </div>
      <Slider label="Population" value={profile.population} min={40000} max={2000000} step={10000}
        fmt={(v) => v.toLocaleString()} onChange={(v) => set({ population: v })} />
      <Segment label="City shape" options={DENSITY_LEVELS} value={profile.density} onChange={(v) => set({ density: v })} />
      <Slider label="Green space" value={profile.green} min={0} max={100} step={1} fmt={(v) => `${v}%`} onChange={(v) => set({ green: v })} />
      <Slider label="Transit coverage" value={profile.transit} min={0} max={100} step={1} fmt={(v) => `${v}%`} onChange={(v) => set({ transit: v })} />
      <Segment label="Budget" options={BUDGET_LEVELS} value={profile.budget} onChange={(v) => set({ budget: v })} />
      <Segment label="Season" options={SEASONS} value={profile.season} onChange={(v) => set({ season: v })} />
      <Guide text={guide.onProfile(profile)} />
    </div>
  )
}

function Pulse({ profile, reading }) {
  if (!reading) return null
  return (
    <div className="fade">
      <h1>🫀 {profile.name}'s pulse</h1>
      <CityScene profile={profile} reading={reading} />
      <div style={{ margin: '0.4rem 0' }}><HealthRing health={reading.health} /></div>
      <SystemCards reading={reading} />
      <Guide text={guide.onPulse(reading)} />
    </div>
  )
}

function Test({ profile, scenarioKey, baseline, reading, runScenario, busy }) {
  const sc = scenarioByKey(scenarioKey)
  return (
    <div className="fade">
      <h1>🧪 Test your city</h1>
      <p className="sub">Put your city under a realistic pressure and watch every system react.</p>
      <div className="tiles">
        {SCENARIOS.map((s) => (
          <button key={s.key} className={`tile ${scenarioKey === s.key ? 'on' : ''}`} onClick={() => runScenario(s.key)}>
            <div className="ti">{s.icon}</div>
            <div className="tt">{s.title}</div>
            <div className="tg">{s.tagline}</div>
          </button>
        ))}
      </div>
      {busy && <p className="sub center">Running city systems…</p>}
      {reading && (
        <>
          <CityScene profile={profile} reading={reading} />
          <div className="center" style={{ margin: '0.3rem 0' }}>
            <HealthRing health={reading.health} size={130} />
            <div style={{ color: '#9fb6d4' }}>was {baseline.health} · now <b style={{ color: '#fff' }}>{reading.health}</b></div>
          </div>
          <CompareRows before={baseline} after={reading} />
          <Guide text={guide.onScenario(sc.title, baseline, reading)} />
        </>
      )}
    </div>
  )
}

function Diagnose({ reading, scenarioKey }) {
  const diag = guide.diagnose(reading)
  const top = reading.systems[reading.sorted[0]]
  const title = scenarioByKey(scenarioKey)?.title || 'your city'
  return (
    <div className="fade">
      <h1>🔎 What matters most</h1>
      <p className="sub">Under <b>{title}</b></p>
      <div className="focuscard">
        <div style={{ fontSize: '2.4rem' }}>{top.icon}</div>
        <div className="nm" style={{ fontSize: '1.15rem', fontWeight: 700 }}>{top.label}</div>
        <div style={{ color: top.color, fontWeight: 800 }}>{top.status}</div>
        <div style={{ color: '#9fb6d4', marginTop: '0.3rem' }}>Focus here first</div>
      </div>
      <ThreeQuestions diag={diag} />
      <Guide text={guide.onPlanReady(reading)} />
    </div>
  )
}

function Improve({ base, improved, improvedProfile, actions, toggleAction }) {
  const top = base.sorted[0]
  const recommended = recommendedActionsFor(top)
  const after = improved || base
  return (
    <div className="fade">
      <h1>🛠️ Improvement plan</h1>
      <p className="sub">Pick one or two moves. Recommended are marked ⭐.</p>
      <div className="tiles">
        {ACTIONS.map((a) => (
          <button key={a.key} className={`tile ${actions.includes(a.key) ? 'on' : ''}`} onClick={() => toggleAction(a.key)}>
            <div className="ti">{a.icon}</div>
            <div className="tt">{recommended[0] === a.key ? <span className="star">⭐ </span> : ''}{a.title}</div>
            <div className="tg">{a.blurb}</div>
          </button>
        ))}
      </div>
      <CityScene profile={improvedProfile} reading={after} />
      <div className="center" style={{ margin: '0.3rem 0' }}>
        <HealthRing health={after.health} size={130} label="Projected" />
        {actions.length > 0 && <div style={{ color: '#9fb6d4' }}>was {base.health} · now <b style={{ color: '#fff' }}>{after.health}</b></div>}
      </div>
      {actions.length > 0
        ? (<><CompareRows before={base} after={after} /><Guide text={guide.onActionsApplied(base, after, actions)} /></>)
        : <Guide text="Pick a move above and I'll show you exactly how the city responds." />}
    </div>
  )
}

// ============================ small controls =================================
function Slider({ label, value, min, max, step, fmt, onChange }) {
  return (
    <div className="field">
      <label>{label}<b>{fmt ? fmt(value) : value}</b></label>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  )
}

function Segment({ label, options, value, onChange }) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="segment">
        {options.map((o) => (
          <button key={o} className={value === o ? 'on' : ''} onClick={() => onChange(o)}>{o}</button>
        ))}
      </div>
    </div>
  )
}

// ============================ bottom bar =================================
function Bar({ step, busy, setStep, scenarioReady, onBringToLife, resetToTest, startOver }) {
  if (step === 0) return null
  if (step === 1)
    return (
      <div className="cta-bar">
        <button className="ghost" onClick={() => setStep(0)}>←</button>
        <button className="cta" disabled={busy} onClick={onBringToLife}>{busy ? 'Waking up…' : 'Bring my city to life →'}</button>
      </div>
    )
  if (step === 2)
    return (
      <div className="cta-bar">
        <button className="ghost" onClick={() => setStep(1)}>Edit</button>
        <button className="cta" onClick={() => setStep(3)}>Test under pressure →</button>
      </div>
    )
  if (step === 3)
    return (
      <div className="cta-bar">
        <button className="ghost" onClick={() => setStep(2)}>←</button>
        <button className="cta" disabled={!scenarioReady} onClick={() => setStep(4)}>What matters most? →</button>
      </div>
    )
  if (step === 4)
    return (
      <div className="cta-bar">
        <button className="ghost" onClick={() => setStep(3)}>←</button>
        <button className="cta" onClick={() => setStep(5)}>Build improvement plan →</button>
      </div>
    )
  return (
    <div className="cta-bar">
      <button className="ghost" onClick={() => setStep(4)}>←</button>
      <button className="cta" onClick={resetToTest}>🧪 Test</button>
      <button className="cta" onClick={startOver}>🔄 New</button>
    </div>
  )
}
