// CityPulse AI — AI Copilot. Contextual assistant grounded in the city profile,
// live model results, scenarios, roadmap and actions. Every answer labels its
// source (model output / assumption / recommendation) and offers real actions.
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useProfile } from '../lib/store'
import { useWorkspace } from '../lib/workspace'
import { Button } from '../components/ui'
import Icon from '../components/icons'

const PROMPTS = [
  'What needs attention right now?',
  'Summarise the roadmap',
  'What data is missing for a validated forecast?',
  'Prepare a stakeholder summary',
]

export default function Copilot() {
  const nav = useNavigate()
  const { profile } = useProfile()
  const ws = useWorkspace()
  const [reading, setReading] = useState(null)
  const [msgs, setMsgs] = useState([{ role: 'ai', tag: null, text: "I'm your CityPulse Copilot. I can read your city profile, live model signals, scenarios, roadmap and actions. Ask me anything, or pick a prompt below." }])
  const [input, setInput] = useState('')
  const endRef = useRef(null)

  useEffect(() => { api.analyze(profile, 'baseline').then(setReading).catch(() => {}) }, [])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  const send = (text) => {
    if (!text.trim()) return
    const reply = respond(text, { profile, reading, ws, nav })
    setMsgs((m) => [...m, { role: 'user', text }, { role: 'ai', ...reply }])
    setInput('')
  }

  const cityName = profile.city ? profile.city[0].toUpperCase() + profile.city.slice(1) : 'your city'
  const focus = reading ? reading.impact.focus_label : '—'

  return (
    <>
      <div className="pagehead"><div className="eyebrow">AI Copilot</div><h1>Decision copilot</h1>
        <p className="lead">Contextual help across your city, scenarios, roadmap and actions.</p></div>

      <div className="cop-ctx">
        <Ctx icon="pin" k="City" v={cityName} />
        <Ctx icon="target" k="Priority" v={focus.split(' & ')[0]} />
        <Ctx icon="actions" k="Open actions" v={ws.actions.filter((a) => a.status !== 'Done').length} />
        <Ctx icon="roadmap" k="Initiatives" v={ws.roadmap.length} />
      </div>

      <div className="cop">
        <div className="cop-msgs">
          {msgs.map((m, i) => (
            <div key={i} className={`msg ${m.role}`}>
              {m.role === 'ai' && <span className="av"><Icon name="intelligence" size={15} /></span>}
              <div className="bub">
                {m.tag && <span className="src">{m.tag}</span>}
                <div className="txt">{m.text}</div>
                {m.actions && (
                  <div className="row" style={{ marginTop: 10, flexWrap: 'wrap' }}>
                    {m.actions.map((a, j) => <Button key={j} size="sm" variant="secondary" icon={a.icon} onClick={a.fn}>{a.label}</Button>)}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div className="cop-sug">
          {PROMPTS.map((p) => <button key={p} className="choice" onClick={() => send(p)}>{p}</button>)}
        </div>
        <div className="cop-input">
          <input type="text" value={input} placeholder="Ask the copilot…" onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send(input)} />
          <Button icon="arrowRight" onClick={() => send(input)}>Send</Button>
        </div>
      </div>

      <style>{`
        .cop-ctx { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:16px; }
        .cop-ctx .c { background:var(--cp-surface); border:1px solid var(--cp-border); border-radius:12px; padding:12px 14px; display:flex; gap:10px; align-items:center; }
        .cop-ctx .ci { width:32px; height:32px; border-radius:9px; display:grid; place-items:center; background:var(--cp-teal-050); color:var(--cp-teal-600); }
        .cop-ctx .ck { font-size:11px; color:var(--cp-muted); } .cop-ctx .cv { font-size:15px; font-weight:700; color:var(--cp-ink); }
        .cop { background:var(--cp-surface); border:1px solid var(--cp-border); border-radius:16px; box-shadow:var(--sh-1); overflow:hidden; }
        .cop-msgs { padding:20px; display:flex; flex-direction:column; gap:16px; max-height:52vh; overflow-y:auto; }
        .msg { display:flex; gap:11px; max-width:82%; }
        .msg.user { margin-inline-start:auto; flex-direction:row-reverse; }
        .msg .av { width:30px; height:30px; border-radius:9px; flex:0 0 auto; display:grid; place-items:center; background:var(--grad-brand); color:#fff; }
        .msg .bub { background:var(--cp-surface-2); border:1px solid var(--cp-border); border-radius:14px; padding:12px 14px; }
        .msg.user .bub { background:var(--cp-navy-600); border-color:var(--cp-navy-600); color:#fff; }
        .msg .src { font-size:10px; text-transform:uppercase; letter-spacing:.07em; font-weight:700; color:var(--cp-teal-600); display:block; margin-bottom:4px; }
        .msg .txt { font-size:14px; line-height:1.55; color:inherit; }
        .cop-sug { display:flex; gap:8px; flex-wrap:wrap; padding:0 20px 14px; }
        .cop-input { display:flex; gap:10px; padding:14px 20px; border-top:1px solid var(--cp-border); background:var(--cp-surface-2); }
        .cop-input input { flex:1; font-family:var(--font); font-size:14px; border:1px solid var(--cp-border-strong); border-radius:10px; padding:11px 14px; }
        .cop-input input:focus { outline:none; border-color:var(--cp-navy-500); box-shadow:0 0 0 3px rgba(29,74,130,.12); }
        @media (max-width:760px){ .cop-ctx{ grid-template-columns:1fr 1fr;} .msg{ max-width:100%; } }
      `}</style>
    </>
  )
}

const Ctx = ({ icon, k, v }) => (
  <div className="c"><span className="ci"><Icon name={icon} size={16} /></span><div><div className="ck">{k}</div><div className="cv">{v}</div></div></div>
)

// Deterministic, context-grounded responder (LLM-ready seam).
function respond(text, { profile, reading, ws, nav }) {
  const t = text.toLowerCase()
  const cityName = profile.city ? profile.city[0].toUpperCase() + profile.city.slice(1) : 'the city'
  const focus = reading?.impact
  if (/attention|priority|urgent|focus/.test(t) && focus) {
    return {
      tag: 'Model output',
      text: `${focus.focus_label} is under the most pressure in ${cityName} right now. ${focus.why} I'd prioritise this in the next planning cycle.`,
      actions: [
        { label: 'Create action', icon: 'plus', fn: () => ws.createAction({ title: `Address ${focus.focus_label.toLowerCase()} pressure`, type: 'Decision', domain: focus.focus_domain, department: 'City Strategy', priority: 'High', relatedArea: 'Central District', source: 'Copilot' }) },
        { label: 'Open Intelligence', icon: 'arrowRight', fn: () => nav('/app/intelligence') },
      ],
    }
  }
  if (/roadmap|initiative/.test(t)) {
    const byH = ws.roadmap.reduce((m, r) => ({ ...m, [r.horizon]: (m[r.horizon] || 0) + 1 }), {})
    return {
      tag: 'Workspace summary',
      text: `Your roadmap has ${ws.roadmap.length} initiative(s): ${Object.entries(byH).map(([h, n]) => `${n} ${h}-term`).join(', ') || 'none yet'}. The nearest focus is "${ws.roadmap[0]?.title || '—'}".`,
      actions: [{ label: 'Open roadmap', icon: 'roadmap', fn: () => nav('/app/roadmap') }],
    }
  }
  if (/missing|data|forecast|valid/.test(t)) {
    return {
      tag: 'Data limitation',
      text: `For a validated local forecast, ${cityName} would need connected Saudi operational data — traffic counts, building energy meters, municipal service requests and waste tonnage by zone. Today's results are transferable, model-supported intelligence.`,
      actions: [{ label: 'Request data', icon: 'plus', fn: () => ws.createAction({ title: 'Request local operational datasets for validation', type: 'Data request', domain: 'governance', department: 'City Data', priority: 'Medium', relatedArea: 'Citywide', source: 'Copilot' }) }],
    }
  }
  if (/summary|stakeholder|report|brief/.test(t) && focus) {
    return {
      tag: 'AI recommendation',
      text: `Stakeholder summary — ${cityName}: the priority is ${focus.focus_label} (${focus.focus_status.toLowerCase()} pressure). Recommended first move: ${focus.recommended_response} There are ${ws.actions.length} tracked actions and ${ws.roadmap.length} roadmap initiatives.`,
      actions: [{ label: 'Open reports', icon: 'evidence', fn: () => nav('/app/reports') }],
    }
  }
  return {
    tag: 'Copilot',
    text: `I can help with priorities, scenarios, the roadmap, missing data, or a stakeholder summary for ${cityName}. Try one of the prompts below, or ask about a specific domain.`,
  }
}
