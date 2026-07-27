// CityPulse AI — application shell: header (logo + context) + side navigation.
import { NavLink } from 'react-router-dom'
import { useProfile } from '../lib/store'
import { useWorkspace } from '../lib/workspace'
import Icon from './icons'

const NAV_MAIN = [
  { to: '/app/overview', label: 'City Overview', ico: 'overview' },
  { to: '/app/intelligence', label: 'City Intelligence', ico: 'intelligence' },
  { to: '/app/scenarios', label: 'Decision Scenarios', ico: 'scenarios' },
]
const NAV_WORK = [
  { to: '/app/roadmap', label: 'Roadmap', ico: 'roadmap' },
  { to: '/app/actions', label: 'Action Center', ico: 'actions', badge: 'actions' },
  { to: '/app/copilot', label: 'AI Copilot', ico: 'intelligence' },
]
const NAV_MORE = [
  { to: '/app/reports', label: 'Reports', ico: 'evidence' },
  { to: '/app/evidence', label: 'Model & Data Evidence', ico: 'layers' },
]

export default function AppShell({ children }) {
  const { profile } = useProfile()
  const ws = useWorkspace()
  const openActions = ws.actions.filter((a) => a.status !== 'Done').length
  const cityName = profile.city
    ? profile.city.charAt(0).toUpperCase() + profile.city.slice(1)
    : 'No city selected'
  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <img src="/citypulse-logo.png" alt="CityPulse AI" />
          <span className="sub">Smart City Decision Platform</span>
        </div>
        <div className="spacer" />
        <div className="ctx">
          <span className="pin"><Icon name="pin" size={15} /></span>
          <span>{cityName}{profile.country ? `, ${profile.country}` : ''}</span>
        </div>
      </header>
      <div className="shell">
        <nav className="sidenav" aria-label="Primary">
          <div className="group">Decision workspace</div>
          {NAV_MAIN.map((n) => <NavItem key={n.to} n={n} count={openActions} />)}
          <div className="group">Delivery</div>
          {NAV_WORK.map((n) => <NavItem key={n.to} n={n} count={openActions} />)}
          <div className="group">More</div>
          {NAV_MORE.map((n) => <NavItem key={n.to} n={n} count={openActions} />)}
        </nav>
        <main className="main">
          <div className="container">{children}</div>
        </main>
      </div>
    </div>
  )
}

function NavItem({ n, count }) {
  return (
    <NavLink to={n.to} className={({ isActive }) => `navlink${isActive ? ' active' : ''}`} title={n.label}>
      <span className="ico"><Icon name={n.ico} size={18} /></span>
      <span>{n.label}</span>
      {n.badge === 'actions' && count > 0 && (
        <span className="nav-badge">{count}</span>
      )}
    </NavLink>
  )
}
