// CityPulse AI — the AI City Guide (React MVP). Plain-language narration that
// answers: what is happening, why it matters, what to do next.

import { SYSTEM_META } from './cityModel'
import { ACTIONS, actionByKey, recommendedActionsFor } from './scenarios'

export const welcome = () =>
  "Hi! I'm your CityPulse Guide. Let's build your city, put it under real-world pressure, and find the smartest place to act."

export function onProfile(p) {
  const size = p.population < 120000 ? 'a small town' : p.population < 600000 ? 'a mid-size city' : 'a large metro'
  return `**${p.name}** is shaping up as ${size}. When it feels right, bring it to life and we'll take its pulse.`
}

export function onPulse(r) {
  const top = r.systems[r.sorted[0]]
  if (r.overall < 40) return `${r.profile.name} is in good shape. ${top.label} is the one system worth keeping an eye on.`
  if (r.overall < 60) return `A steady start. ${top.label} is carrying the most pressure — a good place to test how the city copes.`
  return `${r.profile.name} is already stretched, and ${top.label} is feeling it most. Let's see what a tough scenario does.`
}

export function onScenario(title, before, after) {
  const drop = before.health - after.health
  const movers = biggestMovers(before, after, 2).map((m) => m.label).join(' and ')
  if (drop <= 3) return `**${title}** barely moved the needle — the city absorbs it well, though ${movers} feel it first.`
  return `**${title}** pushes quality of life down ${drop} points. ${movers} take the hit hardest.`
}

export function onPlanReady(r) {
  const top = r.systems[r.sorted[0]]
  return `Here's my read: **${top.label}** needs attention first. Pick one or two moves and watch the city respond.`
}

export function onActionsApplied(before, after, actions) {
  const gain = after.health - before.health
  if (gain <= 0) return "Those moves hold the line but don't gain much here — try one aimed at the system under the most pressure."
  const names = actions.map((a) => actionByKey(a)?.title.toLowerCase()).filter(Boolean).join(', ')
  const pts = gain === 1 ? 'point' : 'points'
  const cap = names.charAt(0).toUpperCase() + names.slice(1)
  return `Nice work. ${cap} lifts quality of life **+${gain} ${pts}**. Your city is measurably better.`
}

export function diagnose(r) {
  const top = r.systems[r.sorted[0]]
  const second = r.systems[r.sorted[1]]
  const linked = Math.abs(top.pressure - second.pressure) < 10 && second.pressure > 55

  const happening = linked
    ? `${top.label} and ${second.label} are under pressure together — they're rising as one connected strain.`
    : `${top.label} is your city's biggest pressure point right now.`

  const why = whyItMatters(top, r)
  const recs = recommendedActionsFor(top.system)
  const first = actionByKey(recs[0])
  const doNext = `Start with **${first.title}** — ${first.blurb.toLowerCase()} It targets ${top.label.toLowerCase()} directly.`
  const connection = connectionLine(r)

  return { system: top.label, status: top.status, happening, why, doNext, connection, detail: top.detail }
}

// helpers
function biggestMovers(before, after, n) {
  return Object.keys(after.systems)
    .map((k) => ({ d: Math.abs(after.systems[k].pressure - before.systems[k].pressure), s: after.systems[k] }))
    .sort((a, b) => b.d - a.d)
    .slice(0, n)
    .map((x) => x.s)
}

function whyItMatters(top, r) {
  const name = r.profile.name
  const reasons = {
    mobility: `Rising collision risk means slower, less safe streets for everyone in ${name} — and it compounds at rush hour.`,
    energy: `High energy strain risks outages and cost spikes, hitting homes and services across ${name} when demand peaks.`,
    services: `When requests pile up, residents wait longer for repairs and answers — the most visible sign of a city under load.`,
    waste: `If collection can't keep pace, streets and public spaces in ${name} feel it fast, and costs climb.`,
  }
  const base = reasons[top.system] ?? ''
  if (top.pressure >= 86) return 'This is at a critical level. ' + base
  if (top.pressure >= 72) return 'This is approaching its limit. ' + base
  return base
}

function connectionLine(r) {
  const hot = r.sorted.map((s) => r.systems[s]).filter((s) => s.pressure >= 60)
  if (hot.length >= 3) return 'Several systems are straining at once — a sign the whole city is running hot, not just one service.'
  if (hot.length === 2) return `${hot[0].label} and ${hot[1].label} are moving together; easing one often relieves the other.`
  if (r.overall < 40) return 'The rest of the city is calm and well-balanced.'
  return 'The other systems are holding steady for now.'
}
