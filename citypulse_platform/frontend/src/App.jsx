// CityPulse AI — routes. Page purposes: Overview (executive brief) ·
// Intelligence (signals & evidence) · Studio (compare options) · Blueprint
// (city strategy) · Actions (operational follow-up) · Roadmap (delivery) ·
// Reports (executive summary) · Evidence (models & validation) · Profile
// (city context). The agent is a persistent dock in the shell, not a page.
import { Routes, Route, Navigate } from 'react-router-dom'
import { useProfile } from './lib/store'
import AppShell from './components/AppShell'
import Onboarding from './pages/Onboarding'
import LandingV2 from './pages/LandingV2'
import Overview from './pages/Overview'
import Intelligence from './pages/Intelligence'
import Studio from './pages/Studio'
import Blueprint from './pages/Blueprint'
import CityProfile from './pages/CityProfile'
import Roadmap from './pages/Roadmap'
import ActionCenter from './pages/ActionCenter'
import Evidence from './pages/Evidence'
import Reports from './pages/Reports'

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
      <Route path="/app/intelligence" element={<Guarded><Intelligence /></Guarded>} />
      <Route path="/app/studio" element={<Guarded><Studio /></Guarded>} />
      <Route path="/app/scenarios" element={<Navigate to="/app/studio" replace />} />
      <Route path="/app/blueprint" element={<Guarded><Blueprint /></Guarded>} />
      <Route path="/app/profile" element={<Guarded><CityProfile /></Guarded>} />
      <Route path="/app/roadmap" element={<Guarded><Roadmap /></Guarded>} />
      <Route path="/app/actions" element={<Guarded><ActionCenter /></Guarded>} />
      <Route path="/app/copilot" element={<Navigate to="/app/overview" replace />} />
      <Route path="/app/reports" element={<Guarded><Reports /></Guarded>} />
      <Route path="/app/evidence" element={<Guarded><Evidence /></Guarded>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
