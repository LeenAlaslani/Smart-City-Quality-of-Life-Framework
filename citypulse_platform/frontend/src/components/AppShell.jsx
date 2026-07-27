// CityPulse AI — application frame: navy icon rail + light command bar + a
// persistent contextual Agent dock (right side, never competing with content).
// Pages stay light; navy is chrome and focus only. ⌘K opens the palette.
import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { api } from '../lib/api'
import { useProfile } from '../lib/store'
import { useWorkspace } from '../lib/workspace'
import { cityName } from '../lib/cityContext'
import { agentRespond, quickPrompts } from '../lib/agent'
import Icon from './icons'

const NAV = [
  { to: '/app/overview', label: 'Overview', hint: 'Executive briefing', ico: 'overview', group: 0 },
  { to: '/app/intelligence', label: 'Intelligence', hint: 'Signals & evidence', ico: 'intelligence', group: 0 },
  { to: '/app/studio', label: 'Decision Studio', hint: 'Compare options', ico: 'scenarios', group: 0 },
  { to: '/app/blueprint', label: 'Blueprint', hint: 'City strategy', ico: 'target', group: 0 },
  { to: '/app/actions', label: 'Action Center', hint: 'Operational follow-up', ico: 'actions', group: 1, badge: true },
  { to: '/app/roadmap', label: 'Roadmap', hint: 'Delivery phases', ico: 'roadmap', group: 1 },
  { to: '/app/reports', label: 'Reports', hint: 'Executive summary', ico: 'reports', group: 2 },
  { to: '/app/evidence', label: 'Evidence', hint: 'Models & validation', ico: 'layers', group: 2 },
]
const ROUTE_NAME = {
  '/app/overview': 'Overview', '/app/intelligence': 'Intelligence', '/app/studio': 'Decision Studio',
  '/app/scenarios': 'Decision Studio', '/app/blueprint': 'Blueprint', '/app/actions': 'Action Center',
  '/app/roadmap': 'Roadmap', '/app/reports': 'Reports', '/app/evidence': 'Evidence', '/app/profile': 'City Profile',
}

export default function AppShell({ children }) {
  const nav = useNavigate()
  const loc = useLocation()
  const { profile } = useProfile()
  const ws = useWorkspace()
  const [palette, setPalette] = useState(false)
  const [dock, setDock] = useState(false)
  const openActions = ws.actions.filter((a) => a.status !== 'Done').length
  const city = profile.city ? cityName(profile) : 'Select city'

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette((p) => !p) }
      if (e.key === 'Escape') { setPalette(false); setDock(false) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="appx">
      <aside className="rail" aria-label="Primary navigation">
        <button className="rail-logo" onClick={() => nav('/')} title="CityPulse — home" aria-label="CityPulse home">
          <PulseGlyph />
        </button>
        <nav className="rail-nav">
          {[0, 1, 2].map((g) => (
            <div className="rail-grp" key={g}>
              {NAV.filter((n) => n.group === g).map((n) => (
                <NavLink key={n.to} to={n.to} className={({ isActive }) => `rail-i${isActive ? ' on' : ''}`}>
                  <Icon name={n.ico} size={20} />
                  <span className="flyout"><b>{n.label}</b><em>{n.hint}</em></span>
                  {n.badge && openActions > 0 && <span className="rail-badge">{openActions}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="rail-foot">
          <button className="rail-i" onClick={() => nav('/')} title="Back to home">
            <Icon name="home" size={19} /><span className="flyout"><b>Home</b><em>Landing</em></span>
          </button>
        </div>
      </aside>

      <div className="appx-main">
        <header className="cbar">
          <button className="city-switch" onClick={() => nav('/app/profile')} title="City profile">
            <span className="cs-dot" />
            <span className="cs-name">{city}</span>
            <span className="cs-country">{profile.country || 'Saudi Arabia'}</span>
            <Icon name="down" size={15} />
          </button>
          <div className="cbar-r">
            <button className="cbar-search" onClick={() => setPalette(true)}>
              <Icon name="search" size={15} />
              <span>Search or run a command</span>
              <kbd>⌘K</kbd>
            </button>
            <button className={`cbar-agent${dock ? ' on' : ''}`} onClick={() => setDock((d) => !d)} title="CityPulse agent">
              <Icon name="spark" size={16} /> Agent
            </button>
            <button className="btn btn-cyan cbar-new" onClick={() => nav('/app/intelligence?guided=1')}>
              <Icon name="plus" size={16} /> New decision
            </button>
          </div>
        </header>
        <main className="stagex">
          <div className="stagex-in">{children}</div>
        </main>
      </div>

      {dock && <AgentDock onClose={() => setDock(false)} route={ROUTE_NAME[loc.pathname] || 'Platform'} pathname={loc.pathname} />}
      {palette && <CommandPalette onClose={() => setPalette(false)} onGo={(to) => { setPalette(false); nav(to) }} current={loc.pathname} />}
    </div>
  )
}

// ── Persistent contextual agent dock ───────────────────────────────────────
function AgentDock({ onClose, route, pathname }) {
  const nav = useNavigate()
  const { profile } = useProfile()
  const ws = useWorkspace()
  const [analyze, setAnalyze] = useState(null)
  const [msgs, setMsgs] = useState([])
  const [input, setInput] = useState('')
  const endRef = useRef(null)
  useEffect(() => { api.analyze(profile, 'baseline').then(setAnalyze).catch(() => {}) }, [])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  const send = (text) => {
    if (!text.trim()) return
    const reply = agentRespond(text, { profile, analyze, ws, nav, route })
    setMsgs((m) => [...m, { role: 'user', text }, { role: 'ai', ...reply }])
    setInput('')
  }
  const prompts = quickPrompts(pathname)
  const focus = analyze?.impact?.focus_label

  return (
    <aside className="dock" role="complementary" aria-label="CityPulse agent">
      <div className="dock-head">
        <span className="dock-mark"><Icon name="spark" size={15} /></span>
        <div className="dock-t"><b>CityPulse agent</b><em>{cityName(profile)} · {route}</em></div>
        <button className="dock-x" onClick={onClose} aria-label="Close agent"><Icon name="plus" size={16} style={{ transform: 'rotate(45deg)' }} /></button>
      </div>
      <div className="dock-ctx">
        <span><Icon name="target" size={12} /> {focus ? focus.split(' & ')[0] : '—'} priority</span>
        <span><Icon name="actions" size={12} /> {ws.actions.filter((a) => a.status !== 'Done').length} open</span>
        <span><Icon name="layers" size={12} /> {ws.blueprint.length} blueprint</span>
      </div>
      <div className="dock-msgs">
        {msgs.length === 0 && (
          <div className="dock-hello">
            Grounded in {cityName(profile)}'s live model readings, profile and workspace.
            Ask a question or pick a prompt.
            <span className="dock-honest">Rule-based prototype assistant — answers are labelled by source.</span>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`dmsg ${m.role}`}>
            <div className="dbub">
              {m.tag && <span className="dsrc">{m.tag}</span>}
              <div>{m.text}</div>
              {m.actions && <div className="dacts">{m.actions.map((a, j) => (
                <button key={j} onClick={() => { a.fn(); }} className="dact"><Icon name={a.icon} size={13} />{a.label}</button>
              ))}</div>}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="dock-sug">{prompts.slice(0, 3).map((p) => <button key={p} onClick={() => send(p)}>{p}</button>)}</div>
      <div className="dock-in">
        <input value={input} placeholder="Ask about the city…" onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send(input)} aria-label="Ask the agent" />
        <button onClick={() => send(input)} aria-label="Send"><Icon name="arrowRight" size={16} /></button>
      </div>
    </aside>
  )
}

function PulseGlyph() {
  return (
    <svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true">
      <circle cx="20" cy="20" r="15" fill="none" stroke="rgba(127,219,232,.35)" strokeWidth="1.2" />
      <line x1="20" y1="5" x2="20" y2="35" stroke="rgba(127,219,232,.28)" strokeWidth="1" />
      <line x1="5" y1="20" x2="35" y2="20" stroke="rgba(127,219,232,.28)" strokeWidth="1" />
      <circle cx="20" cy="5" r="3" fill="#7fdbe8" /><circle cx="35" cy="20" r="3" fill="#2f9e7b" />
      <circle cx="20" cy="35" r="3" fill="#5a86ad" /><circle cx="5" cy="20" r="3" fill="#2f9e7b" />
      <circle cx="20" cy="20" r="5.5" fill="#0e2a4f" stroke="#3fd0e6" strokeWidth="1.4" />
      <circle cx="20" cy="20" r="2" fill="#3fd0e6" />
    </svg>
  )
}

function CommandPalette({ onClose, onGo, current }) {
  const [q, setQ] = useState('')
  const [i, setI] = useState(0)
  const inputRef = useRef(null)
  useEffect(() => { inputRef.current?.focus() }, [])
  const items = useMemo(() => {
    const base = [
      { to: '/app/intelligence?guided=1', label: 'New decision', hint: 'Guided flow', ico: 'plus' },
      ...NAV.map((n) => ({ to: n.to, label: n.label, hint: n.hint, ico: n.ico })),
      { to: '/app/profile', label: 'City Profile', hint: 'Context & data', ico: 'pin' },
      { to: '/', label: 'CityPulse home', hint: 'Landing', ico: 'home' },
    ]
    const s = q.trim().toLowerCase()
    return s ? base.filter((x) => x.label.toLowerCase().includes(s)) : base
  }, [q])
  useEffect(() => { if (i >= items.length) setI(0) }, [items.length, i])
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setI((v) => Math.min(v + 1, items.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setI((v) => Math.max(v - 1, 0)) }
    if (e.key === 'Enter' && items[i]) onGo(items[i].to)
  }
  return (
    <div className="palette-wrap" onMouseDown={onClose}>
      <div className="palette" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-label="Command palette">
        <div className="palette-in">
          <Icon name="search" size={17} />
          <input ref={inputRef} value={q} onChange={(e) => { setQ(e.target.value); setI(0) }} onKeyDown={onKey}
            placeholder="Search pages or run a command…" aria-label="Command input" />
          <kbd>esc</kbd>
        </div>
        <div className="palette-list">
          {items.length ? items.map((x, idx) => (
            <button key={x.to + x.label} className={`palette-row${idx === i ? ' on' : ''}${x.to === current ? ' cur' : ''}`}
              onMouseEnter={() => setI(idx)} onClick={() => onGo(x.to)}>
              <span className="pr-ic"><Icon name={x.ico} size={16} /></span>
              <span className="pr-l">{x.label}</span>
              <span className="pr-h">{x.hint}</span>
            </button>
          )) : <div className="palette-empty">No matches</div>}
        </div>
      </div>
    </div>
  )
}
