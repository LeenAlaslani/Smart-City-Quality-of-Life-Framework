"""
CityPulse AI — Shared Model Integration Layer.

One class loads the four real joblib bundles and exposes a single method,
`read(context)`, that runs every model and returns a unified set of domain
signals on one comparable 0-100 "pressure" scale. The models do the real work:
each domain's number is a genuine prediction from the trained model. The city
context modulates the *meaningful* inputs (season, demand, traffic, service
load, budget) while the rest use representative defaults for that model.

Responsibilities (per the platform's model-integration requirements):
load · validate · feature-prep · category-mapping · predict · normalize ·
error-handling · availability status · version · provenance · limitations.

Every signal carries traceability: which model, its dataset, the execution
time, and its stated limitations.
"""
from __future__ import annotations

import os
import time
from dataclasses import dataclass, field
from functools import lru_cache
from typing import Dict, List, Optional

import numpy as np
import pandas as pd

try:
    import joblib
except Exception:                        # pragma: no cover
    joblib = None

from .registry import REGISTRY, DOMAINS, DOMAIN_LABELS, ModelEntry

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")

# Softened, controlled status palette (cool-leaning, premium — not harsh).
STATUS_BANDS = [
    (0, 34, "Stable", "#2f9e7b"),
    (34, 55, "Watch", "#5a86ad"),
    (55, 72, "Elevated", "#c39a4e"),
    (72, 86, "High", "#c07d63"),
    (86, 101, "Critical", "#b15f6b"),
]


def status_for(p: float):
    p = float(np.clip(p, 0, 100))
    for lo, hi, label, color in STATUS_BANDS:
        if lo <= p < hi:
            return label, color
    return "Critical", "#c1362f"


@dataclass
class CityContext:
    """The subset of the city profile + decision levers the models consume."""
    population: int = 1_500_000
    density: str = "Balanced"          # Compact | Balanced | Spread out
    transit_coverage: int = 45         # 0-100
    green_space: int = 30              # 0-100
    budget: str = "Moderate"           # Tight | Moderate | Strong
    season: str = "Summer"
    # decision/scenario levers (baseline = neutral 1.0 / 0.0)
    demand: float = 1.0
    traffic_intensity: float = 1.0
    service_load: float = 1.0
    heat_stress: float = 0.0
    applied_actions: List[str] = field(default_factory=list)

    @property
    def density_factor(self):
        return {"Compact": 1.15, "Balanced": 1.0, "Spread out": 0.85}[self.density]

    @property
    def budget_factor(self):
        return {"Tight": 0.8, "Moderate": 1.0, "Strong": 1.2}[self.budget]

    @property
    def month(self):
        return {"Spring": 4, "Summer": 7, "Autumn": 10, "Winter": 1}[self.season]

    @property
    def air_temp_c(self):
        base = {"Spring": 20, "Summer": 34, "Autumn": 22, "Winter": 14}[self.season]
        return base + self.heat_stress * 6.0


@dataclass
class DomainSignal:
    domain: str
    pressure: float
    raw: float
    raw_unit: str
    status: str
    color: str
    live: bool
    model_version: str
    dataset_origin: str
    exec_ms: float
    limitations: List[str]
    driver: str = ""

    def public(self) -> dict:
        d = self.__dict__.copy()
        d["domain_label"] = DOMAIN_LABELS[self.domain]
        return d


@dataclass
class CityReading:
    signals: Dict[str, DomainSignal]
    overall_pressure: float
    quality_index: int                 # 0-100, higher = better
    priority: str

    def public(self) -> dict:
        return {
            "signals": {k: v.public() for k, v in self.signals.items()},
            "overall_pressure": round(self.overall_pressure, 1),
            "quality_index": self.quality_index,
            "priority": self.priority,
            "priority_label": DOMAIN_LABELS[self.priority],
        }


class ModelIntegration:
    def __init__(self, models_dir: str = MODELS_DIR):
        self.models_dir = models_dir
        self.bundles: Dict[str, Optional[dict]] = {}
        self._svc_points = None
        self._ref_lo: Dict[str, float] = {}
        self._ref_hi: Dict[str, float] = {}
        self._load_all()
        if not self._load_cache():
            self._calibrate()
            self._save_cache()

    CALIBRATION_VERSION = "saudi-v1"

    @property
    def _cache_path(self):
        return os.path.join(self.models_dir, "_calibration_cache.json")

    def _sig(self):
        parts = [self.CALIBRATION_VERSION]
        for d in DOMAINS:
            p = os.path.join(self.models_dir, REGISTRY[d].bundle_file)
            try:
                parts.append(f"{REGISTRY[d].bundle_file}:{os.stat(p).st_size}")
            except OSError:
                parts.append(f"{REGISTRY[d].bundle_file}:missing")
        return "|".join(parts)

    def _load_cache(self) -> bool:
        try:
            import json
            with open(self._cache_path) as f:
                data = json.load(f)
            if data.get("signature") != self._sig():
                return False
            self._ref_lo = {k: float(v) for k, v in data["ref_lo"].items()}
            self._ref_hi = {k: float(v) for k, v in data["ref_hi"].items()}
            if data.get("svc_points"):
                self._svc_points = np.array(data["svc_points"], dtype=float)
            return set(self._ref_lo) == set(DOMAINS)
        except Exception:
            return False

    def _save_cache(self):
        try:
            import json
            with open(self._cache_path, "w") as f:
                json.dump({"signature": self._sig(), "ref_lo": self._ref_lo,
                           "ref_hi": self._ref_hi,
                           "svc_points": self._svc_points.tolist() if self._svc_points is not None else None}, f)
        except Exception:
            pass

    # ---- loading / availability -----------------------------------------
    def _load_all(self):
        for d in DOMAINS:
            entry = REGISTRY[d]
            path = os.path.join(self.models_dir, entry.bundle_file)
            if joblib is None:
                self.bundles[d] = None
                entry.load_error = "joblib unavailable"
                continue
            try:
                self.bundles[d] = joblib.load(path)
                entry.deployed = True
            except Exception as e:
                self.bundles[d] = None
                entry.deployed = False
                entry.load_error = f"{type(e).__name__}: {e}"

    @property
    def available(self) -> List[str]:
        return [d for d, b in self.bundles.items() if b is not None]

    # ---- feature helpers -------------------------------------------------
    @staticmethod
    def _blank(cols):
        return {c: 0.0 for c in cols}

    @staticmethod
    def _set_onehot(row, prefix, chosen):
        key = f"{prefix}{chosen}"
        if key in row:
            row[key] = 1.0

    # ---- per-model real predictions -------------------------------------
    def _energy_raw(self, c: CityContext) -> float:
        b = self.bundles["energy"]; cols = b["feature_columns"]; cmaps = b["category_maps"]
        b_codes = sorted(set(cmaps["building_id"].values()))[:: max(1, len(cmaps["building_id"]) // 8)][:8]
        u_codes = sorted(set(cmaps["primaryspaceusage"].values()))
        s_codes = sorted(set(cmaps["site_id"].values()))
        temp = c.air_temp_c
        rows = []
        for hour in (14, 19):
            for i, bc in enumerate(b_codes):
                r = self._blank(cols)
                r.update({"building_id": bc, "site_id": s_codes[i % len(s_codes)],
                          "primaryspaceusage": u_codes[i % len(u_codes)],
                          "sqm": 5000 * c.density_factor * c.demand,
                          "airTemperature": temp, "dewTemperature": temp - 5,
                          "seaLvlPressure": 1013.0, "windDirection": 180, "windSpeed": 3.0,
                          "hour": hour, "day_of_week": 2, "is_weekend": 0,
                          "temperature_squared": temp * temp, "month": c.month})
                rows.append(r)
        pred = np.asarray(b["model"].predict(pd.DataFrame(rows)[cols]), dtype=float)
        scale = (c.population / 1_500_000) ** 0.6 * c.demand
        return float(np.mean(pred)) * max(0.3, scale)

    def _waste_raw(self, c: CityContext) -> float:
        b = self.bundles["waste"]; cols = b["feature_columns"]
        boroughs = [x[len("borough_"):] for x in cols if x.startswith("borough_")]
        districts = [x for x in cols if x.startswith("communitydistrict_")]
        pop_scale = c.population / 1_500_000
        recycling = 1.0 - 0.12 * ("recycling" in c.applied_actions) - 0.05 * (c.green_space - 30) / 100.0
        base_hist = 2500 * c.demand * max(0.6, recycling)
        total, n = 0.0, 0
        for bo in boroughs[:4]:
            for dc in districts[:: max(1, len(districts) // 4)][:4]:
                r = self._blank(cols)
                r.update({"year": 2025, "month_number": c.month,
                          "waste_last_month": base_hist, "waste_2_months_ago": base_hist * 0.98})
                self._set_onehot(r, "borough_", bo); r[dc] = 1.0
                total += float(b["model"].predict(pd.DataFrame([r])[cols])[0]); n += 1
        return (total / max(1, n)) * (6 + 6 * (pop_scale ** 0.6))

    def _service_points(self):
        if self._svc_points is not None:
            return self._svc_points
        b = self.bundles["governance"]; cols = b["feature_columns"]
        agencies = [x[len("agency_"):] for x in cols if x.startswith("agency_")]
        complaints = [x[len("complaint_type_"):] for x in cols if x.startswith("complaint_type_")]
        want_ag = [a for a in ["HPD", "DOT", "DSNY", "NYPD", "DEP", "DPR", "DOB", "DOHMH", "HRA"] if a in agencies] or agencies[:8]
        want_cp = [c for c in complaints if any(k in c for k in (
            "Noise", "Blocked", "Street", "Water", "Sanitation", "Parking",
            "Heat", "Sewer", "Rodent", "Graffiti", "Sidewalk", "Damaged"))][:12] or complaints[:12]
        probs = []
        for ag in want_ag:
            for cp in want_cp:
                r = self._blank(cols)
                r.update({"month": 6, "day_of_week": 3, "hour": 12, "is_weekend": 0})
                self._set_onehot(r, "agency_", ag); self._set_onehot(r, "complaint_type_", cp)
                probs.append(float(b["model"].predict_proba(pd.DataFrame([r])[cols])[0][1]))
        self._svc_points = np.sort(np.array(probs))
        return self._svc_points

    def _governance_raw(self, c: CityContext) -> float:
        pts = self._service_points()
        load = c.service_load * c.demand / c.budget_factor
        w = float(np.clip((load - 0.65) / 1.5, 0.0, 1.0))
        n = len(pts); centre = 0.30 + 0.50 * w
        lo = int(max(0, (centre - 0.25) * n)); hi = int(min(n, (centre + 0.25) * n))
        return float(np.mean(pts[lo:hi]))

    def _mobility_raw(self, c: CityContext) -> float:
        b = self.bundles["mobility"]; cols = b["feature_columns"]
        sites = [x[len("site_"):] for x in cols if x.startswith("site_") and not x.startswith("site_type_")]
        codes = [x[len("code_"):] for x in cols if x.startswith("code_")]
        stypes = [x[len("site_type_"):] for x in cols if x.startswith("site_type_")]
        ti = c.traffic_intensity * c.density_factor * c.demand * (1 - 0.35 * c.transit_coverage / 100)
        winter = c.season == "Winter"; vals = []
        for i, site in enumerate(sites[:6]):
            r = self._blank(cols)
            r.update({"air_co": 0.3 * ti, "air_nox": 40 * ti, "air_no2": 30 * ti, "air_no": 15 * ti,
                      "air_o3": 40, "air_air_temp": c.air_temp_c, "latitude": 24.7, "longitude": 46.7,
                      "weather_tavg": c.air_temp_c, "weather_tmin": c.air_temp_c - 4, "weather_tmax": c.air_temp_c + 4,
                      "weather_prcp": 6.0 if winter else 1.0, "weather_wdir": 200,
                      "weather_wspd": 12 if winter else 8, "weather_pres": 1012,
                      "bike_cnt": 1500 * (c.population / 1_500_000), "bike_t1": c.air_temp_c,
                      "bike_t2": c.air_temp_c - 1, "bike_hum": 40, "bike_wind_speed": 10,
                      "bike_weather_code": 1, "bike_is_holiday": 0, "year": 2025, "month": c.month,
                      "hour": 18, "day_of_week": 2, "is_weekend": 0})
            self._set_onehot(r, "site_", site)
            self._set_onehot(r, "code_", codes[i % len(codes)] if codes else "")
            self._set_onehot(r, "site_type_", "Urban Traffic" if "Urban Traffic" in stypes else (stypes[0] if stypes else ""))
            self._set_onehot(r, "season_", c.season)
            X = pd.DataFrame([r])[cols]
            p_any = float(b["stage1_model"].predict_proba(X)[0][1])
            count = float(b["stage2_model"].predict(X)[0])
            vals.append(max(0.0, p_any * max(0.0, count)))
        exposure = ti * (c.population / 1_500_000) ** 0.3
        return float(np.mean(vals)) * max(0.4, exposure)

    _RAW = None

    def _raw(self, domain: str, c: CityContext):
        fns = {"energy": self._energy_raw, "waste": self._waste_raw,
               "governance": self._governance_raw, "mobility": self._mobility_raw}
        if self.bundles.get(domain) is not None:
            try:
                return fns[domain](c), True
            except Exception as e:
                REGISTRY[domain].load_error = f"predict: {type(e).__name__}: {e}"
        # transparent heuristic fallback (only if a bundle is unavailable)
        fb = {"energy": 40 + 30 * abs(c.air_temp_c - 24) / 24,
              "waste": 2500 * (c.population / 1_500_000) ** 0.6 * c.demand,
              "governance": 0.35 * c.service_load * c.demand / c.budget_factor,
              "mobility": 1.5 * c.traffic_intensity * c.density_factor}[domain]
        return float(fb), False

    # ---- calibration -----------------------------------------------------
    def _grid(self):
        grid = []
        for pop in (400_000, 1_000_000, 2_500_000, 5_000_000, 7_500_000):
            for density in ("Balanced", "Compact"):
                for transit in (30, 60):
                    for budget in ("Tight", "Strong"):
                        for season in ("Spring", "Summer", "Winter"):
                            for dm, tr, sl, hs in ((0.9, 0.9, 0.9, 0.0),
                                                   (1.15, 1.3, 1.3, 0.0),
                                                   (1.15, 1.2, 1.2, 0.6)):
                                grid.append(CityContext(population=pop, density=density,
                                            transit_coverage=transit, budget=budget, season=season,
                                            demand=dm, traffic_intensity=tr, service_load=sl, heat_stress=hs))
        return grid

    def _calibrate(self):
        grid = self._grid()
        for d in DOMAINS:
            raws = np.array([self._raw(d, c)[0] for c in grid], dtype=float)
            lo, hi = float(np.percentile(raws, 12)), float(np.percentile(raws, 88))
            if hi <= lo:
                hi = lo + max(1e-6, abs(lo) * 0.1 + 1.0)
            self._ref_lo[d] = lo; self._ref_hi[d] = hi

    def _pressure(self, d, raw):
        lo, hi = self._ref_lo[d], self._ref_hi[d]
        return float(np.clip(22 + ((raw - lo) / (hi - lo)) * 60, 3, 99))

    # ---- the one public method ------------------------------------------
    def read(self, c: CityContext) -> CityReading:
        units = {"energy": "kWh/bldg·hr", "waste": "tons/mo",
                 "governance": "delay probability", "mobility": "expected collisions"}
        signals = {}
        for d in DOMAINS:
            t0 = time.perf_counter()
            raw, live = self._raw(d, c)
            exec_ms = (time.perf_counter() - t0) * 1000
            REGISTRY[d].last_inference_ok = live or REGISTRY[d].last_inference_ok
            pressure = self._pressure(d, raw)
            status, color = status_for(pressure)
            signals[d] = DomainSignal(
                domain=d, pressure=round(pressure, 1), raw=round(raw, 4), raw_unit=units[d],
                status=status, color=color, live=live, model_version=REGISTRY[d].version,
                dataset_origin=REGISTRY[d].dataset_origin, exec_ms=round(exec_ms, 1),
                limitations=REGISTRY[d].limitations, driver=self._driver(d, c))
        vals = [s.pressure for s in signals.values()]
        overall = 0.6 * max(vals) + 0.4 * float(np.mean(vals))
        priority = max(signals.values(), key=lambda s: s.pressure).domain
        return CityReading(signals=signals, overall_pressure=overall,
                           quality_index=int(round(100 - overall)), priority=priority)

    @staticmethod
    def _driver(d, c: CityContext) -> str:
        if d == "energy":
            return "Cooling demand rises with summer temperatures." if c.season == "Summer" else "Seasonal building demand is moderate."
        if d == "waste":
            return "Higher activity increases collection load." if c.demand > 1.1 else "Waste tracks population steadily."
        if d == "governance":
            return "Tight budgets slow resolution times." if c.budget == "Tight" else ("A surge in requests is stretching response." if c.service_load > 1.1 else "Requests resolve close to target.")
        if d == "mobility":
            return "Extreme heat raises road risk." if (c.heat_stress > 0.3 and c.season == "Summer") else ("Low transit keeps traffic and risk high." if c.transit_coverage < 35 else ("Heavy traffic raises collision risk." if c.traffic_intensity > 1.2 else "Traffic conditions are steady."))
        return ""


@lru_cache(maxsize=1)
def get_integration() -> ModelIntegration:
    return ModelIntegration()
