import base64
import calendar
import html
import json
import os
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
LOGO_PATH = next((path for path in LOGO_CANDIDATES if path.exists()), LOGO_CANDIDATES[0])


# ---------------------------------------------------------
# LOGO
# ---------------------------------------------------------
def image_data_uri(path: Path) -> str:
    if not path.exists():
        return ""

    encoded = base64.b64encode(path.read_bytes()).decode("utf-8")
    suffix = path.suffix.lower().replace(".", "") or "png"
    return f"data:image/{suffix};base64,{encoded}"


LOGO_URI = image_data_uri(LOGO_PATH)

if LOGO_PATH.exists():
    try:
        st.logo(str(LOGO_PATH), size="large", icon_image=str(LOGO_PATH))
    except Exception:
        pass


# ---------------------------------------------------------
# DESIGN SYSTEM
# ---------------------------------------------------------
st.markdown(
    """
    <style>
    :root {
        --navy: #0B1F3A;
        --navy-2: #123E5A;
        --blue: #2F6BFF;
        --teal: #00A99D;
        --green: #168C65;
        --amber: #C47A13;
        --red: #C84C4C;
        --ink: #142033;
        --muted: #667085;
        --surface: rgba(255, 255, 255, 0.92);
        --surface-soft: #F7F9FC;
        --line: rgba(17, 40, 70, 0.09);
    }

    html, body, [class*="css"] {
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display",
                     "SF Pro Text", "Segoe UI", sans-serif;
    }

    .stApp {
        background:
            radial-gradient(circle at 10% 0%, rgba(47, 107, 255, 0.08), transparent 26%),
            radial-gradient(circle at 90% 10%, rgba(0, 169, 157, 0.08), transparent 22%),
            #F3F6FA;
        color: var(--ink);
    }

    .main .block-container {
        max-width: 1320px;
        padding-top: 2.2rem;
        padding-bottom: 5rem;
    }

    footer {visibility: hidden;}

    h1, h2, h3 {
        color: var(--ink);
        letter-spacing: -0.025em;
    }

    .cp-hero {
        position: relative;
        overflow: hidden;
        padding: 38px 40px;
        border-radius: 30px;
        background:
            radial-gradient(circle at 87% 15%, rgba(255,255,255,.22), transparent 25%),
            linear-gradient(135deg, #091B33 0%, #0D3D56 54%, #097F82 120%);
        color: white;
        box-shadow: 0 24px 70px rgba(16, 44, 72, 0.18);
        margin-bottom: 24px;
    }

    .cp-hero:after {
        content: "";
        position: absolute;
        width: 260px;
        height: 260px;
        right: -70px;
        bottom: -120px;
        border-radius: 999px;
        background: rgba(255,255,255,.08);
    }

    .cp-hero-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 310px;
        align-items: center;
        gap: 24px;
        position: relative;
        z-index: 1;
    }

    .cp-logo-wrap {
        width: 300px;
        height: 142px;
        border-radius: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255,255,255,.94);
        border: 1px solid rgba(255,255,255,.44);
        box-shadow: 0 22px 55px rgba(2, 17, 35, .20);
        backdrop-filter: blur(18px);
        overflow: hidden;
        font-size: 40px;
    }

    .cp-logo-wrap img {
        width: 100%;
        height: 100%;
        max-width: none;
        max-height: none;
        object-fit: contain;
        transform: scale(1.82);
        filter: contrast(1.18) saturate(1.12);
    }

    .cp-eyebrow {
        text-transform: uppercase;
        letter-spacing: .13em;
        font-size: 12px;
        font-weight: 800;
        color: rgba(255,255,255,.72);
        margin-bottom: 10px;
    }

    .cp-hero h1 {
        color: white;
        font-size: clamp(34px, 5vw, 56px);
        margin: 0 0 10px 0;
        line-height: 1.03;
    }

    .cp-hero p {
        color: rgba(255,255,255,.82);
        font-size: 17px;
        line-height: 1.65;
        max-width: 760px;
        margin: 0;
    }

    .cp-badge {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        border-radius: 999px;
        padding: 7px 12px;
        font-size: 12px;
        font-weight: 800;
        margin-top: 18px;
        background: rgba(255,255,255,.13);
        border: 1px solid rgba(255,255,255,.16);
        color: white;
    }

    .cp-page-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 18px;
        padding: 26px 28px;
        border-radius: 25px;
        background: var(--surface);
        border: 1px solid var(--line);
        box-shadow: 0 16px 45px rgba(16, 44, 72, .07);
        margin-bottom: 20px;
        backdrop-filter: blur(14px);
    }

    .cp-page-head h1 {
        margin: 0 0 7px 0;
        font-size: 34px;
    }

    .cp-page-head p {
        margin: 0;
        color: var(--muted);
        line-height: 1.55;
    }

    .cp-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border-radius: 999px;
        padding: 7px 11px;
        font-size: 12px;
        font-weight: 800;
        white-space: nowrap;
        background: #ECF3FF;
        color: #2F5FCC;
    }

    .cp-chip.live {background:#E9F8F2;color:#087354;}
    .cp-chip.waiting {background:#FFF3DE;color:#9C5E08;}
    .cp-chip.high {background:#FCEAEA;color:#AC3434;}
    .cp-chip.low {background:#EAF7F0;color:#087354;}

    .cp-card {
        height: 100%;
        padding: 23px;
        border-radius: 23px;
        background: var(--surface);
        border: 1px solid var(--line);
        box-shadow: 0 14px 38px rgba(16, 44, 72, .055);
        backdrop-filter: blur(12px);
    }

    .cp-card h3 {
        margin: 0 0 9px 0;
        font-size: 20px;
    }

    .cp-card p {
        margin: 0;
        color: var(--muted);
        line-height: 1.55;
    }

    .cp-module-icon {
        width: 48px;
        height: 48px;
        display:flex;
        align-items:center;
        justify-content:center;
        border-radius: 16px;
        background: #F0F5FF;
        font-size: 24px;
        margin-bottom: 17px;
    }

    .cp-kpi {
        padding: 21px;
        border-radius: 22px;
        background: var(--surface);
        border: 1px solid var(--line);
        box-shadow: 0 12px 32px rgba(16, 44, 72, .05);
        min-height: 132px;
    }

    .cp-kpi-label {
        color: var(--muted);
        font-size: 13px;
        font-weight: 700;
        margin-bottom: 10px;
    }

    .cp-kpi-value {
        color: var(--ink);
        font-size: 28px;
        font-weight: 850;
        letter-spacing: -.04em;
        line-height: 1.1;
    }

    .cp-kpi-note {
        color: var(--muted);
        font-size: 12px;
        margin-top: 9px;
    }

    .cp-decision {
        border-radius: 28px;
        padding: 30px;
        color: white;
        background: linear-gradient(135deg, #0A2342, #0B6C70);
        box-shadow: 0 22px 55px rgba(13, 60, 81, .18);
        margin: 18px 0;
    }

    .cp-decision .label {
        color: rgba(255,255,255,.68);
        font-size: 12px;
        font-weight: 850;
        text-transform: uppercase;
        letter-spacing: .13em;
    }

    .cp-decision h2 {
        color: white;
        font-size: 34px;
        margin: 9px 0 8px 0;
        line-height: 1.1;
    }

    .cp-decision p {
        color: rgba(255,255,255,.78);
        line-height: 1.6;
        margin: 0;
    }

    .cp-action {
        display: flex;
        gap: 13px;
        padding: 17px 18px;
        border-radius: 18px;
        background: white;
        border: 1px solid var(--line);
        margin-bottom: 10px;
    }

    .cp-action-number {
        flex: 0 0 34px;
        width: 34px;
        height: 34px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        background: var(--navy);
        font-weight: 850;
    }

    .cp-action strong {display:block;color:var(--ink);margin-bottom:4px;}
    .cp-action span {color:var(--muted);font-size:13px;line-height:1.45;}

    .cp-empty {
        text-align: center;
        padding: 48px 24px;
        border-radius: 25px;
        background: rgba(255,255,255,.75);
        border: 1px dashed rgba(17, 40, 70, .16);
    }

    .cp-empty-icon {font-size: 42px;margin-bottom: 12px;}
    .cp-empty h3 {margin-bottom: 8px;}
    .cp-empty p {max-width: 650px;margin:auto;color:var(--muted);line-height:1.6;}

    .cp-stepper {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        margin: 6px 0 20px 0;
    }

    .cp-step {
        padding: 12px 14px;
        border-radius: 16px;
        background: white;
        border: 1px solid var(--line);
        color: var(--muted);
        font-size: 13px;
        font-weight: 750;
    }

    .cp-step b {
        color: var(--blue);
        margin-right: 7px;
    }

    .cp-login-feature {
        padding: 15px 0;
        border-bottom: 1px solid rgba(255,255,255,.12);
        color: rgba(255,255,255,.83);
        font-size: 14px;
    }

    .cp-login-feature:last-child {border-bottom:none;}

    div[data-testid="stForm"] {
        background: rgba(255,255,255,.86);
        border: 1px solid var(--line);
        border-radius: 24px;
        padding: 24px;
        box-shadow: 0 14px 38px rgba(16, 44, 72, .05);
    }

    div[data-testid="stVerticalBlockBorderWrapper"] {
        background: rgba(255,255,255,.90);
        border-color: var(--line) !important;
        border-radius: 23px !important;
        box-shadow: 0 14px 38px rgba(16, 44, 72, .05);
    }

    div[data-testid="stMetric"] {
        background: white;
        border: 1px solid var(--line);
        border-radius: 20px;
        padding: 18px;
        box-shadow: 0 10px 30px rgba(16, 44, 72, .045);
    }

    .stButton > button,
    .stDownloadButton > button,
    div[data-testid="stFormSubmitButton"] > button {
        border: 0 !important;
        border-radius: 15px !important;
        min-height: 48px;
        font-weight: 780;
        background: linear-gradient(135deg, #102D50, #0B6C70) !important;
        color: white !important;
        box-shadow: 0 10px 24px rgba(16, 58, 78, .16);
        transition: transform .15s ease, box-shadow .15s ease;
    }

    .stButton > button:hover,
    .stDownloadButton > button:hover,
    div[data-testid="stFormSubmitButton"] > button:hover {
        transform: translateY(-1px);
        box-shadow: 0 14px 28px rgba(16, 58, 78, .21);
    }

    div[data-baseweb="input"] > div,
    div[data-baseweb="select"] > div,
    div[data-baseweb="base-input"] {
        border-radius: 15px !important;
        border-color: rgba(16, 44, 72, .10) !important;
        background: #F7F9FC !important;
    }

    [data-testid="stNumberInputStepDown"],
    [data-testid="stNumberInputStepUp"] {
        background: transparent !important;
    }

    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
        background: rgba(255,255,255,.8);
        border: 1px solid var(--line);
        padding: 7px;
        border-radius: 17px;
    }

    .stTabs [data-baseweb="tab"] {
        border-radius: 12px;
        padding: 10px 16px;
    }

    .stTabs [aria-selected="true"] {
        background: #EAF1FF;
        color: #244FAF;
    }

    [data-testid="stChatMessage"] {
        border-radius: 20px;
        border: 1px solid var(--line);
        padding: 8px 12px;
        background: rgba(255,255,255,.78);
    }


    .cp-card {
        transition: transform .20s ease, box-shadow .20s ease, border-color .20s ease;
    }

    .cp-card:hover {
        transform: translateY(-6px);
        box-shadow: 0 24px 58px rgba(16, 44, 72, .13);
        border-color: rgba(47, 107, 255, .24);
    }

    .cp-quick-action {
        padding: 18px 20px;
        border-radius: 21px;
        background: rgba(255,255,255,.88);
        border: 1px solid var(--line);
        box-shadow: 0 13px 32px rgba(16, 44, 72, .055);
        min-height: 112px;
    }

    .cp-quick-action strong {
        display: block;
        font-size: 16px;
        color: var(--ink);
        margin-bottom: 6px;
    }

    .cp-quick-action span {
        color: var(--muted);
        font-size: 13px;
        line-height: 1.5;
    }

    .cp-attention {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 20px;
        align-items: center;
        padding: 24px 26px;
        border-radius: 24px;
        background: linear-gradient(135deg, rgba(255,255,255,.96), rgba(236,246,249,.96));
        border: 1px solid var(--line);
        box-shadow: 0 16px 42px rgba(16, 44, 72, .065);
        margin: 15px 0 24px 0;
    }

    .cp-attention-label {
        color: var(--muted);
        font-size: 12px;
        font-weight: 850;
        text-transform: uppercase;
        letter-spacing: .12em;
        margin-bottom: 7px;
    }

    .cp-attention h3 {margin:0 0 7px 0;font-size:24px;}
    .cp-attention p {margin:0;color:var(--muted);line-height:1.55;}

    .cp-attention-status {
        min-width: 122px;
        text-align: center;
        padding: 16px 18px;
        border-radius: 19px;
        background: #EAF7F0;
        color: #087354;
        font-weight: 850;
    }

    .cp-module-meta {
        display:flex;
        justify-content:space-between;
        gap:12px;
        color:var(--muted);
        font-size:12px;
        margin-top:16px;
        padding-top:14px;
        border-top:1px solid var(--line);
    }

    .cp-stepper-v3 {
        display:grid;
        grid-template-columns:repeat(3,1fr);
        gap:10px;
        margin:10px 0 24px 0;
    }

    .cp-step-v3 {
        position:relative;
        padding:15px 16px;
        border-radius:18px;
        border:1px solid var(--line);
        background:rgba(255,255,255,.75);
        color:var(--muted);
        font-size:13px;
        font-weight:800;
    }

    .cp-step-v3.active {
        background:linear-gradient(135deg,#102D50,#0B6C70);
        color:white;
        box-shadow:0 14px 30px rgba(16,58,78,.17);
    }

    .cp-step-v3.done {
        background:#EAF7F0;
        color:#087354;
        border-color:rgba(8,115,84,.12);
    }

    .cp-result-grid {
        display:grid;
        grid-template-columns:repeat(2,minmax(0,1fr));
        gap:12px;
        margin-top:14px;
    }

    .cp-result-row {
        padding:17px 18px;
        border-radius:18px;
        background:white;
        border:1px solid var(--line);
    }

    .cp-result-row small {display:block;color:var(--muted);font-weight:750;margin-bottom:6px;}
    .cp-result-row strong {font-size:17px;color:var(--ink);}

    .cp-scenario {
        border-radius:25px;
        padding:24px;
        background:linear-gradient(145deg,#F9FBFF,#EEF7F7);
        border:1px solid var(--line);
        box-shadow:0 14px 38px rgba(16,44,72,.055);
    }

    .cp-scenario-result {
        padding:20px;
        border-radius:20px;
        background:white;
        border:1px solid var(--line);
        margin-top:14px;
    }

    .cp-action-center-item {
        border-radius:21px;
        padding:19px 20px;
        background:rgba(255,255,255,.91);
        border:1px solid var(--line);
        box-shadow:0 12px 30px rgba(16,44,72,.045);
        margin-bottom:10px;
    }

    .cp-action-center-item.reviewed {opacity:.64;}
    .cp-action-center-item h4 {margin:0 0 5px 0;color:var(--ink);}
    .cp-action-center-item p {margin:0;color:var(--muted);font-size:13px;line-height:1.5;}

    .cp-view-note {
        border-left:4px solid #2F6BFF;
        padding:12px 15px;
        border-radius:0 14px 14px 0;
        background:#EEF4FF;
        color:#34517E;
        font-size:13px;
        margin-bottom:17px;
    }

    @media (max-width: 760px) {
        .main .block-container {padding: 1.2rem .8rem 4rem .8rem;}
        .cp-hero {padding: 28px 24px;border-radius:24px;}
        .cp-hero-grid {grid-template-columns:1fr;}
        .cp-logo-wrap {width:100%;height:110px;margin-top:10px;}
        .cp-page-head {padding:22px;border-radius:21px;}
        .cp-page-head h1 {font-size:29px;}
        .cp-stepper {grid-template-columns:1fr;}
        .cp-stepper-v3 {grid-template-columns:1fr;}
        .cp-result-grid {grid-template-columns:1fr;}
        .cp-attention {grid-template-columns:1fr;}
        .cp-decision h2 {font-size:28px;}
    }
    </style>
    """,
    unsafe_allow_html=True,
)


# ---------------------------------------------------------
# SESSION STATE
# ---------------------------------------------------------
DEFAULT_STATE = {
    "logged_in": False,
    "profile_ready": False,
    "user_name": "",
    "user_email": "",
    "city_profile": {},
    "prediction_history": [],
    "waste_result": None,
    "transportation_result": None,
    "energy_result": None,
    "governance_result": None,
    "advisor_messages": [],
    "view_mode": "Executive View",
    "waste_step": 1,
    "waste_inputs": {
        "borough": "Bronx",
        "district": 1,
        "two_months": 3900.0,
        "last_month": 4000.0,
        "month_name": "January",
        "year": 2026,
    },
    "action_center": [],
    "waste_ai_answer": "",
    "waste_ai_source": "",
}

for key, value in DEFAULT_STATE.items():
    if key not in st.session_state:
        st.session_state[key] = deepcopy(value)


# ---------------------------------------------------------
# MODEL LOADING
# Only load model files that you created and trust.
# ---------------------------------------------------------
MODEL_FILES = {
    "transportation": "transportation_bundle.joblib",
    "energy": "energy_bundle.joblib",
    "governance": "governance_bundle.joblib",
    "waste": "waste_bundle.joblib",
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

WASTE_BUNDLE = MODEL_BUNDLES["waste"]
WASTE_MODEL = WASTE_BUNDLE.get("model") if isinstance(WASTE_BUNDLE, dict) else None
WASTE_FEATURES = (
    WASTE_BUNDLE.get("feature_columns", [])
    if isinstance(WASTE_BUNDLE, dict)
    else []
)


# ---------------------------------------------------------
# SMALL UI HELPERS
# ---------------------------------------------------------
def logo_markup() -> str:
    if LOGO_URI:
        return f'<img src="{LOGO_URI}" alt="CityPulse logo">'
    return "🏙️"


def hero(title: str, subtitle: str, eyebrow: str = "CITYPULSE AI", badge: str = ""):
    badge_html = f'<div class="cp-badge">● {html.escape(badge)}</div>' if badge else ""

    st.markdown(
        f"""
        <div class="cp-hero">
            <div class="cp-hero-grid">
                <div>
                    <div class="cp-eyebrow">{html.escape(eyebrow)}</div>
                    <h1>{html.escape(title)}</h1>
                    <p>{html.escape(subtitle)}</p>
                    {badge_html}
                </div>
                <div class="cp-logo-wrap">{logo_markup()}</div>
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


def module_card(icon: str, title: str, text: str, status: str, status_class: str = ""):
    st.markdown(
        f"""
        <div class="cp-card">
            <div class="cp-module-icon">{icon}</div>
            <h3>{html.escape(title)}</h3>
            <p>{html.escape(text)}</p>
            <div style="margin-top:17px;">
                <span class="cp-chip {status_class}">{html.escape(status)}</span>
            </div>
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


def empty_state(icon: str, title: str, text: str):
    st.markdown(
        f"""
        <div class="cp-empty">
            <div class="cp-empty-icon">{icon}</div>
            <h3>{html.escape(title)}</h3>
            <p>{html.escape(text)}</p>
        </div>
        """,
        unsafe_allow_html=True,
    )


def action_item(number: int, title: str, text: str):
    st.markdown(
        f"""
        <div class="cp-action">
            <div class="cp-action-number">{number}</div>
            <div>
                <strong>{html.escape(title)}</strong>
                <span>{html.escape(text)}</span>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def module_found(module: str) -> bool:
    return MODEL_BUNDLES.get(module) is not None


def active_results() -> list[dict]:
    result_keys = [
        "transportation_result",
        "energy_result",
        "governance_result",
        "waste_result",
    ]
    return [st.session_state[key] for key in result_keys if st.session_state.get(key)]



def segmented(label: str, options: list[str], key: str, default: str) -> str:
    """Use the modern segmented control with a safe fallback."""
    if key not in st.session_state:
        st.session_state[key] = default

    if hasattr(st, "segmented_control"):
        value = st.segmented_control(
            label,
            options,
            default=st.session_state[key],
            key=f"{key}_widget",
            label_visibility="collapsed",
        )
    else:
        value = st.radio(
            label,
            options,
            index=options.index(st.session_state[key]),
            horizontal=True,
            key=f"{key}_widget",
            label_visibility="collapsed",
        )

    if value:
        st.session_state[key] = value
    return st.session_state[key]


def pill_choice(label: str, options: list[str], key: str, default: str | None = None):
    if hasattr(st, "pills"):
        return st.pills(label, options, default=default, key=key, label_visibility="collapsed")
    return st.selectbox(
        label,
        options,
        index=options.index(default) if default in options else 0,
        key=key,
        label_visibility="collapsed",
    )


def module_snapshot(module: str) -> tuple[str, str]:
    result_map = {
        "transportation": st.session_state.transportation_result,
        "energy": st.session_state.energy_result,
        "governance": st.session_state.governance_result,
        "waste": st.session_state.waste_result,
    }
    result = result_map.get(module)

    if result:
        label = result.get("status", result.get("priority", "Completed"))
        updated = result.get("created_at", "Current session")
        return str(label), str(updated)

    if module_found(module):
        return "Ready for assessment", "Model connected"

    return "Setup needed", "Model not connected"


def ensure_action(action_id: str, module: str, title: str, detail: str, priority: str = "Medium", status: str = "Open"):
    existing = next(
        (item for item in st.session_state.action_center if item["id"] == action_id),
        None,
    )

    if existing:
        existing.update({"module": module, "title": title, "detail": detail})
        return

    st.session_state.action_center.append(
        {
            "id": action_id,
            "module": module,
            "title": title,
            "detail": detail,
            "priority": priority,
            "status": status,
            "note": "",
            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
        }
    )


def sync_action_center():
    waste = st.session_state.waste_result

    if waste:
        ensure_action(
            "waste_latest",
            "Waste Management",
            waste["actions"][0][0],
            waste["actions"][0][1],
            priority=waste["priority"] if waste["priority"] in ["Low", "Medium", "High"] else "Medium",
        )

    setup_items = [
        ("transport_setup", "Transportation", "Connect the transportation model", "Complete the mobility-risk assessment setup."),
        ("energy_setup", "Energy", "Connect the energy model", "Enable building-demand forecasts and peak-period planning."),
        ("governance_setup", "Public Services", "Connect the public-services model", "Enable early identification of requests needing attention."),
    ]

    for action_id, module, title, detail in setup_items:
        module_key = {
            "Transportation": "transportation",
            "Energy": "energy",
            "Public Services": "governance",
        }[module]
        if not module_found(module_key):
            ensure_action(action_id, module, title, detail, priority="Medium", status="Waiting")


def add_waste_action_to_center():
    result = st.session_state.waste_result
    if not result:
        return

    ensure_action(
        "waste_latest",
        "Waste Management",
        result["actions"][0][0],
        result["actions"][0][1],
        priority=result["priority"] if result["priority"] in ["Low", "Medium", "High"] else "Medium",
    )
    st.toast("Action added to the City Action Center", icon="✅")


def render_action_center(limit: int = 5):
    sync_action_center()
    items = st.session_state.action_center[:limit]

    if not items:
        empty_state("✅", "No open city actions", "Complete an assessment to create the first operational action.")
        return

    for index, item in enumerate(items):
        css_class = "reviewed" if item["status"] == "Reviewed" else ""
        st.markdown(
            f"""
            <div class="cp-action-center-item {css_class}">
                <h4>{html.escape(item['module'])} — {html.escape(item['title'])}</h4>
                <p>{html.escape(item['detail'])}</p>
            </div>
            """,
            unsafe_allow_html=True,
        )

        c1, c2, c3 = st.columns([1.1, 1, 1])
        with c1:
            priority_options = ["Low", "Medium", "High"]
            item["priority"] = st.selectbox(
                "Priority",
                priority_options,
                index=priority_options.index(item.get("priority", "Medium")),
                key=f"action_priority_{item['id']}",
                label_visibility="collapsed",
            )
        with c2:
            button_label = "Reopen" if item["status"] == "Reviewed" else "Mark reviewed"
            if st.button(button_label, key=f"action_review_{item['id']}", use_container_width=True):
                item["status"] = "Open" if item["status"] == "Reviewed" else "Reviewed"
                st.rerun()
        with c3:
            with st.popover("Add note", use_container_width=True):
                note = st.text_area(
                    "Action note",
                    value=item.get("note", ""),
                    key=f"action_note_{item['id']}",
                    label_visibility="collapsed",
                )
                if st.button("Save note", key=f"save_note_{item['id']}", use_container_width=True):
                    item["note"] = note
                    st.toast("Note saved", icon="📝")


def render_waste_stepper(active_step: int):
    labels = ["Select area", "Add recent data", "Review forecast"]
    cards = []
    for number, label in enumerate(labels, start=1):
        if number < active_step:
            css_class = "done"
            prefix = "✓"
        elif number == active_step:
            css_class = "active"
            prefix = str(number)
        else:
            css_class = ""
            prefix = str(number)
        cards.append(f'<div class="cp-step-v3 {css_class}">{prefix} · {html.escape(label)}</div>')

    st.markdown(
        '<div class="cp-stepper-v3">' + "".join(cards) + "</div>",
        unsafe_allow_html=True,
    )


def scenario_outlook(result: dict, increase: int, workforce: str, vehicle_capacity: str) -> dict:
    adjusted_volume = result["prediction"] * (1 + increase / 100)
    pressure_points = 0

    if increase >= 10:
        pressure_points += 1
    if workforce == "Limited":
        pressure_points += 1
    if vehicle_capacity == "Limited":
        pressure_points += 1
    if workforce == "Strong":
        pressure_points -= 1
    if vehicle_capacity == "Extra capacity":
        pressure_points -= 1

    if pressure_points >= 2:
        status = "Additional resources may be needed"
        detail = "The test scenario combines higher demand with limited operational capacity. Review staffing and vehicle availability before the month begins."
        level = "High"
    elif pressure_points == 1:
        status = "A small operational buffer is recommended"
        detail = "Current resources may be sufficient, but keeping backup capacity available would reduce planning risk."
        level = "Medium"
    else:
        status = "Current capacity appears sufficient"
        detail = "The selected workforce and vehicle capacity appear able to support this planning scenario."
        level = "Low"

    return {
        "volume": adjusted_volume,
        "status": status,
        "detail": detail,
        "level": level,
    }


# ---------------------------------------------------------
# WASTE MODEL HELPERS
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
        raise ValueError("The saved bundle does not contain feature_columns.")

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

    prepared_data = prepare_waste_input(
        borough=borough,
        district=district,
        year=year,
        month_number=month_number,
        last_month=last_month,
        two_months=two_months,
    )

    prediction = float(WASTE_MODEL.predict(prepared_data)[0])
    difference = prediction - last_month
    change_percent = (difference / last_month * 100) if last_month else 0.0

    if change_percent >= 10:
        priority = "High"
        status = "Prepare for higher demand"
        headline = "Collection demand is expected to rise noticeably."
        summary = (
            "The selected district may need earlier operational preparation "
            "before the forecast month begins."
        )
        actions = [
            ("Review collection capacity", "Check whether the current collection plan can absorb the expected increase."),
            ("Confirm workforce coverage", "Review shifts and availability for the selected district."),
            ("Monitor the first collection cycle", "Compare actual volume with the forecast and adjust quickly."),
        ]
    elif change_percent >= 5:
        priority = "Medium"
        status = "Needs attention"
        headline = "Waste demand may increase moderately."
        summary = (
            "The city should review its current plan and prepare a small operational buffer."
        )
        actions = [
            ("Review the monthly schedule", "Check collection timing for the selected district."),
            ("Prepare a small resource buffer", "Keep additional capacity available if actual volume rises."),
            ("Track the next update", "Run the forecast again when new monthly data becomes available."),
        ]
    elif change_percent <= -10:
        priority = "Low"
        status = "Lower demand expected"
        headline = "Waste demand is expected to decrease."
        summary = (
            "The city may have an opportunity to optimize resources while keeping service quality stable."
        )
        actions = [
            ("Keep service quality stable", "Do not reduce essential coverage based on one forecast alone."),
            ("Review resource efficiency", "Check whether some capacity can support another nearby area."),
            ("Confirm with actual data", "Compare the forecast with the first collection cycle."),
        ]
    else:
        priority = "Low"
        status = "Stable outlook"
        headline = "Waste demand is expected to remain close to last month."
        summary = (
            "The current collection plan appears suitable, with no urgent expansion indicated by the forecast."
        )
        actions = [
            ("Maintain the current plan", "Continue the normal collection schedule for this district."),
            ("Watch for local events", "Adjust only if holidays, events, or service disruptions change demand."),
            ("Update next month", "Use the next actual value to improve the following forecast."),
        ]

    result = {
        "module": "Waste Management",
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
        "actions": actions,
        "model_name": WASTE_BUNDLE.get("model_name", "Waste Forecast Model"),
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
    }

    return result


def waste_chart(result: dict):
    labels = ["Two months ago", "Last month", "Forecast"]
    values = [
        result["two_months"],
        result["last_month"],
        result["prediction"],
    ]

    figure = go.Figure()
    figure.add_trace(
        go.Bar(
            x=labels,
            y=values,
            text=[f"{value:,.0f}" for value in values],
            textposition="outside",
            marker_color=["#C7D3E5", "#7893B8", "#0B7B7C"],
            hovertemplate="%{x}<br>%{y:,.0f} tons<extra></extra>",
        )
    )

    figure.update_layout(
        height=360,
        margin=dict(l=20, r=20, t=34, b=20),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        showlegend=False,
        bargap=0.45,
        yaxis=dict(
            title="Waste tons",
            gridcolor="rgba(17,40,70,.08)",
            zeroline=False,
        ),
        xaxis=dict(title=None),
        font=dict(family="-apple-system, BlinkMacSystemFont, Segoe UI"),
    )

    st.plotly_chart(figure, use_container_width=True, config={"displayModeBar": False})


# ---------------------------------------------------------
# ADVISOR HELPERS
# ---------------------------------------------------------
def city_context_text() -> str:
    profile = st.session_state.city_profile
    results = active_results()

    context = {
        "city_profile": profile,
        "latest_results": results,
    }
    return json.dumps(context, ensure_ascii=False, indent=2)


def rule_based_advisor(question: str) -> str:
    question_lower = question.lower()
    waste = st.session_state.waste_result
    city_name = st.session_state.city_profile.get("city_name", "the city")

    if not active_results():
        return (
            "There are no completed city assessments yet. Start with one smart-city area, "
            "then I can explain the result and turn it into an action plan."
        )

    if waste:
        area = f'{waste["borough"]}, District {waste["district"]}'
        forecast_period = f'{waste["month_name"]} {waste["year"]}'

        if any(word in question_lower for word in ["action", "plan", "prepare", "next step"]):
            steps = "\n".join(
                f"{index}. **{title}:** {text}"
                for index, (title, text) in enumerate(waste["actions"], start=1)
            )
            return (
                f"For **{area}** in **{forecast_period}**, the outlook is **{waste['status']}**.\n\n"
                f"{steps}\n\nThis is decision support and should be reviewed with local operational data."
            )

        if "why" in question_lower or "reason" in question_lower:
            return (
                f"The forecast for **{area}** is **{waste['prediction']:,.0f} tons**, "
                f"which is **{waste['change_percent']:+.1f}%** compared with last month. "
                f"That is why the planning status is **{waste['status']}**."
            )

        if any(word in question_lower for word in ["most important", "priority", "main problem"]):
            return (
                f"The latest available priority for {city_name} is the waste outlook in **{area}**. "
                f"Its current planning level is **{waste['priority']}**, with an expected volume of "
                f"**{waste['prediction']:,.0f} tons** in **{forecast_period}**."
            )

        return (
            f"The latest waste forecast for **{area}** is **{waste['prediction']:,.0f} tons** "
            f"for **{forecast_period}**. The outlook is **{waste['status']}**. "
            f"{waste['summary']}"
        )

    return "I found completed assessments, but I need more detail about the area you want to review."


def get_openai_key() -> str:
    try:
        if "OPENAI_API_KEY" in st.secrets:
            return str(st.secrets["OPENAI_API_KEY"])
    except Exception:
        pass

    return os.getenv("OPENAI_API_KEY", "")


def ask_city_advisor(question: str) -> tuple[str, str]:
    api_key = get_openai_key()

    if not api_key:
        return rule_based_advisor(question), "Smart guidance"

    try:
        from openai import OpenAI

        client = OpenAI(api_key=api_key)
        model_name = os.getenv("OPENAI_MODEL", "gpt-5.6-luna")

        instructions = (
            "You are CityPulse AI, a decision-support advisor for city managers. "
            "Use only the city profile and machine-learning results supplied in the context. "
            "Do not invent predictions, probabilities, causes, budgets, staffing numbers, or truck counts. "
            "Explain findings in simple stakeholder-friendly English. "
            "Structure useful answers as: What is happening, Why it matters, Recommended next action. "
            "State when more data or human review is needed."
        )

        response = client.responses.create(
            model=model_name,
            reasoning={"effort": "low"},
            instructions=instructions,
            input=(
                f"CITY CONTEXT:\n{city_context_text()}\n\n"
                f"USER QUESTION:\n{question}"
            ),
        )

        return response.output_text, f"AI advisor · {model_name}"

    except Exception as error:
        fallback = rule_based_advisor(question)
        return f"{fallback}\n\n_AI service fallback: {error}_", "Smart guidance"



# ---------------------------------------------------------
# INTERACTIVE DIALOGS
# ---------------------------------------------------------
@st.dialog("Run a city assessment")
def city_assessment_dialog():
    st.write("Choose the city area you want to assess now.")
    choice = pill_choice(
        "Assessment area",
        ["Transportation", "Energy", "Public Services", "Waste Management"],
        key="assessment_dialog_choice",
        default="Waste Management",
    )

    module_map = {
        "Transportation": ("transportation", "Mobility-risk planning"),
        "Energy": ("energy", "Building-demand planning"),
        "Public Services": ("governance", "Service-priority planning"),
        "Waste Management": ("waste", "Monthly waste planning"),
    }
    module_key, description = module_map[choice]

    st.markdown(f"**{description}**")
    if module_found(module_key):
        st.success("The model file is connected and ready.")
    else:
        st.warning("This workspace is ready, but its model file is not connected yet.")

    if st.button("Open selected workspace", use_container_width=True, type="primary"):
        page_map = {
            "Transportation": transportation_page_link,
            "Energy": energy_page_link,
            "Public Services": governance_page_link,
            "Waste Management": waste_page_link,
        }
        st.switch_page(page_map[choice])


@st.dialog("Ask AI about this result")
def waste_ai_dialog():
    result = st.session_state.waste_result
    if not result:
        st.info("Create a waste forecast first.")
        return

    st.caption(
        f"{result['borough']}, District {result['district']} · "
        f"{result['month_name']} {result['year']}"
    )

    prompt_options = [
        "Why is this result important?",
        "What should the city do next?",
        "Create a short action plan",
        "Explain this to a city manager",
    ]
    selected_prompt = pill_choice(
        "Suggested question",
        prompt_options,
        key="waste_ai_prompt",
        default=prompt_options[0],
    )
    custom_question = st.text_input(
        "Or ask your own question",
        placeholder="What is the main planning risk?",
    )

    if st.button("Generate guidance", use_container_width=True, type="primary"):
        question = custom_question.strip() or selected_prompt
        with st.spinner("Preparing stakeholder guidance..."):
            answer, source = ask_city_advisor(question)
        st.session_state.waste_ai_answer = answer
        st.session_state.waste_ai_source = source

    if st.session_state.waste_ai_answer:
        st.markdown(st.session_state.waste_ai_answer)
        st.caption(st.session_state.waste_ai_source)


# ---------------------------------------------------------
# REPORT HELPERS
# ---------------------------------------------------------
def report_html() -> str:
    profile = st.session_state.city_profile
    waste = st.session_state.waste_result

    waste_section = "<p>No waste assessment has been completed.</p>"

    if waste:
        actions = "".join(
            f"<li><strong>{html.escape(title)}</strong>: {html.escape(text)}</li>"
            for title, text in waste["actions"]
        )
        waste_section = f"""
        <h2>Waste Management Outlook</h2>
        <p><strong>Area:</strong> {html.escape(waste['borough'])}, District {waste['district']}</p>
        <p><strong>Forecast period:</strong> {html.escape(waste['month_name'])} {waste['year']}</p>
        <p><strong>Expected waste:</strong> {waste['prediction']:,.0f} tons</p>
        <p><strong>Change from last month:</strong> {waste['change_percent']:+.1f}%</p>
        <p><strong>Planning status:</strong> {html.escape(waste['status'])}</p>
        <p>{html.escape(waste['summary'])}</p>
        <h3>Recommended actions</h3>
        <ol>{actions}</ol>
        """

    return f"""
    <!doctype html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>CityPulse AI Report</title>
        <style>
            body {{font-family: Arial, sans-serif; color:#142033; max-width:900px; margin:40px auto; line-height:1.6;}}
            .head {{background:#0B2745;color:white;padding:28px;border-radius:18px;}}
            .meta {{background:#F3F6FA;padding:18px;border-radius:14px;margin:18px 0;}}
            h1,h2,h3 {{line-height:1.2;}}
        </style>
    </head>
    <body>
        <div class="head">
            <h1>CityPulse AI Executive Report</h1>
            <p>{html.escape(profile.get('city_name', 'City'))}, {html.escape(profile.get('country', ''))}</p>
        </div>
        <div class="meta">
            <strong>Prepared:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M')}<br>
            <strong>City manager:</strong> {html.escape(st.session_state.user_name)}<br>
            <strong>Population:</strong> {profile.get('population', 0):,}<br>
            <strong>Districts:</strong> {profile.get('districts', 0)}
        </div>
        {waste_section}
        <hr>
        <p><small>CityPulse AI provides decision support. Final operational decisions require human review and local data.</small></p>
    </body>
    </html>
    """


# ---------------------------------------------------------
# LOGIN + PROFILE SETUP
# ---------------------------------------------------------
def login_page():
    left, right = st.columns([1.15, 0.85], gap="large")

    with left:
        st.markdown(
            f"""
            <div class="cp-hero" style="min-height:580px;display:flex;align-items:center;">
                <div style="position:relative;z-index:1;width:100%;">
                    <div class="cp-logo-wrap" style="margin-bottom:28px;">{logo_markup()}</div>
                    <div class="cp-eyebrow">SMART CITY DECISION SUPPORT</div>
                    <h1>Turn city data into clear action.</h1>
                    <p>
                        CityPulse AI helps decision makers understand future needs,
                        focus on priority areas and prepare practical city actions.
                    </p>
                    <div style="margin-top:30px;max-width:590px;">
                        <div class="cp-login-feature">✓ One workspace for four smart-city areas</div>
                        <div class="cp-login-feature">✓ Stakeholder-friendly forecasts and action plans</div>
                        <div class="cp-login-feature">✓ AI guidance based on real model results</div>
                    </div>
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    with right:
        st.markdown("## Welcome")
        st.caption("Access the CityPulse workspace")

        sign_in_tab, create_tab = st.tabs(["Sign in", "Create account"])

        with sign_in_tab:
            with st.form("sign_in_form"):
                email = st.text_input("Work email", placeholder="name@city.gov")
                password = st.text_input("Password", type="password")
                sign_in = st.form_submit_button("Continue", use_container_width=True)

            if sign_in:
                if email and password:
                    st.session_state.logged_in = True
                    st.session_state.user_email = email
                    st.session_state.user_name = email.split("@")[0].replace(".", " ").title()
                    st.session_state.profile_ready = bool(st.session_state.city_profile)
                    st.rerun()
                else:
                    st.error("Enter your email and password.")

        with create_tab:
            with st.form("create_account_form"):
                full_name = st.text_input("Full name")
                new_email = st.text_input("Work email", placeholder="name@city.gov")
                new_password = st.text_input("Create password", type="password")
                create_account = st.form_submit_button("Create workspace", use_container_width=True)

            if create_account:
                if full_name and new_email and new_password:
                    st.session_state.logged_in = True
                    st.session_state.profile_ready = False
                    st.session_state.user_name = full_name
                    st.session_state.user_email = new_email
                    st.rerun()
                else:
                    st.error("Complete all account fields.")

        st.caption("Prototype login: account data is kept only during the current session.")


def city_profile_page():
    page_header(
        "🏙️",
        "Create the city workspace",
        "Tell CityPulse who will use the platform and which city priorities matter most.",
        "Step 1 of 1",
    )

    old = st.session_state.city_profile

    with st.form("city_profile_form"):
        st.markdown("### City identity")
        col1, col2 = st.columns(2)

        with col1:
            city_name = st.text_input(
                "City name",
                value=old.get("city_name", ""),
                placeholder="Jeddah",
            )
            country = st.text_input(
                "Country",
                value=old.get("country", ""),
                placeholder="Saudi Arabia",
            )
            role_options = [
                "City Manager",
                "Data Analyst",
                "Transportation Department",
                "Energy Department",
                "Public Services Department",
                "Waste Management Department",
            ]
            user_role = st.selectbox(
                "Your role",
                role_options,
                index=role_options.index(old.get("role", "City Manager"))
                if old.get("role") in role_options
                else 0,
            )

        with col2:
            population = st.number_input(
                "Population",
                min_value=0,
                value=int(old.get("population", 100000)),
                step=1000,
            )
            districts = st.number_input(
                "Number of districts",
                min_value=1,
                value=int(old.get("districts", 10)),
                step=1,
            )
            language_options = ["English", "Arabic"]
            language = st.selectbox(
                "Preferred language",
                language_options,
                index=language_options.index(old.get("language", "English"))
                if old.get("language") in language_options
                else 0,
            )

        st.markdown("### Strategic focus")

        goals = st.multiselect(
            "Main city goals",
            [
                "Improve Transportation",
                "Reduce Energy Use",
                "Improve Public Services",
                "Improve Waste Collection",
                "Improve Quality of Life",
                "Reduce Environmental Problems",
            ],
            default=old.get("goals", ["Improve Quality of Life"]),
        )

        selected_modules = st.multiselect(
            "Smart-city areas to use",
            ["Transportation", "Energy", "Public Services", "Waste Management"],
            default=old.get(
                "selected_modules",
                ["Transportation", "Energy", "Public Services", "Waste Management"],
            ),
        )

        save_profile = st.form_submit_button("Enter city workspace", use_container_width=True)

    if save_profile:
        if not city_name or not country:
            st.error("Enter the city name and country.")
            return

        st.session_state.city_profile = {
            "city_name": city_name,
            "country": country,
            "role": user_role,
            "population": int(population),
            "districts": int(districts),
            "language": language,
            "goals": goals,
            "selected_modules": selected_modules,
        }
        st.session_state.profile_ready = True
        st.toast("City workspace is ready", icon="✅")
        st.rerun()


# ---------------------------------------------------------
# APP PAGES
# ---------------------------------------------------------
def home_page():
    profile = st.session_state.city_profile
    waste = st.session_state.waste_result
    connected_count = sum(module_found(module) for module in MODEL_FILES)

    hero(
        f'{profile["city_name"]} Command Center',
        "What should the city focus on next? Run an assessment, review the latest priority or turn results into an executive action plan.",
        eyebrow=f'WELCOME, {st.session_state.user_name.upper()}',
        badge=f"{connected_count} of 4 model files connected",
    )

    action1, action2, action3 = st.columns(3)
    with action1:
        st.markdown(
            '<div class="cp-quick-action"><strong>🧭 Run City Assessment</strong><span>Choose one smart-city area and begin a guided assessment.</span></div>',
            unsafe_allow_html=True,
        )
        if st.button("Start assessment", key="home_run_assessment", use_container_width=True):
            city_assessment_dialog()
    with action2:
        st.markdown(
            '<div class="cp-quick-action"><strong>✨ Ask AI Advisor</strong><span>Explain a completed result and prepare simple next actions.</span></div>',
            unsafe_allow_html=True,
        )
        if st.button("Open advisor", key="home_open_advisor", use_container_width=True):
            st.switch_page(advisor_page_link)
    with action3:
        st.markdown(
            '<div class="cp-quick-action"><strong>📄 Executive Report</strong><span>Turn city findings into a stakeholder-ready summary.</span></div>',
            unsafe_allow_html=True,
        )
        if st.button("Create report", key="home_open_report", use_container_width=True):
            st.switch_page(reports_page_link)

    st.write("")
    mode = segmented(
        "Workspace view",
        ["Executive View", "Analyst View"],
        key="view_mode",
        default="Executive View",
    )

    if mode == "Executive View":
        st.markdown(
            '<div class="cp-view-note"><strong>Executive View:</strong> focuses on the city priority, decision and recommended action.</div>',
            unsafe_allow_html=True,
        )

        c1, c2, c3, c4 = st.columns(4)
        with c1:
            kpi_card("Connected models", f"{connected_count} / 4", "Current prototype")
        with c2:
            kpi_card("Completed assessments", str(len(active_results())), "Current session")
        with c3:
            priority = waste["priority"] if waste else "Waiting"
            kpi_card("Latest priority", priority, "From completed results")
        with c4:
            kpi_card("Planning areas", str(profile["districts"]), profile["city_name"])

        if waste:
            st.markdown(
                f"""
                <div class="cp-attention">
                    <div>
                        <div class="cp-attention-label">WHAT NEEDS ATTENTION NOW?</div>
                        <h3>{html.escape(waste['headline'])}</h3>
                        <p>{html.escape(waste['summary'])}</p>
                    </div>
                    <div class="cp-attention-status">{html.escape(waste['priority'])} priority</div>
                </div>
                """,
                unsafe_allow_html=True,
            )
        else:
            st.markdown(
                """
                <div class="cp-attention">
                    <div>
                        <div class="cp-attention-label">WHAT NEEDS ATTENTION NOW?</div>
                        <h3>Complete the first city assessment.</h3>
                        <p>CityPulse will replace technical model output with a clear priority, decision and action plan.</p>
                    </div>
                    <div class="cp-attention-status">Waiting</div>
                </div>
                """,
                unsafe_allow_html=True,
            )

    else:
        st.markdown(
            '<div class="cp-view-note"><strong>Analyst View:</strong> shows model readiness, completed runs and data-level details.</div>',
            unsafe_allow_html=True,
        )
        readiness = pd.DataFrame(
            [
                {
                    "Module": label,
                    "Model connected": "Yes" if module_found(key) else "No",
                    "Latest result": module_snapshot(key)[0],
                    "Updated": module_snapshot(key)[1],
                }
                for key, label in [
                    ("transportation", "Transportation"),
                    ("energy", "Energy"),
                    ("governance", "Public Services"),
                    ("waste", "Waste Management"),
                ]
            ]
        )
        st.dataframe(readiness, use_container_width=True, hide_index=True)
        if st.session_state.prediction_history:
            st.caption(f"Prediction runs in this session: {len(st.session_state.prediction_history)}")

    st.markdown("### Smart-city workspaces")
    selected = profile.get("selected_modules", [])
    workspace_cols = st.columns(4)
    workspace_data = [
        ("transportation", "Transportation", "🚦", "Anticipate higher-risk conditions and support safer mobility planning.", transportation_page_link),
        ("energy", "Energy", "⚡", "Forecast building demand and prepare for peak consumption periods.", energy_page_link),
        ("governance", "Public Services", "🏛️", "Identify service requests that may need earlier attention.", governance_page_link),
        ("waste", "Waste Planning", "♻️", "Forecast collection demand and turn it into an operational plan.", waste_page_link),
    ]

    for column, (module_key, title, icon, description, page_link) in zip(workspace_cols, workspace_data):
        with column:
            latest_status, latest_update = module_snapshot(module_key)
            status_class = "live" if module_found(module_key) else "waiting"
            module_card(icon, title, description, latest_status, status_class)
            st.markdown(
                f'<div class="cp-module-meta"><span>{html.escape(latest_status)}</span><span>{html.escape(latest_update)}</span></div>',
                unsafe_allow_html=True,
            )
            allowed = title in selected or (title == "Waste Planning" and "Waste Management" in selected)
            if allowed and st.button("Open workspace", key=f"open_{module_key}_workspace", use_container_width=True):
                st.switch_page(page_link)

    st.markdown("### City Action Center")
    st.caption("Review, prioritize and add notes to the next city actions.")
    render_action_center(limit=5)


def transportation_page():
    found = module_found("transportation")
    page_header(
        "🚦",
        "Transportation Planning",
        "Turn mobility and environmental conditions into a clear road-risk planning outlook.",
        "Model file found" if found else "Model not connected",
        "live" if found else "waiting",
    )

    empty_state(
        "🛣️",
        "Transportation experience is ready for model integration",
        "The stakeholder page will show the expected risk period, why it matters and the recommended monitoring action. Save the transportation bundle next, then connect its exact training features.",
    )

    col1, col2, col3 = st.columns(3)
    with col1:
        module_card("1", "What will happen?", "A simple risk outlook for the selected time and conditions.", "Stakeholder output")
    with col2:
        module_card("2", "Why does it matter?", "A short explanation of the main conditions linked to the result.", "Clear context")
    with col3:
        module_card("3", "What should the city do?", "A practical monitoring or safety-preparation action.", "Action plan")


def energy_page():
    found = module_found("energy")
    page_header(
        "⚡",
        "Building Energy Planning",
        "Prepare buildings for expected electricity demand and peak operating periods.",
        "Model file found" if found else "Model not connected",
        "live" if found else "waiting",
    )

    empty_state(
        "🏢",
        "Energy experience is ready for model integration",
        "After the energy bundle is connected, this page will present expected consumption, demand level and a short building action plan instead of raw model metrics.",
    )

    col1, col2, col3 = st.columns(3)
    with col1:
        module_card("01", "Demand outlook", "Expected electricity consumption in a clear unit.", "Forecast")
    with col2:
        module_card("02", "Operational meaning", "Whether the building should prepare for a normal or higher-demand period.", "Decision")
    with col3:
        module_card("03", "Suggested response", "Monitor, prepare, or review the building operation plan.", "Action")


def governance_page():
    found = module_found("governance")
    page_header(
        "🏛️",
        "Public Service Prioritization",
        "Help service teams identify requests that may require earlier attention.",
        "Model file found" if found else "Model not connected",
        "live" if found else "waiting",
    )

    empty_state(
        "📨",
        "Public-services experience is ready for model integration",
        "The final page will show the request priority, expected delay risk and the recommended review action. It will not expose technical classification metrics to stakeholders.",
    )

    col1, col2, col3 = st.columns(3)
    with col1:
        module_card("A", "Priority", "Normal handling or earlier review.", "Simple outcome")
    with col2:
        module_card("B", "Reason", "A clear explanation based on request conditions.", "Context")
    with col3:
        module_card("C", "Team action", "What the service department should review next.", "Action")


def waste_page():
    if WASTE_MODEL is None:
        page_header(
            "♻️",
            "Waste Planning",
            "Forecast monthly collection demand and prepare the right operational response.",
            "Model not connected",
            "waiting",
        )
        error = MODEL_ERRORS.get("waste")
        empty_state(
            "📦",
            "Add the waste model bundle",
            "Place waste_bundle.joblib inside citypulse_streamlit/models, then restart the application.",
        )
        if error:
            with st.expander("Technical loading error"):
                st.code(error)
        return

    page_header(
        "♻️",
        "Waste Planning",
        "Move from recent collection data to a clear monthly resource-planning decision.",
        "Live model",
        "live",
    )

    mode = segmented(
        "Waste workspace view",
        ["Executive View", "Analyst View"],
        key="view_mode",
        default="Executive View",
    )

    render_waste_stepper(st.session_state.waste_step)
    inputs = st.session_state.waste_inputs

    if st.session_state.waste_step == 1:
        with st.container(border=True):
            st.markdown("### Step 1 — Select the planning area")
            st.caption("Choose the local area the municipality wants to prepare for.")
            c1, c2 = st.columns(2)
            with c1:
                inputs["borough"] = st.selectbox(
                    "Borough",
                    ["Bronx", "Brooklyn", "Manhattan", "Queens", "Staten Island"],
                    index=["Bronx", "Brooklyn", "Manhattan", "Queens", "Staten Island"].index(inputs.get("borough", "Bronx")),
                )
            with c2:
                inputs["district"] = int(
                    st.number_input(
                        "Community district",
                        min_value=1,
                        max_value=20,
                        value=int(inputs.get("district", 1)),
                        step=1,
                    )
                )

            st.info(f"Planning area: {inputs['borough']} · District {inputs['district']}")
            if st.button("Continue to recent data", use_container_width=True, type="primary"):
                st.session_state.waste_step = 2
                st.rerun()

    elif st.session_state.waste_step == 2:
        with st.container(border=True):
            st.markdown("### Step 2 — Add recent collection data")
            st.caption("Use the actual waste collected in the last two months.")
            c1, c2 = st.columns(2)
            with c1:
                inputs["two_months"] = float(
                    st.number_input(
                        "Waste collected two months ago",
                        min_value=0.0,
                        value=float(inputs.get("two_months", 3900.0)),
                        step=50.0,
                        format="%.0f",
                    )
                )
            with c2:
                inputs["last_month"] = float(
                    st.number_input(
                        "Waste collected last month",
                        min_value=0.0,
                        value=float(inputs.get("last_month", 4000.0)),
                        step=50.0,
                        format="%.0f",
                    )
                )

            recent_change = inputs["last_month"] - inputs["two_months"]
            st.caption(f"Recent movement: {recent_change:+,.0f} tons")
            back, next_step = st.columns(2)
            with back:
                if st.button("Back", use_container_width=True):
                    st.session_state.waste_step = 1
                    st.rerun()
            with next_step:
                if st.button("Continue to forecast", use_container_width=True, type="primary"):
                    st.session_state.waste_step = 3
                    st.rerun()

    else:
        with st.container(border=True):
            st.markdown("### Step 3 — Review and generate the forecast")
            st.caption("Confirm the planning period, then let CityPulse create the decision brief.")
            c1, c2 = st.columns(2)
            with c1:
                month_options = list(calendar.month_name)[1:]
                inputs["month_name"] = st.selectbox(
                    "Forecast month",
                    month_options,
                    index=month_options.index(inputs.get("month_name", "January")),
                )
                month_number = month_options.index(inputs["month_name"]) + 1
            with c2:
                inputs["year"] = int(
                    st.number_input(
                        "Forecast year",
                        min_value=2000,
                        max_value=2035,
                        value=int(inputs.get("year", 2026)),
                        step=1,
                    )
                )

            st.markdown(
                f"""
                <div class="cp-result-grid">
                    <div class="cp-result-row"><small>Planning area</small><strong>{html.escape(inputs['borough'])} · District {inputs['district']}</strong></div>
                    <div class="cp-result-row"><small>Forecast period</small><strong>{html.escape(inputs['month_name'])} {inputs['year']}</strong></div>
                    <div class="cp-result-row"><small>Two months ago</small><strong>{inputs['two_months']:,.0f} tons</strong></div>
                    <div class="cp-result-row"><small>Last month</small><strong>{inputs['last_month']:,.0f} tons</strong></div>
                </div>
                """,
                unsafe_allow_html=True,
            )

            back, run = st.columns([1, 1.5])
            with back:
                if st.button("Back to recent data", use_container_width=True):
                    st.session_state.waste_step = 2
                    st.rerun()
            with run:
                run_forecast = st.button(
                    "Generate monthly decision brief",
                    use_container_width=True,
                    type="primary",
                )

        if run_forecast:
            try:
                with st.status("Preparing the city forecast...", expanded=True) as status:
                    status.write("Checking the district information")
                    time.sleep(0.25)
                    status.write("Running the waste-demand model")
                    result = run_waste_prediction(
                        borough=inputs["borough"],
                        district=int(inputs["district"]),
                        year=int(inputs["year"]),
                        month_number=int(month_number),
                        last_month=float(inputs["last_month"]),
                        two_months=float(inputs["two_months"]),
                    )
                    time.sleep(0.25)
                    status.write("Creating the stakeholder recommendation")
                    time.sleep(0.2)
                    status.update(label="Forecast ready", state="complete", expanded=False)

                st.session_state.waste_result = result
                st.session_state.prediction_history.append(result)
                add_waste_action_to_center()
                st.toast("Waste decision brief created", icon="✅")
            except Exception as error:
                st.error("The waste plan could not be generated.")
                with st.expander("Technical details"):
                    st.code(str(error))

    result = st.session_state.waste_result
    if not result:
        st.write("")
        empty_state(
            "🧭",
            "Complete the three planning steps",
            "The final result will focus on the decision, why it matters and the next city actions — not only the prediction number.",
        )
        return

    st.divider()

    if mode == "Executive View":
        st.markdown(
            f"""
            <div class="cp-decision">
                <div class="label">EXECUTIVE DECISION</div>
                <h2>{html.escape(result['headline'])}</h2>
                <p>{html.escape(result['summary'])}</p>
            </div>
            """,
            unsafe_allow_html=True,
        )

        st.markdown(
            f"""
            <div class="cp-result-grid">
                <div class="cp-result-row"><small>Forecast</small><strong>{result['prediction']:,.0f} tons</strong></div>
                <div class="cp-result-row"><small>Expected trend</small><strong>{result['change_percent']:+.1f}% from last month</strong></div>
                <div class="cp-result-row"><small>Priority</small><strong>{html.escape(result['priority'])}</strong></div>
                <div class="cp-result-row"><small>Main decision</small><strong>{html.escape(result['actions'][0][0])}</strong></div>
            </div>
            """,
            unsafe_allow_html=True,
        )

        st.markdown("### Recommended next actions")
        for index, (title, detail) in enumerate(result["actions"], start=1):
            action_item(index, title, detail)

        a1, a2, a3 = st.columns(3)
        with a1:
            if st.button("Add to Action Plan", use_container_width=True):
                add_waste_action_to_center()
        with a2:
            if st.button("Ask AI About This", use_container_width=True):
                waste_ai_dialog()
        with a3:
            if st.button("Create Executive Report", use_container_width=True):
                st.switch_page(reports_page_link)

    else:
        st.markdown(
            '<div class="cp-view-note"><strong>Analyst View:</strong> shows the full forecast inputs, demand movement and model information.</div>',
            unsafe_allow_html=True,
        )
        c1, c2, c3, c4 = st.columns(4)
        with c1:
            kpi_card("Forecast", f'{result["prediction"]:,.0f} tons', "Model output")
        with c2:
            kpi_card("Change", f'{result["change_percent"]:+.1f}%', f'{result["difference"]:+,.0f} tons')
        with c3:
            kpi_card("Model", result["model_name"], f"{len(WASTE_FEATURES)} features")
        with c4:
            kpi_card("Generated", result["created_at"], "Current session")

        left, right = st.columns([1.1, .9], gap="large")
        with left:
            with st.container(border=True):
                st.markdown("#### Demand movement")
                waste_chart(result)
        with right:
            with st.container(border=True):
                st.markdown("#### Assessment inputs")
                st.write(f"**Area:** {result['borough']} · District {result['district']}")
                st.write(f"**Forecast period:** {result['month_name']} {result['year']}")
                st.write(f"**Two months ago:** {result['two_months']:,.0f} tons")
                st.write(f"**Last month:** {result['last_month']:,.0f} tons")
                st.write(f"**Planning status:** {result['status']}")

    st.markdown("### Test a planning scenario")
    st.caption("This simulator tests an operational scenario. It does not change the machine-learning forecast.")
    with st.container(border=True):
        s1, s2, s3 = st.columns(3)
        with s1:
            increase = st.slider("Possible demand increase", 0, 30, 10, format="%d%%")
        with s2:
            workforce = st.selectbox("Workforce availability", ["Limited", "Normal", "Strong"], index=1)
        with s3:
            vehicle_capacity = st.selectbox("Vehicle capacity", ["Limited", "Current capacity", "Extra capacity"], index=1)

        scenario = scenario_outlook(result, increase, workforce, vehicle_capacity)
        st.markdown(
            f"""
            <div class="cp-scenario-result">
                <small>Scenario result</small>
                <h3 style="margin:7px 0;">{html.escape(scenario['status'])}</h3>
                <p style="color:var(--muted);margin:0;">{html.escape(scenario['detail'])}</p>
                <div class="cp-module-meta">
                    <span>Scenario volume: {scenario['volume']:,.0f} tons</span>
                    <span>{html.escape(scenario['level'])} planning pressure</span>
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    st.caption(
        f'Forecast generated using {result["model_name"]}. '
        "The model result and planning scenario require review with local operational data."
    )


# ---------------------------------------------------------
# AI ADVISOR
# ---------------------------------------------------------
def advisor_page():
    has_key = bool(get_openai_key())
    page_header(
        "✨",
        "AI City Advisor",
        "Turn completed city assessments into a clear explanation, priority or short action plan.",
        "AI connected" if has_key else "Smart guidance mode",
        "live",
    )

    if not active_results():
        empty_state(
            "💬",
            "Complete an assessment first",
            "The advisor only uses real results saved in the current CityPulse session. It does not invent city forecasts.",
        )
        return

    latest = st.session_state.waste_result
    if latest:
        st.markdown(
            f"""
            <div class="cp-attention">
                <div>
                    <div class="cp-attention-label">LATEST CONTEXT</div>
                    <h3>{html.escape(latest['borough'])}, District {latest['district']}</h3>
                    <p>{html.escape(latest['headline'])} · {html.escape(latest['month_name'])} {latest['year']}</p>
                </div>
                <div class="cp-attention-status">{html.escape(latest['priority'])}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    quick_prompts = [
        "What is the main city priority?",
        "Why does the latest result matter?",
        "Create a short action plan",
        "Explain this to a city manager",
    ]
    selected_prompt = pill_choice(
        "Quick advisor prompts",
        quick_prompts,
        key="advisor_quick_prompt",
        default=quick_prompts[0],
    )

    c1, c2 = st.columns([1, 2])
    with c1:
        use_prompt = st.button("Use selected question", use_container_width=True)
    with c2:
        custom_question = st.text_input(
            "Ask your own question",
            placeholder="What should the municipality prepare next?",
            label_visibility="collapsed",
        )

    for message in st.session_state.advisor_messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])
            if message.get("source"):
                st.caption(message["source"])

    user_question = st.chat_input("Ask CityPulse about the city")
    question = user_question or (custom_question if custom_question else None) or (selected_prompt if use_prompt else None)

    if question:
        st.session_state.advisor_messages.append({"role": "user", "content": question, "source": ""})

        with st.status("Reviewing the latest city results...", expanded=False) as status:
            answer, source = ask_city_advisor(question)
            status.update(label="Guidance ready", state="complete")

        st.session_state.advisor_messages.append({"role": "assistant", "content": answer, "source": source})
        st.rerun()

    if not has_key:
        st.info(
            "Smart guidance mode is active. It explains the saved model result using project rules without a paid AI API."
        )


# ---------------------------------------------------------
# REPORTS
# ---------------------------------------------------------
def reports_page():
    profile = st.session_state.city_profile
    results = active_results()

    page_header(
        "📄",
        "Executive Reports",
        "Turn completed assessments into a stakeholder-ready city summary.",
        f"{len(results)} assessment(s)",
    )

    c1, c2, c3 = st.columns(3)
    with c1:
        kpi_card("City", profile["city_name"], profile["country"])
    with c2:
        kpi_card("Completed assessments", str(len(results)), "Current session")
    with c3:
        kpi_card("Report status", "Ready" if results else "Waiting", "Requires at least one result")

    if not results:
        empty_state(
            "📋",
            "No report content yet",
            "Complete a smart-city assessment first. CityPulse will then create an executive summary and recommended actions.",
        )
        return

    waste = st.session_state.waste_result

    if waste:
        st.markdown("### Latest executive summary")
        st.markdown(
            f"""
            <div class="cp-card">
                <h3>{html.escape(waste['headline'])}</h3>
                <p>
                    The expected collection volume is <strong>{waste['prediction']:,.0f} tons</strong>
                    in {html.escape(waste['borough'])}, District {waste['district']}, for
                    {html.escape(waste['month_name'])} {waste['year']}.
                    The planning status is <strong>{html.escape(waste['status'])}</strong>.
                </p>
            </div>
            """,
            unsafe_allow_html=True,
        )

        for index, (title, text) in enumerate(waste["actions"], start=1):
            action_item(index, title, text)

    report_content = report_html()
    file_name = f"CityPulse_{profile['city_name'].replace(' ', '_')}_Report.html"

    st.download_button(
        "Download executive report",
        data=report_content,
        file_name=file_name,
        mime="text/html",
        use_container_width=True,
    )


# ---------------------------------------------------------
# PROFILE
# ---------------------------------------------------------
def profile_page():
    profile = st.session_state.city_profile

    page_header(
        "👤",
        "Workspace Profile",
        "Review the current user, city identity and strategic focus.",
        profile.get("role", "City user"),
    )

    left, right = st.columns(2, gap="large")

    with left:
        with st.container(border=True):
            st.markdown("### User")
            st.write(f'**Name:** {st.session_state.user_name}')
            st.write(f'**Email:** {st.session_state.user_email}')
            st.write(f'**Role:** {profile["role"]}')

    with right:
        with st.container(border=True):
            st.markdown("### City")
            st.write(f'**City:** {profile["city_name"]}')
            st.write(f'**Country:** {profile["country"]}')
            st.write(f'**Population:** {profile["population"]:,}')
            st.write(f'**Districts:** {profile["districts"]}')

    st.markdown("### Strategic focus")
    goals = profile.get("goals", [])
    if goals:
        columns = st.columns(2)
        for index, goal in enumerate(goals):
            columns[index % 2].success(goal)
    else:
        st.caption("No strategic goals selected.")

    c1, c2 = st.columns(2)
    with c1:
        if st.button("Edit city profile", use_container_width=True):
            st.session_state.profile_ready = False
            st.rerun()
    with c2:
        if st.button("Log out", use_container_width=True):
            for key, value in DEFAULT_STATE.items():
                st.session_state[key] = deepcopy(value)
            st.rerun()


# ---------------------------------------------------------
# ACCESS FLOW
# ---------------------------------------------------------
if not st.session_state.logged_in:
    login_page()
    st.stop()

if not st.session_state.profile_ready:
    city_profile_page()
    st.stop()


# ---------------------------------------------------------
# NAVIGATION
# ---------------------------------------------------------
home_page_link = st.Page(home_page, title="Home", icon="🏙️", default=True)
transportation_page_link = st.Page(transportation_page, title="Transportation", icon="🚦")
energy_page_link = st.Page(energy_page, title="Energy", icon="⚡")
governance_page_link = st.Page(governance_page, title="Public Services", icon="🏛️")
waste_page_link = st.Page(waste_page, title="Waste Planning", icon="♻️")
advisor_page_link = st.Page(advisor_page, title="AI Advisor", icon="✨")
reports_page_link = st.Page(reports_page, title="Reports", icon="📄")
profile_page_link = st.Page(profile_page, title="Profile", icon="👤")

pages = {
    "": [home_page_link],
    "Smart City Areas": [
        transportation_page_link,
        energy_page_link,
        governance_page_link,
        waste_page_link,
    ],
    "Decision Support": [advisor_page_link, reports_page_link, profile_page_link],
}

current_page = st.navigation(pages, position="top")
current_page.run()
