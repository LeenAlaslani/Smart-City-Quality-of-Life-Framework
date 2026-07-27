// CityPulse AI — ONE shared source of truth for how a city reading is classified
// into statuses, attention sets and counts. Every card, count and message on a
// page derives from these helpers, so the UI can never contradict itself
// (e.g. a "Watch" priority while the alerts say "0 to watch").
//
// The status vocabulary MIRRORS the backend STATUS_BANDS (backend/app/
// integration.py): Stable → Watch → Elevated → High → Critical.

export const STATUS_TIER = { Stable: 0, Watch: 1, Elevated: 2, High: 3, Critical: 4 }

// A domain needs attention once it leaves the Stable band (Watch and above).
export const ATTENTION_MIN = STATUS_TIER.Watch
// A domain is an urgent alert from the Elevated band upward.
export const URGENT_MIN = STATUS_TIER.Elevated

// Scalar pressure → band, mirroring backend STATUS_BANDS (colors from tokens).
export const BANDS = [
  [0, 34, 'Stable', '#2f9e7b'], [34, 55, 'Watch', '#5a86ad'],
  [55, 72, 'Elevated', '#b98f3f'], [72, 86, 'High', '#bd7761'], [86, 101, 'Critical', '#b15f6b'],
]
export function bandOf(p) {
  for (const [lo, hi, status, color] of BANDS) if (p >= lo && p < hi) return { status, color }
  return { status: 'Critical', color: '#b15f6b' }
}

export const tierOf = (status) => STATUS_TIER[status] ?? 0
export const needsAttention = (status) => tierOf(status) >= ATTENTION_MIN
export const isUrgent = (status) => tierOf(status) >= URGENT_MIN

// Plain-language band descriptions (used in legends / evidence lines).
export const BAND_MEANING = {
  Stable: 'within seasonal baseline',
  Watch: 'trending toward threshold — monitor',
  Elevated: 'above comfortable range — act soon',
  High: 'near capacity — action needed',
  Critical: 'exceeds threshold — act now',
}

// Classify a reading's signals into a single consistent view. Everything the
// Overview shows about status is read from this object.
export function classify(reading) {
  const signals = Object.values(reading.signals)
  const ordered = [...signals].sort((a, b) => b.pressure - a.pressure)
  const attention = ordered.filter((s) => needsAttention(s.status)) // Watch+
  const urgent = ordered.filter((s) => isUrgent(s.status))          // Elevated+
  const stable = ordered.filter((s) => !needsAttention(s.status))
  const priority = reading.signals[reading.priority] || ordered[0]
  return {
    ordered, attention, urgent, stable, priority,
    watchCount: attention.length,
    urgentCount: urgent.length,
    allStable: attention.length === 0,
  }
}

// Honest, qualitative model confidence — DERIVED from real provenance/integrity,
// never a fabricated percentage. Models are trained on external (non-Saudi) open
// data with no local validation set, so confidence is "Indicative" until local
// operational data is connected (at which point the backend drops `data_gap`).
export function confidenceFrom(analyze) {
  const prov = analyze._provenance || {}
  const integ = analyze.integrity || {}
  const hasGap = !!integ.data_gap
  const level = hasGap ? 2 : 3            // 1 Low · 2 Indicative · 3 High
  const label = ['Low', 'Indicative', 'High'][level - 1]
  const caption = hasGap
    ? `Model-supported · trained on ${prov.dataset_origin || 'external open data'}. Validate with local Saudi operational data for a confirmed forecast.`
    : 'Validated against local operational data.'
  return { level, label, caption, live: !!prov.live, datasetOrigin: prov.dataset_origin || null }
}

// Data-freshness descriptor, bound to the real provenance flag.
export function freshnessFrom(analyze) {
  const prov = analyze._provenance || {}
  return {
    live: !!prov.live,
    label: prov.live ? 'Live model run' : 'Cached',
    detail: prov.dataset_origin ? `external-trained · ${prov.dataset_origin}` : 'external-trained',
  }
}
