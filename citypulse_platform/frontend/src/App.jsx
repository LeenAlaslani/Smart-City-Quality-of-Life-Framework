// CityPulse AI — routes. Every area is implemented and functional.
import { Routes, Route, Navigate } from 'react-router-dom'
import { useProfile } from './lib/store'
import AppShell from './components/AppShell'
import Landing from './pages/Landing'
import Onboarding from './pages/Onboarding'
import Overview from './pages/Overview'
import Intelligence from './pages/Intelligence'
import Scenarios from './pages/Scenarios'
import Roadmap from './pages/Roadmap'
import ActionCenter from './pages/ActionCenter'
import Copilot from './pages/Copilot'
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
      <Route path="/" element={<Landing />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/app/overview" element={<Guarded><Overview /></Guarded>} />
      <Route path="/app/intelligence" element={<Guarded><Intelligence /></Guarded>} />
      <Route path="/app/scenarios" element={<Guarded><Scenarios /></Guarded>} />
      <Route path="/app/roadmap" element={<Guarded><Roadmap /></Guarded>} />
      <Route path="/app/actions" element={<Guarded><ActionCenter /></Guarded>} />
      <Route path="/app/copilot" element={<Guarded><Copilot /></Guarded>} />
      <Route path="/app/reports" element={<Guarded><Reports /></Guarded>} />
      <Route path="/app/evidence" element={<Guarded><Evidence /></Guarded>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
