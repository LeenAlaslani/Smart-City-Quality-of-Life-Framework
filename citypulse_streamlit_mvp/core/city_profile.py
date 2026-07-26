"""
CityPulse AI — City profile, scenarios and actions.

A CityProfile is the *only* thing a non-technical user ever edits. It holds a
handful of plain-language levers (population, density, greenery, transit,
budget, season). Scenarios and Actions are pre-baked "moves" that nudge those
levers. Everything downstream — the four ML models — is driven from here via
the shared adapter, so the user never sees a model input directly.
"""
from __future__ import annotations

from dataclasses import dataclass, field, replace
from typing import Dict, List


# --- The four city systems, in one place so the whole app agrees on names ----
SYSTEMS = ["mobility", "energy", "services", "waste"]

SYSTEM_META = {
    "mobility": {"label": "Mobility",        "icon": "🚦", "model": "Transportation"},
    "energy":   {"label": "Energy",          "icon": "⚡", "model": "Energy"},
    "services": {"label": "Public Services", "icon": "🏛️", "model": "Public Services"},
    "waste":    {"label": "Waste",           "icon": "♻️", "model": "Waste Management"},
}

DENSITY_LEVELS = ["Compact", "Balanced", "Spread out"]
BUDGET_LEVELS = ["Tight", "Moderate", "Strong"]
SEASONS = ["Spring", "Summer", "Autumn", "Winter"]


@dataclass
class CityProfile:
    """A whole city described in the terms a mayor would actually use."""
    name: str = "New Haven"
    population: int = 250_000
    density: str = "Balanced"        # Compact / Balanced / Spread out
    green_space: int = 35            # % of the city that is parks / green (0-100)
    transit_coverage: int = 45       # % of residents with good transit (0-100)
    budget: str = "Moderate"         # Tight / Moderate / Strong
    season: str = "Summer"

    # Hidden pressure levers moved by scenarios/actions (baseline = neutral).
    # These are never shown as raw numbers; they translate into model inputs.
    demand: float = 1.0              # overall load on every system
    traffic_intensity: float = 1.0   # cars on the road (drives mobility + air)
    service_load: float = 1.0        # requests hitting public services
    heat_stress: float = 0.0         # extra warm/cold stress on energy (-/+)

    # Bookkeeping
    applied_actions: List[str] = field(default_factory=list)

    # ---- convenient derived helpers -------------------------------------
    @property
    def density_factor(self) -> float:
        return {"Compact": 1.15, "Balanced": 1.0, "Spread out": 0.85}[self.density]

    @property
    def budget_factor(self) -> float:
        # Higher budget = more capacity to absorb pressure.
        return {"Tight": 0.8, "Moderate": 1.0, "Strong": 1.2}[self.budget]

    @property
    def month(self) -> int:
        return {"Spring": 4, "Summer": 7, "Autumn": 10, "Winter": 1}[self.season]

    @property
    def air_temp_c(self) -> float:
        base = {"Spring": 14, "Summer": 26, "Autumn": 13, "Winter": 4}[self.season]
        return base + self.heat_stress * 6.0

    def copy(self) -> "CityProfile":
        return replace(self, applied_actions=list(self.applied_actions))


# --------------------------------------------------------------------------
# Scenarios — the "tests" the user runs against their city.
# Each scenario is a function of the current profile -> a stressed profile.
# --------------------------------------------------------------------------
@dataclass
class Scenario:
    key: str
    title: str
    icon: str
    tagline: str
    # multiplicative / additive nudges applied on top of the base profile
    population_mult: float = 1.0
    demand_mult: float = 1.0
    traffic_mult: float = 1.0
    service_mult: float = 1.0
    heat_delta: float = 0.0
    force_season: str | None = None
    budget_shift: int = 0   # -1 tighter, +1 stronger

    def apply(self, base: CityProfile) -> CityProfile:
        p = base.copy()
        p.population = int(base.population * self.population_mult)
        p.demand = base.demand * self.demand_mult
        p.traffic_intensity = base.traffic_intensity * self.traffic_mult
        p.service_load = base.service_load * self.service_mult
        p.heat_stress = base.heat_stress + self.heat_delta
        if self.force_season:
            p.season = self.force_season
        if self.budget_shift:
            idx = max(0, min(2, BUDGET_LEVELS.index(base.budget) + self.budget_shift))
            p.budget = BUDGET_LEVELS[idx]
        return p


SCENARIOS: Dict[str, Scenario] = {
    "boom": Scenario(
        "boom", "Population Boom", "📈",
        "40% more residents arrive over three years.",
        population_mult=1.4, demand_mult=1.18, traffic_mult=1.25, service_mult=1.3,
    ),
    "heatwave": Scenario(
        "heatwave", "Heat Wave", "🔥",
        "A record summer pushes cooling and tempers to the limit.",
        force_season="Summer", heat_delta=0.6, demand_mult=1.12, traffic_mult=1.1,
        service_mult=1.15,
    ),
    "budget": Scenario(
        "budget", "Budget Squeeze", "✂️",
        "Funding is cut — every service must do more with less.",
        budget_shift=-1, service_mult=1.2, demand_mult=1.05,
    ),
    "festival": Scenario(
        "festival", "Big Event Weekend", "🎉",
        "A festival brings a surge of visitors and demand downtown.",
        demand_mult=1.25, traffic_mult=1.5, service_mult=1.4, population_mult=1.05,
    ),
}


# --------------------------------------------------------------------------
# Actions — the "improvements" the user makes. Each eases specific systems by
# moving the underlying levers, so the models genuinely re-predict lower.
# --------------------------------------------------------------------------
@dataclass
class Action:
    key: str
    title: str
    icon: str
    blurb: str
    helps: List[str]          # systems it primarily improves
    apply_fn: str             # name of transform (handled below)

    def apply(self, p: CityProfile) -> CityProfile:
        q = p.copy()
        if self.key == "transit":
            q.transit_coverage = min(100, p.transit_coverage + 20)
            q.traffic_intensity = p.traffic_intensity * 0.82
        elif self.key == "recycling":
            q.demand = p.demand  # waste capacity handled in adapter via budget+green
            q.green_space = min(100, p.green_space + 8)
        elif self.key == "staffing":
            q.service_load = p.service_load * 0.82
        elif self.key == "retrofit":
            q.heat_stress = p.heat_stress * 0.6
            q.green_space = min(100, p.green_space + 6)
        elif self.key == "smart_signals":
            q.traffic_intensity = p.traffic_intensity * 0.9
            q.demand = p.demand * 0.98
        if self.key not in q.applied_actions:
            q.applied_actions.append(self.key)
        return q


ACTIONS: Dict[str, Action] = {
    "transit": Action(
        "transit", "Expand transit lines", "🚈",
        "More buses and rail take cars off the road.",
        helps=["mobility"], apply_fn="transit"),
    "smart_signals": Action(
        "smart_signals", "Smart traffic signals", "🚥",
        "Adaptive signals smooth flow and cut congestion.",
        helps=["mobility", "energy"], apply_fn="smart_signals"),
    "staffing": Action(
        "staffing", "Add service capacity", "👷",
        "Extra staff clears requests before they pile up.",
        helps=["services"], apply_fn="staffing"),
    "recycling": Action(
        "recycling", "Boost recycling & routes", "♻️",
        "Better routes and recycling ease the waste load.",
        helps=["waste"], apply_fn="recycling"),
    "retrofit": Action(
        "retrofit", "Retrofit buildings", "🏢",
        "Efficient, greener buildings cut energy strain.",
        helps=["energy"], apply_fn="retrofit"),
}


def recommended_actions_for(system: str) -> List[str]:
    """Which action keys most help a given pressured system, best first.
    An action whose *primary* (first-listed) target is this system ranks above
    one that only helps it as a side effect."""
    scored = []
    for k, a in ACTIONS.items():
        if system in a.helps:
            primary = 0 if a.helps[0] == system else 1
            scored.append((primary, k))
    scored.sort()
    out = [k for _, k in scored]
    return out or list(ACTIONS.keys())[:2]
