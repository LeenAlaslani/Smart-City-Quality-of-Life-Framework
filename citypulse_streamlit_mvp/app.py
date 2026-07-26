"""
CityPulse AI — a gameful smart-city planning experience.

Build a city, put it under real-world pressure, and let four trained ML models
(transportation, energy, public services, waste) work together in the
background to show what's happening, why it matters, and what to do next.

Run:  streamlit run app.py
"""
from __future__ import annotations

import os
import streamlit as st
import streamlit.components.v1 as components

from core.adapter import get_adapter
from core.city_profile import (CityProfile, SCENARIOS, ACTIONS, DENSITY_LEVELS,
                               BUDGET_LEVELS, SEASONS, recommended_actions_for)
from core.narrative import CityGuide
from ui import theme, components as C
from ui.city_svg import render_city

st.set_page_config(page_title="CityPulse AI", page_icon="🛰️", layout="wide",
                   initial_sidebar_state="collapsed")

ASSETS = os.path.join(os.path.dirname(__file__), "assets")
LOGO = os.path.join(ASSETS, "citypulse_logo.png")
GUIDE = CityGuide()


@st.cache_resource(show_spinner=False)
def adapter():
    return get_adapter()


# ---------------------------------------------------------------------------
#  session state
# ---------------------------------------------------------------------------
def init_state():
    ss = st.session_state
    ss.setdefault("step", 0)
    ss.setdefault("profile", CityProfile())
    ss.setdefault("baseline", None)        # CityReading of base city
    ss.setdefault("scenario_key", None)
    ss.setdefault("scenario_reading", None)
    ss.setdefault("actions", [])
    ss.setdefault("improved_reading", None)


def goto(step: int):
    st.session_state.step = step


def html(s: str):
    st.markdown(s, unsafe_allow_html=True)


def svg_block(inner: str, height: int = 360):
    """Render raw SVG/HTML in an isolated iframe. st.markdown sanitizes <svg>
    and <animate>, so anything with real SVG must go through here."""
    components.html(
        "<!doctype html><html><head><meta charset='utf-8'>"
        "<style>html,body{margin:0;padding:0;background:transparent;"
        "font-family:'Source Sans Pro',-apple-system,sans-serif;}</style></head>"
        f"<body>{inner}</body></html>",
        height=height, scrolling=False,
    )


# ---------------------------------------------------------------------------
#  helpers
# ---------------------------------------------------------------------------
def scenario_profile():
    ss = st.session_state
    p = ss.profile
    if ss.scenario_key:
        p = SCENARIOS[ss.scenario_key].apply(ss.profile)
    return p


def current_reading():
    """The reading in play right now (improved > scenario > baseline)."""
    ss = st.session_state
    return ss.improved_reading or ss.scenario_reading or ss.baseline


# ===========================================================================
#  STEP 0 — welcome
# ===========================================================================
def step_welcome():
    c1, c2, c3 = st.columns([1, 2, 1])
    with c2:
        if os.path.exists(LOGO):
            st.image(LOGO, use_container_width=True)
        html('<div style="text-align:center;margin-top:-1rem">'
             '<h2 style="margin-bottom:.2rem">Build a city. Test it. Make it better.</h2>'
             '<p style="color:#9fb6d4;font-size:1.05rem">'
             'A smart-city planner powered by four working AI models — mobility, '
             'energy, public services and waste — brought together into one living city.'
             '</p></div>')
        html(C.guide(GUIDE.welcome()))
        if st.button("Start building  →", type="primary", use_container_width=True):
            goto(1)
            st.rerun()


# ===========================================================================
#  STEP 1 — found your city
# ===========================================================================
def step_found():
    ss = st.session_state
    html(C.stepper(0))
    st.markdown("### 🏙️ Found your city")
    p = ss.profile

    left, right = st.columns([1, 1.1], gap="large")
    with left:
        name = st.text_input("City name", p.name)
        population = st.slider("Population", 40_000, 2_000_000, p.population,
                               step=10_000, format="%d")
        density = st.select_slider("City shape", DENSITY_LEVELS, p.density)
        green = st.slider("Green space", 0, 100, p.green_space,
                          help="Share of the city that is parks and greenery")
        transit = st.slider("Transit coverage", 0, 100, p.transit_coverage,
                            help="Share of residents with good public transport")
        cc1, cc2 = st.columns(2)
        budget = cc1.select_slider("Budget", BUDGET_LEVELS, p.budget)
        season = cc2.selectbox("Season", SEASONS, index=SEASONS.index(p.season))

    # update the working profile live
    ss.profile = CityProfile(name=name, population=population, density=density,
                             green_space=green, transit_coverage=transit,
                             budget=budget, season=season)

    with right:
        svg_block(render_city(ss.profile), 340)
        html(C.guide(GUIDE.on_profile(ss.profile)))

    b1, b2 = st.columns([1, 2])
    if b1.button("←  Back", use_container_width=True):
        goto(0); st.rerun()
    if b2.button("Bring my city to life  →", type="primary", use_container_width=True):
        with st.spinner("Waking up the city and taking its first pulse…"):
            ss.baseline = adapter().read_city(ss.profile)
            ss.scenario_key = None
            ss.scenario_reading = None
            ss.actions = []
            ss.improved_reading = None
        goto(2); st.rerun()


# ===========================================================================
#  STEP 2 — the pulse
# ===========================================================================
def step_pulse():
    ss = st.session_state
    html(C.stepper(1))
    reading = ss.baseline
    st.markdown(f"### 🫀 {ss.profile.name}'s pulse")

    left, right = st.columns([1.5, 1], gap="large")
    with left:
        svg_block(render_city(ss.profile, reading), 360)
    with right:
        svg_block(C.health_ring(reading.health), 210)
    html(C.system_cards(reading))
    html(C.guide(GUIDE.on_pulse(reading)))

    b1, b2 = st.columns([1, 2])
    if b1.button("←  Edit city", use_container_width=True):
        goto(1); st.rerun()
    if b2.button("Test my city under pressure  →", type="primary",
                 use_container_width=True):
        goto(3); st.rerun()


# ===========================================================================
#  STEP 3 — test with scenarios
# ===========================================================================
def step_test():
    ss = st.session_state
    html(C.stepper(2))
    st.markdown("### 🧪 Test your city")
    st.caption("Put your city under a realistic pressure. Watch every system react.")

    cols = st.columns(len(SCENARIOS))
    for col, (key, sc) in zip(cols, SCENARIOS.items()):
        with col:
            picked = ss.scenario_key == key
            if st.button(f"{sc.icon}\n\n**{sc.title}**\n\n{sc.tagline}",
                         key=f"sc_{key}", use_container_width=True,
                         type="primary" if picked else "secondary"):
                with st.spinner(f"Running {sc.title} through the city…"):
                    ss.scenario_key = key
                    ss.scenario_reading = adapter().read_city(sc.apply(ss.profile))
                    ss.actions = []
                    ss.improved_reading = None
                st.rerun()

    if ss.scenario_reading is not None:
        before, after = ss.baseline, ss.scenario_reading
        sc = SCENARIOS[ss.scenario_key]
        st.divider()
        left, right = st.columns([1.5, 1], gap="large")
        with left:
            svg_block(render_city(scenario_profile(), after), 360)
        with right:
            svg_block(C.health_ring(after.health), 200)
            html(f'<div style="text-align:center;color:#9fb6d4">'
                 f'was {before.health} · now <b style="color:#e8f1fb">{after.health}</b></div>')
        # per-system before/after
        rows = ""
        for s in after.sorted_systems():
            b = before.systems[s.system]
            rows += C.compare_row(s.label, s.icon, b.pressure, s.pressure, s.color)
        html(f'<div style="margin:.6rem 0">{rows}</div>')
        html(C.guide(GUIDE.on_scenario(sc.title, before, after)))

        b1, b2 = st.columns([1, 2])
        if b1.button("←  Back to pulse", use_container_width=True):
            goto(2); st.rerun()
        if b2.button("What matters most?  →", type="primary", use_container_width=True):
            goto(4); st.rerun()
    else:
        if st.button("←  Back to pulse", use_container_width=True):
            goto(2); st.rerun()


# ===========================================================================
#  STEP 4 — diagnosis (the 3 questions)
# ===========================================================================
def step_diagnose():
    ss = st.session_state
    html(C.stepper(3))
    reading = ss.scenario_reading or ss.baseline
    diag = GUIDE.diagnose(reading, ss.baseline)
    sc_title = SCENARIOS[ss.scenario_key].title if ss.scenario_key else "your city"
    st.markdown(f"### 🔎 What matters most under **{sc_title}**")

    left, right = st.columns([1, 1.2], gap="large")
    with left:
        top = reading.sorted_systems()[0]
        html(f'<div class="cp-card" style="text-align:center;padding:1.4rem">'
             f'<div style="font-size:2.6rem">{top.icon}</div>'
             f'<div class="name" style="font-size:1.2rem">{top.label}</div>'
             f'<div class="status" style="color:{top.color};font-size:1rem">'
             f'{top.status}</div>'
             f'<div style="color:#9fb6d4;margin-top:.4rem">Focus here first</div></div>')
        svg_block(C.health_ring(reading.health), 210)
    with right:
        html(C.three_questions(diag))

    html(C.guide(GUIDE.on_plan_ready(reading)))
    b1, b2 = st.columns([1, 2])
    if b1.button("←  Back to test", use_container_width=True):
        goto(3); st.rerun()
    if b2.button("Build my improvement plan  →", type="primary",
                 use_container_width=True):
        goto(5); st.rerun()


# ===========================================================================
#  STEP 5 — improvement plan
# ===========================================================================
def step_improve():
    ss = st.session_state
    html(C.stepper(4))
    st.markdown("### 🛠️ Your improvement plan")

    base_reading = ss.scenario_reading or ss.baseline
    top_system = base_reading.sorted_systems()[0].system
    recommended = recommended_actions_for(top_system)

    st.caption("Pick one or two moves. Recommended actions are marked ⭐.")
    cols = st.columns(len(ACTIONS))
    for col, (key, act) in zip(cols, ACTIONS.items()):
        with col:
            chosen = key in ss.actions
            star = "⭐ " if key in recommended[:1] else ""
            label = f"{act.icon}\n\n{star}**{act.title}**\n\n{act.blurb}"
            if st.button(label, key=f"ac_{key}", use_container_width=True,
                         type="primary" if chosen else "secondary"):
                if chosen:
                    ss.actions.remove(key)
                else:
                    ss.actions.append(key)
                # recompute
                p = scenario_profile()
                for k in ss.actions:
                    p = ACTIONS[k].apply(p)
                ss.improved_reading = adapter().read_city(p) if ss.actions else None
                st.rerun()

    st.divider()
    before = base_reading
    after = ss.improved_reading or base_reading

    left, right = st.columns([1.5, 1], gap="large")
    with left:
        p = scenario_profile()
        for k in ss.actions:
            p = ACTIONS[k].apply(p)
        svg_block(render_city(p, after), 360)
    with right:
        svg_block(C.health_ring(after.health, "Projected"), 210)
        if ss.actions:
            html(f'<div style="text-align:center;color:#9fb6d4">'
                 f'was {before.health} · now '
                 f'<b style="color:#e8f1fb">{after.health}</b></div>')

    if ss.actions:
        rows = ""
        for s in after.sorted_systems():
            b = before.systems[s.system]
            rows += C.compare_row(s.label, s.icon, b.pressure, s.pressure, s.color)
        html(f'<div style="margin:.6rem 0">{rows}</div>')
        html(C.guide(GUIDE.on_actions_applied(before, after, ss.actions)))
    else:
        html(C.guide("Pick a move above and I'll show you exactly how the city responds."))

    b1, b2, b3 = st.columns(3)
    if b1.button("←  Back", use_container_width=True):
        goto(4); st.rerun()
    if b2.button("🧪 Test another scenario", use_container_width=True):
        ss.actions = []; ss.improved_reading = None
        goto(3); st.rerun()
    if b3.button("🔄 Start a new city", use_container_width=True):
        for k in ("baseline", "scenario_key", "scenario_reading", "actions",
                  "improved_reading"):
            st.session_state[k] = [] if k == "actions" else None
        goto(1); st.rerun()


# ===========================================================================
#  main
# ===========================================================================
def main():
    theme.inject(st)
    init_state()

    # tiny brand header on inner steps
    if st.session_state.step > 0:
        h1, h2 = st.columns([1, 6])
        with h1:
            if os.path.exists(LOGO):
                st.image(LOGO, width=120)

    steps = {0: step_welcome, 1: step_found, 2: step_pulse,
             3: step_test, 4: step_diagnose, 5: step_improve}
    steps[st.session_state.step]()

    # transparency footer: which models are live
    live = adapter().live_systems
    st.caption(f"Models live: {', '.join(live) if live else 'none (demo mode)'} · "
               "CityPulse AI · gameful MVP")


if __name__ == "__main__":
    main()
