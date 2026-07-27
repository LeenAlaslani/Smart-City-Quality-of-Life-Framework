// CityPulse AI — lightweight city-profile store (React context + localStorage).
import { createContext, useContext, useEffect, useState } from 'react'

const KEY = 'citypulse.profile'
const Ctx = createContext(null)

const defaultProfile = {
  city: null, country: 'Saudi Arabia', population_range: null, districts: null,
  city_type: null, challenges: [], priorities: [], budget_level: null,
  timeline: null, data_availability: null,
}

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(() => {
    try { return { ...defaultProfile, ...JSON.parse(localStorage.getItem(KEY) || '{}') } }
    catch { return defaultProfile }
  })
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(profile)) }, [profile])
  const update = (patch) => setProfile((p) => ({ ...p, ...patch }))
  const reset = () => setProfile(defaultProfile)
  const isOnboarded = !!(profile.city && profile.population_range && profile.city_type)
  return <Ctx.Provider value={{ profile, update, reset, isOnboarded }}>{children}</Ctx.Provider>
}

export const useProfile = () => useContext(Ctx)
