"""
CityPulse AI — Cross-Domain Decision Intelligence.

The models are an invisible engine. This layer turns a *government decision*
into measurable planning assumptions, runs the real connected models on those
assumptions, and returns one cross-domain decision view in plain municipal
language — with clear integrity separation (assumptions vs model outputs vs
limitations). No ML jargon is exposed here; provenance is kept only for the
separate Model & Data Evidence area.
"""
from __future__ import annotations

import copy
from typing import Dict, List

from .integration import CityContext, get_integration, DOMAIN_LABELS
from .registry import REGISTRY

# ---- Saudi city model (structured choices) ------------------------------
SAUDI_CITIES = [
    {"id": "riyadh", "name": "Riyadh", "region": "Riyadh Province"},
    {"id": "jeddah", "name": "Jeddah", "region": "Makkah Province"},
    {"id": "makkah", "name": "Makkah", "region": "Makkah Province"},
    {"id": "madinah", "name": "Madinah", "region": "Madinah Province"},
    {"id": "dammam", "name": "Dammam", "region": "Eastern Province"},
    {"id": "khobar", "name": "Al Khobar", "region": "Eastern Province"},
    {"id": "taif", "name": "Taif", "region": "Makkah Province"},
    {"id": "tabuk", "name": "Tabuk", "region": "Tabuk Province"},
    {"id": "abha", "name": "Abha", "region": "Asir Province"},
    {"id": "neom", "name": "NEOM", "region": "Tabuk Province (new development)"},
]
POPULATION_RANGES = [
    {"id": "lt_250k", "label": "Under 250,000", "value": 180_000},
    {"id": "250k_1m", "label": "250,000 – 1 million", "value": 600_000},
    {"id": "1m_3m", "label": "1 – 3 million", "value": 1_800_000},
    {"id": "3m_6m", "label": "3 – 6 million", "value": 4_500_000},
    {"id": "gt_6m", "label": "Over 6 million", "value": 7_500_000},
]
CITY_TYPES = [
    {"id": "capital", "label": "Capital / large metropolis", "density": "Compact"},
    {"id": "major", "label": "Major regional city", "density": "Balanced"},
    {"id": "coastal", "label": "Coastal / port city", "density": "Balanced"},
    {"id": "holy", "label": "Holy city (high seasonal influx)", "density": "Compact"},
    {"id": "emerging", "label": "Emerging / new development", "density": "Spread out"},
]
CHALLENGES = [
    {"id": "congestion", "label": "Traffic congestion"},
    {"id": "peak_energy", "label": "Peak energy demand"},
    {"id": "service_backlog", "label": "Service request backlog"},
    {"id": "waste_capacity", "label": "Waste collection capacity"},
    {"id": "seasonal_surge", "label": "Seasonal population surge"},
    {"id": "sustainability", "label": "Sustainability targets"},
]
PRIORITIES = [
    {"id": "mobility", "label": "Improve mobility"},
    {"id": "sustainability", "label": "Sustainability & efficiency"},
    {"id": "digital_gov", "label": "Digital government services"},
    {"id": "quality_of_life", "label": "Quality of life"},
    {"id": "resource_mgmt", "label": "Resource management"},
]
BUDGET_LEVELS = [
    {"id": "tight", "label": "Constrained", "value": "Tight"},
    {"id": "moderate", "label": "Moderate", "value": "Moderate"},
    {"id": "strong", "label": "Well-resourced", "value": "Strong"},
]
TIMELINES = [
    {"id": "1y", "label": "Within 1 year"}, {"id": "3y", "label": "1 – 3 years"},
    {"id": "5y", "label": "3 – 5 years"}, {"id": "vision", "label": "Vision 2030 horizon"},
]

DOMAIN_ICONS = {"mobility": "mobility", "energy": "energy",
                "governance": "governance", "waste": "waste"}

# ---- Government decisions -> measurable assumptions ----------------------
# Each decision translates a municipal decision into plain, measurable planning
# assumptions and the model-input levers those imply.
DECISIONS = {
    "baseline": {
        "title": "Current operating conditions", "icon": "pulse",
        "question": "What is the city's current operational picture?",
        "category": "Baseline",
        "assumptions": [], "levers": {},
        "response": "Monitor the highest-pressure area and prepare targeted actions.",
    },
    "metro_line": {
        "title": "Open a new metro line", "icon": "transit",
        "question": "What could change if a new metro line opens?",
        "category": "Mobility",
        "assumptions": [
            {"label": "Vehicle traffic on affected corridors", "value": "−18%"},
            {"label": "Public-transport coverage", "value": "+20 pts"},
            {"label": "Activity & footfall around stations", "value": "Higher"},
        ],
        "levers": {"transit_coverage": +20, "traffic_intensity": 0.82, "demand": 1.03},
        "response": "Sequence the opening with station-area service and mobility readiness.",
    },
    "riyadh_season": {
        "title": "Prepare for Riyadh Season", "icon": "event",
        "question": "How should the city prepare for a major event season?",
        "category": "Major event",
        "assumptions": [
            {"label": "Visitor volume", "value": "Large increase"},
            {"label": "Peak-hour traffic", "value": "+40%"},
            {"label": "Public-service requests", "value": "+35%"},
            {"label": "Waste generation", "value": "+30%"},
            {"label": "Venue energy demand", "value": "Higher"},
        ],
        "levers": {"demand": 1.25, "traffic_intensity": 1.4, "service_load": 1.35, "heat_stress": 0.2},
        "response": "Pre-position teams and capacity across the affected domains before the season.",
    },
    "prioritise_district": {
        "title": "Prioritise a high-demand district", "icon": "district",
        "question": "What happens if resources concentrate on the busiest district?",
        "category": "Districts",
        "assumptions": [
            {"label": "Demand concentrated in one district", "value": "+15%"},
            {"label": "Service focus on that district", "value": "Higher"},
        ],
        "levers": {"demand": 1.15, "service_load": 1.1},
        "response": "Rebalance field teams toward the prioritised district for the planning window.",
    },
    "visitor_surge": {
        "title": "Manage a major visitor surge", "icon": "visitors",
        "question": "How should operations change during unusually high demand?",
        "category": "Demand",
        "assumptions": [
            {"label": "Population present in the city", "value": "+25%"},
            {"label": "Peak-hour road demand", "value": "+45%"},
            {"label": "Service requests", "value": "+40%"},
        ],
        "levers": {"demand": 1.25, "traffic_intensity": 1.45, "service_load": 1.4},
        "response": "Activate surge staffing and temporary capacity across services and mobility.",
    },
    "waste_capacity": {
        "title": "Increase waste-collection capacity", "icon": "waste",
        "question": "What is the effect of adding collection capacity?",
        "category": "Environment",
        "assumptions": [
            {"label": "Collection routes & recycling", "value": "Increased"},
            {"label": "Backlog risk", "value": "Reduced"},
        ],
        "levers": {"actions": ["recycling"], "green_space": +8},
        "response": "Add routes ahead of the next high-demand period; track backlog weekly.",
    },
    "energy_demand": {
        "title": "Respond to higher energy demand", "icon": "energy",
        "question": "How should the city respond to a hot-season demand peak?",
        "category": "Energy",
        "assumptions": [
            {"label": "Cooling load / ambient temperature", "value": "Higher"},
            {"label": "Peak electricity demand", "value": "+"},
        ],
        "levers": {"heat_stress": +0.6, "season": "Summer", "demand": 1.1},
        "response": "Advance building-efficiency measures and peak-demand management.",
    },
    "staffing": {
        "title": "Adjust public-service staffing", "icon": "staffing",
        "question": "What changes if service staffing increases?",
        "category": "Services",
        "assumptions": [
            {"label": "Service-desk capacity", "value": "Increased"},
            {"label": "Request resolution time", "value": "Reduced"},
        ],
        "levers": {"service_load": 0.8},
        "response": "Reallocate staff to the highest-delay service lines first.",
    },
    "new_development": {
        "title": "Plan a new development (NEOM-style)", "icon": "development",
        "question": "What priorities should a new smart-city development consider?",
        "category": "New city",
        "assumptions": [
            {"label": "Greenfield city profile", "value": "Planned"},
            {"label": "Target density & transit", "value": "High-transit, compact"},
        ],
        "levers": {"transit_coverage": +25, "green_space": +20},
        "external": True,
        "response": "Set mobility-first, sustainability-first targets; validate with local data.",
    },
}

ACTION_BY_DOMAIN = {
    "mobility": ("Expand transit & corridor capacity", "Transportation Operations"),
    "energy": ("Launch a building-efficiency programme", "Energy & Sustainability"),
    "governance": ("Add service-desk capacity for peak load", "Public-Service Operations"),
    "waste": ("Increase collection routes & recycling", "Environment Operations"),
}
WHY = {
    "mobility": "Higher road risk and congestion affect safety and travel time across the network.",
    "energy": "Peak electricity demand raises cost and grid-strain risk during hot periods.",
    "governance": "Rising delay risk means residents wait longer for service resolution.",
    "waste": "Collection pressure affects cleanliness, cost and sustainability targets.",
}
RESOURCE = {
    "mobility": "Traffic management, transit capacity and enforcement teams.",
    "energy": "Grid coordination and building-efficiency budget.",
    "governance": "Service-desk staffing and field crews.",
    "waste": "Collection fleet, routes and recycling capacity.",
}
RISK = {
    "mobility": "Congestion and incident risk concentrate at peak hours.",
    "energy": "Demand peaks may exceed comfortable supply margins.",
    "governance": "Backlogs grow if capacity is not added early.",
    "waste": "Missed collections in the busiest zones.",
}


def options() -> dict:
    return {
        "cities": SAUDI_CITIES, "population_ranges": POPULATION_RANGES,
        "city_types": CITY_TYPES, "challenges": CHALLENGES, "priorities": PRIORITIES,
        "budget_levels": BUDGET_LEVELS, "timelines": TIMELINES,
        "decisions": [{"id": k, "title": v["title"], "icon": v.get("icon"),
                       "question": v["question"], "category": v["category"],
                       "is_scenario": k != "baseline"}
                      for k, v in DECISIONS.items()],
    }


def profile_to_context(profile: dict) -> CityContext:
    pop = next((r["value"] for r in POPULATION_RANGES if r["id"] == profile.get("population_range")), 1_500_000)
    density = next((t["density"] for t in CITY_TYPES if t["id"] == profile.get("city_type")), "Balanced")
    budget = next((b["value"] for b in BUDGET_LEVELS if b["id"] == profile.get("budget_level")), "Moderate")
    ch = set(profile.get("challenges", [])); pr = set(profile.get("priorities", []))
    ctx = CityContext(population=pop, density=density, budget=budget,
                      transit_coverage=45, green_space=30, season="Summer")
    if "congestion" in ch: ctx.traffic_intensity *= 1.2; ctx.transit_coverage = 30
    if "peak_energy" in ch: ctx.heat_stress += 0.4
    if "service_backlog" in ch: ctx.service_load *= 1.2
    if "waste_capacity" in ch: ctx.demand *= 1.1
    if "seasonal_surge" in ch: ctx.demand *= 1.15; ctx.traffic_intensity *= 1.15
    if "mobility" in pr: ctx.transit_coverage = min(100, ctx.transit_coverage + 10)
    if "sustainability" in pr: ctx.green_space = min(100, ctx.green_space + 10)
    return ctx


def apply_decision(ctx: CityContext, key: str) -> CityContext:
    c = copy.deepcopy(ctx)
    for k, v in DECISIONS.get(key, {}).get("levers", {}).items():
        if k == "transit_coverage": c.transit_coverage = min(100, c.transit_coverage + v)
        elif k == "green_space": c.green_space = min(100, c.green_space + v)
        elif k == "actions": c.applied_actions = list(set(c.applied_actions + v))
        elif k in ("budget", "season"): setattr(c, k, v)
        elif k in ("demand", "traffic_intensity", "service_load"): setattr(c, k, getattr(c, k) * v)
        elif k == "heat_stress": c.heat_stress += v
    return c


def city_name(profile) -> str:
    return next((c["name"] for c in SAUDI_CITIES if c["id"] == profile.get("city")), "the city")


def apply_overrides(ctx: CityContext, overrides: dict) -> CityContext:
    """User-adjusted assumptions (from the Intelligence sliders) re-run the
    real models on modified inputs. Multipliers are relative to 1.0."""
    if not overrides:
        return ctx
    if "traffic_mult" in overrides:
        ctx.traffic_intensity *= float(overrides["traffic_mult"])
    if "demand_mult" in overrides:
        ctx.demand *= float(overrides["demand_mult"])
    if "service_mult" in overrides:
        ctx.service_load *= float(overrides["service_mult"])
    if "transit_delta" in overrides:
        ctx.transit_coverage = int(max(0, min(100, ctx.transit_coverage + float(overrides["transit_delta"]))))
    if "heat_delta" in overrides:
        ctx.heat_stress += float(overrides["heat_delta"])
    return ctx


def analyze(profile: dict, decision_key: str = "baseline", overrides: dict | None = None) -> dict:
    integ = get_integration()
    base_ctx = profile_to_context(profile)
    base_reading = integ.read(base_ctx)
    ctx = apply_decision(base_ctx, decision_key)
    ctx = apply_overrides(ctx, overrides or {})
    reading = integ.read(ctx)
    decision = DECISIONS.get(decision_key, DECISIONS["baseline"])
    is_scenario = decision_key != "baseline"
    cname = city_name(profile)

    # cross-domain movers vs current conditions
    movers = []
    if is_scenario:
        for d, s in reading.signals.items():
            delta = round(s.pressure - base_reading.signals[d].pressure, 1)
            if abs(delta) >= 2:
                movers.append({"domain": d, "label": DOMAIN_LABELS[d], "delta": delta,
                               "direction": "up" if delta > 0 else "down"})
        movers.sort(key=lambda m: abs(m["delta"]), reverse=True)

    ordered = sorted(reading.signals.values(), key=lambda s: s.pressure, reverse=True)
    top = ordered[0]
    affected = [DOMAIN_LABELS[m["domain"]] for m in movers[:3]] or [DOMAIN_LABELS[s.domain] for s in ordered[:2]]
    pressure_points = [{"label": DOMAIN_LABELS[s.domain], "status": s.status, "color": s.color,
                        "domain": s.domain} for s in ordered[:2]]

    what_changes = (
        f"{DOMAIN_LABELS[top.domain]} shows the highest operational pressure under this decision."
        if not is_scenario else
        f"Under these assumptions, pressure shifts most in {', '.join(affected)}."
    )

    external = decision.get("external", False)
    limitation = (
        "Planning scenario — it combines your assumptions with connected model outputs. "
        "It is not a causal impact study."
        if is_scenario else
        "Model-supported operational picture based on the current city profile."
    )
    data_gap = (
        "This new-development analysis uses models trained on other cities. "
        "Validated deployment requires local NEOM operational data."
        if external else
        "A validated local forecast requires Saudi municipal operational data "
        "(traffic, energy, 311-style requests, waste tonnage)."
    )

    next_actions = [
        {"title": ACTION_BY_DOMAIN[top.domain][0], "department": ACTION_BY_DOMAIN[top.domain][1], "domain": top.domain},
    ]
    if len(ordered) > 1 and (not is_scenario or movers):
        d2 = (movers[0]["domain"] if movers else ordered[1].domain)
        if d2 != top.domain:
            next_actions.append({"title": ACTION_BY_DOMAIN[d2][0], "department": ACTION_BY_DOMAIN[d2][1], "domain": d2})

    return {
        "city": cname,
        "decision": {"id": decision_key, "title": decision["title"], "icon": decision.get("icon"),
                     "question": decision["question"], "category": decision["category"],
                     "is_scenario": is_scenario, "external": external},
        "assumptions": decision.get("assumptions", []),
        "reading": reading.public(),
        "baseline_reading": base_reading.public() if is_scenario else None,
        "movers": movers,
        "impact": {
            "what_changes": what_changes,
            "why": WHY[top.domain],
            "affected": affected,
            "pressure_points": pressure_points,
            "resource_implications": RESOURCE[top.domain],
            "risks": RISK[top.domain],
            "recommended_response": decision.get("response", ""),
            "focus_domain": top.domain,
            "focus_label": DOMAIN_LABELS[top.domain],
            "focus_status": top.status,
            "focus_color": top.color,
        },
        "next_actions": next_actions,
        "integrity": {"limitation": limitation, "data_gap": data_gap, "external": external},
        # kept ONLY for the Model & Data Evidence area — not shown in exec UI
        "_provenance": {
            "model": REGISTRY[top.domain].display_name, "algorithm": REGISTRY[top.domain].algorithm,
            "dataset_origin": top.dataset_origin, "version": top.model_version,
            "exec_ms": top.exec_ms, "live": top.live,
        },
    }
