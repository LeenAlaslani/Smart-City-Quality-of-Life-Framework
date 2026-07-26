"""
CityPulse AI — Shared model adapter.

This is the single bridge between a plain-language `CityProfile` and the four
trained ML bundles. Every model is loaded once and driven through ONE method,
`read_city()`, which returns a unified `CityReading` — four systems described
on the same 0-100 "pressure" scale plus a human status. Nothing in the UI ever
talks to a model directly; it only ever sees a CityReading.

Design principles
-----------------
* One adapter, four models, one output shape  → the app feels like one city,
  not four separate prediction tools.
* The models do the real work: each system's number is a genuine prediction.
  The CityProfile modulates a few *meaningful* inputs of each model (season,
  demand, traffic, load) while the rest use representative city-like defaults.
* Robust by construction: if a bundle is missing or errors, that one system
  falls back to a transparent heuristic and is flagged `live=False`, so the
  journey never crashes during a demo.
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from functools import lru_cache
from typing import Dict, List, Optional

import numpy as np
import pandas as pd

try:                       # joblib is required for real models; degrade cleanly.
    import joblib
except Exception:          # pragma: no cover
    joblib = None

from .city_profile import CityProfile, SYSTEMS, SYSTEM_META

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")

BUNDLE_FILES = {
    "energy":   "energy_bundle.joblib",
    "waste":    "waste_bundle.joblib",
    "services": "governance_bundle.joblib",
    "mobility": "transportation_bundle.joblib",
}

# Human status bands over the shared 0-100 pressure scale.
STATUS_BANDS = [
    (0,   34, "Calm",     "#22c55e"),
    (34,  55, "Steady",   "#84cc16"),
    (55,  72, "Strained", "#f59e0b"),
    (72,  86, "Under pressure", "#f97316"),
    (86, 101, "Critical", "#ef4444"),
]


def status_for(pressure: float):
    p = float(np.clip(pressure, 0, 100))
    for lo, hi, label, color in STATUS_BANDS:
        if lo <= p < hi:
            return label, color
    return "Critical", "#ef4444"


@dataclass
class SystemReading:
    system: str
    pressure: float                 # 0-100, shared scale
    raw: float                      # native model output (kWh, tons, prob, collisions)
    raw_unit: str
    status: str
    color: str
    live: bool                      # True if produced by the real model
    detail: str = ""                # one plain-language line about the driver

    @property
    def label(self) -> str:
        return SYSTEM_META[self.system]["label"]

    @property
    def icon(self) -> str:
        return SYSTEM_META[self.system]["icon"]


@dataclass
class CityReading:
    systems: Dict[str, SystemReading]
    profile: CityProfile
    overall: float = 0.0            # 0-100 city pressure (higher = worse)
    health: int = 0                 # 0-100 "quality of life", higher = better
    priority: str = "mobility"      # the system that needs attention first

    def __post_init__(self):
        vals = [s.pressure for s in self.systems.values()]
        # City pressure leans toward the worst system (a city is judged by its
        # weakest service), blended with the average.
        self.overall = float(0.6 * max(vals) + 0.4 * np.mean(vals))
        self.health = int(round(100 - self.overall))
        self.priority = max(self.systems.values(), key=lambda s: s.pressure).system

    def sorted_systems(self) -> List[SystemReading]:
        return sorted(self.systems.values(), key=lambda s: s.pressure, reverse=True)


# ==========================================================================
#  Adapter
# ==========================================================================
class CityAdapter:
    """Loads the four bundles and turns any CityProfile into a CityReading."""

    def __init__(self, models_dir: str = MODELS_DIR):
        self.models_dir = models_dir
        self.bundles: Dict[str, Optional[dict]] = {}
        self.errors: Dict[str, str] = {}
        self._svc_points = None
        self._load_all()
        # Calibrate each system's raw->pressure band across a broad city grid so
        # pressures are stable and comparable. The grid sweep is ~30s, so the
        # result is cached to disk keyed on the model files (first run only).
        self._ref_lo: Dict[str, float] = {}
        self._ref_hi: Dict[str, float] = {}
        if not self._load_calibration_cache():
            self._calibrate()
            self._save_calibration_cache()

    # ---- loading ---------------------------------------------------------
    def _load_all(self):
        for sys_key, fname in BUNDLE_FILES.items():
            path = os.path.join(self.models_dir, fname)
            if joblib is None:
                self.bundles[sys_key] = None
                self.errors[sys_key] = "joblib unavailable"
                continue
            try:
                self.bundles[sys_key] = joblib.load(path)
            except Exception as e:            # missing lib (e.g. libomp) etc.
                self.bundles[sys_key] = None
                self.errors[sys_key] = f"{type(e).__name__}: {e}"

    @property
    def live_systems(self) -> List[str]:
        return [k for k, b in self.bundles.items() if b is not None]

    # ---- calibration cache (disk) ---------------------------------------
    # Bump when the calibration grid or raw-signal maths change, so cached
    # bands from an older logic version are invalidated.
    CALIBRATION_VERSION = "v2-heatgrid"

    def _cache_signature(self) -> str:
        """Fingerprint the model files (+ calibration logic version) so the
        cache invalidates if either changes."""
        parts = [self.CALIBRATION_VERSION]
        for fname in BUNDLE_FILES.values():
            path = os.path.join(self.models_dir, fname)
            try:
                st = os.stat(path)
                parts.append(f"{fname}:{st.st_size}")
            except OSError:
                parts.append(f"{fname}:missing")
        return "|".join(parts)

    @property
    def _cache_path(self) -> str:
        return os.path.join(self.models_dir, "_calibration_cache.json")

    def _load_calibration_cache(self) -> bool:
        try:
            import json
            with open(self._cache_path) as f:
                data = json.load(f)
            if data.get("signature") != self._cache_signature():
                return False
            self._ref_lo = {k: float(v) for k, v in data["ref_lo"].items()}
            self._ref_hi = {k: float(v) for k, v in data["ref_hi"].items()}
            if data.get("svc_points"):
                self._svc_points = np.array(data["svc_points"], dtype=float)
            return set(self._ref_lo) == set(SYSTEMS)
        except Exception:
            return False

    def _save_calibration_cache(self):
        try:
            import json
            data = {
                "signature": self._cache_signature(),
                "ref_lo": self._ref_lo, "ref_hi": self._ref_hi,
                "svc_points": (self._svc_points.tolist()
                               if self._svc_points is not None else None),
            }
            with open(self._cache_path, "w") as f:
                json.dump(data, f)
        except Exception:
            pass   # a read-only FS just means we recompute next boot

    # ---- feature-vector helpers -----------------------------------------
    @staticmethod
    def _blank_row(feature_columns: List[str]) -> Dict[str, float]:
        return {c: 0.0 for c in feature_columns}

    @staticmethod
    def _set_onehot(row: Dict[str, float], prefix: str, chosen: str):
        key = f"{prefix}{chosen}"
        if key in row:
            row[key] = 1.0

    # ---- per-system raw predictions -------------------------------------
    def _energy_raw(self, p: CityProfile) -> float:
        """Average predicted electricity load across representative buildings."""
        b = self.bundles["energy"]
        cols = b["feature_columns"]
        cmaps = b["category_maps"]
        # representative spread of building / site / usage codes
        b_codes = sorted(set(cmaps["building_id"].values()))
        u_codes = sorted(set(cmaps["primaryspaceusage"].values()))
        s_codes = sorted(set(cmaps["site_id"].values()))
        b_codes = b_codes[:: max(1, len(b_codes) // 8)][:8]
        u_codes = u_codes[:: max(1, len(u_codes) // 4)][:4]
        temp = p.air_temp_c
        rows = []
        # A weekday afternoon and an evening peak, across the sampled buildings.
        for hour in (14, 19):
            for bi, bc in enumerate(b_codes):
                r = self._blank_row(cols)
                r["building_id"] = bc
                r["site_id"] = s_codes[bi % len(s_codes)]
                r["primaryspaceusage"] = u_codes[bi % len(u_codes)]
                # floor area scales with density & demand (busier, denser city)
                r["sqm"] = 5000 * p.density_factor * p.demand
                r["airTemperature"] = temp
                r["dewTemperature"] = temp - 5
                r["seaLvlPressure"] = 1013.0
                r["windDirection"] = 180
                r["windSpeed"] = 3.0
                r["hour"] = hour
                r["day_of_week"] = 2
                r["is_weekend"] = 0
                r["temperature_squared"] = temp * temp
                r["month"] = p.month
                rows.append(r)
        X = pd.DataFrame(rows)[cols]
        pred = np.asarray(b["model"].predict(X), dtype=float)
        # Load grows with population (sub-linearly — a bigger city uses more
        # energy but isn't automatically "critical" just for its size) and with
        # demand. Temperature effect comes straight from the model.
        scale = (p.population / 250_000) ** 0.6 * p.demand
        return float(np.mean(pred)) * max(0.3, scale)

    def _waste_raw(self, p: CityProfile) -> float:
        """Total predicted monthly waste (tons) across sampled districts."""
        b = self.bundles["waste"]
        cols = b["feature_columns"]
        boroughs = [c[len("borough_"):] for c in cols if c.startswith("borough_")]
        districts = [c for c in cols if c.startswith("communitydistrict_")]
        # base recent-history load scales with population & demand; capacity
        # (recycling/budget) trims it.
        # Representative recent-history load per district depends on demand and
        # recycling capacity (not city size — size is applied once, below).
        base_hist = 2500 * p.demand
        recycling = 1.0 - 0.12 * ("recycling" in p.applied_actions) \
            - 0.05 * (p.green_space - 35) / 100.0
        base_hist *= max(0.6, recycling)
        total = 0.0
        n = 0
        for bo in boroughs[:4]:
            for dc in districts[:: max(1, len(districts) // 4)][:4]:
                r = self._blank_row(cols)
                r["year"] = 2025
                r["month_number"] = p.month
                r["waste_last_month"] = base_hist
                r["waste_2_months_ago"] = base_hist * 0.98
                self._set_onehot(r, "borough_", bo)
                r[dc] = 1.0
                X = pd.DataFrame([r])[cols]
                total += float(b["model"].predict(X)[0])
                n += 1
        per = total / max(1, n)
        # City size applied once, sub-linearly.
        return per * (p.population / 250_000) ** 0.6

    def _service_points(self):
        """Predicted delay probability for a diverse set of real request types,
        sorted ascending. Computed once; the model responds strongly to the
        *type* of request, so this is the lever that actually moves."""
        if getattr(self, "_svc_points", None) is not None:
            return self._svc_points
        b = self.bundles["services"]
        cols = b["feature_columns"]
        agencies = [c[len("agency_"):] for c in cols if c.startswith("agency_")]
        complaints = [c[len("complaint_type_"):] for c in cols
                      if c.startswith("complaint_type_")]
        want_ag = [a for a in ["HPD", "DOT", "DSNY", "NYPD", "DEP", "DPR", "DOB",
                               "DOHMH", "HRA"] if a in agencies] or agencies[:8]
        want_cp = [c for c in complaints if any(k in c for k in (
            "Noise", "Blocked", "Street", "Water", "Sanitation", "Parking",
            "Heat", "Sewer", "Rodent", "Graffiti", "Sidewalk", "Damaged"))][:12]
        want_cp = want_cp or complaints[:12]
        probs = []
        for i, ag in enumerate(want_ag):
            for cp in want_cp:
                r = self._blank_row(cols)
                r["month"] = 6
                r["day_of_week"] = 3
                r["hour"] = 12
                r["is_weekend"] = 0
                self._set_onehot(r, "agency_", ag)
                self._set_onehot(r, "complaint_type_", cp)
                X = pd.DataFrame([r])[cols]
                probs.append(float(b["model"].predict_proba(X)[0][1]))
        self._svc_points = np.sort(np.array(probs))
        return self._svc_points

    def _services_raw(self, p: CityProfile) -> float:
        """Average delay probability (0-1). Under strain a city faces more of
        the slow, backlog-prone request types; when well-resourced it clears the
        easy ones first. We slide the request mix along the model's real range."""
        pts = self._service_points()
        load = p.service_load * p.demand / p.budget_factor          # ~0.5 .. 2.6
        w = float(np.clip((load - 0.65) / 1.5, 0.0, 1.0))           # easy..hard
        # Pick a window of the sorted request types: low load -> easier half,
        # high load -> harder half. Window centre slides with load.
        n = len(pts)
        centre = 0.30 + 0.50 * w                                    # 0.30..0.80
        lo = int(max(0, (centre - 0.25) * n))
        hi = int(min(n, (centre + 0.25) * n))
        return float(np.mean(pts[lo:hi]))

    def _mobility_raw(self, p: CityProfile) -> float:
        """Expected collision risk = P(collision) * predicted count (hurdle)."""
        b = self.bundles["mobility"]
        cols = b["feature_columns"]
        sites = [c[len("site_"):] for c in cols if c.startswith("site_")
                 and not c.startswith("site_type_")]
        codes = [c[len("code_"):] for c in cols if c.startswith("code_")]
        stypes = [c[len("site_type_"):] for c in cols if c.startswith("site_type_")]
        # traffic intensity drives air pollution proxies & risk
        ti = p.traffic_intensity * p.density_factor * p.demand
        # transit coverage relieves traffic
        ti *= (1.0 - 0.35 * (p.transit_coverage / 100.0))
        winter = p.season == "Winter"
        vals = []
        for i, site in enumerate(sites[:6]):
            r = self._blank_row(cols)
            # air quality worsens with traffic
            r["air_co"] = 0.3 * ti
            r["air_nox"] = 40 * ti
            r["air_no2"] = 30 * ti
            r["air_no"] = 15 * ti
            r["air_o3"] = 40
            r["air_air_temp"] = p.air_temp_c
            r["latitude"] = 51.5
            r["longitude"] = -0.12
            r["weather_tavg"] = p.air_temp_c
            r["weather_tmin"] = p.air_temp_c - 4
            r["weather_tmax"] = p.air_temp_c + 4
            r["weather_prcp"] = 6.0 if winter else 2.0
            r["weather_wdir"] = 200
            r["weather_wspd"] = 12 if winter else 8
            r["weather_pres"] = 1012
            r["bike_cnt"] = 1500 * (p.population / 250_000)
            r["bike_t1"] = p.air_temp_c
            r["bike_t2"] = p.air_temp_c - 1
            r["bike_hum"] = 70
            r["bike_wind_speed"] = 10
            r["bike_weather_code"] = 3 if winter else 1
            r["bike_is_holiday"] = 0
            r["year"] = 2025
            r["month"] = p.month
            r["hour"] = 18            # evening peak
            r["day_of_week"] = 2
            r["is_weekend"] = 0
            self._set_onehot(r, "site_", site)
            self._set_onehot(r, "code_", codes[i % len(codes)] if codes else "")
            self._set_onehot(r, "site_type_",
                             "Urban Traffic" if "Urban Traffic" in stypes
                             else (stypes[0] if stypes else ""))
            self._set_onehot(r, "season_", p.season)
            X = pd.DataFrame([r])[cols]
            p_any = float(b["stage1_model"].predict_proba(X)[0][1])
            count = float(b["stage2_model"].predict(X)[0])
            vals.append(max(0.0, p_any * max(0.0, count)))
        # The model gives per-condition collision risk. Total mobility risk in a
        # city also scales with *exposure* — how many trips happen. More traffic
        # and density = proportionally more collision opportunities; transit
        # relieves it. This makes the real model responsive to city choices.
        exposure = ti * (p.population / 250_000) ** 0.3
        return float(np.mean(vals)) * max(0.4, exposure)

    # ---- heuristic fallbacks (only if a model can't load) ---------------
    def _fallback_raw(self, system: str, p: CityProfile) -> float:
        base = {
            "energy": 40 + 30 * abs(p.air_temp_c - 18) / 18,
            "waste": 2500 * (p.population / 250_000) * p.demand,
            "services": 0.35 * p.service_load * p.demand / p.budget_factor,
            "mobility": 1.5 * p.traffic_intensity * p.density_factor
            * (1 - 0.3 * p.transit_coverage / 100),
        }[system]
        return float(base)

    # ---- calibration -----------------------------------------------------
    def _raw(self, system: str, p: CityProfile) -> tuple[float, bool]:
        if self.bundles.get(system) is not None:
            try:
                fn = {
                    "energy": self._energy_raw, "waste": self._waste_raw,
                    "services": self._services_raw, "mobility": self._mobility_raw,
                }[system]
                return fn(p), True
            except Exception as e:
                self.errors[system] = f"predict: {type(e).__name__}: {e}"
        return self._fallback_raw(system, p), False

    def _calibrate(self):
        """Set each system's raw->pressure band from the 12th/88th percentiles
        of a broad city grid, so typical cities land mid-scale and every model —
        flat or spiky — gets a stable, legible band."""
        grid = self._calibration_grid()
        for s in SYSTEMS:
            raws = np.array([self._raw(s, p)[0] for p in grid], dtype=float)
            lo, hi = float(np.percentile(raws, 12)), float(np.percentile(raws, 88))
            if hi <= lo:
                hi = lo + max(1e-6, abs(lo) * 0.1 + 1.0)
            self._ref_lo[s] = lo
            self._ref_hi[s] = hi

    @staticmethod
    def _calibration_grid() -> List[CityProfile]:
        """A broad spread of plausible cities used to set robust pressure bands.
        Percentiles of this distribution avoid both razor-thin bands (a flat
        model) and single-outlier blow-outs (a spiky model)."""
        grid = []
        for pop in (120_000, 250_000, 500_000):
            for density in ("Balanced", "Compact"):
                for transit in (30, 60):
                    for budget in ("Tight", "Strong"):
                        for season in ("Spring", "Summer", "Winter"):
                            # include a heat-stressed variant so heat-wave
                            # conditions sit inside the band instead of pegging.
                            for dm, tr, sl, hs in ((0.9, 0.9, 0.9, 0.0),
                                                   (1.15, 1.3, 1.3, 0.0),
                                                   (1.15, 1.2, 1.2, 0.6)):
                                grid.append(CityProfile(
                                    population=pop, density=density,
                                    transit_coverage=transit, budget=budget,
                                    season=season, demand=dm,
                                    traffic_intensity=tr, service_load=sl,
                                    heat_stress=hs))
        return grid

    def _to_pressure(self, system: str, raw: float) -> float:
        lo, hi = self._ref_lo[system], self._ref_hi[system]
        # map [lo,hi] -> [22,82], clip to [3,99]
        t = (raw - lo) / (hi - lo)
        return float(np.clip(22 + t * 60, 3, 99))

    # ---- the one public method ------------------------------------------
    def read_city(self, p: CityProfile) -> CityReading:
        units = {"energy": "kWh/bldg·hr", "waste": "tons/mo",
                 "services": "delay risk", "mobility": "collision risk"}
        details = {
            "energy": self._energy_detail, "waste": self._waste_detail,
            "services": self._services_detail, "mobility": self._mobility_detail,
        }
        readings = {}
        for s in SYSTEMS:
            raw, live = self._raw(s, p)
            pressure = self._to_pressure(s, raw)
            label, color = status_for(pressure)
            readings[s] = SystemReading(
                system=s, pressure=pressure, raw=raw, raw_unit=units[s],
                status=label, color=color, live=live, detail=details[s](p),
            )
        return CityReading(systems=readings, profile=p)

    # ---- plain-language drivers (the "why") -----------------------------
    @staticmethod
    def _energy_detail(p: CityProfile) -> str:
        if p.heat_stress > 0.5 or p.season == "Summer":
            return "Cooling demand is high as temperatures climb."
        if p.season == "Winter":
            return "Heating load rises across buildings in the cold."
        return "Building energy demand is moderate this season."

    @staticmethod
    def _waste_detail(p: CityProfile) -> str:
        if p.demand > 1.1:
            return "More people and activity means more waste to collect."
        if "recycling" in p.applied_actions:
            return "Recycling upgrades are easing the collection load."
        return "Waste generation is tracking population steadily."

    @staticmethod
    def _services_detail(p: CityProfile) -> str:
        if p.budget == "Tight":
            return "Tight budgets slow how fast requests get resolved."
        if p.service_load > 1.1:
            return "A surge in requests is stretching response times."
        return "Requests are being resolved close to target times."

    @staticmethod
    def _mobility_detail(p: CityProfile) -> str:
        if p.heat_stress > 0.3 and p.season == "Summer":
            return "Extreme heat is pushing collision and congestion risk up."
        if p.transit_coverage < 35:
            return "Low transit coverage keeps traffic and risk high."
        if p.traffic_intensity > 1.2:
            return "Heavy traffic raises congestion and collision risk."
        return "Traffic conditions are steady across the network."


@lru_cache(maxsize=1)
def get_adapter() -> CityAdapter:
    """Cached singleton so models load once per process."""
    return CityAdapter()
