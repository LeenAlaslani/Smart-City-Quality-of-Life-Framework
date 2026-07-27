"""
CityPulse AI — Inference API (FastAPI).

Runs the four REAL project models and serves connected city intelligence to the
government web platform. This is the lightweight Python inference service
referenced by the deployment architecture (Option A): joblib/LightGBM models
cannot run in a browser, so the React frontend calls these endpoints.
"""
from __future__ import annotations

from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from . import intelligence as intel
from .integration import get_integration
from .registry import registry_public

app = FastAPI(title="CityPulse AI — Inference API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],           # dev; restrict in production
    allow_methods=["*"],
    allow_headers=["*"],
)


class CityProfile(BaseModel):
    city: Optional[str] = None
    country: str = "Saudi Arabia"
    population_range: Optional[str] = None
    districts: Optional[str] = None
    city_type: Optional[str] = None
    challenges: List[str] = Field(default_factory=list)
    priorities: List[str] = Field(default_factory=list)
    budget_level: Optional[str] = None
    timeline: Optional[str] = None
    data_availability: Optional[str] = None


class AnalyzeRequest(BaseModel):
    profile: CityProfile
    decision: str = "baseline"
    overrides: dict = Field(default_factory=dict)


@app.get("/api/health")
def health():
    integ = get_integration()
    return {
        "status": "ok",
        "models_available": integ.available,
        "models_total": 4,
    }


@app.get("/api/options")
def options():
    """All structured onboarding + decision choices (no free-text needed)."""
    return intel.options()


@app.get("/api/models")
def models():
    """Model registry with real provenance, limitations and runtime status."""
    return {"models": registry_public()}


@app.post("/api/analyze")
def analyze(req: AnalyzeRequest):
    """Connected city intelligence built from all four real models."""
    try:
        return intel.analyze(req.profile.model_dump(), req.decision, req.overrides)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {e}")


@app.get("/api/overview")
def overview(city: str = "riyadh", population_range: str = "1m_3m",
             city_type: str = "capital", budget_level: str = "moderate"):
    """Concise City Overview: baseline reading + priority + provenance summary."""
    profile = {"city": city, "population_range": population_range,
               "city_type": city_type, "budget_level": budget_level,
               "challenges": [], "priorities": []}
    result = intel.analyze(profile, "baseline")
    return {
        "city": result["city"],
        "reading": result["reading"],
        "priority_narrative": result["narrative"],
        "models_available": get_integration().available,
    }
