# CityPulse AI — Saudi Government Smart-City Decision Platform

A formal, desktop-first decision-support platform for Saudi municipalities. Four
trained machine-learning models (Transportation & Mobility, Energy & Sustainable
Buildings, Governance & Digital Services, Environment & Waste) run **invisibly in
the background** as one connected intelligence engine. The interface stays
executive, visual and decision-focused — no ML jargon in the user experience.

```
citypulse_platform/
├── backend/          FastAPI inference service (runs the 4 real joblib models)
│   ├── app/          registry · integration (shared adapter) · intelligence · main
│   ├── models/       energy / governance / transportation / waste bundles + cache
│   ├── Dockerfile    (installs libgomp1 for LightGBM)
│   └── requirements.txt
├── frontend/         React + Vite platform (design system, pages, charts)
└── render.yaml       Render blueprint (backend web service + frontend static site)
```

## Architecture
- **React (Vite) frontend** → calls a **lightweight Python (FastAPI) inference
  service** that loads the four trained `joblib` bundles through one shared
  integration layer (validation → feature prep → category mapping → prediction →
  normalisation → provenance). joblib/LightGBM models cannot run in a browser, so
  a small backend is required — real predictions, never hard-coded.
- Government decisions (metro line, Riyadh Season, district priority, visitor
  surge, NEOM-style development, …) are translated into **measurable assumptions**,
  fed to the real models, and returned as one **cross-domain** decision view with
  clear separation of *assumptions vs. model outputs vs. limitations*.
- Technical provenance (datasets, algorithms, metrics, origins, versions,
  limitations) lives only in **Model & Data Evidence**, not the executive pages.

## Pages (all implemented, no placeholders)
Landing · Onboarding · City Overview · City Intelligence · Decision Scenarios ·
Roadmap · Action Center · AI Copilot · Reports · Model & Data Evidence.

## Run locally
Backend (Python 3.11):
```bash
cd citypulse_platform/backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt        # macOS also: brew install libomp
uvicorn app.main:app --host 127.0.0.1 --port 8600
```
Frontend (Node 18+), in a second terminal:
```bash
cd citypulse_platform/frontend
npm install
npm run dev        # http://localhost:5190 (proxies /api → :8600)
```
First backend start calibrates the pressure bands (~30s) and caches to
`backend/models/_calibration_cache.json`; later starts are instant.

## Deploy to Render — see [DEPLOY.md](./DEPLOY.md)
Two services: a Docker **backend** (runs the models) and a **static frontend**.
The frontend must be built with `VITE_API_BASE` pointing at the backend.

## Model provenance (shown only in Model & Data Evidence)
| Domain | Model | Dataset origin | Target |
|--------|-------|----------------|--------|
| Transportation & Mobility | LightGBM hurdle (2-stage) | London, UK | collision risk |
| Energy & Sustainable Buildings | HistGradientBoosting | international building-energy | electricity demand |
| Governance & Digital Services | Random Forest | NYC 311, USA | request-delay risk |
| Environment & Waste | Extra Trees | NYC DSNY, USA | monthly waste tonnage |

Models are trained on non-Saudi datasets; the platform presents results as
**transferable, model-supported operational intelligence** and flags that a
validated local forecast needs Saudi municipal data. Nothing is fabricated.
