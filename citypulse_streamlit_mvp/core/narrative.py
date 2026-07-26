"""
CityPulse AI — the AI City Guide.

One small class turns a `CityReading` (four model outputs) into plain-language
guidance a non-technical municipal user can act on. It answers the three
questions the whole product is built around:

    1. What is happening in the city?
    2. Why does it matter?
    3. What should the municipality do next?

It works fully offline (deterministic, no API key). If an OpenAI key is present
in the environment it can optionally rephrase the same facts more naturally, but
the app never depends on it.
"""
from __future__ import annotations

import os
from typing import Dict, List, Optional

from .adapter import CityReading, SystemReading
from .city_profile import ACTIONS, SYSTEM_META, recommended_actions_for


class CityGuide:
    """Friendly, non-technical narrator for the city-building journey."""

    persona = "CityPulse Guide"

    # ---- short contextual lines for each step of the journey -------------
    def welcome(self) -> str:
        return ("Hi! I'm your CityPulse Guide. Let's build your city, put it "
                "under real-world pressure, and find the smartest place to act.")

    def on_profile(self, profile) -> str:
        size = ("a small town" if profile.population < 120_000 else
                "a mid-size city" if profile.population < 600_000 else
                "a large metro")
        return (f"**{profile.name}** is shaping up as {size}. When it feels "
                "right, bring it to life and we'll take its pulse.")

    def on_pulse(self, reading: CityReading) -> str:
        top = reading.sorted_systems()[0]
        if reading.overall < 40:
            return (f"{reading.profile.name} is in good shape. "
                    f"{top.label} is the one system worth keeping an eye on.")
        if reading.overall < 60:
            return (f"A steady start. {top.label} is carrying the most pressure "
                    "— a good place to test how the city copes.")
        return (f"{reading.profile.name} is already stretched, and {top.label} "
                "is feeling it most. Let's see what a tough scenario does.")

    def on_scenario(self, scenario_title: str, before: CityReading,
                    after: CityReading) -> str:
        drop = before.health - after.health
        movers = self._biggest_movers(before, after, n=2)
        names = " and ".join(m.label for m in movers)
        if drop <= 3:
            return (f"**{scenario_title}** barely moved the needle — the city "
                    f"absorbs it well, though {names} feel it first.")
        return (f"**{scenario_title}** pushes quality of life down "
                f"{drop} points. {names} take the hit hardest.")

    def on_plan_ready(self, reading: CityReading) -> str:
        p = reading.sorted_systems()[0]
        return (f"Here's my read: **{p.label}** needs attention first. "
                "Pick one or two moves and watch the city respond.")

    def on_actions_applied(self, before: CityReading, after: CityReading,
                           actions: List[str]) -> str:
        gain = after.health - before.health
        if gain <= 0:
            return ("Those moves hold the line but don't gain much here — "
                    "try one aimed at the system under the most pressure.")
        names = ", ".join(ACTIONS[a].title.lower() for a in actions if a in ACTIONS)
        pts = "point" if gain == 1 else "points"
        return (f"Nice work. {names.capitalize()} lifts quality of life "
                f"**+{gain} {pts}**. Your city is measurably better.")

    # ---- the core 3-question diagnosis ----------------------------------
    def diagnose(self, reading: CityReading,
                 baseline: Optional[CityReading] = None) -> Dict[str, str]:
        top = reading.sorted_systems()[0]
        second = reading.sorted_systems()[1]

        # 1. What is happening?
        happening = f"{top.label} is your city's biggest pressure point right now."
        if self._linked(top, second):
            happening = (f"{top.label} and {second.label} are under pressure "
                         "together — they're rising as one connected strain.")

        # 2. Why it matters
        why = self._why_it_matters(top, reading)

        # 3. What to do next
        recs = recommended_actions_for(top.system)
        first = ACTIONS[recs[0]]
        do_next = (f"Start with **{first.title}** — {first.blurb.lower()} "
                   f"It targets {top.label.lower()} directly.")

        # optional cross-system connection line
        connection = self._connection_line(reading)

        return {
            "system": top.label,
            "status": top.status,
            "happening": happening,
            "why": why,
            "do_next": do_next,
            "connection": connection,
            "detail": top.detail,
        }

    # ---- helpers ---------------------------------------------------------
    @staticmethod
    def _biggest_movers(before: CityReading, after: CityReading, n=2
                        ) -> List[SystemReading]:
        deltas = []
        for k, s_after in after.systems.items():
            d = s_after.pressure - before.systems[k].pressure
            deltas.append((abs(d), s_after))
        deltas.sort(key=lambda x: x[0], reverse=True)
        return [s for _, s in deltas[:n]]

    @staticmethod
    def _linked(a: SystemReading, b: SystemReading) -> bool:
        return abs(a.pressure - b.pressure) < 10 and b.pressure > 55

    def _why_it_matters(self, top: SystemReading, reading: CityReading) -> str:
        name = reading.profile.name
        reasons = {
            "mobility": (f"Rising collision risk means slower, less safe streets "
                         f"for everyone in {name} — and it compounds at rush hour."),
            "energy": (f"High energy strain risks outages and cost spikes, hitting "
                       f"homes and services across {name} when demand peaks."),
            "services": (f"When requests pile up, residents wait longer for repairs "
                         f"and answers — the most visible sign of a city under load."),
            "waste": (f"If collection can't keep pace, streets and public spaces in "
                      f"{name} feel it fast, and costs climb."),
        }
        base = reasons.get(top.system, "")
        if top.pressure >= 86:
            return "This is at a critical level. " + base
        if top.pressure >= 72:
            return "This is approaching its limit. " + base
        return base

    def _connection_line(self, reading: CityReading) -> str:
        """One sentence tying the four systems into a single story."""
        hot = [s for s in reading.sorted_systems() if s.pressure >= 60]
        if len(hot) >= 3:
            return ("Several systems are straining at once — a sign the whole "
                    "city is running hot, not just one service.")
        if len(hot) == 2:
            return (f"{hot[0].label} and {hot[1].label} are moving together; "
                    "easing one often relieves the other.")
        if reading.overall < 40:
            return "The rest of the city is calm and well-balanced."
        return "The other systems are holding steady for now."

    # ---- optional LLM polish (never required) ---------------------------
    def maybe_polish(self, text: str) -> str:
        """If an OpenAI key is configured, lightly rephrase; else return as-is."""
        key = os.environ.get("OPENAI_API_KEY")
        if not key:
            return text
        try:                                   # pragma: no cover - optional path
            from openai import OpenAI
            client = OpenAI(api_key=key)
            r = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content":
                     "Rephrase for a non-technical city official in one short, "
                     "warm sentence. Keep all facts and any **bold** intact."},
                    {"role": "user", "content": text},
                ],
                max_tokens=90, temperature=0.4,
            )
            return r.choices[0].message.content.strip()
        except Exception:
            return text
