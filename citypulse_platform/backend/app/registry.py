"""
CityPulse AI — Model Registry.

Single source of truth for the four real project models: what they are, the
dataset they were trained on, their target, inputs, units, thresholds and
documented limitations. Every intelligence result the platform produces is
traceable back to one of these entries.

Metrics (R2, F1, MAE, ...) are read from the training notebooks and attached in
the Model & Data Evidence area; where a value has not yet been extracted from a
notebook it is left as None rather than fabricated.
"""
from __future__ import annotations

from dataclasses import dataclass, field, asdict
from typing import Dict, List, Optional

# The four connected decision domains (not four separate tools).
DOMAINS = ["mobility", "energy", "governance", "waste"]

DOMAIN_LABELS = {
    "mobility": "Transportation & Mobility",
    "energy": "Energy & Sustainable Buildings",
    "governance": "Governance & Digital Services",
    "waste": "Environment & Waste Management",
}


@dataclass
class ModelMetric:
    name: str
    value: Optional[float] = None      # None = not yet extracted from notebook
    note: str = ""


@dataclass
class ModelEntry:
    domain: str
    bundle_file: str
    display_name: str
    algorithm: str
    task: str                          # regression | classification | hurdle
    target: str
    target_unit: str
    dataset_name: str
    dataset_origin: str                # geography of the training data
    dataset_note: str                  # transferability / localization note
    key_features: List[str]
    n_features: int
    threshold: Optional[float] = None
    version: str = "1.0.0"
    metrics: List[ModelMetric] = field(default_factory=list)
    limitations: List[str] = field(default_factory=list)
    notebook: str = ""
    # runtime status, filled by the integration layer
    deployed: bool = False
    last_inference_ok: Optional[bool] = None
    load_error: str = ""

    def public(self) -> dict:
        d = asdict(self)
        d["domain_label"] = DOMAIN_LABELS[self.domain]
        return d


# ---- The real project models --------------------------------------------
REGISTRY: Dict[str, ModelEntry] = {
    "mobility": ModelEntry(
        domain="mobility",
        bundle_file="transportation_bundle.joblib",
        display_name="Urban Mobility Risk (Hurdle)",
        algorithm="LightGBM two-stage hurdle (classifier + regressor)",
        task="hurdle",
        target="collision_count",
        target_unit="expected collisions",
        dataset_name="London urban road-risk dataset (air quality, weather, cycle hire, collisions)",
        dataset_origin="Greater London, United Kingdom",
        dataset_note=("Trained on London conditions. Presented as transferable, "
                      "model-supported operational intelligence — not a verified "
                      "Saudi forecast. Localization with Saudi municipal data is a "
                      "documented future requirement."),
        key_features=["air_nox", "air_no2", "weather_tavg", "weather_prcp",
                      "bike_cnt", "hour", "season", "site_type"],
        n_features=53,
        threshold=0.5,
        notebook="Smart_London_Urban_Risk_Predication.ipynb",
        limitations=[
            "Trained on London road, weather and air-quality patterns.",
            "Two-stage hurdle: P(any collision) x expected count.",
            "Exposure (traffic volume) is applied by the platform, not the model.",
        ],
    ),
    "energy": ModelEntry(
        domain="energy",
        bundle_file="energy_bundle.joblib",
        display_name="Building Electricity Demand",
        algorithm="HistGradient Boosting Regressor",
        task="regression",
        target="electricity_consumption",
        target_unit="kWh (per building-hour)",
        dataset_name="Building energy meter dataset (buildings, site, usage, weather)",
        dataset_origin="International building-energy dataset",
        dataset_note=("Trained on non-Saudi buildings. Used for relative demand "
                      "intelligence; absolute kWh should be recalibrated on Saudi "
                      "building stock before operational use."),
        key_features=["primaryspaceusage", "sqm", "airTemperature", "hour",
                      "month", "is_weekend", "temperature_squared"],
        n_features=14,
        notebook="Smart_Energy_and_Sustainable_Buildings (1).ipynb",
        limitations=[
            "Absolute consumption reflects the training building stock.",
            "Temperature is a dominant driver (cooling / heating load).",
        ],
    ),
    "governance": ModelEntry(
        domain="governance",
        bundle_file="governance_bundle.joblib",
        display_name="Service Request Delay Risk",
        algorithm="Random Forest Classifier",
        task="classification",
        target="delayed_request",
        target_unit="probability of delayed resolution",
        dataset_name="Municipal 311 service-request dataset (agency, complaint type, timing)",
        dataset_origin="New York City, USA (311)",
        dataset_note=("Trained on NYC 311 operations. Delay dynamics transfer as "
                      "operational intelligence; Saudi service catalogues and SLAs "
                      "should replace NYC agencies/types for local use."),
        key_features=["agency", "complaint_type", "hour", "day_of_week",
                      "is_weekend", "month"],
        n_features=317,
        threshold=0.5,
        notebook="Smart_Governance_and_Digital_Services.ipynb",
        limitations=[
            "Positive class = 'High Delay Risk' (resolution beyond ~6.08 days).",
            "Request mix (complaint types) is the strongest driver of delay.",
        ],
    ),
    "waste": ModelEntry(
        domain="waste",
        bundle_file="waste_bundle.joblib",
        display_name="Monthly Waste Demand",
        algorithm="Extra Trees Regressor",
        task="regression",
        target="waste_tons",
        target_unit="tons per month",
        dataset_name="Municipal monthly waste tonnage by district",
        dataset_origin="New York City, USA (DSNY)",
        dataset_note=("Trained on NYC district tonnage. Demand behaviour transfers; "
                      "Saudi collection zones and per-capita rates should be "
                      "substituted for operational planning."),
        key_features=["waste_last_month", "waste_2_months_ago", "borough",
                      "communitydistrict", "month_number", "year"],
        n_features=25,
        notebook="Smart_Waste_Collection_Demand_Prediction.ipynb",
        limitations=[
            "Uses recent-month lags; needs history to project forward.",
            "District structure follows the NYC borough/community-district schema.",
        ],
    ),
}


def registry_public() -> List[dict]:
    return [REGISTRY[d].public() for d in DOMAINS]
