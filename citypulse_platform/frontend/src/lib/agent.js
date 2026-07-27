// CityPulse AI — the agent layer. One shared, honest reasoning module used by
// the Decision Workspace (where it narrates the investigation) and the Overview
// (where it composes the recommendation). It reads ONLY real state: city
// profile, live model output and the workspace. Answers are deterministic and
// labelled by source; this module is the seam where a hosted LLM would plug in
// later (same inputs, same action contract).
import { cityName, cityDecisions, OUTCOME_LABEL, fmtOutcome, DOMAIN_CATEGORIES } from './cityContext'
import { classify } from './cityStatus'

// ── Recommendation: the next decision the city should investigate ──────────
// Live priority domain → first applicable decision for this city in that
// domain's categories (categories listed best-fit-first). Fully explainable.
export function recommendDecision(profile, reading, decisions) {
  if (!reading) return null
  const cls = classify(reading)
  const pri = cls.priority
  const applicable = cityDecisions(profile, decisions || [])
  const cats = DOMAIN_CATEGORIES[pri.domain] || []
  let pick = null
  for (const c of cats) { pick = applicable.find((d) => d.category === c); if (pick) break }
  pick = pick || applicable[0]
  if (!pick) return null
  return {
    decision: pick,
    domain: pri.domain,
    why: `${pri.domain_label} is the current priority (${pri.status.toLowerCase()}) — ${pri.driver}`,
    signal: `${OUTCOME_LABEL[pri.domain]}: ${fmtOutcome(pri)}`,
  }
}

// City status word for the header — honest, derived from band counts.
export function cityStatusLine(reading) {
  const cls = classify(reading)
  if (cls.allStable) return { label: 'Steady', detail: 'All four domains inside their normal range.' }
  if (cls.urgentCount > 0) return { label: 'Act now', detail: `${cls.urgentCount} domain${cls.urgentCount === 1 ? '' : 's'} above the comfortable range.` }
  return { label: 'Watchful', detail: `${cls.watchCount} of 4 domains trending toward thresholds.` }
}

// Delivery risk from the real workspace.
export function deliveryRisk(ws) {
  const today = new Date().toISOString().slice(0, 10)
  const open = (ws.tasks || []).filter((t) => t.status !== 'Done')
  const overdue = open.filter((t) => t.due && t.due < today)
  const todo = (ws.tasks || []).filter((t) => t.status === 'To do')
  const inReview = (ws.initiatives || []).filter((i) => i.status === 'In review')
  if (overdue.length) return { level: 'high', text: `${overdue.length} task${overdue.length === 1 ? ' is' : 's are'} past due — oldest: “${overdue[0].title}”.` }
  if (inReview.length) return { level: 'med', text: `${inReview.length} initiative${inReview.length === 1 ? '' : 's'} awaiting review.` }
  if (todo.length) return { level: 'low', text: `${todo.length} task${todo.length === 1 ? '' : 's'} not yet started.` }
  return { level: 'none', text: 'No delivery blockers in the workspace.' }
}

// ── Deterministic Q&A (used by the Workspace agent) ────────────────────────
export function agentRespond(text, ctx) {
  const { profile, analyze, ws, nav } = ctx
  const t = text.toLowerCase()
  const city = cityName(profile)
  const reading = analyze?.reading
  const impact = analyze?.impact

  const domHit = reading && [
    [/service|governance|delay|request/, 'governance'],
    [/traffic|mobility|road|transport|congestion/, 'mobility'],
    [/energy|electric|power|cooling|building/, 'energy'],
    [/waste|environment|collection|tons/, 'waste'],
  ].find(([re]) => re.test(t))
  if (domHit && !/attention|initiative|missing|summary|deliver/.test(t)) {
    const s = reading.signals[domHit[1]]
    return { tag: 'Model output', text: `${s.domain_label} in ${city}: ${fmtOutcome(s)} — ${s.status}. ${s.driver}` }
  }
  if (/attention|priority|urgent|focus|worry/.test(t) && impact) {
    return { tag: 'Model output', text: `${impact.focus_label} is the priority in ${city}. ${impact.why}` }
  }
  if (/initiative|strategy|deliver|roadmap|approve/.test(t)) {
    const inits = ws.initiatives || []
    const byStage = STAGES_ORDER.map((st) => `${inits.filter((i) => i.status === st).length} ${st.toLowerCase()}`).filter((x) => !x.startsWith('0')).join(', ')
    return {
      tag: 'Workspace', text: `${inits.length} initiative${inits.length === 1 ? '' : 's'} in the pipeline: ${byStage || 'none yet'}. Approving one adds it to delivery with its evidence attached.`,
      actions: [{ label: 'Open Initiatives', icon: 'target', fn: () => nav('/app/initiatives') }],
    }
  }
  if (/missing|data|valid|calibrat/.test(t)) {
    const missing = profile.datasets_missing?.length ? profile.datasets_missing.join(', ')
      : 'traffic counts, building energy meters, service-request logs and waste tonnage by zone'
    return {
      tag: 'Data limitation', text: `For a validated local picture, ${city} still needs: ${missing}. Until then, outputs are internationally-trained prototype signals.`,
      actions: [{ label: 'See Evidence', icon: 'layers', fn: () => nav('/app/evidence') }],
    }
  }
  if (/summary|stakeholder|report|brief/.test(t) && impact) {
    return {
      tag: 'Composed from workspace', text: `${city}: priority is ${impact.focus_label} (${impact.focus_status.toLowerCase()}). First move: ${impact.recommended_response}`,
      actions: [{ label: 'Open report', icon: 'reports', fn: () => nav('/app/reports') }],
    }
  }
  return { tag: 'Assistant', text: `I can explain what needs attention in ${city}, read any domain's model output, summarise initiatives and delivery, or flag missing data. I'm grounded in your live models and workspace.` }
}
const STAGES_ORDER = ['Proposed', 'In review', 'Approved', 'In delivery', 'Delivered']

export function quickPrompts() {
  return ['What needs attention right now?', 'What do the models say about traffic?', 'What data is missing for validation?']
}
