import base64
import calendar
import html
import json
import time
from copy import deepcopy
from datetime import datetime
from pathlib import Path

import joblib
import pandas as pd
import plotly.graph_objects as go
import streamlit as st


# ---------------------------------------------------------
# APP SETTINGS
# ---------------------------------------------------------
st.set_page_config(
    page_title="CityPulse AI",
    page_icon="🏙️",
    layout="wide",
    initial_sidebar_state="collapsed",
)

BASE_DIR = Path(__file__).resolve().parent
ASSETS_DIR = BASE_DIR / "assets"
MODELS_DIR = BASE_DIR / "models"

LOGO_CANDIDATES = [
    ASSETS_DIR / "CityPulse AI.png",
    ASSETS_DIR / "logo.png",
]
HERO_IMAGE_CANDIDATES = [
    ASSETS_DIR / "smart_cities.jpg",
    ASSETS_DIR / "smart_cities.png",
    ASSETS_DIR / "Smart Cities.jpg",
    ASSETS_DIR / "Smart Cities.png",
]

LOGO_PATH = next((p for p in LOGO_CANDIDATES if p.exists()), None)
HERO_IMAGE_PATH = next((p for p in HERO_IMAGE_CANDIDATES if p.exists()), None)


def image_data_uri(path: Path | None) -> str:
    if path is None or not path.exists():
        return ""
    suffix = path.suffix.lower().replace(".", "") or "png"
    if suffix == "jpg":
        suffix = "jpeg"
    encoded = base64.b64encode(path.read_bytes()).decode("utf-8")
    return f"data:image/{suffix};base64,{encoded}"


LOGO_URI = image_data_uri(LOGO_PATH)
HERO_IMAGE_URI = image_data_uri(HERO_IMAGE_PATH)

if LOGO_PATH:
    try:
        st.logo(str(LOGO_PATH), size="large", icon_image=str(LOGO_PATH))
    except Exception:
        pass


# ---------------------------------------------------------
# DESIGN
# ---------------------------------------------------------
st.markdown(
    """
    <style>
    :root {
        --navy: #071C2D;
        --navy-2: #0B3348;
        --teal: #0C8E91;
        --blue: #2F6FED;
        --green: #148A62;
        --amber: #A96A10;
        --red: #B84747;
        --ink: #102033;
        --muted: #66768A;
        --line: rgba(11, 45, 70, .10);
        --surface: rgba(255, 255, 255, .94);
    }

    html, body, [class*="css"] {
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display",
                     "SF Pro Text", "Segoe UI", sans-serif;
    }

    .stApp {
        background:
            radial-gradient(circle at 4% 0%, rgba(47,111,237,.08), transparent 24%),
            radial-gradient(circle at 96% 6%, rgba(12,142,145,.08), transparent 22%),
            #F4F7FA;
        color: var(--ink);
    }

    .main .block-container {
        max-width: 1220px;
        padding-top: 1.35rem;
        padding-bottom: 5rem;
    }

    footer {visibility: hidden;}

    h1, h2, h3 {
        color: var(--ink);
        letter-spacing: -.025em;
    }

    .cp-hero {
        border-radius: 30px;
        overflow: hidden;
        background: linear-gradient(135deg, #071C2D 0%, #0B344A 62%, #0C7B7E 130%);
        box-shadow: 0 24px 65px rgba(12, 42, 64, .18);
        margin-bottom: 20px;
    }

    .cp-hero-inner {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 430px;
        min-height: 290px;
    }

    .cp-hero-copy {
        padding: 38px 38px 34px 38px;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    .cp-eyebrow {
        color: rgba(255,255,255,.67);
        font-size: 11px;
        letter-spacing: .15em;
        font-weight: 800;
        text-transform: uppercase;
        margin-bottom: 10px;
    }

    .cp-hero h1 {
        color: white;
        font-size: clamp(38px, 5vw, 58px);
        line-height: 1.03;
        margin: 0 0 12px 0;
    }

    .cp-hero p {
        color: rgba(255,255,255,.82);
        font-size: 17px;
        line-height: 1.65;
        max-width: 690px;
        margin: 0;
    }

    .cp-hero-badges {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 20px;
    }

    .cp-hero-badge {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 8px 12px;
        color: white;
        background: rgba(255,255,255,.12);
        border: 1px solid rgba(255,255,255,.16);
        border-radius: 999px;
        font-size: 12px;
        font-weight: 750;
    }

    .cp-hero-media {
        position: relative;
        min-height: 290px;
        background: rgba(255,255,255,.06);
        overflow: hidden;
    }

    .cp-hero-media img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
        display: block;
        filter: saturate(.92) contrast(1.03);
    }

    .cp-hero-media::after {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(90deg, rgba(7,28,45,.55), rgba(7,28,45,.02) 45%, rgba(7,28,45,.08));
        pointer-events: none;
    }

    .cp-hero-fallback {
        height: 100%;
        min-height: 290px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 86px;
        background: radial-gradient(circle at 50% 50%, rgba(255,255,255,.16), transparent 55%);
    }

    .cp-journey {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 9px;
        margin: 16px 0 24px 0;
    }

    .cp-stage {
        position: relative;
        background: rgba(255,255,255,.78);
        border: 1px solid var(--line);
        border-radius: 18px;
        padding: 14px 15px;
        min-height: 75px;
    }

    .cp-stage strong {display:block;font-size:13px;margin-bottom:5px;}
    .cp-stage span {color:var(--muted);font-size:12px;line-height:1.35;}
    .cp-stage.active {
        border-color: rgba(47,111,237,.38);
        box-shadow: 0 11px 30px rgba(47,111,237,.10);
        background: #F4F8FF;
    }
    .cp-stage.done {background:#F0FAF6;border-color:rgba(20,138,98,.22);}

    .cp-page-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 18px;
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: 24px;
        padding: 24px 26px;
        box-shadow: 0 13px 34px rgba(15,45,70,.055);
        margin-bottom: 20px;
    }

    .cp-page-head h1 {font-size:33px;margin:0 0 6px 0;}
    .cp-page-head p {margin:0;color:var(--muted);line-height:1.55;max-width:760px;}

    .cp-chip {
        display: inline-flex;
        border-radius: 999px;
        padding: 7px 11px;
        font-size: 12px;
        font-weight: 800;
        white-space: nowrap;
        background: #EDF3FF;
        color: #2F5FCC;
    }
    .cp-chip.green {background:#E8F7F0;color:#087451;}
    .cp-chip.amber {background:#FFF3DF;color:#935A09;}
    .cp-chip.gray {background:#F0F2F5;color:#667085;}
    .cp-chip.red {background:#FDECEC;color:#A13E3E;}

    .cp-card {
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: 22px;
        padding: 21px;
        box-shadow: 0 11px 30px rgba(15,45,70,.045);
        height: 100%;
    }
    .cp-card h3 {margin:0 0 8px 0;font-size:20px;}
    .cp-card p {margin:0;color:var(--muted);line-height:1.55;font-size:14px;}

    .cp-section-label {
        color: var(--muted);
        font-size: 12px;
        font-weight: 800;
        letter-spacing: .11em;
        text-transform: uppercase;
        margin-bottom: 7px;
    }

    .cp-decision {
        border-radius: 26px;
        padding: 26px 28px;
        background: linear-gradient(135deg, #071F31, #0B5262 75%, #0A8580 130%);
        color: white;
        box-shadow: 0 20px 50px rgba(15,45,70,.15);
        margin: 16px 0;
    }
    .cp-decision small {color:rgba(255,255,255,.67);font-weight:800;letter-spacing:.11em;text-transform:uppercase;}
    .cp-decision h2 {color:white;margin:9px 0 8px 0;font-size:31px;}
    .cp-decision p {color:rgba(255,255,255,.82);margin:0;line-height:1.6;}

    .cp-evidence {
        border-left: 4px solid var(--blue);
        background: #F4F8FF;
        border-radius: 0 18px 18px 0;
        padding: 17px 19px;
        margin: 10px 0;
    }
    .cp-evidence strong {display:block;margin-bottom:4px;}
    .cp-evidence span {color:var(--muted);font-size:14px;line-height:1.55;}

    .cp-signal {
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: 20px;
        padding: 18px;
        min-height: 145px;
    }
    .cp-signal-top {display:flex;justify-content:space-between;gap:12px;align-items:flex-start;}
    .cp-signal h3 {margin:0;font-size:18px;}
    .cp-signal p {color:var(--muted);font-size:13px;line-height:1.5;margin:12px 0 0 0;}

    .cp-plan-card {
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: 22px;
        padding: 22px;
        box-shadow: 0 10px 28px rgba(15,45,70,.04);
        margin-bottom: 13px;
    }
    .cp-plan-card h3 {margin:5px 0 8px 0;font-size:22px;}
    .cp-plan-meta {
        display:flex;
        flex-wrap:wrap;
        gap:8px;
        margin-top:14px;
    }
    .cp-meta {
        padding:6px 9px;
        border-radius:999px;
        background:#F1F4F8;
        color:#536579;
        font-size:11px;
        font-weight:750;
    }

    .cp-review-card {
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: 27px;
        padding: 28px;
        box-shadow: 0 16px 42px rgba(15,45,70,.07);
    }
    .cp-review-card h2 {font-size:31px;margin:8px 0 12px 0;}
    .cp-review-card p {color:var(--muted);line-height:1.65;}

    .cp-brief {
        background:white;
        border:1px solid var(--line);
        border-radius:24px;
        padding:28px;
        box-shadow:0 13px 34px rgba(15,45,70,.05);
    }

    div[data-testid="stButton"] button,
    div[data-testid="stDownloadButton"] button {
        border-radius: 14px;
        min-height: 45px;
        font-weight: 700;
        transition: transform .15s ease, box-shadow .15s ease;
    }
    div[data-testid="stButton"] button:hover,
    div[data-testid="stDownloadButton"] button:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 22px rgba(15,45,70,.10);
    }

    div[data-testid="stForm"] {
        background: rgba(255,255,255,.90);
        border: 1px solid var(--line);
        border-radius: 22px;
        padding: 21px;
    }

    @media (max-width: 860px) {
        .main .block-container {padding: .9rem .75rem 4rem .75rem;}
        .cp-hero-inner {grid-template-columns:1fr;}
        .cp-hero-media {min-height:220px;}
        .cp-hero-media img {min-height:220px;}
        .cp-hero-copy {padding:28px 23px;}
        .cp-journey {grid-template-columns:1fr 1fr;}
        .cp-page-head {padding:21px;border-radius:21px;}
        .cp-page-head h1 {font-size:28px;}
    }
    </style>
    """,
    unsafe_allow_html=True,
)


# ---------------------------------------------------------
# STATE
# ---------------------------------------------------------
DEFAULT_STATE = {
    "v5_case_ready": False,
    "v5_city": {
        "name": "Jep",
        "country": "Saudi Arabia",
        "population": 100000,
        "districts": 10,
        "objective": "Prepare for next month's operational demand",
        "horizon": "Next month",
    },
    "v5_evidence": {},
    "v5_plan": [],
    "v5_plan_status": "Draft",
    "v5_review_index": 0,
    "v5_copilot_answer": "",
    "v5_waste_inputs": {
        "borough": "Bronx",
        "district": 1,
        "month_name": "January",
        "year": 2026,
        "last_month": 4000.0,
        "two_months": 3900.0,
    },
}
for key, value in DEFAULT_STATE.items():
    if key not in st.session_state:
        st.session_state[key] = deepcopy(value)


# ---------------------------------------------------------
# MODEL REGISTRY
# ---------------------------------------------------------
MODEL_FILES = {
    "Mobility": "transportation_bundle.joblib",
    "Energy": "energy_bundle.joblib",
    "Public Services": "governance_bundle.joblib",
    "Waste": "waste_bundle.joblib",
}

MODEL_DESCRIPTIONS = {
    "Mobility": "Transportation risk and mobility pressure",
    "Energy": "Building energy demand and peak conditions",
    "Public Services": "Requests that may need earlier attention",
    "Waste": "Monthly district waste demand",
}


@st.cache_resource
def load_model_bundle(file_name: str):
    path = MODELS_DIR / file_name
    if not path.exists():
        return None, None
    try:
        return joblib.load(path), None
    except Exception as error:
        return None, str(error)


MODEL_BUNDLES = {}
MODEL_ERRORS = {}
for area, file_name in MODEL_FILES.items():
    bundle, error = load_model_bundle(file_name)
    MODEL_BUNDLES[area] = bundle
    MODEL_ERRORS[area] = error


def model_file_available(area: str) -> bool:
    return isinstance(MODEL_BUNDLES.get(area), dict)


WASTE_BUNDLE = MODEL_BUNDLES.get("Waste")
WASTE_MODEL = WASTE_BUNDLE.get("model") if isinstance(WASTE_BUNDLE, dict) else None
WASTE_FEATURES = WASTE_BUNDLE.get("feature_columns", []) if isinstance(WASTE_BUNDLE, dict) else []


# ---------------------------------------------------------
# UI HELPERS
# ---------------------------------------------------------
def hero(title: str, subtitle: str, badges: list[str] | None = None):
    badges = badges or []
    badge_html = "".join(
        f'<span class="cp-hero-badge">● {html.escape(item)}</span>' for item in badges
    )
    if HERO_IMAGE_URI:
        media = f'<img src="{HERO_IMAGE_URI}" alt="Smart city visual">'
    elif LOGO_URI:
        media = f'<img src="{LOGO_URI}" alt="CityPulse AI logo" style="object-fit:contain;padding:45px;background:white;">'
    else:
        media = '<div class="cp-hero-fallback">🏙️</div>'

    st.markdown(
        f"""
        <div class="cp-hero">
            <div class="cp-hero-inner">
                <div class="cp-hero-copy">
                    <div class="cp-eyebrow">CITYPULSE AI · MUNICIPAL DECISION PLATFORM</div>
                    <h1>{html.escape(title)}</h1>
                    <p>{html.escape(subtitle)}</p>
                    <div class="cp-hero-badges">{badge_html}</div>
                </div>
                <div class="cp-hero-media">{media}</div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def page_header(icon: str, title: str, subtitle: str, chip: str = "", chip_class: str = ""):
    chip_html = f'<span class="cp-chip {chip_class}">{html.escape(chip)}</span>' if chip else ""
    st.markdown(
        f"""
        <div class="cp-page-head">
            <div>
                <h1>{icon} {html.escape(title)}</h1>
                <p>{html.escape(subtitle)}</p>
            </div>
            {chip_html}
        </div>
        """,
        unsafe_allow_html=True,
    )


def journey(stage: int):
    stages = [
        ("Define the city case", "Set one municipal objective"),
        ("Draft the city plan", "Turn evidence into interventions"),
        ("Review decisions", "Approve, defer, or request evidence"),
        ("Issue the brief", "Prepare the stakeholder summary"),
    ]
    blocks = []
    for idx, (title, note) in enumerate(stages, start=1):
        state = "done" if idx < stage else "active" if idx == stage else ""
        prefix = "✓" if idx < stage else str(idx)
        blocks.append(
            f'<div class="cp-stage {state}"><strong>{prefix}. {html.escape(title)}</strong><span>{html.escape(note)}</span></div>'
        )
    st.markdown('<div class="cp-journey">' + "".join(blocks) + "</div>", unsafe_allow_html=True)


def signal_card(area: str, headline: str, note: str, available: bool, priority: str = ""):
    if available:
        chip = f'<span class="cp-chip green">Evidence available</span>'
    else:
        chip = f'<span class="cp-chip gray">Not connected</span>'
    priority_html = f'<div style="margin-top:10px;"><span class="cp-chip amber">{html.escape(priority)}</span></div>' if priority else ""
    st.markdown(
        f"""
        <div class="cp-signal">
            <div class="cp-signal-top"><h3>{html.escape(area)}</h3>{chip}</div>
            <p><strong>{html.escape(headline)}</strong><br>{html.escape(note)}</p>
            {priority_html}
        </div>
        """,
        unsafe_allow_html=True,
    )


def plan_card(item: dict, number: int):
    status_class = {
        "Draft": "gray",
        "Approved": "green",
        "Needs Evidence": "amber",
        "Deferred": "red",
    }.get(item.get("review_status", "Draft"), "gray")
    st.markdown(
        f"""
        <div class="cp-plan-card">
            <div style="display:flex;justify-content:space-between;gap:15px;align-items:flex-start;">
                <div>
                    <div class="cp-section-label">Intervention {number}</div>
                    <h3>{html.escape(item['title'])}</h3>
                </div>
                <span class="cp-chip {status_class}">{html.escape(item.get('review_status','Draft'))}</span>
            </div>
            <p style="color:var(--muted);line-height:1.6;margin:0;">{html.escape(item['decision'])}</p>
            <div class="cp-plan-meta">
                <span class="cp-meta">Owner: {html.escape(item['owner'])}</span>
                <span class="cp-meta">Timing: {html.escape(item['timing'])}</span>
                <span class="cp-meta">Evidence: {html.escape(item['source'])}</span>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def evidence_count() -> int:
    return len(st.session_state.v5_evidence)


def completed_reviews() -> int:
    return sum(item.get("review_status") != "Draft" for item in st.session_state.v5_plan)


# ---------------------------------------------------------
# WASTE ADAPTER
# ---------------------------------------------------------
def prepare_waste_input(
    borough: str,
    district: int,
    year: int,
    month_number: int,
    last_month: float,
    two_months: float,
) -> pd.DataFrame:
    row = pd.DataFrame([
        {
            "borough": borough,
            "communitydistrict": district,
            "year": year,
            "month_number": month_number,
            "waste_last_month": last_month,
            "waste_2_months_ago": two_months,
        }
    ])
    row = pd.get_dummies(
        row,
        columns=["borough", "communitydistrict"],
        drop_first=True,
        dtype=int,
    )
    return row.reindex(columns=WASTE_FEATURES, fill_value=0)


def run_waste_signal(inputs: dict) -> dict:
    if WASTE_MODEL is None or not WASTE_FEATURES:
        raise RuntimeError("The waste model is not available.")

    month_number = list(calendar.month_name).index(inputs["month_name"])
    model_input = prepare_waste_input(
        borough=inputs["borough"],
        district=int(inputs["district"]),
        year=int(inputs["year"]),
        month_number=month_number,
        last_month=float(inputs["last_month"]),
        two_months=float(inputs["two_months"]),
    )
    forecast = float(WASTE_MODEL.predict(model_input)[0])
    difference = forecast - float(inputs["last_month"])
    percent = (difference / float(inputs["last_month"]) * 100) if inputs["last_month"] else 0.0

    if percent >= 10:
        priority = "High"
        position = "Prepare temporary collection capacity for the forecast month."
        rationale = "The forecast is materially above the previous month and may pressure the current collection plan."
    elif percent >= 5:
        priority = "Medium"
        position = "Review collection capacity before confirming next month's schedule."
        rationale = "The forecast indicates a moderate increase that should be checked against available crews and vehicles."
    elif percent <= -8:
        priority = "Low"
        position = "Keep the current collection plan and avoid unnecessary expansion."
        rationale = "The forecast is below the previous month, so additional collection capacity is not currently indicated."
    else:
        priority = "Low"
        position = "Maintain the current collection plan."
        rationale = "The forecast is close to the previous month and does not indicate urgent operational change."

    return {
        "area": "Waste",
        "headline": position,
        "priority": priority,
        "forecast": forecast,
        "unit": "tons",
        "difference": difference,
        "change_percent": percent,
        "location": f"{inputs['borough']} District {int(inputs['district'])}",
        "period": f"{inputs['month_name']} {int(inputs['year'])}",
        "rationale": rationale,
        "source": WASTE_BUNDLE.get("model_name", "Waste forecasting model") if isinstance(WASTE_BUNDLE, dict) else "Waste forecasting model",
        "limitation": "The forecast supports planning and should be checked against current fleet, staffing, events, and local operating conditions.",
        "inputs": deepcopy(inputs),
    }


def waste_figure(signal: dict):
    inputs = signal["inputs"]
    values = [float(inputs["two_months"]), float(inputs["last_month"]), float(signal["forecast"])]
    labels = ["Two months ago", "Last month", "Forecast"]
    fig = go.Figure(go.Bar(x=labels, y=values, text=[f"{v:,.0f}" for v in values], textposition="outside"))
    fig.update_layout(
        height=310,
        margin=dict(l=10, r=10, t=20, b=10),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        yaxis_title="Waste tons",
        showlegend=False,
    )
    return fig


# ---------------------------------------------------------
# SYNTHESIS LAYER
# Model outputs are combined as normalized decision signals,
# not by merging unrelated raw datasets.
# ---------------------------------------------------------
def build_plan_from_evidence() -> list[dict]:
    city = st.session_state.v5_city
    evidence = st.session_state.v5_evidence
    plan = []

    waste = evidence.get("Waste")
    if waste:
        owner = "Municipal sanitation operations"
        if waste["priority"] == "High":
            title = "Prepare additional collection capacity"
            decision = (
                f"For {waste['location']} in {waste['period']}, review temporary fleet and workforce capacity "
                f"before finalizing the collection schedule."
            )
        elif waste["priority"] == "Medium":
            title = "Validate collection capacity before scheduling"
            decision = (
                f"Compare the {waste['forecast']:,.0f}-ton forecast with available crews and vehicles, "
                "then confirm the monthly collection plan."
            )
        else:
            title = "Maintain the current collection position"
            decision = (
                f"For {waste['location']} in {waste['period']}, keep the current collection plan unless "
                "local events or operational changes create new demand."
            )

        plan.append({
            "id": "waste_position",
            "title": title,
            "decision": decision,
            "why": waste["rationale"],
            "owner": owner,
            "timing": "Before next monthly schedule",
            "source": "Waste demand forecast",
            "review_status": "Draft",
        })
        plan.append({
            "id": "waste_validation",
            "title": "Validate the forecast after the first collection cycle",
            "decision": (
                "Compare actual collected waste with the forecast after the first cycle and record the variance "
                "for the following planning period."
            ),
            "why": "This creates a practical feedback loop and helps the municipality judge whether the model remains useful locally.",
            "owner": owner,
            "timing": "After the first collection cycle",
            "source": "Operational validation",
            "review_status": "Draft",
        })

    missing_areas = [area for area in MODEL_FILES if area not in evidence]
    if missing_areas:
        relevant = missing_areas[0]
        plan.append({
            "id": "evidence_gap",
            "title": f"Request the next relevant city signal: {relevant}",
            "decision": (
                f"Before expanding the city-wide plan, request the minimum information needed to evaluate {MODEL_DESCRIPTIONS[relevant].lower()}."
            ),
            "why": (
                f"The current plan is based on {len(evidence)} connected signal(s). Adding {relevant.lower()} evidence can reveal cross-department effects and reduce one-area decisions."
            ),
            "owner": "Smart city program office",
            "timing": "Next planning review",
            "source": "Evidence coverage gap",
            "review_status": "Draft",
        })

    if not plan:
        plan.append({
            "id": "start_review",
            "title": "Run the first evidence review",
            "decision": "Use the available city data to create the first evidence-backed municipal position.",
            "why": "A plan should begin with a real planning question and at least one available evidence signal.",
            "owner": "Smart city program office",
            "timing": "Now",
            "source": "City case setup",
            "review_status": "Draft",
        })

    return plan


def strongest_signal() -> dict | None:
    priorities = {"High": 3, "Medium": 2, "Low": 1}
    signals = list(st.session_state.v5_evidence.values())
    if not signals:
        return None
    return max(signals, key=lambda item: priorities.get(item.get("priority", "Low"), 0))


def refresh_plan():
    old_status = {item["id"]: item.get("review_status", "Draft") for item in st.session_state.v5_plan}
    new_plan = build_plan_from_evidence()
    for item in new_plan:
        if item["id"] in old_status:
            item["review_status"] = old_status[item["id"]]
    st.session_state.v5_plan = new_plan
    st.session_state.v5_plan_status = "In Review" if any(i["review_status"] != "Draft" for i in new_plan) else "Draft"


# ---------------------------------------------------------
# COPILOT
# ---------------------------------------------------------
def copilot_reply(question: str) -> str:
    q = question.strip().lower()
    city = st.session_state.v5_city
    signal = strongest_signal()
    evidence = st.session_state.v5_evidence
    plan = st.session_state.v5_plan

    greeting_words = {"hi", "hello", "hey", "مرحبا", "هلا", "السلام"}
    if any(word in q.split() for word in greeting_words):
        return (
            f"Hello. I am reviewing the municipal case for {city['name']}: “{city['objective']}”. "
            f"I currently have {len(evidence)} of 4 evidence signals. You can ask for the case summary, "
            "the recommended municipal position, missing evidence, or a stakeholder explanation."
        )

    if "summary" in q or "summar" in q or "ملخص" in q:
        if not signal:
            return (
                f"The {city['name']} case is defined, but no model evidence has been reviewed yet. "
                "The next useful step is to run the City Review using the available waste model."
            )
        return (
            f"The current case focuses on {city['objective'].lower()} over {city['horizon'].lower()}. "
            f"The strongest available signal is {signal['area']} with {signal['priority'].lower()} priority. "
            f"The current municipal position is: {signal['headline']}"
        )

    if "next" in q or "do" in q or "وش" in q or "ماذا" in q:
        if plan:
            pending = next((item for item in plan if item.get("review_status") == "Draft"), plan[0])
            return (
                f"The next decision waiting for municipal review is: {pending['title']}. "
                f"Recommended position: {pending['decision']} Owner: {pending['owner']}."
            )
        return "Run the first City Review so CityPulse can create an evidence-backed draft plan."

    if "missing" in q or "ناقص" in q or "data" in q:
        missing = [area for area in MODEL_FILES if area not in evidence]
        if not missing:
            return "All four evidence areas currently have saved results. The next step is human review of the municipal plan."
        return (
            "The current evidence gap is: " + ", ".join(missing) + ". "
            "These are not buttons the municipality must activate. They are evidence sources that should be connected only when the relevant data is available."
        )

    if "why" in q or "important" in q or "ليش" in q:
        if signal:
            return (
                f"This matters because {signal['rationale']} The result should support a municipal review, "
                "not an automatic operational decision."
            )
        return "The city case still needs one real evidence signal before CityPulse can explain a priority."

    if "30" in q or "month plan" in q or "خطة" in q:
        if not plan:
            return "Run the City Review first. Then I can turn the evidence into a short municipal review plan."
        actions = [f"{idx}. {item['title']}" for idx, item in enumerate(plan[:3], start=1)]
        return "A simple 30-day municipal review plan:\n" + "\n".join(actions)

    if "manager" in q or "mayor" in q or "stakeholder" in q or "مدير" in q:
        if signal:
            return (
                f"For a municipal director: CityPulse reviewed the available {signal['area'].lower()} evidence for {city['name']}. "
                f"The evidence indicates {signal['priority'].lower()} priority. The proposed position is: {signal['headline']} "
                "The recommendation still requires operational validation and human approval."
            )
        return "For a stakeholder: the city case is ready, but no evidence-backed recommendation has been produced yet."

    if "waste" in q or "نفايات" in q:
        waste = evidence.get("Waste")
        if waste:
            return (
                f"The waste forecast is {waste['forecast']:,.0f} tons for {waste['location']} in {waste['period']}. "
                f"That is {waste['change_percent']:+.1f}% compared with last month. {waste['headline']}"
            )
        return "The waste model is available, but the City Review has not saved a waste forecast yet."

    return (
        f"I can help with the {city['name']} municipal case using the saved evidence and review decisions. "
        "Try asking: “Summarize the case”, “What decision is waiting?”, “What evidence is missing?”, "
        "or “Explain this to a municipal director”."
    )


@st.dialog("CityPulse Copilot")
def copilot_dialog(context: str = ""):
    st.caption("Evidence-aware guidance for the current city case. It does not make official municipal decisions.")
    prompts = [
        "Summarize the city case",
        "What decision is waiting for review?",
        "What evidence is missing?",
        "Explain this to a municipal director",
        "Create a simple 30-day review plan",
    ]
    for prompt in prompts:
        if st.button(prompt, use_container_width=True, key=f"copilot_{prompt}_{context}"):
            st.session_state.v5_copilot_answer = copilot_reply(prompt)
            st.rerun()

    question = st.text_input("Ask your own question", key=f"copilot_input_{context}")
    if st.button("Ask CityPulse", type="primary", use_container_width=True, key=f"copilot_ask_{context}"):
        st.session_state.v5_copilot_answer = copilot_reply(question or "Summarize the city case")
        st.rerun()

    if st.session_state.v5_copilot_answer:
        st.info(st.session_state.v5_copilot_answer)


# ---------------------------------------------------------
# CITY REVIEW DIALOG
# ---------------------------------------------------------
@st.dialog("Run City Review")
def city_review_dialog():
    city = st.session_state.v5_city
    st.write(
        f"CityPulse will review the available evidence for **{city['name']}** and create a draft municipal plan. "
        "Models are used automatically when their required data is available."
    )

    connected = [area for area in MODEL_FILES if model_file_available(area)]
    st.caption("Model files detected: " + (", ".join(connected) if connected else "None"))

    if not model_file_available("Waste"):
        st.error("The waste model file is not available yet.")
        return

    inputs = st.session_state.v5_waste_inputs
    with st.form("city_review_form"):
        st.subheader("Waste evidence for the current review")
        col1, col2 = st.columns(2)
        with col1:
            borough = st.selectbox(
                "Area",
                ["Bronx", "Brooklyn", "Manhattan", "Queens", "Staten Island"],
                index=["Bronx", "Brooklyn", "Manhattan", "Queens", "Staten Island"].index(inputs["borough"]),
            )
            district = st.number_input("District", min_value=1, max_value=20, value=int(inputs["district"]), step=1)
            month_name = st.selectbox("Planning month", list(calendar.month_name)[1:], index=list(calendar.month_name)[1:].index(inputs["month_name"]))
        with col2:
            last_month = st.number_input("Waste collected last month", min_value=0.0, value=float(inputs["last_month"]), step=100.0)
            two_months = st.number_input("Waste collected two months ago", min_value=0.0, value=float(inputs["two_months"]), step=100.0)
            year = st.number_input("Year", min_value=2000, max_value=2035, value=int(inputs["year"]), step=1)

        run = st.form_submit_button("Review City Evidence", type="primary", use_container_width=True)

    if run:
        saved_inputs = {
            "borough": borough,
            "district": int(district),
            "month_name": month_name,
            "year": int(year),
            "last_month": float(last_month),
            "two_months": float(two_months),
        }
        st.session_state.v5_waste_inputs = saved_inputs

        try:
            with st.status("Preparing the municipal review...") as status:
                status.write("Checking the city objective")
                time.sleep(.2)
                status.write("Running the connected waste evidence model")
                signal = run_waste_signal(saved_inputs)
                time.sleep(.2)
                status.write("Translating the model output into a municipal position")
                st.session_state.v5_evidence["Waste"] = signal
                refresh_plan()
                status.update(label="City review ready", state="complete")
            st.toast("The draft city plan is ready for review")
            st.rerun()
        except Exception as error:
            st.error("The city review could not be completed.")
            st.code(str(error))


# ---------------------------------------------------------
# ONBOARDING
# ---------------------------------------------------------
def onboarding_page():
    hero(
        "Build one clear municipal case.",
        "Start with Jep, choose one planning objective, and let CityPulse use the available evidence to prepare a decision brief.",
        ["No model activation", "Evidence-based plan", "Human review"],
    )
    journey(1)

    city = st.session_state.v5_city
    left, right = st.columns([1.15, .85])
    with left:
        with st.form("case_builder"):
            st.subheader("Define the city case")
            city_name = st.text_input("City name", value=city["name"])
            country = st.text_input("Country", value=city["country"])
            c1, c2 = st.columns(2)
            with c1:
                population = st.number_input("Population", min_value=0, value=int(city["population"]), step=1000)
            with c2:
                districts = st.number_input("Planning districts", min_value=1, value=int(city["districts"]), step=1)

            objective_options = [
                "Prepare for next month's operational demand",
                "Improve public service response",
                "Plan for rapid city growth",
                "Reduce operational pressure",
                "Improve quality of life",
            ]
            objective = st.selectbox(
                "Municipal planning objective",
                objective_options,
                index=objective_options.index(city["objective"]) if city["objective"] in objective_options else 0,
            )
            horizon = st.segmented_control(
                "Planning horizon",
                ["Next month", "Next quarter", "Next year"],
                default=city["horizon"],
            ) if hasattr(st, "segmented_control") else st.radio(
                "Planning horizon", ["Next month", "Next quarter", "Next year"], horizontal=True
            )

            create_case = st.form_submit_button("Create Jep City Case", type="primary", use_container_width=True)

        if create_case:
            st.session_state.v5_city = {
                "name": city_name or "Jep",
                "country": country or "Saudi Arabia",
                "population": int(population),
                "districts": int(districts),
                "objective": objective,
                "horizon": horizon or "Next month",
            }
            st.session_state.v5_case_ready = True
            st.rerun()

    with right:
        st.markdown(
            """
            <div class="cp-card">
                <div class="cp-section-label">What happens next</div>
                <h3>One case, four evidence signals</h3>
                <p>CityPulse will use transportation, energy, public-service, and waste models as evidence sources. The user does not activate models. The platform detects what is available and uses only relevant evidence.</p>
                <div style="height:14px"></div>
                <div class="cp-evidence"><strong>Step 1</strong><span>Run the city review using available evidence.</span></div>
                <div class="cp-evidence"><strong>Step 2</strong><span>Receive a draft municipal plan.</span></div>
                <div class="cp-evidence"><strong>Step 3</strong><span>Approve, defer, or request more evidence.</span></div>
            </div>
            """,
            unsafe_allow_html=True,
        )


# ---------------------------------------------------------
# HOME
# ---------------------------------------------------------
def home_page():
    city = st.session_state.v5_city
    hero(
        f"{city['name']} City Case",
        f"Objective: {city['objective']}. CityPulse combines available model signals into one municipal review instead of exposing separate prediction tools.",
        [f"Horizon: {city['horizon']}", f"Evidence: {evidence_count()} of 4", f"Plan: {st.session_state.v5_plan_status}"],
    )
    journey(1 if not st.session_state.v5_evidence else 2)

    c1, c2, c3 = st.columns(3)
    with c1:
        if st.button("Run City Review", type="primary", use_container_width=True):
            city_review_dialog()
    with c2:
        if st.button("Open Draft City Plan", use_container_width=True):
            st.switch_page(plan_page_link)
    with c3:
        if st.button("Ask CityPulse", use_container_width=True):
            copilot_dialog("home")

    st.write("")
    strongest = strongest_signal()
    if strongest:
        st.markdown(
            f"""
            <div class="cp-decision">
                <small>Current municipal position</small>
                <h2>{html.escape(strongest['headline'])}</h2>
                <p>{html.escape(strongest['rationale'])}</p>
            </div>
            """,
            unsafe_allow_html=True,
        )
    else:
        st.markdown(
            """
            <div class="cp-decision">
                <small>Current municipal position</small>
                <h2>No evidence-backed position has been created yet.</h2>
                <p>Run the City Review. CityPulse will use the available model evidence and create a draft plan for human review.</p>
            </div>
            """,
            unsafe_allow_html=True,
        )

    st.subheader("City evidence")
    cols = st.columns(4)
    for idx, area in enumerate(MODEL_FILES):
        saved = st.session_state.v5_evidence.get(area)
        with cols[idx]:
            if saved:
                signal_card(area, saved["headline"], f"{saved['source']} · {saved['period']}", True, f"{saved['priority']} priority")
            else:
                if model_file_available(area):
                    note = "Model file detected. The input adapter will be added when this model is prepared for the shared city review."
                    headline = "Evidence source detected"
                else:
                    note = "Connect this evidence only when the city has the relevant model and data."
                    headline = MODEL_DESCRIPTIONS[area]
                signal_card(area, headline, note, False)

    st.write("")
    st.subheader("Why the models belong together")
    st.markdown(
        """
        <div class="cp-card">
            <p><strong>The raw datasets are not merged.</strong> Each model produces one standardized city signal: what may happen, priority, affected area, evidence, and limitation. CityPulse then combines those signals at the <strong>decision layer</strong> to create one municipal plan and reveal cross-department effects.</p>
        </div>
        """,
        unsafe_allow_html=True,
    )

    if st.session_state.v5_plan:
        st.subheader("Draft plan preview")
        for idx, item in enumerate(st.session_state.v5_plan[:2], start=1):
            plan_card(item, idx)


# ---------------------------------------------------------
# CITY PLAN
# ---------------------------------------------------------
def city_plan_page():
    city = st.session_state.v5_city
    page_header(
        "🧭",
        f"{city['name']} Draft City Plan",
        "A small set of evidence-backed municipal interventions. This is not a generic task list; every item has an owner, timing, evidence source, and a review decision.",
        st.session_state.v5_plan_status,
        "amber" if st.session_state.v5_plan_status != "Approved" else "green",
    )
    journey(2)

    if not st.session_state.v5_plan:
        st.info("Run the City Review from Home to create the first evidence-backed plan.")
        if st.button("Run City Review", type="primary"):
            city_review_dialog()
        return

    signal = strongest_signal()
    if signal:
        st.markdown(
            f"""
            <div class="cp-decision">
                <small>Recommended planning position</small>
                <h2>{html.escape(signal['headline'])}</h2>
                <p>{html.escape(signal['rationale'])}</p>
            </div>
            """,
            unsafe_allow_html=True,
        )

    for idx, item in enumerate(st.session_state.v5_plan, start=1):
        plan_card(item, idx)
        with st.expander("Why this intervention is in the plan"):
            st.write(item["why"])

    c1, c2 = st.columns(2)
    with c1:
        if st.button("Send Plan to Human Review", type="primary", use_container_width=True):
            st.session_state.v5_plan_status = "In Review"
            st.session_state.v5_review_index = 0
            st.switch_page(review_page_link)
    with c2:
        if st.button("Ask CityPulse About the Plan", use_container_width=True):
            copilot_dialog("plan")


# ---------------------------------------------------------
# REVIEW
# ---------------------------------------------------------
def review_page():
    city = st.session_state.v5_city
    reviewed = completed_reviews()
    total = len(st.session_state.v5_plan)
    page_header(
        "🔎",
        "Municipal Decision Review",
        "Review one recommendation at a time. Approving a recommendation records a human decision; it does not automatically control municipal operations.",
        f"{reviewed} of {total} reviewed" if total else "No draft plan",
        "green" if total and reviewed == total else "amber",
    )
    journey(3)

    if not st.session_state.v5_plan:
        st.info("Create the draft city plan first.")
        return

    max_index = len(st.session_state.v5_plan) - 1
    st.session_state.v5_review_index = min(max(st.session_state.v5_review_index, 0), max_index)
    index = st.session_state.v5_review_index
    item = st.session_state.v5_plan[index]

    st.progress((index + 1) / len(st.session_state.v5_plan), text=f"Decision {index + 1} of {len(st.session_state.v5_plan)}")
    st.markdown(
        f"""
        <div class="cp-review-card">
            <div class="cp-section-label">Decision for review</div>
            <h2>{html.escape(item['title'])}</h2>
            <p><strong>Proposed municipal position:</strong><br>{html.escape(item['decision'])}</p>
            <div class="cp-evidence"><strong>Why it is proposed</strong><span>{html.escape(item['why'])}</span></div>
            <div class="cp-plan-meta">
                <span class="cp-meta">Owner: {html.escape(item['owner'])}</span>
                <span class="cp-meta">Timing: {html.escape(item['timing'])}</span>
                <span class="cp-meta">Evidence: {html.escape(item['source'])}</span>
                <span class="cp-meta">Current status: {html.escape(item['review_status'])}</span>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    st.write("")
    a, b, c = st.columns(3)
    with a:
        if st.button("Approve for the City Brief", type="primary", use_container_width=True):
            item["review_status"] = "Approved"
            st.toast("Decision approved for the executive brief")
            if index < max_index:
                st.session_state.v5_review_index += 1
            st.rerun()
    with b:
        if st.button("Request More Evidence", use_container_width=True):
            item["review_status"] = "Needs Evidence"
            if index < max_index:
                st.session_state.v5_review_index += 1
            st.rerun()
    with c:
        if st.button("Defer Decision", use_container_width=True):
            item["review_status"] = "Deferred"
            if index < max_index:
                st.session_state.v5_review_index += 1
            st.rerun()

    n1, n2, n3 = st.columns([1, 1, 1])
    with n1:
        if st.button("← Previous", disabled=index == 0, use_container_width=True):
            st.session_state.v5_review_index -= 1
            st.rerun()
    with n2:
        if st.button("Ask CityPulse", use_container_width=True):
            copilot_dialog(f"review_{item['id']}")
    with n3:
        if st.button("Next →", disabled=index == max_index, use_container_width=True):
            st.session_state.v5_review_index += 1
            st.rerun()

    if completed_reviews() == len(st.session_state.v5_plan):
        st.session_state.v5_plan_status = "Reviewed"
        st.success("All draft recommendations have a human review status. The executive brief can now be issued.")
        if st.button("Open Executive Brief", type="primary"):
            st.switch_page(report_page_link)


# ---------------------------------------------------------
# REPORT
# ---------------------------------------------------------
def executive_summary_text() -> str:
    city = st.session_state.v5_city
    signal = strongest_signal()
    approved = [item for item in st.session_state.v5_plan if item["review_status"] == "Approved"]
    needs = [item for item in st.session_state.v5_plan if item["review_status"] == "Needs Evidence"]
    deferred = [item for item in st.session_state.v5_plan if item["review_status"] == "Deferred"]

    lines = [
        f"CITYPULSE AI — {city['name']} EXECUTIVE BRIEF",
        "",
        f"Planning objective: {city['objective']}",
        f"Planning horizon: {city['horizon']}",
        f"Evidence coverage: {len(st.session_state.v5_evidence)} of 4 city signals",
        "",
    ]
    if signal:
        lines += [
            "CURRENT EVIDENCE-BACKED POSITION",
            signal["headline"],
            signal["rationale"],
            "",
        ]
    else:
        lines += ["CURRENT POSITION", "No evidence-backed position has been produced.", ""]

    lines += ["HUMAN REVIEW OUTCOME"]
    if approved:
        lines += ["Approved recommendations:"] + [f"- {item['title']}: {item['decision']}" for item in approved]
    else:
        lines += ["- No recommendations have been approved yet."]
    if needs:
        lines += ["Recommendations requiring more evidence:"] + [f"- {item['title']}" for item in needs]
    if deferred:
        lines += ["Deferred recommendations:"] + [f"- {item['title']}" for item in deferred]

    lines += [
        "",
        "IMPORTANT LIMITATION",
        "CityPulse provides decision support. Model outputs, simulations, and AI guidance require operational validation and authorized human review.",
    ]
    return "\n".join(lines)


def executive_html() -> str:
    city = st.session_state.v5_city
    signal = strongest_signal()
    plan_rows = "".join(
        f"""
        <tr>
          <td>{html.escape(item['title'])}</td>
          <td>{html.escape(item['owner'])}</td>
          <td>{html.escape(item['timing'])}</td>
          <td>{html.escape(item['review_status'])}</td>
        </tr>
        """
        for item in st.session_state.v5_plan
    )
    position = signal["headline"] if signal else "No evidence-backed position yet."
    rationale = signal["rationale"] if signal else "Run the City Review to create the first municipal position."
    return f"""<!doctype html>
<html><head><meta charset="utf-8"><title>{html.escape(city['name'])} CityPulse Brief</title>
<style>
body{{font-family:Arial,sans-serif;color:#102033;margin:40px;line-height:1.55}}
h1{{font-size:34px;margin-bottom:5px}} h2{{margin-top:28px;color:#0B3348}}
.hero{{background:#082C43;color:white;padding:26px;border-radius:18px}} .hero p{{color:#D8E7EF}}
.box{{border:1px solid #DDE5EA;border-radius:14px;padding:18px;margin-top:14px}}
table{{width:100%;border-collapse:collapse;margin-top:12px}} th,td{{border:1px solid #DDE5EA;padding:10px;text-align:left}} th{{background:#F2F6F8}}
.note{{font-size:12px;color:#66768A;margin-top:25px}}
</style></head><body>
<div class="hero"><h1>{html.escape(city['name'])} Executive City Brief</h1><p>{html.escape(city['objective'])} · {html.escape(city['horizon'])}</p></div>
<h2>Municipal position</h2><div class="box"><strong>{html.escape(position)}</strong><p>{html.escape(rationale)}</p></div>
<h2>Evidence coverage</h2><p>{len(st.session_state.v5_evidence)} of 4 city evidence signals are currently available.</p>
<h2>Review decisions</h2><table><thead><tr><th>Recommendation</th><th>Owner</th><th>Timing</th><th>Review status</th></tr></thead><tbody>{plan_rows}</tbody></table>
<p class="note">CityPulse AI is a decision-support prototype. Recommendations require operational validation and authorized human approval.</p>
</body></html>"""


def report_page():
    city = st.session_state.v5_city
    page_header(
        "📄",
        f"{city['name']} Executive Brief",
        "A stakeholder-ready summary of the city objective, evidence, municipal position, and human review decisions.",
        "Stakeholder version",
        "green",
    )
    journey(4)

    signal = strongest_signal()
    st.markdown('<div class="cp-brief">', unsafe_allow_html=True)
    st.subheader("Planning case")
    st.write(f"**Objective:** {city['objective']}")
    st.write(f"**Horizon:** {city['horizon']}")
    st.write(f"**Evidence coverage:** {len(st.session_state.v5_evidence)} of 4 city signals")

    st.subheader("Municipal position")
    if signal:
        st.success(signal["headline"])
        st.write(signal["rationale"])
    else:
        st.info("No evidence-backed position has been produced yet.")

    st.subheader("Review outcome")
    if st.session_state.v5_plan:
        df = pd.DataFrame([
            {
                "Recommendation": item["title"],
                "Owner": item["owner"],
                "Timing": item["timing"],
                "Review status": item["review_status"],
            }
            for item in st.session_state.v5_plan
        ])
        st.dataframe(df, hide_index=True, use_container_width=True)
    st.markdown('</div>', unsafe_allow_html=True)

    st.write("")
    st.subheader("Download for stakeholders")
    st.caption("The main output is a formatted executive brief. Technical project backup is kept separate so it is not confused with the stakeholder report.")
    c1, c2 = st.columns(2)
    with c1:
        st.download_button(
            "Download Executive Brief (HTML)",
            data=executive_html(),
            file_name=f"{city['name']}_CityPulse_Executive_Brief.html",
            mime="text/html",
            type="primary",
            use_container_width=True,
        )
    with c2:
        evidence_rows = []
        for area, item in st.session_state.v5_evidence.items():
            evidence_rows.append({
                "Area": area,
                "Headline": item.get("headline", ""),
                "Priority": item.get("priority", ""),
                "Source": item.get("source", ""),
                "Limitation": item.get("limitation", ""),
            })
        appendix = pd.DataFrame(evidence_rows).to_csv(index=False) if evidence_rows else "Area,Headline,Priority,Source,Limitation\n"
        st.download_button(
            "Download Evidence Appendix (CSV)",
            data=appendix,
            file_name=f"{city['name']}_CityPulse_Evidence_Appendix.csv",
            mime="text/csv",
            use_container_width=True,
        )

    with st.expander("Prototype backup — not part of the executive report"):
        st.write("JSON is only for saving and restoring the prototype state. It is not intended for municipal stakeholders.")
        backup = {
            "city": st.session_state.v5_city,
            "evidence": st.session_state.v5_evidence,
            "plan": st.session_state.v5_plan,
        }
        st.download_button(
            "Download Project Backup (JSON)",
            data=json.dumps(backup, indent=2),
            file_name=f"{city['name']}_CityPulse_Project_Backup.json",
            mime="application/json",
        )


# ---------------------------------------------------------
# ROUTING
# ---------------------------------------------------------
if not st.session_state.v5_case_ready:
    onboarding_page()
    st.stop()

home_page_link = st.Page(home_page, title="Home", icon="🏙️", default=True)
plan_page_link = st.Page(city_plan_page, title="City Plan", icon="🧭")
review_page_link = st.Page(review_page, title="Review", icon="🔎")
report_page_link = st.Page(report_page, title="Brief", icon="📄")

pages = {
    "": [home_page_link, plan_page_link, review_page_link, report_page_link]
}

current_page = st.navigation(pages, position="top")
current_page.run()
