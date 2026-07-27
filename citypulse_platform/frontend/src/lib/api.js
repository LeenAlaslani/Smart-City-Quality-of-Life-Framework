// CityPulse AI — API client for the Python inference service.
// Dev: proxied '/api'. Prod (separate backend origin): set VITE_API_BASE to the
// backend's URL + '/api' (e.g. https://citypulse-backend.onrender.com/api).
const BASE = import.meta.env.VITE_API_BASE || '/api'

async function req(path, opts) {
  const res = await fetch(BASE + path, opts)
  if (!res.ok) {
    let detail = res.statusText
    try { detail = (await res.json()).detail || detail } catch {}
    throw new Error(detail)
  }
  return res.json()
}

export const api = {
  health: () => req('/health'),
  options: () => req('/options'),
  models: () => req('/models'),
  overview: (p) => req(`/overview?${new URLSearchParams(p)}`),
  analyze: (profile, decision = 'baseline', overrides = {}) =>
    req('/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, decision, overrides }),
    }),
}
