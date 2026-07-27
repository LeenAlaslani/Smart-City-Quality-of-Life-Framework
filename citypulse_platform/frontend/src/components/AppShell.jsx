// CityPulse AI — application frame: a compact navy icon rail + a light command
// bar over a clean light stage. Five daily pages (Overview · Signals · Decision
// Workspace · Initiatives · Reports) and two utility pages (City Profile ·
// Evidence). The agent lives inside the Decision Workspace, not a side drawer.
// Pages stay light; navy is chrome only. ⌘K opens the command palette.
import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useProfile } from '../lib/store'
import { useWorkspace } from '../lib/workspace'
import { cityName } from '../lib/cityContext'
import Icon from './icons'

const NAV = [
  { to: '/app/overview', label: 'Overview', hint: 'City operations', ico: 'overview', group: 0 },
  { to: '/app/signals', label: 'Signals', hint: 'Model readings & evidence', ico: 'pulse', group: 0 },
  { to: '/app/workspace', label: 'Decision Workspace', hint: 'Investigate & recommend', ico: 'scenarios', group: 0 },
  { to: '/app/initiatives', label: 'Initiatives', hint: 'Approvals & delivery', ico: 'target', group: 0, badge: true },
  { to: '/app/reports', label: 'Reports', hint: 'Executive summary', ico: 'reports', group: 0 },
  { to: '/app/profile', label: 'City Profile', hint: 'Context & data', ico: 'pin', group: 1 },
  { to: '/app/evidence', label: 'Evidence', hint: 'Models & validation', ico: 'layers', group: 1 },
]

export default function AppShell({ children }) {
  const nav = useNavigate()
  const loc = useLocation()
  const { profile } = useProfile()
  const ws = useWorkspace()
  const [palette, setPalette] = useState(false)
  // review + delivery items needing a human — the one rail badge
  const pending = (ws.initiatives || []).filter((i) => i.status === 'In review' || i.status === 'Proposed').length
  const city = profile.city ? cityName(profile) : 'Select city'

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette((p) => !p) }
      if (e.key === 'Escape') setPalette(false)
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
          {[0, 1].map((g) => (
            <div className="rail-grp" key={g}>
              {NAV.filter((n) => n.group === g).map((n) => (
                <NavLink key={n.to} to={n.to} className={({ isActive }) => `rail-i${isActive ? ' on' : ''}`}>
                  <Icon name={n.ico} size={20} />
                  <span className="flyout"><b>{n.label}</b><em>{n.hint}</em></span>
                  {n.badge && pending > 0 && <span className="rail-badge">{pending}</span>}
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
            <button className="btn btn-cyan cbar-new" onClick={() => nav('/app/workspace')}>
              <Icon name="plus" size={16} /> New decision
            </button>
          </div>
        </header>
        <main className="stagex">
          <div className="stagex-in">{children}</div>
        </main>
      </div>

      {palette && <CommandPalette onClose={() => setPalette(false)} onGo={(to) => { setPalette(false); nav(to) }} current={loc.pathname} />}
    </div>
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
      { to: '/app/workspace', label: 'New decision', hint: 'Investigate', ico: 'plus' },
      ...NAV.map((n) => ({ to: n.to, label: n.label, hint: n.hint, ico: n.ico })),
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
