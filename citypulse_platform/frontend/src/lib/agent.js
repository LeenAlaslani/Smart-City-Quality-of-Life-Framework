// CityPulse AI — the agent layer. One shared, honest reasoning module used by
// the persistent assistant panel, the Overview Command Brief and the Blueprint.
// It reads ONLY real state: city profile, live model output, workspace and the
// route. Answers are deterministic and labelled; the module is the seam where a
// hosted LLM would plug in later (same inputs, same action contract).
import { cityName, cityDecisions, OUTCOME_LABEL, fmtOutcome, DOMAIN_CATEGORIES } from './cityContext'
import { classify } from './cityStatus'

// ── Recommendation: the next decision the city should test ─────────────────
// Chosen from the live priority domain → first applicable decision for this
// city in that domain's categories. Fully explainable ("why" is returned).
export function recommendDecision(profile, reading, decisions) {
  if (!reading) return null
  const cls = classify(reading)
  const pri = cls.priority
  const applicable = cityDecisions(profile, decisions || [])
  // categories are listed best-fit-first per domain — honour that order
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

// ── City status phrase for the executive brief (honest, no invented trend) ──
export function cityStatusLine(reading) {
  const cls = classify(reading)
  if (cls.allStable) return { label: 'Steady', detail: 'All four domains inside their normal range.' }
  if (cls.urgentCount > 0) return { label: 'Act now', detail: `${cls.urgentCount} domain${cls.urgentCount === 1 ? '' : 's'} above the comfortable range.` }
  return { label: 'Watchful', detail: `${cls.watchCount} of 4 domains trending toward thresholds.` }
}

// Delivery risk from the real workspace (due/overdue review items).
export function deliveryRisk(ws) {
  const today = new Date().toISOString().slice(0, 10)
  const open = ws.actions.filter((a) => a.status !== 'Done')
  const overdue = open.filter((a) => a.due && a.due < today)
  const toReview = ws.actions.filter((a) => a.status === 'To review')
  if (overdue.length) return { level: 'high', text: `${overdue.length} open action${overdue.length === 1 ? ' is' : 's are'} past due — oldest: “${overdue[0].title}”.` }
  if (toReview.length > 2) return { level: 'med', text: `${toReview.length} decisions are queued for review — throughput risk.` }
  if (toReview.length) return { level: 'low', text: `${toReview.length} decision${toReview.length === 1 ? '' : 's'} awaiting review.` }
  return { level: 'none', text: 'No delivery blockers in the workspace.' }
}

// ── Deterministic Q&A (used by the assistant panel) ────────────────────────
export function agentRespond(text, ctx) {
  const { profile, analyze, ws, nav, route } = ctx
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
  if (domHit && !/attention|roadmap|missing|summary|blueprint/.test(t)) {
    const s = reading.signals[domHit[1]]
    return {
      tag: 'Model output',
      text: `${s.domain_label} in ${city}: ${fmtOutcome(s)} — ${s.status}. ${s.driver}`,
      actions: [{ label: 'Open Decision Studio', icon: 'scenarios', fn: () => nav('/app/studio') }],
    }
  }
  if (/attention|priority|urgent|focus|worry/.test(t) && impact) {
    return {
      tag: 'Model output',
      text: `${impact.focus_label} is the priority in ${city}. ${impact.why}`,
      actions: [
        { label: 'Test the recommended decision', icon: 'intelligence', fn: () => nav('/app/intelligence?guided=1') },
      ],
    }
  }
  if (/blueprint|strategy|vision|initiative/.test(t)) {
    const props = ws.blueprint.filter((b) => b.status === 'Proposed').length
    return {
      tag: 'Workspace',
      text: `The Blueprint holds ${ws.blueprint.length} initiative${ws.blueprint.length === 1 ? '' : 's'} (${props} proposed, awaiting a decision). Approving one moves it onto the roadmap with its evidence attached.`,
      actions: [{ label: 'Open Blueprint', icon: 'layers', fn: () => nav('/app/blueprint') }],
    }
  }
  if (/roadmap|deliver/.test(t)) {
    const byH = ws.roadmap.reduce((m, r) => ({ ...m, [r.horizon]: (m[r.horizon] || 0) + 1 }), {})
    return {
      tag: 'Workspace',
      text: `${ws.roadmap.length} initiative(s): ${Object.entries(byH).map(([h, n]) => `${n} ${h}-term`).join(', ') || 'none yet'}. ${deliveryRisk(ws).text}`,
      actions: [{ label: 'Open roadmap', icon: 'roadmap', fn: () => nav('/app/roadmap') }],
    }
  }
  if (/missing|data|valid|calibrat/.test(t)) {
    const missing = profile.datasets_missing?.length
      ? profile.datasets_missing.join(', ')
      : 'traffic counts, building energy meters, service-request logs and waste tonnage by zone'
    return {
      tag: 'Data limitation',
      text: `For a validated local picture, ${city} still needs: ${missing}. Until then, outputs are internationally-trained prototype signals.`,
      actions: [
        { label: 'Create data request', icon: 'plus', fn: () => ws.createAction({ title: 'Request local operational datasets for validation', type: 'Data request', domain: 'governance', department: 'City Data', priority: 'Medium', relatedArea: 'Citywide', source: 'Agent' }) },
        { label: 'See evidence', icon: 'layers', fn: () => nav('/app/evidence') },
      ],
    }
  }
  if (/summary|stakeholder|report|brief/.test(t) && impact) {
    return {
      tag: 'Composed from workspace',
      text: `${city}: priority is ${impact.focus_label} (${impact.focus_status.toLowerCase()}). First move: ${impact.recommended_response} ${ws.actions.length} tracked actions · ${ws.roadmap.length} roadmap initiatives.`,
      actions: [{ label: 'Open report', icon: 'reports', fn: () => nav('/app/reports') }],
    }
  }
  return {
    tag: 'Assistant',
    text: `I can explain what needs attention in ${city}, read any domain's model output, summarise the blueprint, roadmap or missing data, or draft a stakeholder brief. I'm grounded in your live models and workspace${route ? ` (currently: ${route})` : ''}.`,
  }
}

// Contextual quick prompts per route.
export function quickPrompts(pathname) {
  const base = ['What needs attention right now?', 'What data is missing for validation?']
  if (pathname.includes('intelligence')) return ['Explain the current priority', 'What do the models say about traffic?', ...base.slice(1)]
  if (pathname.includes('blueprint')) return ['Summarise the blueprint', 'What should we approve first?', ...base]
  if (pathname.includes('roadmap') || pathname.includes('actions')) return ['Summarise delivery status', ...base]
  if (pathname.includes('studio') || pathname.includes('scenarios')) return ['Which option should we prefer?', ...base]
  if (pathname.includes('reports')) return ['Prepare a stakeholder summary', ...base]
  return ['What needs attention right now?', 'What decision should we test next?', 'What data is missing for validation?']
}
