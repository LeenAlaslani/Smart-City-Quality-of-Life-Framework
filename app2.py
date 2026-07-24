"""
================================================================================
 SMART CITY READINESS PREDICTOR
 A business intelligence dashboard built on top of the best-performing model
 from `Smart_London_Urban_Risk_Predication.ipynb`.
================================================================================

WHAT THE UNDERLYING MODEL ACTUALLY DOES
----------------------------------------
The source notebook trains 4 regression models (LSTM, Feedforward Neural
Network, Random Forest, XGBoost) on ~158K hourly records that merge London
air-quality, weather, and bike-share/mobility data to predict
`collision_count` (road-traffic incidents per hour, per monitoring site).
It does NOT take "population / budget / internet penetration" as inputs --
those columns don't exist anywhere in the notebook.

The best model by RMSE/R2 is the FNN (Feedforward Neural Network):
    R2 = 0.8212 | RMSE = 1.0413 | MAE = 0.7190 | MSE = 1.0843

This app is honest about that: it uses the REAL trained features
(environmental quality, weather, mobility/infrastructure activity, and time
context) and reframes the model's output -- predicted incident/risk load --
into a business-friendly "Urban Risk Index" and a transparent, clearly
labeled "Estimated Years to Smart-City Readiness" heuristic. The heuristic
formula is disclosed in the UI and in code comments; it is NOT a raw model
output, since the model was never trained to predict "years."

REQUIRED MODEL ARTIFACTS (produced by extending the notebook's save step)
---------------------------------------------------------------------------
Place these in a `saved_models/` folder next to this file:
    - best_model.keras        (the trained FNN -- already saved in cell 70)
    - scaler.pkl               (joblib.dump(scaler, "scaler.pkl"))
    - pca.pkl                  (joblib.dump(pca, "pca.pkl"))
    - feature_columns.pkl      (joblib.dump(X.columns.tolist(), ...))
The notebook currently only saves the model itself, not the scaler/PCA/
column-order objects -- see the note at the end of my chat message for the
3-line addition needed. Without these files, the app runs in DEMO MODE
(clearly flagged in the UI) using a transparent placeholder formula so it
is still runnable and demonstrable end-to-end.
"""

import os
import joblib
import numpy as np
import pandas as pd
import streamlit as st

# ------------------------------------------------------------------------
# 1. PAGE CONFIG -- must be the first Streamlit call
# ------------------------------------------------------------------------
st.set_page_config(
    page_title="Smart City Readiness Predictor",
    page_icon="🏙️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ------------------------------------------------------------------------
# 1b. THEME / STYLING -- dark "smart home / smart city" palette requested
#     by the user: deep charcoal-navy background, mint accent, warm cream
#     accent, white text. Applied via scoped CSS. Purely cosmetic -- no
#     effect on model logic below.
# ------------------------------------------------------------------------
BG1 = "#131321"          # page background (top)
BG2 = "#1B1B2E"          # page background (bottom)
SIDEBAR_BG1 = "#0F0F1C"  # sidebar gradient (top)
SIDEBAR_BG2 = "#181829"  # sidebar gradient (bottom)
CARD_BG = "#1E1E33"      # KPI card surface
TRACK_BG = "#2A2A40"     # gauge track background
MINT = "#46F0D2"         # primary accent
MINT_DEEP = "#22C9AE"    # deeper mint for gradients/hover
CREAM = "#FBE2B4"        # secondary/warm accent
WHITE = "#FFFFFF"
MUTED = "#9A9AB8"        # secondary text on dark surfaces
ALERT = "#FF6F91"        # high-risk indicator (not in source palette, needed for red/amber/green semantics)

st.markdown(
    f"""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&family=Inter:wght@400;500;600&display=swap');

    html, body, [class*="css"] {{
        font-family: 'Inter', sans-serif;
    }}

    .stApp {{
        background: linear-gradient(180deg, {BG1} 0%, {BG2} 100%);
    }}

    /* Readable light text across the dark background */
    .stApp, .stApp p, .stApp li, .stApp span, .stApp label,
    [data-testid="stCaptionContainer"] {{
        color: #E8E8F5;
    }}
    .stApp h1, .stApp h2, .stApp h3, .stApp h4 {{ color: {WHITE}; }}

    /* ---- Header banner (mint hero card, like the reference weather tile) ---- */
    .sc-header {{
        background: linear-gradient(135deg, {MINT} 0%, {MINT_DEEP} 100%);
        padding: 2rem 2.4rem;
        border-radius: 18px;
        margin-bottom: 1.6rem;
        box-shadow: 0 10px 28px rgba(70,240,210,0.25);
    }}
    .sc-header h1 {{
        font-family: 'Poppins', sans-serif;
        font-weight: 700;
        font-size: 2.1rem;
        margin: 0 0 0.35rem 0;
        color: {BG1};
    }}
    .sc-header p {{
        color: #1E2A38;
        font-size: 1.02rem;
        margin: 0;
        opacity: 0.85;
    }}

    /* ---- Metric / KPI cards ---- */
    .metric-card {{
        background: {CARD_BG};
        border-radius: 14px;
        padding: 1.15rem 1.3rem;
        box-shadow: 0 4px 16px rgba(0,0,0,0.35);
        height: 100%;
        border-left: 5px solid {MINT};
    }}
    .metric-icon {{ font-size: 1.5rem; margin-bottom: 0.25rem; }}
    .metric-label {{
        font-size: 0.78rem; color: {MUTED}; font-weight: 700;
        text-transform: uppercase; letter-spacing: 0.04em;
    }}
    .metric-value {{
        font-family: 'Poppins', sans-serif; font-weight: 700;
        font-size: 1.85rem; margin: 0.15rem 0; color: {WHITE};
    }}
    .metric-sub {{ font-size: 0.8rem; color: {MUTED}; }}

    /* ---- Gauge ---- */
    .gauge-label {{ font-weight: 600; color: {MUTED}; font-size: 0.9rem; }}
    .gauge-track {{
        background: {TRACK_BG}; border-radius: 20px; height: 16px;
        overflow: hidden; margin: 0.4rem 0 0.25rem 0;
    }}
    .gauge-fill {{ height: 100%; border-radius: 20px; transition: width 0.6s ease; }}
    .gauge-value {{ font-weight: 700; font-size: 0.85rem; text-align: right; }}

    /* ---- Sidebar ---- */
    section[data-testid="stSidebar"] {{
        background: linear-gradient(180deg, {SIDEBAR_BG1} 0%, {SIDEBAR_BG2} 100%);
    }}
    section[data-testid="stSidebar"] * {{ color: #EDEDF7 !important; }}
    section[data-testid="stSidebar"] .stSlider [data-baseweb="slider"] div[role="slider"] {{
        background-color: {MINT} !important;
    }}

    /* ---- Buttons ---- */
    .stButton > button[kind="primary"] {{
        background: linear-gradient(135deg, {MINT} 0%, {MINT_DEEP} 100%);
        border: none; border-radius: 10px; font-weight: 700; color: {BG1} !important;
        box-shadow: 0 4px 14px rgba(70,240,210,0.35);
    }}
    .stButton > button[kind="primary"]:hover {{
        background: linear-gradient(135deg, {MINT_DEEP} 0%, {MINT} 100%);
    }}

    /* ---- Tabs ---- */
    button[data-baseweb="tab"] {{ font-weight: 600; font-size: 1rem; color: {MUTED}; }}
    button[data-baseweb="tab"][aria-selected="true"] {{ color: {MINT} !important; }}

    /* ---- Charts & tables keep a light card so their default dark text stays readable ---- */
    div[data-testid^="stVegaLiteChart"], div[data-testid="stDataFrame"] {{
        background: {WHITE};
        border-radius: 14px;
        padding: 0.6rem;
    }}
    </style>
    """,
    unsafe_allow_html=True,
)


def metric_card(icon: str, label: str, value: str, sub: str = "", color: str = MINT):
    """Render a styled KPI card (replaces plain st.metric for a business look)."""
    st.markdown(
        f"""
        <div class="metric-card" style="border-left-color:{color};">
            <div class="metric-icon">{icon}</div>
            <div class="metric-label">{label}</div>
            <div class="metric-value" style="color:{color};">{value}</div>
            <div class="metric-sub">{sub}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_gauge(value: float, label: str = "Urban Risk Index"):
    """Render a color-coded (mint/cream/alert) gauge bar for the risk score."""
    color = MINT if value < 33 else (CREAM if value < 66 else ALERT)
    st.markdown(
        f"""
        <div class="gauge-label">{label}</div>
        <div class="gauge-track"><div class="gauge-fill" style="width:{value}%; background:{color};"></div></div>
        <div class="gauge-value" style="color:{color};">{value} / 100</div>
        """,
        unsafe_allow_html=True,
    )


# ------------------------------------------------------------------------
# 2. CONSTANTS -- ground-truth numbers pulled directly from the notebook
#    (dataset size, feature counts, and the full model comparison table).
#    Keeping these as named constants means the "Model Details" tab always
#    reflects what was actually measured during training.
# ------------------------------------------------------------------------
BEST_MODEL_NAME = "Feedforward Neural Network (FNN)"
BEST_MODEL_SHORT = "FNN"

DATASET_ROWS = 157_896                 # merged hourly records, London 2015-2017
DATASET_RAW_COLUMNS = 39               # engineered dataset before modeling prep
DATASET_FEATURES_ORIGINAL = 53         # after one-hot encoding, pre-PCA
DATASET_FEATURES_PCA = 23              # principal components kept (95% variance target)
PCA_VARIANCE_EXPLAINED = 0.96
TRAIN_TEST_SPLIT = "80% train / 20% test"
DATE_RANGE = "4 Jan 2015 – 3 Jan 2017 (hourly, Greater London)"

# Full model comparison table (sorted by RMSE, best first) -- from the notebook
MODEL_COMPARISON = pd.DataFrame(
    [
        {"Model": "FNN",           "MAE": 0.7190, "MSE": 1.0843, "RMSE": 1.0413, "R2": 0.8212},
        {"Model": "LSTM",          "MAE": 0.6311, "MSE": 1.1468, "RMSE": 1.0709, "R2": 0.8109},
        {"Model": "XGBoost",       "MAE": 0.8051, "MSE": 1.6584, "RMSE": 1.2878, "R2": 0.7265},
        {"Model": "Random Forest", "MAE": 1.1713, "MSE": 2.9575, "RMSE": 1.7197, "R2": 0.5123},
    ]
)

# The 9 DEFRA/AURN air-quality monitoring sites used in the notebook, with
# approximate coordinates (used to auto-fill lat/lon; user can override).
LONDON_SITES = {
    "London Bexley": (51.4660, 0.1845),
    "London Bloomsbury": (51.5222, -0.1258),
    "London Eltham": (51.4526, 0.0708),
    "London Haringey Priory Park South": (51.5841, -0.1253),
    "London Harlington": (51.4888, -0.4419),
    "London Hillingdon": (51.4966, -0.4600),
    "London Marylebone Road": (51.5225, -0.1546),
    "London N. Kensington": (51.5211, -0.2133),
    "London Westminster": (51.4946, -0.1319),
}

SEASONS = ["Winter", "Spring", "Summer", "Autumn"]
SAVE_FOLDER = "saved_models"


# ------------------------------------------------------------------------
# 3. LOAD MODEL ARTIFACTS (cached so it only runs once per session)
#    Falls back to DEMO MODE if the real artifacts aren't present, so the
#    app is always runnable for review/demo purposes.
# ------------------------------------------------------------------------
@st.cache_resource(show_spinner="Loading trained model...")
def load_artifacts():
    model_path = os.path.join(SAVE_FOLDER, "best_model.keras")
    scaler_path = os.path.join(SAVE_FOLDER, "scaler.pkl")
    pca_path = os.path.join(SAVE_FOLDER, "pca.pkl")
    cols_path = os.path.join(SAVE_FOLDER, "feature_columns.pkl")

    required = [model_path, scaler_path, pca_path, cols_path]
    if not all(os.path.exists(p) for p in required):
        return None  # -> triggers demo mode

    try:
        import tensorflow as tf  # imported lazily so app still boots without it

        model = tf.keras.models.load_model(model_path)
        scaler = joblib.load(scaler_path)
        pca = joblib.load(pca_path)
        feature_columns = joblib.load(cols_path)
        return {"model": model, "scaler": scaler, "pca": pca, "columns": feature_columns}
    except Exception as e:
        st.warning(f"Found model files but couldn't load them ({e}). Running in demo mode.")
        return None


ARTIFACTS = load_artifacts()
DEMO_MODE = ARTIFACTS is None


# ------------------------------------------------------------------------
# 4. FEATURE ENGINEERING -- turns sidebar inputs into the exact row shape
#    the model was trained on (raw features -> one-hot -> scale -> PCA).
# ------------------------------------------------------------------------
def build_raw_feature_row(inputs: dict) -> pd.DataFrame:
    """Assemble a single-row dataframe matching the notebook's pre-encoding schema."""
    row = {
        # air quality
        "air_co": inputs["air_co"], "air_nox": inputs["air_nox"],
        "air_no2": inputs["air_no2"], "air_no": inputs["air_no"],
        "air_o3": inputs["air_o3"], "air_air_temp": inputs["air_air_temp"],
        # location
        "latitude": inputs["latitude"], "longitude": inputs["longitude"],
        "site": inputs["site"],
        # weather
        "weather_tavg": inputs["weather_tavg"], "weather_tmin": inputs["weather_tmin"],
        "weather_tmax": inputs["weather_tmax"], "weather_prcp": inputs["weather_prcp"],
        "weather_wdir": inputs["weather_wdir"], "weather_wspd": inputs["weather_wspd"],
        "weather_pres": inputs["weather_pres"],
        # mobility / infrastructure activity
        "bike_cnt": inputs["bike_cnt"], "bike_t1": inputs["weather_tavg"],
        "bike_t2": inputs["weather_tavg"], "bike_hum": inputs["bike_hum"],
        "bike_wind_speed": inputs["weather_wspd"], "bike_weather_code": inputs["bike_weather_code"],
        "bike_is_holiday": int(inputs["is_holiday"]),
        # temporal context
        "year": inputs["year"], "month": inputs["month"], "day": inputs["day"],
        "hour": inputs["hour"], "day_of_week": inputs["day_of_week"],
        "is_weekend": int(inputs["is_weekend"]), "season": inputs["season"],
    }
    return pd.DataFrame([row])


def preprocess_for_model(raw_row: pd.DataFrame, feature_columns: list) -> np.ndarray:
    """One-hot encode, then align columns to the exact training-time layout."""
    categorical_cols = raw_row.select_dtypes(include="object").columns
    encoded = pd.get_dummies(raw_row, columns=categorical_cols, dtype=int)
    # any column the model expects but this row doesn't have (e.g. a site
    # that wasn't selected) gets filled with 0 -- standard safe alignment
    aligned = encoded.reindex(columns=feature_columns, fill_value=0)
    return aligned.values


def predict_incident_load(inputs: dict):
    """
    Returns (predicted_value, mode) where mode is 'model' or 'demo'.
    predicted_value approximates the model's target: expected collision /
    incident count for the given hour and conditions (higher = more urban
    stress / less "smart" traffic management).
    """
    if not DEMO_MODE:
        raw_row = build_raw_feature_row(inputs)
        X = preprocess_for_model(raw_row, ARTIFACTS["columns"])
        X_scaled = ARTIFACTS["scaler"].transform(X)
        X_pca = ARTIFACTS["pca"].transform(X_scaled)
        pred = float(ARTIFACTS["model"].predict(X_pca, verbose=0).ravel()[0])
        return max(pred, 0.0), "model"

    # ---- DEMO MODE fallback ----
    # Transparent placeholder: a small weighted heuristic using the same
    # inputs, calibrated roughly to the training target's scale (mean
    # collision_count is low, single digits per hour). This exists ONLY so
    # the dashboard is runnable without the real .keras/scaler/pca files;
    # it is clearly labeled in the UI and is not a trained model.
    rush_hour_bump = 1.4 if inputs["hour"] in (7, 8, 9, 16, 17, 18) else 0.0
    weekday_bump = 0.6 if not inputs["is_weekend"] else 0.0
    traffic_proxy = inputs["bike_cnt"] / 400.0
    pollution_proxy = (inputs["air_no2"] + inputs["air_nox"]) / 120.0
    weather_penalty = 0.4 if inputs["weather_prcp"] > 2 else 0.0
    pred = 0.6 + rush_hour_bump + weekday_bump + traffic_proxy + pollution_proxy + weather_penalty
    return max(pred, 0.0), "demo"


# ------------------------------------------------------------------------
# 5. BUSINESS-LAYER TRANSLATION
#    Converts the model's raw predicted incident load into the two
#    business KPIs the stakeholder asked for: a 0-100 Urban Risk Index and
#    an "Estimated Years to Smart-City Readiness". This conversion is a
#    documented heuristic, not a model output -- disclosed in the UI.
# ------------------------------------------------------------------------
RISK_CEILING = 5.0   # predicted incidents/hour treated as "maximum stress" for scaling
MIN_YEARS, MAX_YEARS = 2.0, 20.0


def compute_business_kpis(predicted_load: float):
    risk_index = min(predicted_load / RISK_CEILING, 1.0) * 100
    years_to_smart_city = MIN_YEARS + (risk_index / 100) * (MAX_YEARS - MIN_YEARS)
    confidence_pct = MODEL_COMPARISON.loc[
        MODEL_COMPARISON["Model"] == BEST_MODEL_SHORT, "R2"
    ].iloc[0] * 100
    return {
        "risk_index": round(risk_index, 1),
        "years": round(years_to_smart_city, 1),
        "confidence_pct": round(confidence_pct, 1),
    }


# ------------------------------------------------------------------------
# 6. SIDEBAR -- all user inputs, grouped into business-friendly categories
# ------------------------------------------------------------------------
with st.sidebar:
    st.header("🏙️ City / Area Inputs")
    st.caption("Enter conditions for the area and time you want to evaluate.")

    site = st.selectbox("Monitoring Site / Area", list(LONDON_SITES.keys()))
    default_lat, default_lon = LONDON_SITES[site]

    with st.expander("📍 Location", expanded=False):
        latitude = st.number_input("Latitude", value=default_lat, format="%.4f")
        longitude = st.number_input("Longitude", value=default_lon, format="%.4f")

    with st.expander("🌫️ Environmental Quality Indicators", expanded=True):
        air_no2 = st.slider("NO₂ (µg/m³)", 0.0, 150.0, 45.0)
        air_nox = st.slider("NOx (µg/m³)", 0.0, 250.0, 70.0)
        air_no = st.slider("NO (µg/m³)", 0.0, 150.0, 15.0)
        air_o3 = st.slider("O₃ (µg/m³)", 0.0, 100.0, 20.0)
        air_co = st.slider("CO (mg/m³)", 0.0, 2.0, 0.35)
        air_air_temp = st.slider("Ambient Air Temp (°C)", -5.0, 35.0, 12.0)

    with st.expander("🌦️ Weather Conditions", expanded=False):
        weather_tavg = st.slider("Avg Temperature (°C)", -5.0, 35.0, 12.0)
        weather_tmin = st.slider("Min Temperature (°C)", -10.0, 30.0, 8.0)
        weather_tmax = st.slider("Max Temperature (°C)", -5.0, 40.0, 16.0)
        weather_prcp = st.slider("Precipitation (mm)", 0.0, 30.0, 1.0)
        weather_wdir = st.slider("Wind Direction (°)", 0, 360, 180)
        weather_wspd = st.slider("Wind Speed (km/h)", 0.0, 60.0, 15.0)
        weather_pres = st.slider("Pressure (hPa)", 980.0, 1040.0, 1013.0)

    with st.expander("🚲 Mobility & Infrastructure Activity", expanded=False):
        bike_cnt = st.slider("Bike-Share Trips (hourly count)", 0, 2000, 400)
        bike_hum = st.slider("Humidity (%)", 0, 100, 65)
        bike_weather_code = st.slider("Local Weather Code (met station)", 1, 26, 3)
        is_holiday = st.checkbox("Public Holiday", value=False)

    with st.expander("🕒 Temporal Context", expanded=True):
        eval_date = st.date_input("Date")
        hour = st.slider("Hour of Day", 0, 23, 8)
        is_weekend = eval_date.weekday() >= 5
        day_of_week = eval_date.weekday()
        month = eval_date.month
        season = SEASONS[(month % 12) // 3]

    st.divider()
    run_prediction = st.button("🔮 Run Smart City Prediction", type="primary", use_container_width=True)

    if DEMO_MODE:
        st.warning(
            "⚠️ Running in **DEMO MODE** — trained model artifacts "
            "(`best_model.keras`, `scaler.pkl`, `pca.pkl`, `feature_columns.pkl`) "
            "were not found in `saved_models/`. Predictions use a placeholder "
            "formula until the real files are added.",
            icon="⚠️",
        )

inputs = dict(
    site=site, latitude=latitude, longitude=longitude,
    air_no2=air_no2, air_nox=air_nox, air_no=air_no, air_o3=air_o3,
    air_co=air_co, air_air_temp=air_air_temp,
    weather_tavg=weather_tavg, weather_tmin=weather_tmin, weather_tmax=weather_tmax,
    weather_prcp=weather_prcp, weather_wdir=weather_wdir, weather_wspd=weather_wspd,
    weather_pres=weather_pres, bike_cnt=bike_cnt, bike_hum=bike_hum,
    bike_weather_code=bike_weather_code, is_holiday=is_holiday,
    year=eval_date.year, month=month, day=eval_date.day, hour=hour,
    day_of_week=day_of_week, is_weekend=is_weekend, season=season,
)

# ------------------------------------------------------------------------
# 7. MAIN DASHBOARD LAYOUT
# ------------------------------------------------------------------------
st.markdown(
    """
    <div class="sc-header">
        <h1>🏙️ Smart City Readiness Predictor</h1>
        <p>A business decision-support tool that estimates how far an area is from
        'smart city' readiness, based on real-time environmental, weather, and
        urban mobility conditions.</p>
    </div>
    """,
    unsafe_allow_html=True,
)

tab_predict, tab_model = st.tabs(["📊 Prediction Dashboard", "🧠 Model Details"])

# ---------------------- TAB 1: PREDICTION DASHBOARD ----------------------
with tab_predict:
    if not run_prediction:
        st.info(
            "👈 Set the area's conditions in the sidebar, then click "
            "**Run Smart City Prediction** to generate a readiness estimate.",
            icon="👈",
        )
    else:
        predicted_load, mode = predict_incident_load(inputs)
        kpi = compute_business_kpis(predicted_load)

        st.subheader(f"Results for {site}")
        if mode == "demo":
            st.caption("Showing DEMO MODE estimate (placeholder formula, not the trained model).")

        # ---- Metric cards ----
        # c0 shows the model's actual raw prediction (collision_count) front
        # and center, clearly labeled, before the derived business KPIs.
        c0, c1, c2, c3, c4 = st.columns(5)
        with c0:
            metric_card(
                "🚧", "Predicted Collisions / Hour", f"{predicted_load:.2f}",
                "raw model output (target: collision_count)", color=CREAM,
            )
        with c1:
            metric_card("⏳", "Est. Years to Smart City", f"{kpi['years']} yrs", color=CREAM)
        with c2:
            metric_card("🎯", "Model Confidence (R²)", f"{kpi['confidence_pct']}%", color=MINT)
        with c3:
            risk_color = MINT if kpi["risk_index"] < 33 else (CREAM if kpi["risk_index"] < 66 else ALERT)
            metric_card("⚠️", "Urban Risk Index", f"{kpi['risk_index']} / 100", color=risk_color)
        with c4:
            metric_card("📚", "Training Dataset Size", f"{DATASET_ROWS:,}", "records", color=WHITE)

        st.divider()

        left, right = st.columns([1.3, 1])

        with left:
            st.markdown("### 📝 Summary for Decision-Makers")
            st.markdown(
                f"""
Based on the current environmental, weather, and mobility conditions entered
for **{site}**, the model's raw prediction — the actual `collision_count`
target it was trained on — is **{predicted_load:.2f} collisions/hour**.
That number is translated into an **Urban Risk Index of
{kpi['risk_index']}/100** for easier business interpretation.

Using this signal, the tool estimates the area is roughly
**{kpi['years']} years away from smart-city-level infrastructure
readiness** — a shorter estimate means current traffic, environmental, and
mobility patterns already resemble a well-optimized, low-risk urban system;
a longer estimate flags a bigger investment gap.

This estimate carries the trained model's overall confidence level of
**{kpi['confidence_pct']}%** (R² on held-out test data), meaning the model
explains about {kpi['confidence_pct']}% of the variation seen historically
in real London traffic-incident data.

*Note: "Years to smart city" is a business-layer conversion of the model's
risk prediction using a transparent formula (see Model Details tab) — it is
not a number the model directly predicts.*
                """
            )

        with right:
            st.markdown("### ⚠️ Risk Index Gauge")
            render_gauge(kpi["risk_index"])

# ---------------------- TAB 2: MODEL DETAILS ----------------------
# Written for a non-technical business stakeholder first; exact statistical
# terms (R2, RMSE, MAE) are kept available in a collapsed technical section
# for anyone who wants them, rather than driving the main page.
with tab_model:
    r2 = MODEL_COMPARISON.iloc[0]["R2"]
    rmse = MODEL_COMPARISON.iloc[0]["RMSE"]
    mae = MODEL_COMPARISON.iloc[0]["MAE"]
    mse = MODEL_COMPARISON.iloc[0]["MSE"]

    st.subheader("🧠 How This Model Works")
    m1, m2, m3, m4 = st.columns(4)
    with m1:
        metric_card("🤖", "Prediction Method", "Neural Network", "an AI model that learns from patterns in historical data", color=WHITE)
    with m2:
        metric_card("🎯", "Accuracy", f"{r2*100:.0f}%", "how closely predictions match real, historical outcomes", color=MINT)
    with m3:
        metric_card("📏", "Typical Error", f"± {rmse:.1f}", "collisions/hour off, on a typical prediction", color=CREAM)
    with m4:
        metric_card("✅", "Best-Case Error", f"± {mae:.1f}", "collisions/hour off, in the average case", color=CREAM)

    st.markdown(
        f"""
### 💬 In plain terms

Think of this model as a very experienced traffic analyst who has reviewed
**{DATASET_ROWS:,} hours** of real London data — air quality, weather, and
bike/mobility activity — and learned to spot the conditions that come before
a rise in traffic incidents.

**How much can you trust it?** Out of 100 real situations it's tested against,
its predictions land close to what actually happened about **{r2*100:.0f} times**.
Its typical estimate is off by roughly **{rmse:.1f} incident(s) per hour** —
a tight margin for hour-by-hour forecasting.

**Why this specific model?** Four different prediction approaches were
built and tested side by side. This one — a Neural Network — was kept
automatically because it made the most accurate predictions on data it
had never seen before, beating the other three.
        """
    )

    with st.expander("🔧 Technical specification (for data / engineering teams)"):
        st.markdown(
            f"""
- **Model type:** Feedforward Neural Network (FNN) — Keras / TensorFlow
- **Architecture:** `Dense(160, tanh) → Dense(40, tanh) → Dense(1)`, Adam optimizer, early stopping on validation loss
- **Target variable:** `collision_count` — hourly road-traffic collisions per monitoring site
- **R² Score:** {r2:.4f}
- **RMSE:** {rmse:.4f}
- **MAE:** {mae:.4f}
- **MSE:** {mse:.4f}
            """
        )

    st.divider()
    st.subheader("📚 What Data Trained This Model")
    d1, d2, d3 = st.columns(3)
    with d1:
        metric_card("📊", "Training Examples", f"{DATASET_ROWS:,}", "hourly observations across London", color=WHITE)
    with d2:
        metric_card("🧩", "Data Points Considered", str(DATASET_FEATURES_ORIGINAL), "signals reviewed per prediction", color=MINT)
    with d3:
        metric_card("🗜️", "Simplified To", str(DATASET_FEATURES_PCA), f"core signals, keeping {PCA_VARIANCE_EXPLAINED:.0%} of the insight", color=CREAM)

    st.markdown(
        f"""
To keep the model fast and reliable, the **{DATASET_FEATURES_ORIGINAL} original
data points** were mathematically compressed into **{DATASET_FEATURES_PCA} core
signals** that retain **{PCA_VARIANCE_EXPLAINED:.0%}** of the meaningful
information — similar to summarizing a long report into its key takeaways
without losing the message.

**Time period covered:** {DATE_RANGE}
**How it was tested:** {TRAIN_TEST_SPLIT} — the model was checked against
data it never saw during training, not just graded on what it memorized.
        """
    )

    st.markdown("**What kind of data feeds this model:**")
    st.markdown(
        """
- 🌫️ **Environmental quality** — air pollution levels (NO₂, NOx, NO, O₃, CO) and ambient temperature
- 🌦️ **Weather** — temperature, rainfall, wind, and air pressure
- 🚲 **Mobility & infrastructure activity** — bike-share usage, humidity, local weather conditions, holidays
- 🕒 **Time context** — hour, day of week, month, season
- 📍 **Location** — monitoring site, latitude, longitude
        """
    )

    st.divider()
    st.caption(
        "Data sources: DEFRA AURN UK air quality (2015-2023), London bike-share "
        "dataset, London weather (2000-2023), and UK road safety accident records — "
        "merged and filtered to a common London date range for training."
    )