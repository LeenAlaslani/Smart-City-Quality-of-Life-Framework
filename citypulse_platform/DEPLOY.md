# Deploying CityPulse AI to Render

Two services: a **Docker backend** (Python + the 4 real models) and a **static
frontend** (React build). Deploy the backend first, then point the frontend at it.

> Nothing below deploys automatically. `autoDeploy` is off and no service is
> created until you click through the Render dashboard.

## Prerequisites
- The `citypulse-gameful-mvp` branch pushed to GitHub (done).
- A free Render account connected to the GitHub repo.

## Step 1 — Backend (Docker web service)
1. Render dashboard → **New + → Web Service** → pick this repo → branch
   `citypulse-gameful-mvp`.
2. Settings:
   - **Runtime**: Docker
   - **Root Directory**: `citypulse_platform/backend`
   - **Dockerfile Path**: `citypulse_platform/backend/Dockerfile`
   - **Health Check Path**: `/api/health`
   - **Instance Type**: Free (fine for a demo)
3. Create. First build installs `libgomp1` + Python deps and loads the 4 models.
4. When live, note the URL, e.g. `https://citypulse-backend.onrender.com`.
   Verify: opening `…/api/health` returns `models_available: [4 models]`.

**Backend environment variables:** none required. (`PORT` is provided by Render;
`PYTHONUNBUFFERED=1` is optional for logs.)

## Step 2 — Frontend (Static site)
1. **New + → Static Site** → same repo/branch.
2. Settings:
   - **Root Directory**: `citypulse_platform/frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Add rewrite rule** (Redirects/Rewrites tab): Source `/*` → Destination
     `/index.html` → Action **Rewrite** (SPA history-mode fallback).
3. **Environment variable (REQUIRED):**
   - `VITE_API_BASE` = `https://citypulse-backend.onrender.com/api`
     (your backend URL from Step 1, with `/api` appended). This is baked in at
     build time, so set it **before** the first build (or set it and redeploy).
4. Create. When live, open the frontend URL and complete onboarding.

## Alternative — Blueprint (one click)
Copy `citypulse_platform/render.yaml` to the **repository root**, then
**New + → Blueprint** and select the repo. It provisions both services; you still
set `VITE_API_BASE` on the frontend to the backend URL + `/api`.

## Required environment variables (summary)
| Service | Variable | Required | Value |
|---------|----------|----------|-------|
| Frontend | `VITE_API_BASE` | **Yes** | `https://<backend>.onrender.com/api` |
| Backend | `PYTHONUNBUFFERED` | No | `1` (nicer logs) |

## Notes
- Free Render services sleep when idle; the first request after a sleep is slow
  (cold start + one-time model calibration if the cache is absent — the committed
  `_calibration_cache.json` avoids the ~30s recompute).
- For production, restrict the backend CORS (`app/main.py`, `allow_origins`) to
  the frontend origin instead of `*`.
