// CityPulse AI — routes. Five daily pages + two utility pages; the agent lives
// inside the Decision Workspace, not a page. Old routes redirect to their new
// homes so nothing 404s.
import { Routes, Route, Navigate } from 'react-router-dom'
import { useProfile } from './lib/store'
import AppShell from './components/AppShell'
import Onboarding from './pages/Onboarding'
import LandingV2 from './pages/LandingV2'
import Overview from './pages/Overview'
import Signals from './pages/Signals'
import Workspace from './pages/Workspace'
import Initiatives from './pages/Initiatives'
import Reports from './pages/Reports'
import Evidence from './pages/Evidence'
import CityProfile from './pages/CityProfile'

function Guarded({ children }) {
  const { isOnboarded } = useProfile()
  if (!isOnboarded) return <Navigate to="/onboarding" replace />
  return <AppShell>{children}</AppShell>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingV2 />} />
      <Route path="/onboarding" element={<Onboarding />} />

      <Route path="/app/overview" element={<Guarded><Overview /></Guarded>} />
      <Route path="/app/signals" element={<Guarded><Signals /></Guarded>} />
      <Route path="/app/workspace" element={<Guarded><Workspace /></Guarded>} />
      <Route path="/app/initiatives" element={<Guarded><Initiatives /></Guarded>} />
      <Route path="/app/reports" element={<Guarded><Reports /></Guarded>} />
      <Route path="/app/profile" element={<Guarded><CityProfile /></Guarded>} />
      <Route path="/app/evidence" element={<Guarded><Evidence /></Guarded>} />

      {/* legacy routes → new homes */}
      <Route path="/app/intelligence" element={<Navigate to="/app/signals" replace />} />
      <Route path="/app/studio" element={<Navigate to="/app/workspace" replace />} />
      <Route path="/app/scenarios" element={<Navigate to="/app/workspace" replace />} />
      <Route path="/app/blueprint" element={<Navigate to="/app/initiatives" replace />} />
      <Route path="/app/actions" element={<Navigate to="/app/initiatives" replace />} />
      <Route path="/app/roadmap" element={<Navigate to="/app/initiatives" replace />} />
      <Route path="/app/copilot" element={<Navigate to="/app/workspace" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
