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
import streamlit.components.v1 as components


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
LOGO_PATH = next((path for path in LOGO_CANDIDATES if path.exists()), None)


def image_data_uri(path: Path | None) -> str:
    if path is None or not path.exists():
        return ""

    encoded = base64.b64encode(path.read_bytes()).decode("utf-8")
    suffix = path.suffix.lower().replace(".", "") or "png"
    return f"data:image/{suffix};base64,{encoded}"


LOGO_URI = image_data_uri(LOGO_PATH)

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
        --navy: #0B2239;
        --navy-2: #123B52;
        --blue: #3E78FF;
        --teal: #0AA7A2;
        --green: #17835F;
        --amber: #B86B0B;
        --red: #C44C4C;
        --ink: #152235;
        --muted: #667085;
        --surface: rgba(255, 255, 255, .94);
        --line: rgba(14, 43, 68, .09);
    }

    html, body, [class*="css"] {
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display",
                     "SF Pro Text", "Segoe UI", sans-serif;
    }

    .stApp {
        background:
            radial-gradient(circle at 8% 0%, rgba(62,120,255,.09), transparent 25%),
            radial-gradient(circle at 94% 8%, rgba(10,167,162,.08), transparent 23%),
            #F3F6FA;
        color: var(--ink);
    }

    .main .block-container {
        max-width: 1240px;
        padding-top: 1.8rem;
        padding-bottom: 5rem;
    }

    footer {visibility: hidden;}

    h1, h2, h3 {
        color: var(--ink);
        letter-spacing: -.025em;
    }

    .cp-hero {
        position: relative;
        overflow: hidden;
        padding: 34px 36px;
        border-radius: 30px;
        background:
            radial-gradient(circle at 88% 12%, rgba(255,255,255,.20), transparent 24%),
            linear-gradient(135deg, #081C31 0%, #0E3A53 58%, #087C80 120%);
        box-shadow: 0 24px 68px rgba(15,45,70,.18);
        margin-bottom: 22px;
    }

    .cp-hero-grid {
        display:grid;
        grid-template-columns:minmax(0,1fr) 250px;
        align-items:center;
        gap:26px;
        position:relative;
        z-index:1;
    }

    .cp-hero h1 {
        color:white;
        font-size:clamp(34px,5vw,55px);
        line-height:1.04;
        margin:0 0 10px 0;
    }

    .cp-hero p {
        color:rgba(255,255,255,.82);
        font-size:17px;
        line-height:1.65;
        max-width:720px;
        margin:0;
    }

    .cp-eyebrow {
        text-transform:uppercase;
        letter-spacing:.14em;
        color:rgba(255,255,255,.67);
        font-size:11px;
        font-weight:800;
        margin-bottom:9px;
    }

    .cp-logo {
        height:118px;
        border-radius:25px;
        background:white;
        display:flex;
        align-items:center;
        justify-content:center;
        overflow:hidden;
        box-shadow:0 18px 45px rgba(0,0,0,.16);
    }

    .cp-logo img {
        width:100%;
        height:100%;
        object-fit:contain;
        transform:scale(1.55);
        filter:contrast(1.12) saturate(1.10);
    }

    .cp-logo-fallback {font-size:52px;}

    .cp-badge {
        display:inline-flex;
        margin-top:17px;
        padding:7px 12px;
        border-radius:999px;
        background:rgba(255,255,255,.13);
        border:1px solid rgba(255,255,255,.16);
        color:white;
        font-size:12px;
        font-weight:800;
    }

    .cp-page-head {
        display:flex;
        justify-content:space-between;
        align-items:flex-start;
        gap:18px;
        padding:24px 26px;
        background:var(--surface);
        border:1px solid var(--line);
        border-radius:24px;
        box-shadow:0 14px 38px rgba(15,45,70,.06);
        margin-bottom:20px;
    }

    .cp-page-head h1 {margin:0 0 6px 0;font-size:33px;}
    .cp-page-head p {margin:0;color:var(--muted);line-height:1.55;}

    .cp-chip {
        display:inline-flex;
        align-items:center;
        border-radius:999px;
        padding:7px 11px;
        font-size:12px;
        font-weight:800;
        white-space:nowrap;
        background:#EDF3FF;
        color:#2F5FCC;
    }

    .cp-chip.green {background:#E9F7F1;color:#087451;}
    .cp-chip.amber {background:#FFF3DF;color:#9A5B06;}
    .cp-chip.gray {background:#F0F2F5;color:#667085;}
    .cp-chip.red {background:#FDECEC;color:#A43E3E;}

    .cp-card {
        background:var(--surface);
        border:1px solid var(--line);
        border-radius:23px;
        padding:22px;
        min-height:170px;
        box-shadow:0 12px 32px rgba(15,45,70,.055);
        transition:transform .20s ease, box-shadow .20s ease, border-color .20s ease;
    }

    .cp-card:hover {
        transform:translateY(-5px);
        box-shadow:0 22px 52px rgba(15,45,70,.11);
        border-color:rgba(62,120,255,.22);
    }

    .cp-card h3 {margin:10px 0 7px 0;font-size:21px;}
    .cp-card p {margin:0;color:var(--muted);line-height:1.55;font-size:14px;}
    .cp-icon {font-size:28px;}

    .cp-kpi {
        background:var(--surface);
        border:1px solid var(--line);
        border-radius:20px;
        padding:19px 20px;
        box-shadow:0 10px 28px rgba(15,45,70,.045);
        height:100%;
    }

    .cp-kpi-label {font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;}
    .cp-kpi-value {font-size:28px;font-weight:850;color:var(--ink);margin-top:6px;}
    .cp-kpi-note {font-size:12px;color:var(--muted);margin-top:4px;line-height:1.4;}

    .cp-priority {
        border-radius:26px;
        padding:28px;
        background:linear-gradient(135deg,#FFFFFF 0%,#F5F9FF 100%);
        border:1px solid rgba(62,120,255,.13);
        box-shadow:0 18px 46px rgba(15,45,70,.075);
        margin:18px 0 23px 0;
    }

    .cp-priority small {font-weight:800;color:#56708B;text-transform:uppercase;letter-spacing:.08em;}
    .cp-priority h2 {font-size:31px;margin:9px 0 7px 0;}
    .cp-priority p {margin:0;color:var(--muted);font-size:15px;line-height:1.6;}

    .cp-decision {
        border-radius:26px;
        padding:28px;
        background:linear-gradient(135deg,#0A263E,#0E6E73);
        color:white;
        box-shadow:0 22px 55px rgba(10,45,65,.18);
        margin:18px 0;
    }

    .cp-decision h2 {color:white;margin:8px 0;font-size:31px;}
    .cp-decision p {color:rgba(255,255,255,.78);margin:0;line-height:1.65;}
    .cp-decision small {color:rgba(255,255,255,.65);font-weight:800;text-transform:uppercase;letter-spacing:.08em;}

    .cp-plan-item {
        display:flex;
        gap:14px;
        align-items:flex-start;
        padding:17px 18px;
        border-radius:18px;
        background:rgba(255,255,255,.92);
        border:1px solid var(--line);
        margin-bottom:9px;
    }

    .cp-plan-dot {
        width:29px;height:29px;min-width:29px;
        display:flex;align-items:center;justify-content:center;
        border-radius:10px;background:#EAF1FF;color:#3267D7;font-weight:900;
    }

    .cp-plan-item strong {display:block;color:var(--ink);margin-bottom:3px;}
    .cp-plan-item span {color:var(--muted);font-size:13px;line-height:1.45;}

    .cp-stepper {
        display:grid;
        grid-template-columns:repeat(3,1fr);
        gap:10px;
        margin:5px 0 20px 0;
    }

    .cp-step {
        border-radius:16px;
        padding:12px 14px;
        background:#F0F3F7;
        color:#7B8795;
        font-size:12px;
        font-weight:800;
        border:1px solid transparent;
    }

    .cp-step.active {background:#EAF1FF;color:#2C61D1;border-color:rgba(62,120,255,.17);}
    .cp-step.done {background:#E9F7F1;color:#087451;}

    .cp-city-shell {
        background:linear-gradient(180deg,#EDF6FF 0%,#F8FBFD 100%);
        border:1px solid rgba(62,120,255,.10);
        border-radius:27px;
        padding:16px;
        box-shadow:0 14px 36px rgba(15,45,70,.055);
        overflow:hidden;
    }

    .cp-city-shell svg {width:100%;height:auto;display:block;}

    .cp-builder-panel {
        background:var(--surface);
        border:1px solid var(--line);
        border-radius:26px;
        padding:25px;
        box-shadow:0 15px 42px rgba(15,45,70,.06);
    }

    .cp-note {
        border-left:4px solid var(--blue);
        border-radius:0 15px 15px 0;
        background:#EEF4FF;
        color:#37557D;
        padding:12px 15px;
        font-size:13px;
        line-height:1.5;
    }

    .cp-empty {
        text-align:center;
        padding:35px 25px;
        border:1px dashed rgba(14,43,68,.18);
        border-radius:23px;
        background:rgba(255,255,255,.68);
    }

    .cp-empty h3 {margin:9px 0 6px 0;}
    .cp-empty p {margin:0;color:var(--muted);}

    div[data-testid="stButton"] button,
    div[data-testid="stDownloadButton"] button {
        border-radius:14px;
        min-height:44px;
        font-weight:750;
        border:1px solid rgba(14,43,68,.10);
        transition:transform .15s ease, box-shadow .15s ease;
    }

    div[data-testid="stButton"] button:hover,
    div[data-testid="stDownloadButton"] button:hover {
        transform:translateY(-1px);
        box-shadow:0 9px 24px rgba(15,45,70,.10);
    }

    div[data-testid="stForm"] {
        background:rgba(255,255,255,.86);
        border:1px solid var(--line);
        border-radius:22px;
        padding:21px;
    }

    @media (max-width: 760px) {
        .main .block-container {padding:1rem .75rem 4rem .75rem;}
        .cp-hero {padding:27px 22px;border-radius:24px;}
        .cp-hero-grid {grid-template-columns:1fr;}
        .cp-logo {height:100px;}
        .cp-page-head {padding:21px;border-radius:21px;}
        .cp-page-head h1 {font-size:28px;}
        .cp-stepper {grid-template-columns:1fr;}
        .cp-priority h2,.cp-decision h2 {font-size:26px;}
    }
    </style>
    """,
    unsafe_allow_html=True,
)


# ---------------------------------------------------------
# SESSION STATE
# ---------------------------------------------------------
DEFAULT_STATE = {
    "onboarding_done": False,
    "builder_step": 1,
    "builder_data": {
        "city_type": "Growing City",
        "city_name": "",
        "country": "",
        "population": 100000,
        "districts": 10,
        "goals": [],
        "challenges": [],
    },
    "active_systems": [],
    "system_focus": "",
    "city_check_result": None,
    "waste_step": 1,
    "waste_inputs": {
        "borough": "Bronx",
        "district": 1,
        "month_name": "January",
        "year": 2026,
        "last_month": 4000.0,
        "two_months": 3900.0,
    },
    "waste_result": None,
    "city_plan": [],
    "advisor_answer": "",
}

for key, value in DEFAULT_STATE.items():
    if key not in st.session_state:
        st.session_state[key] = deepcopy(value)


# ---------------------------------------------------------
# MODEL LOADING
# Only load model files that you created and trust.
# ---------------------------------------------------------
MODEL_FILES = {
    "Mobility": "transportation_bundle.joblib",
    "Energy": "energy_bundle.joblib",
    "Public Services": "governance_bundle.joblib",
    "Waste": "waste_bundle.joblib",
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

for module_name, file_name in MODEL_FILES.items():
    bundle, error = load_model_bundle(file_name)
    MODEL_BUNDLES[module_name] = bundle
    MODEL_ERRORS[module_name] = error

WASTE_BUNDLE = MODEL_BUNDLES.get("Waste")
WASTE_MODEL = WASTE_BUNDLE.get("model") if isinstance(WASTE_BUNDLE, dict) else None
WASTE_FEATURES = (
    WASTE_BUNDLE.get("feature_columns", [])
    if isinstance(WASTE_BUNDLE, dict)
    else []
)


# ---------------------------------------------------------
# SMALL HELPERS
# ---------------------------------------------------------
def logo_markup() -> str:
    if LOGO_URI:
        return f'<img src="{LOGO_URI}" alt="CityPulse AI logo">'
    return '<div class="cp-logo-fallback">🏙️</div>'


def hero(title: str, subtitle: str, badge: str = "Smart City Decision Support"):
    st.markdown(
        f"""
        <div class="cp-hero">
            <div class="cp-hero-grid">
                <div>
                    <div class="cp-eyebrow">CITYPULSE AI</div>
                    <h1>{html.escape(title)}</h1>
                    <p>{html.escape(subtitle)}</p>
                    <div class="cp-badge">● {html.escape(badge)}</div>
                </div>
                <div class="cp-logo">{logo_markup()}</div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def page_header(icon: str, title: str, subtitle: str, chip: str = "", chip_class: str = ""):
    chip_html = (
        f'<span class="cp-chip {chip_class}">{html.escape(chip)}</span>'
        if chip
        else ""
    )

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


def kpi_card(label: str, value: str, note: str = ""):
    st.markdown(
        f"""
        <div class="cp-kpi">
            <div class="cp-kpi-label">{html.escape(label)}</div>
            <div class="cp-kpi-value">{html.escape(value)}</div>
            <div class="cp-kpi-note">{html.escape(note)}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def module_card(icon: str, title: str, text: str, status: str, status_class: str = "gray"):
    st.markdown(
        f"""
        <div class="cp-card">
            <div class="cp-icon">{icon}</div>
            <h3>{html.escape(title)}</h3>
            <p>{html.escape(text)}</p>
            <div style="margin-top:16px;"><span class="cp-chip {status_class}">{html.escape(status)}</span></div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def plan_item(number: str, title: str, text: str):
    st.markdown(
        f"""
        <div class="cp-plan-item">
            <div class="cp-plan-dot">{html.escape(number)}</div>
            <div>
                <strong>{html.escape(title)}</strong>
                <span>{html.escape(text)}</span>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def stepper(current_step: int):
    names = ["Select Area", "Add Recent Data", "Review Forecast"]
    cards = []

    for index, name in enumerate(names, start=1):
        if index < current_step:
            state = "done"
            marker = "✓"
        elif index == current_step:
            state = "active"
            marker = str(index)
        else:
            state = ""
            marker = str(index)

        cards.append(
            f'<div class="cp-step {state}">{marker} &nbsp; {html.escape(name)}</div>'
        )

    st.markdown(
        '<div class="cp-stepper">' + "".join(cards) + "</div>",
        unsafe_allow_html=True,
    )


def segmented(label: str, options: list[str], default: str, key: str):
    if hasattr(st, "segmented_control"):
        result = st.segmented_control(
            label,
            options,
            default=default,
            key=key,
        )
        return result or default

    return st.radio(label, options, index=options.index(default), horizontal=True, key=key)


def multi_choice(label: str, options: list[str], default: list[str], key: str):
    if hasattr(st, "pills"):
        result = st.pills(
            label,
            options,
            default=default,
            selection_mode="multi",
            key=key,
        )
        return result or []

    return st.multiselect(label, options, default=default, key=key)


def readiness_score() -> int:
    score = 0

    if st.session_state.onboarding_done:
        score += 30

    score += min(len(st.session_state.active_systems), 4) * 10

    if st.session_state.waste_result:
        score += 15

    if st.session_state.city_check_result:
        score += 15

    return min(score, 100)


def add_system(system_name: str):
    if system_name not in st.session_state.active_systems:
        st.session_state.active_systems.append(system_name)


def add_plan_task(phase: str, title: str, detail: str):
    exists = any(
        item["title"] == title
        for item in st.session_state.city_plan
    )

    if not exists:
        st.session_state.city_plan.append(
            {
                "id": f"task_{len(st.session_state.city_plan) + 1}",
                "phase": phase,
                "title": title,
                "detail": detail,
                "done": False,
                "note": "",
            }
        )


def model_connected(system_name: str) -> bool:
    return isinstance(MODEL_BUNDLES.get(system_name), dict)


# ---------------------------------------------------------
# INTERACTIVE CITY VISUAL
# ---------------------------------------------------------
def city_visual(active_systems: list[str], city_type: str, readiness: int):
    mobility = "#3E78FF" if "Mobility" in active_systems else "#C8D2DC"
    energy = "#F3B43B" if "Energy" in active_systems else "#C8D2DC"
    services = "#8B65D6" if "Public Services" in active_systems else "#C8D2DC"
    waste = "#20A46B" if "Waste" in active_systems else "#C8D2DC"

    city_label = html.escape(city_type)

    city_html = f"""
    <!doctype html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            * {{ box-sizing: border-box; }}
            html, body {{
                margin: 0;
                padding: 0;
                background: transparent;
                overflow: hidden;
                font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display",
                             "SF Pro Text", "Segoe UI", sans-serif;
            }}
            .city-shell {{
                width: 100%;
                padding: 14px;
                border-radius: 27px;
                background: linear-gradient(180deg, #EDF6FF 0%, #F8FBFD 100%);
                border: 1px solid rgba(62,120,255,.10);
                box-shadow: 0 14px 36px rgba(15,45,70,.055);
                overflow: hidden;
            }}
            svg {{
                display: block;
                width: 100%;
                height: auto;
            }}
        </style>
    </head>
    <body>
        <div class="city-shell">
            <svg viewBox="0 0 760 330" role="img" aria-label="Interactive city illustration">
                <defs>
                    <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stop-color="#E9F4FF"/>
                        <stop offset="100%" stop-color="#F9FCFE"/>
                    </linearGradient>
                    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#18364D" flood-opacity="0.12"/>
                    </filter>
                </defs>

                <rect x="0" y="0" width="760" height="330" rx="24" fill="url(#sky)"/>
                <circle cx="660" cy="60" r="33" fill="#FFD66B" opacity=".78"/>
                <path d="M0 245 C120 220, 200 252, 320 232 S560 245,760 220 L760 330 L0 330 Z" fill="#DDEBE5"/>

                <g filter="url(#shadow)">
                    <rect x="72" y="132" width="72" height="105" rx="8" fill="#FFFFFF"/>
                    <rect x="91" y="151" width="13" height="13" rx="3" fill="{energy}" opacity=".80"/>
                    <rect x="113" y="151" width="13" height="13" rx="3" fill="{energy}" opacity=".80"/>
                    <rect x="91" y="177" width="13" height="13" rx="3" fill="{energy}" opacity=".80"/>
                    <rect x="113" y="177" width="13" height="13" rx="3" fill="{energy}" opacity=".80"/>

                    <rect x="164" y="94" width="93" height="143" rx="10" fill="#FFFFFF"/>
                    <rect x="188" y="119" width="16" height="16" rx="3" fill="{energy}" opacity=".80"/>
                    <rect x="216" y="119" width="16" height="16" rx="3" fill="{energy}" opacity=".80"/>
                    <rect x="188" y="150" width="16" height="16" rx="3" fill="{energy}" opacity=".80"/>
                    <rect x="216" y="150" width="16" height="16" rx="3" fill="{energy}" opacity=".80"/>

                    <rect x="490" y="117" width="88" height="120" rx="10" fill="#FFFFFF"/>
                    <circle cx="534" cy="151" r="16" fill="{services}" opacity=".88"/>
                    <rect x="512" y="177" width="44" height="10" rx="5" fill="{services}" opacity=".55"/>

                    <rect x="606" y="154" width="75" height="83" rx="10" fill="#FFFFFF"/>
                    <path d="M627 181 h32 v30 h-32z" fill="{waste}" opacity=".75"/>
                    <path d="M632 174 h22" stroke="{waste}" stroke-width="7" stroke-linecap="round"/>
                </g>

                <path d="M20 270 C180 244,260 292,402 260 S620 275,740 252" fill="none" stroke="{mobility}" stroke-width="18" stroke-linecap="round" opacity=".82"/>
                <path d="M20 270 C180 244,260 292,402 260 S620 275,740 252" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="12 11" opacity=".80"/>

                <g>
                    <circle cx="315" cy="259" r="21" fill="{mobility}"/>
                    <circle cx="315" cy="259" r="7" fill="#FFFFFF"/>
                    <circle cx="430" cy="253" r="19" fill="{services}"/>
                    <path d="M430 244 v18 M421 253 h18" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>
                    <circle cx="590" cy="265" r="18" fill="{waste}"/>
                    <path d="M582 265 l6 6 11-14" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
                </g>

                <rect x="28" y="24" width="210" height="52" rx="17" fill="#FFFFFF" opacity=".92"/>
                <text x="47" y="47" fill="#163149" font-size="15" font-family="sans-serif" font-weight="700">{city_label}</text>
                <text x="47" y="66" fill="#6B7D8E" font-size="12" font-family="sans-serif">Readiness {readiness}%</text>

                <g font-family="sans-serif" font-size="11" font-weight="700">
                    <circle cx="350" cy="43" r="6" fill="{mobility}"/><text x="362" y="47" fill="#536779">Mobility</text>
                    <circle cx="444" cy="43" r="6" fill="{energy}"/><text x="456" y="47" fill="#536779">Energy</text>
                    <circle cx="527" cy="43" r="6" fill="{services}"/><text x="539" y="47" fill="#536779">Services</text>
                    <circle cx="628" cy="43" r="6" fill="{waste}"/><text x="640" y="47" fill="#536779">Waste</text>
                </g>
            </svg>
        </div>
    </body>
    </html>
    """

    components.html(city_html, height=390, scrolling=False)


# ---------------------------------------------------------
# WASTE MODEL
# ---------------------------------------------------------
def prepare_waste_input(
    borough: str,
    district: int,
    year: int,
    month_number: int,
    last_month: float,
    two_months: float,
) -> pd.DataFrame:
    if not WASTE_FEATURES:
        raise ValueError("The saved waste bundle does not contain feature_columns.")

    row = {feature: 0 for feature in WASTE_FEATURES}

    numeric_values = {
        "year": year,
        "month_number": month_number,
        "waste_last_month": last_month,
        "waste_2_months_ago": two_months,
    }

    for feature in WASTE_FEATURES:
        feature_name = str(feature)

        if feature_name in numeric_values:
            row[feature] = numeric_values[feature_name]

        if feature_name == f"borough_{borough}":
            row[feature] = 1

        district_names = {
            f"communitydistrict_{district}",
            f"communitydistrict_{float(district)}",
            f"communitydistrict_{str(district)}",
        }

        if feature_name in district_names:
            row[feature] = 1

    return pd.DataFrame([row], columns=WASTE_FEATURES)


def run_waste_prediction(
    borough: str,
    district: int,
    year: int,
    month_number: int,
    last_month: float,
    two_months: float,
) -> dict:
    if WASTE_MODEL is None:
        raise ValueError("Waste model is not available.")

    prepared = prepare_waste_input(
        borough=borough,
        district=district,
        year=year,
        month_number=month_number,
        last_month=last_month,
        two_months=two_months,
    )

    prediction = float(WASTE_MODEL.predict(prepared)[0])
    difference = prediction - last_month
    change_percent = (difference / last_month * 100) if last_month else 0.0

    if change_percent >= 10:
        priority = "High"
        status = "Prepare for higher demand"
        headline = "Collection demand is expected to rise noticeably."
        summary = "Review collection capacity before the forecast month begins."
        decision = "Prepare additional operational capacity."
        actions = [
            ("Review collection capacity", "Check whether the current plan can absorb the expected increase."),
            ("Confirm workforce coverage", "Review team availability for the selected district."),
            ("Monitor the first cycle", "Compare actual volume with the forecast and adjust quickly."),
        ]
    elif change_percent >= 5:
        priority = "Medium"
        status = "Needs attention"
        headline = "Waste demand may increase moderately."
        summary = "The current plan may need a small operational buffer."
        decision = "Keep backup capacity available."
        actions = [
            ("Review the schedule", "Check collection timing for the selected district."),
            ("Prepare a small buffer", "Keep limited additional capacity available."),
            ("Update the forecast", "Run the assessment again when new monthly data is available."),
        ]
    elif change_percent <= -10:
        priority = "Low"
        status = "Lower demand expected"
        headline = "Waste demand is expected to decrease."
        summary = "The city may optimize resources while keeping service quality stable."
        decision = "Maintain service quality and review resource efficiency."
        actions = [
            ("Keep essential coverage", "Do not reduce service based on one forecast alone."),
            ("Review resource use", "Check whether some capacity can support another nearby area."),
            ("Confirm with actual data", "Compare the forecast with the first collection cycle."),
        ]
    else:
        priority = "Low"
        status = "Stable outlook"
        headline = "Current collection capacity appears sufficient."
        summary = "The expected waste level is close to last month with no urgent expansion indicated."
        decision = "Keep the current collection plan."
        actions = [
            ("Maintain the current schedule", "Continue normal collection for the district."),
            ("Watch for local events", "Adjust only if events or disruptions change demand."),
            ("Review next month", "Use the next actual value for the following forecast."),
        ]

    return {
        "module": "Waste",
        "borough": borough,
        "district": int(district),
        "year": int(year),
        "month": int(month_number),
        "month_name": calendar.month_name[int(month_number)],
        "prediction": prediction,
        "difference": difference,
        "change_percent": change_percent,
        "last_month": float(last_month),
        "two_months": float(two_months),
        "priority": priority,
        "status": status,
        "headline": headline,
        "summary": summary,
        "decision": decision,
        "actions": actions,
        "model_name": WASTE_BUNDLE.get("model_name", "Waste Forecast Model"),
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
    }


def waste_chart(result: dict):
    figure = go.Figure()
    figure.add_trace(
        go.Bar(
            x=["Two months ago", "Last month", "Forecast"],
            y=[result["two_months"], result["last_month"], result["prediction"]],
            text=[
                f'{result["two_months"]:,.0f}',
                f'{result["last_month"]:,.0f}',
                f'{result["prediction"]:,.0f}',
            ],
            textposition="outside",
            marker_color=["#B8C5D1", "#6F8EA8", "#0AA7A2"],
            hovertemplate="%{x}<br>%{y:,.0f} tons<extra></extra>",
        )
    )
    figure.update_layout(
        height=330,
        margin=dict(l=20, r=20, t=30, b=20),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        yaxis_title="Waste tons",
        showlegend=False,
    )
    st.plotly_chart(figure, use_container_width=True, config={"displayModeBar": False})


# ---------------------------------------------------------
# CITY CHECK AND ADVISOR
# ---------------------------------------------------------
def build_city_check(scenario: str) -> dict:
    active = st.session_state.active_systems
    waste = st.session_state.waste_result

    if not active:
        raise ValueError("Activate at least one city system first.")

    main_priority = "Complete the first connected assessment"
    summary = "The city has active systems, but more operational information is needed before setting a strong priority."
    decision = "Open one active system and complete its first assessment."
    strongest = active[0]

    if waste:
        strongest = "Waste Planning" if waste["priority"] == "Low" else "City Profile"
        main_priority = "Waste Management" if waste["priority"] in ["Medium", "High"] else "No urgent waste pressure"
        summary = waste["headline"]
        decision = waste["decision"]

    if scenario == "Higher Demand" and waste:
        main_priority = "Prepare for demand pressure"
        summary = "Higher demand may reduce the operational buffer in the selected district."
        decision = "Review collection capacity and keep backup resources available."
    elif scenario == "Limited Workforce":
        main_priority = "Workforce capacity"
        summary = "Limited workforce can increase pressure across active city systems."
        decision = "Protect essential services and prioritize the most time-sensitive actions."
    elif scenario == "Limited Budget":
        main_priority = "Quick-win initiatives"
        summary = "A limited budget requires the city to start with low-effort actions that use existing capacity."
        decision = "Prioritize one quick win and delay non-essential expansion."
    elif scenario == "Rapid Population Growth":
        main_priority = "Capacity planning"
        summary = "Rapid growth may increase demand before city systems are fully prepared."
        decision = "Update demand assumptions and review district-level capacity."

    inactive = [
        system
        for system in ["Mobility", "Energy", "Public Services", "Waste"]
        if system not in active
    ]
    missing = inactive[0] if inactive else "No major system missing"

    return {
        "scenario": scenario,
        "main_priority": main_priority,
        "summary": summary,
        "decision": decision,
        "strongest": strongest,
        "missing": missing,
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
    }


def advisor_response(question: str) -> str:
    city = st.session_state.builder_data.get("city_name") or "the city"
    check = st.session_state.city_check_result
    waste = st.session_state.waste_result
    active = st.session_state.active_systems
    question_lower = question.lower()

    if "30" in question_lower or "plan" in question_lower:
        first = check["decision"] if check else "Activate one city system and complete its first assessment."
        second = f"Add basic information for {check['missing']}." if check and check["missing"] != "No major system missing" else "Review the latest system result with the responsible department."
        return (
            f"A simple 30-day plan for {city}:\n\n"
            f"1. {first}\n"
            f"2. {second}\n"
            "3. Assign one owner to each open action and review progress at the end of the month."
        )

    if "missing" in question_lower or "information" in question_lower:
        if check:
            return f"The main missing requirement is {check['missing']}. Add only the basic information needed for that system before the next City Check."
        return "Activate at least one city system first. CityPulse will then identify the most important missing information."

    if "waste" in question_lower and waste:
        return (
            f"The waste forecast for {waste['borough']} District {waste['district']} is "
            f"{waste['prediction']:,.0f} tons. {waste['headline']} "
            f"The recommended decision is: {waste['decision']}"
        )

    if "why" in question_lower and check:
        return f"This is the main priority because {check['summary'].lower()} The recommendation is based on the current city profile, activated systems, and the selected planning scenario."

    if "next" in question_lower or "priority" in question_lower:
        if check:
            return f"The next priority for {city} is {check['main_priority']}. Recommended decision: {check['decision']}"
        return "Activate one city system and run the first City Check. This will give the city one clear priority and one recommended next decision."

    if active:
        active_text = ", ".join(active)
        return f"{city} currently has these active systems: {active_text}. Run a City Check to identify the main priority, or open Waste Planning to create the first real model forecast."

    return "Start by activating one city system. CityPulse will keep the experience simple and show only the next useful decision."


# ---------------------------------------------------------
# DIALOGS
# ---------------------------------------------------------
@st.dialog("Run City Check")
def city_check_dialog():
    st.write("Choose one planning condition. CityPulse will review the active systems and return one clear priority.")

    scenario = segmented(
        "Planning condition",
        ["Current Conditions", "Higher Demand", "Limited Workforce", "Limited Budget", "Rapid Population Growth"],
        "Current Conditions",
        "city_check_scenario",
    )

    if st.button("Run City Check", type="primary", use_container_width=True):
        try:
            with st.status("Checking the city...", expanded=True) as status:
                status.write("Reviewing the city profile")
                time.sleep(.25)
                status.write("Checking active systems")
                time.sleep(.25)
                status.write("Finding the main priority")
                time.sleep(.25)
                status.write("Preparing the city plan")
                result = build_city_check(scenario)
                status.update(label="City Check complete", state="complete")

            st.session_state.city_check_result = result
            add_plan_task("Now", result["main_priority"], result["decision"])

            if result["missing"] != "No major system missing":
                add_plan_task("Next", f"Activate {result['missing']}", "Add only the basic information needed for this city system.")

            st.toast("City Check completed", icon="✅")
            st.rerun()

        except Exception as error:
            st.error(str(error))


@st.dialog("Ask CityPulse")
def advisor_dialog(context: str = ""):
    st.caption("CityPulse uses the current city profile, active systems, and saved results.")

    questions = [
        "What should the city do next?",
        "Why is this the main priority?",
        "Create a simple 30-day plan",
        "What information is missing?",
    ]

    if st.session_state.waste_result:
        questions.append("Explain the waste result simply")

    for question in questions:
        if st.button(question, use_container_width=True, key=f"advisor_{question}_{context}"):
            st.session_state.advisor_answer = advisor_response(question)

    custom = st.text_input("Or ask your own question", key=f"advisor_custom_{context}")

    if st.button("Ask", type="primary", use_container_width=True, key=f"advisor_send_{context}"):
        if custom.strip():
            st.session_state.advisor_answer = advisor_response(custom)

    if st.session_state.advisor_answer:
        st.info(st.session_state.advisor_answer)


# ---------------------------------------------------------
# CITY BUILDER
# ---------------------------------------------------------
def builder_page():
    hero(
        "Build a smarter city, one clear step at a time.",
        "Create a simple city profile, activate the systems you need, and let CityPulse turn the information into a practical city plan.",
        badge="Guided City Builder",
    )

    step = st.session_state.builder_step
    progress = int(step / 3 * 100)

    st.progress(progress, text=f"City Builder · Step {step} of 3")

    left, right = st.columns([1.12, .88], gap="large")

    with right:
        city_visual([], st.session_state.builder_data.get("city_type", "Growing City"), min(progress, 30))

    with left:
        st.markdown('<div class="cp-builder-panel">', unsafe_allow_html=True)

        if step == 1:
            st.subheader("1. Your City")
            st.write("Start with only the information needed to create the city workspace.")

            with st.form("builder_city_form"):
                city_type = segmented(
                    "City type",
                    ["Growing City", "Coastal City", "Dense City", "Tourism City", "Industrial City"],
                    st.session_state.builder_data.get("city_type", "Growing City"),
                    "builder_city_type",
                )

                city_name = st.text_input(
                    "City name",
                    value=st.session_state.builder_data.get("city_name", ""),
                    placeholder="Jeddah",
                )

                country = st.text_input(
                    "Country",
                    value=st.session_state.builder_data.get("country", ""),
                    placeholder="Saudi Arabia",
                )

                col1, col2 = st.columns(2)
                population = col1.number_input(
                    "Population",
                    min_value=0,
                    value=int(st.session_state.builder_data.get("population", 100000)),
                    step=1000,
                )
                districts = col2.number_input(
                    "Districts",
                    min_value=1,
                    value=int(st.session_state.builder_data.get("districts", 10)),
                    step=1,
                )

                continue_button = st.form_submit_button("Continue", type="primary", use_container_width=True)

            if continue_button:
                if not city_name.strip() or not country.strip():
                    st.error("Please enter the city name and country.")
                else:
                    st.session_state.builder_data.update(
                        {
                            "city_type": city_type,
                            "city_name": city_name.strip(),
                            "country": country.strip(),
                            "population": int(population),
                            "districts": int(districts),
                        }
                    )
                    st.session_state.builder_step = 2
                    st.rerun()

        elif step == 2:
            st.subheader("2. What Matters Most?")
            st.write("Choose only the goals and challenges that matter most now.")

            goals = multi_choice(
                "Main goals",
                ["Better Mobility", "Lower Energy Use", "Faster Public Services", "Cleaner Districts", "Better Quality of Life"],
                st.session_state.builder_data.get("goals", []),
                "builder_goals",
            )

            challenges = multi_choice(
                "Main challenges",
                ["Traffic and road risk", "High energy demand", "Slow public services", "Waste collection pressure", "Missing city data"],
                st.session_state.builder_data.get("challenges", []),
                "builder_challenges",
            )

            st.markdown('<div class="cp-note">Choose two or three items. More details can be added later only when a city system needs them.</div>', unsafe_allow_html=True)
            st.write("")

            col1, col2 = st.columns(2)

            if col1.button("Back", use_container_width=True):
                st.session_state.builder_step = 1
                st.rerun()

            if col2.button("Review City", type="primary", use_container_width=True):
                st.session_state.builder_data["goals"] = goals
                st.session_state.builder_data["challenges"] = challenges
                st.session_state.builder_step = 3
                st.rerun()

        else:
            data = st.session_state.builder_data
            st.subheader("3. Your City Is Ready")
            st.write("Review the simple foundation before opening the city workspace.")

            col1, col2 = st.columns(2)
            col1.metric("City", data.get("city_name", "—"))
            col2.metric("City Type", data.get("city_type", "—"))
            col1.metric("Population", f'{data.get("population", 0):,}')
            col2.metric("Districts", data.get("districts", 0))

            if data.get("goals"):
                st.write("**Main goals:** " + " · ".join(data["goals"]))

            if data.get("challenges"):
                st.write("**Main challenges:** " + " · ".join(data["challenges"]))

            col1, col2 = st.columns(2)

            if col1.button("Back", use_container_width=True):
                st.session_state.builder_step = 2
                st.rerun()

            if col2.button("Create My City", type="primary", use_container_width=True):
                st.session_state.onboarding_done = True
                add_plan_task("Now", "Activate the first city system", "Start with the system that has available information or a connected model.")
                st.toast("City workspace created", icon="🏙️")
                st.rerun()

        st.markdown("</div>", unsafe_allow_html=True)


# ---------------------------------------------------------
# HOME / COMMAND CENTER
# ---------------------------------------------------------
def home_page():
    city = st.session_state.builder_data
    check = st.session_state.city_check_result
    readiness = readiness_score()

    hero(
        f'{city.get("city_name", "Your City")} Command Center',
        "See one clear city priority, open the systems you need, and keep the next actions simple.",
        badge="City workspace active",
    )

    action1, action2, action3 = st.columns(3)

    if action1.button("🏙️ Run City Check", type="primary", use_container_width=True):
        city_check_dialog()

    if action2.button("✨ Ask CityPulse", use_container_width=True):
        advisor_dialog("home")

    if action3.button("📄 Create Report", use_container_width=True):
        st.switch_page(report_page_link)

    st.write("")

    visual_col, summary_col = st.columns([1.25, .75], gap="large")

    with visual_col:
        city_visual(st.session_state.active_systems, city.get("city_type", "Growing City"), readiness)

    with summary_col:
        st.subheader("City Snapshot")
        st.progress(readiness, text=f"City Readiness · {readiness}%")

        kpi_card("Active Systems", f'{len(st.session_state.active_systems)} of 4', "Only activate systems the city wants to assess.")
        st.write("")
        kpi_card("Completed Assessments", "1" if st.session_state.waste_result else "0", "Waste is currently the connected model.")

    if check:
        priority_title = check["main_priority"]
        priority_text = check["summary"]
        decision = check["decision"]
    else:
        priority_title = "Complete the first City Check"
        priority_text = "Activate at least one city system, then CityPulse will identify one clear priority."
        decision = "Open City Systems and start with Waste Planning if the model is connected."

    st.markdown(
        f"""
        <div class="cp-priority">
            <small>What should the city focus on now?</small>
            <h2>{html.escape(priority_title)}</h2>
            <p>{html.escape(priority_text)}</p>
            <p style="margin-top:12px;"><strong>Recommended decision:</strong> {html.escape(decision)}</p>
        </div>
        """,
        unsafe_allow_html=True,
    )

    st.subheader("Smart City Workspaces")
    system_columns = st.columns(4)

    systems = [
        ("Mobility", "🚦", "Understand transport risk and mobility pressure."),
        ("Energy", "⚡", "Prepare buildings for changing energy demand."),
        ("Public Services", "🏛️", "Find services that may need earlier attention."),
        ("Waste", "♻️", "Forecast district waste and prepare collection resources."),
    ]

    for column, (name, icon, description) in zip(system_columns, systems):
        active = name in st.session_state.active_systems
        connected = model_connected(name)
        status = "Active" if active else "Not Started"
        status_class = "green" if active else "gray"

        with column:
            module_card(icon, name, description, status, status_class)

            button_label = "Open Workspace" if active else "Open System"
            if st.button(button_label, use_container_width=True, key=f"home_open_{name}"):
                st.session_state.system_focus = name
                st.switch_page(systems_page_link)

            if connected:
                st.caption("Real model connected")
            else:
                st.caption("Demo setup available")

    st.write("")
    st.subheader("Your City Plan")

    open_tasks = [task for task in st.session_state.city_plan if not task["done"]][:3]

    if not open_tasks:
        st.info("Run the first City Check to create a simple city plan.")
    else:
        for index, task in enumerate(open_tasks, start=1):
            plan_item(str(index), task["title"], task["detail"])

        if st.button("Open Full City Plan"):
            st.switch_page(plan_page_link)


# ---------------------------------------------------------
# CITY SYSTEMS
# ---------------------------------------------------------
def systems_page():
    page_header(
        "◉",
        "City Systems",
        "Activate only the systems the city needs. Each system asks for basic information only when required.",
        chip=f"{len(st.session_state.active_systems)} active",
        chip_class="green" if st.session_state.active_systems else "gray",
    )

    if st.session_state.system_focus == "Waste":
        waste_workspace()
        return

    if st.session_state.system_focus in ["Mobility", "Energy", "Public Services"]:
        simple_system_workspace(st.session_state.system_focus)
        return

    city_visual(
        st.session_state.active_systems,
        st.session_state.builder_data.get("city_type", "Growing City"),
        readiness_score(),
    )

    st.write("")
    system_data = [
        ("Mobility", "🚦", "Mobility and Transportation", "Understand transport pressure and road-risk conditions."),
        ("Energy", "⚡", "Energy and Buildings", "Prepare for building energy-demand patterns."),
        ("Public Services", "🏛️", "Public Services", "Identify requests that may need earlier attention."),
        ("Waste", "♻️", "Waste Planning", "Forecast monthly district waste using the connected model."),
    ]

    for row_start in range(0, 4, 2):
        columns = st.columns(2, gap="large")

        for column, item in zip(columns, system_data[row_start:row_start + 2]):
            name, icon, title, description = item
            active = name in st.session_state.active_systems
            connected = model_connected(name)

            with column:
                status = "Active" if active else "Ready to Activate"
                status_class = "green" if active else "gray"
                module_card(icon, title, description, status, status_class)

                col1, col2 = st.columns(2)

                if not active:
                    if col1.button("Activate", type="primary", use_container_width=True, key=f"activate_{name}"):
                        add_system(name)
                        st.toast(f"{name} system activated", icon="✅")
                        st.rerun()
                else:
                    col1.success("System active")

                if col2.button("Open", use_container_width=True, key=f"open_{name}"):
                    st.session_state.system_focus = name
                    st.rerun()

                if connected:
                    st.caption("Real model connected")
                else:
                    st.caption("Demo intelligence until the model is connected")

        st.write("")


def simple_system_workspace(system_name: str):
    system_info = {
        "Mobility": ("🚦", "Mobility and Transportation", "The transportation model will identify periods and conditions with higher urban risk."),
        "Energy": ("⚡", "Energy and Buildings", "The energy model will forecast building electricity consumption and high-demand periods."),
        "Public Services": ("🏛️", "Public Services", "The services model will identify requests that may need earlier attention."),
    }

    icon, title, description = system_info[system_name]

    if st.button("← Back to City Systems"):
        st.session_state.system_focus = ""
        st.rerun()

    page_header(icon, title, description, chip="Demo Setup", chip_class="amber")

    if system_name not in st.session_state.active_systems:
        if st.button(f"Activate {system_name}", type="primary"):
            add_system(system_name)
            st.rerun()

    st.markdown(
        """
        <div class="cp-empty">
            <div style="font-size:42px;">🔗</div>
            <h3>This workspace is prepared for the next model.</h3>
            <p>The city can activate the system now. Real assessments will appear after its model bundle is added.</p>
        </div>
        """,
        unsafe_allow_html=True,
    )

    st.write("")
    st.subheader("What CityPulse will show")
    plan_item("1", "What may happen", "A simple forecast or risk result for the selected system.")
    plan_item("2", "Why it matters", "A stakeholder-friendly explanation without technical model language.")
    plan_item("3", "What the city should do", "One recommended decision and a small set of next actions.")


# ---------------------------------------------------------
# WASTE WORKSPACE
# ---------------------------------------------------------
def waste_workspace():
    if st.button("← Back to City Systems"):
        st.session_state.system_focus = ""
        st.rerun()

    model_status = "Model Connected" if WASTE_MODEL is not None else "Model Missing"
    model_class = "green" if WASTE_MODEL is not None else "red"

    page_header(
        "♻️",
        "Waste Planning",
        "Create a monthly district forecast and turn it into one clear collection decision.",
        chip=model_status,
        chip_class=model_class,
    )

    if WASTE_MODEL is None:
        st.error("The waste model could not be loaded.")
        if MODEL_ERRORS.get("Waste"):
            with st.expander("Show technical error"):
                st.code(MODEL_ERRORS["Waste"])
        return

    add_system("Waste")
    step = st.session_state.waste_step
    stepper(step)

    inputs = st.session_state.waste_inputs

    if step == 1:
        st.subheader("Select the planning area")

        with st.form("waste_area_form"):
            col1, col2 = st.columns(2)

            borough = col1.selectbox(
                "Borough",
                ["Bronx", "Brooklyn", "Manhattan", "Queens", "Staten Island"],
                index=["Bronx", "Brooklyn", "Manhattan", "Queens", "Staten Island"].index(inputs["borough"]),
            )
            district = col2.number_input("Community District", min_value=1, max_value=20, value=int(inputs["district"]), step=1)

            month_names = list(calendar.month_name)[1:]
            month_name = col1.selectbox("Forecast Month", month_names, index=month_names.index(inputs["month_name"]))
            year = col2.number_input("Year", min_value=2000, max_value=2035, value=int(inputs["year"]), step=1)

            continue_button = st.form_submit_button("Continue", type="primary", use_container_width=True)

        if continue_button:
            st.session_state.waste_inputs.update(
                {
                    "borough": borough,
                    "district": int(district),
                    "month_name": month_name,
                    "year": int(year),
                }
            )
            st.session_state.waste_step = 2
            st.rerun()

    elif step == 2:
        st.subheader("Add recent waste levels")
        st.caption("Only two recent values are needed because the model uses the previous months to forecast the next one.")

        with st.form("waste_data_form"):
            col1, col2 = st.columns(2)
            two_months = col1.number_input("Waste two months ago", min_value=0.0, value=float(inputs["two_months"]), step=100.0)
            last_month = col2.number_input("Waste last month", min_value=0.0, value=float(inputs["last_month"]), step=100.0)

            run_button = st.form_submit_button("Create Waste Plan", type="primary", use_container_width=True)

        col1, _ = st.columns([.3, .7])
        if col1.button("Back"):
            st.session_state.waste_step = 1
            st.rerun()

        if run_button:
            try:
                with st.status("Preparing the waste plan...", expanded=True) as status:
                    status.write("Checking the district information")
                    time.sleep(.25)
                    status.write("Running the connected waste model")
                    time.sleep(.25)
                    status.write("Creating the planning recommendation")

                    month_number = list(calendar.month_name).index(inputs["month_name"])
                    result = run_waste_prediction(
                        borough=inputs["borough"],
                        district=int(inputs["district"]),
                        year=int(inputs["year"]),
                        month_number=month_number,
                        last_month=float(last_month),
                        two_months=float(two_months),
                    )
                    status.update(label="Waste plan ready", state="complete")

                st.session_state.waste_inputs["last_month"] = float(last_month)
                st.session_state.waste_inputs["two_months"] = float(two_months)
                st.session_state.waste_result = result
                st.session_state.waste_step = 3

                add_plan_task("Now", result["decision"], result["summary"])
                add_plan_task("Next", "Review the first collection cycle", "Compare the actual district volume with the forecast.")

                st.toast("Waste plan created", icon="✅")
                st.rerun()

            except Exception as error:
                st.error("The forecast could not be completed.")
                with st.expander("Show technical error"):
                    st.code(str(error))

    else:
        result = st.session_state.waste_result

        if not result:
            st.session_state.waste_step = 1
            st.rerun()

        st.markdown(
            f"""
            <div class="cp-decision">
                <small>Recommended city decision</small>
                <h2>{html.escape(result['headline'])}</h2>
                <p>{html.escape(result['decision'])}</p>
            </div>
            """,
            unsafe_allow_html=True,
        )

        col1, col2, col3, col4 = st.columns(4)
        with col1:
            kpi_card("Forecast", f'{result["prediction"]:,.0f} tons', f'{result["month_name"]} {result["year"]}')
        with col2:
            kpi_card("Expected Change", f'{result["change_percent"]:+.1f}%', "Compared with last month")
        with col3:
            kpi_card("Priority", result["priority"], result["status"])
        with col4:
            kpi_card("Area", f'{result["borough"]} {result["district"]}', "Selected district")

        st.write("")
        left, right = st.columns([1.1, .9], gap="large")

        with left:
            st.subheader("Recommended Next Actions")
            for index, (title, detail) in enumerate(result["actions"], start=1):
                plan_item(str(index), title, detail)

        with right:
            st.subheader("Recent Waste and Forecast")
            waste_chart(result)

        st.subheader("Test a Simple Planning Scenario")
        st.caption("This is a planning simulation, not a new machine-learning forecast.")

        col1, col2 = st.columns(2)
        increase = col1.slider("Possible demand increase", 0, 25, 8, 1, format="%d%%")
        capacity = segmented("Current operational capacity", ["Limited", "Normal", "Extra capacity"], "Normal", "waste_capacity")

        adjusted = result["prediction"] * (1 + increase / 100)

        if capacity == "Limited" and increase >= 8:
            scenario_message = "Additional resources may be needed."
        elif capacity == "Extra capacity":
            scenario_message = "Current capacity appears sufficient."
        elif increase >= 15:
            scenario_message = "Keep a small operational buffer available."
        else:
            scenario_message = "The current plan remains reasonable."

        st.info(f"Scenario volume: {adjusted:,.0f} tons. {scenario_message}")

        action1, action2, action3 = st.columns(3)

        if action1.button("Add Actions to City Plan", type="primary", use_container_width=True):
            for title, detail in result["actions"]:
                add_plan_task("Now" if title == result["actions"][0][0] else "Next", title, detail)
            st.toast("Actions added to the City Plan", icon="✅")

        if action2.button("Ask CityPulse", use_container_width=True):
            advisor_dialog("waste")

        if action3.button("Start a New Forecast", use_container_width=True):
            st.session_state.waste_step = 1
            st.rerun()

        st.caption(
            f'Created with {result["model_name"]} on {result["created_at"]}. '
            "This forecast supports planning and requires human review."
        )


# ---------------------------------------------------------
# CITY PLAN
# ---------------------------------------------------------
def plan_page():
    page_header(
        "✓",
        "Your City Plan",
        "Keep only the next useful actions. Missions and complex project structures can be added later when needed.",
        chip=f'{len([task for task in st.session_state.city_plan if not task["done"]])} open',
        chip_class="amber",
    )

    if not st.session_state.city_plan:
        st.markdown(
            """
            <div class="cp-empty">
                <div style="font-size:42px;">📝</div>
                <h3>No city actions yet</h3>
                <p>Run the first City Check or complete the Waste Planning assessment.</p>
            </div>
            """,
            unsafe_allow_html=True,
        )
        return

    phases = ["Now", "Next", "Later"]

    for phase in phases:
        tasks = [task for task in st.session_state.city_plan if task["phase"] == phase]

        if not tasks:
            continue

        st.subheader(phase)

        for task in tasks:
            with st.container(border=True):
                col1, col2 = st.columns([.78, .22])
                col1.markdown(f"**{task['title']}**")
                col1.caption(task["detail"])

                done = col2.checkbox(
                    "Done",
                    value=task["done"],
                    key=f'done_{task["id"]}',
                )

                if done != task["done"]:
                    task["done"] = done
                    st.rerun()

                with st.expander("Add a note"):
                    task["note"] = st.text_input(
                        "Note",
                        value=task.get("note", ""),
                        key=f'note_{task["id"]}',
                        label_visibility="collapsed",
                    )

    st.write("")
    col1, col2 = st.columns(2)

    if col1.button("✨ Ask CityPulse About the Plan", use_container_width=True):
        advisor_dialog("plan")

    if col2.button("📄 Create Executive Report", use_container_width=True):
        st.switch_page(report_page_link)


# ---------------------------------------------------------
# REPORT
# ---------------------------------------------------------
def report_text() -> str:
    city = st.session_state.builder_data
    check = st.session_state.city_check_result
    waste = st.session_state.waste_result
    open_tasks = [task for task in st.session_state.city_plan if not task["done"]]

    lines = [
        "CITYPULSE AI — EXECUTIVE CITY SUMMARY",
        "",
        f"City: {city.get('city_name', '—')}",
        f"Country: {city.get('country', '—')}",
        f"City type: {city.get('city_type', '—')}",
        f"Population: {city.get('population', 0):,}",
        f"Districts: {city.get('districts', 0)}",
        f"City readiness: {readiness_score()}%",
        f"Active systems: {', '.join(st.session_state.active_systems) if st.session_state.active_systems else 'None'}",
        "",
        "MAIN PRIORITY",
    ]

    if check:
        lines.extend([
            check["main_priority"],
            check["summary"],
            f"Recommended decision: {check['decision']}",
        ])
    else:
        lines.append("The first City Check has not been completed.")

    lines.extend(["", "CONNECTED MODEL INTELLIGENCE"])

    if waste:
        lines.extend([
            f"Waste forecast: {waste['prediction']:,.0f} tons",
            f"Area: {waste['borough']} District {waste['district']}",
            f"Priority: {waste['priority']}",
            f"Decision: {waste['decision']}",
        ])
    else:
        lines.append("No completed model assessment yet.")

    lines.extend(["", "NEXT ACTIONS"])

    if open_tasks:
        for index, task in enumerate(open_tasks, start=1):
            lines.append(f"{index}. {task['title']} — {task['detail']}")
    else:
        lines.append("No open actions.")

    lines.extend([
        "",
        "NOTE",
        "CityPulse AI provides decision support. Forecasts, simulations, and AI guidance require human review.",
    ])

    return "\n".join(lines)


def report_page():
    page_header(
        "▤",
        "Executive Report",
        "A short stakeholder summary focused on the city priority, connected intelligence, and next actions.",
        chip="Ready to Export",
        chip_class="green",
    )

    city = st.session_state.builder_data
    check = st.session_state.city_check_result
    waste = st.session_state.waste_result

    st.subheader(f'{city.get("city_name", "City")} Executive Summary')

    col1, col2, col3 = st.columns(3)
    with col1:
        kpi_card("City Readiness", f"{readiness_score()}%", "Profile, systems, assessments, and City Check")
    with col2:
        kpi_card("Active Systems", f'{len(st.session_state.active_systems)} of 4', "Activated city areas")
    with col3:
        kpi_card("Open Actions", str(len([task for task in st.session_state.city_plan if not task["done"]])), "Waiting for review")

    if check:
        st.markdown(
            f"""
            <div class="cp-priority">
                <small>Main city priority</small>
                <h2>{html.escape(check['main_priority'])}</h2>
                <p>{html.escape(check['summary'])}</p>
                <p style="margin-top:12px;"><strong>Recommended decision:</strong> {html.escape(check['decision'])}</p>
            </div>
            """,
            unsafe_allow_html=True,
        )
    else:
        st.info("Run the first City Check to complete the priority section.")

    if waste:
        st.subheader("Connected Model Intelligence")
        st.write(f"**Waste Planning:** {waste['headline']}")
        st.write(f"Forecast: **{waste['prediction']:,.0f} tons** for {waste['borough']} District {waste['district']}.")
        st.write(f"Recommended decision: **{waste['decision']}**")

    st.subheader("Next Actions")
    open_tasks = [task for task in st.session_state.city_plan if not task["done"]]

    if open_tasks:
        for index, task in enumerate(open_tasks[:5], start=1):
            plan_item(str(index), task["title"], task["detail"])
    else:
        st.write("No open actions.")

    text = report_text()
    project_json = json.dumps(
        {
            "city": st.session_state.builder_data,
            "active_systems": st.session_state.active_systems,
            "city_check": st.session_state.city_check_result,
            "waste_result": st.session_state.waste_result,
            "city_plan": st.session_state.city_plan,
        },
        indent=2,
        default=str,
    )

    st.write("")
    col1, col2 = st.columns(2)
    col1.download_button(
        "Download Executive Summary",
        data=text,
        file_name="CityPulse_Executive_Summary.txt",
        mime="text/plain",
        use_container_width=True,
    )
    col2.download_button(
        "Export City Project",
        data=project_json,
        file_name="CityPulse_Project.json",
        mime="application/json",
        use_container_width=True,
    )

    with st.expander("Edit City Profile"):
        st.write("This returns to the short City Builder. Existing systems and results remain in the current session.")
        if st.button("Open City Builder"):
            st.session_state.onboarding_done = False
            st.session_state.builder_step = 1
            st.rerun()


# ---------------------------------------------------------
# APP FLOW
# ---------------------------------------------------------
if not st.session_state.onboarding_done:
    builder_page()
    st.stop()


home_page_link = st.Page(home_page, title="Home", icon="🏙️", default=True)
systems_page_link = st.Page(systems_page, title="City Systems", icon="🧩")
plan_page_link = st.Page(plan_page, title="City Plan", icon="✅")
report_page_link = st.Page(report_page, title="Report", icon="📄")

pages = {
    "": [
        home_page_link,
        systems_page_link,
        plan_page_link,
        report_page_link,
    ]
}

current_page = st.navigation(pages, position="top")
current_page.run()
