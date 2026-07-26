# CityPulse AI — Gameful Streamlit MVP

A clean, gameful smart-city planner for **non-technical municipal users**. You
**build a city, test it under real-world pressure, and improve it** — while four
trained ML models work together in the background as *one* connected city, not
four separate prediction tools.

It answers three questions at every step:

1. **What is happening in the city?**
2. **Why does it matter?**
3. **What should the municipality do next?**

> This is the main, fully-functional MVP. It loads and runs the four real
> `joblib` model bundles. A separate, backend-free React concept lives in
> [`../citypulse_react_mvp`](../citypulse_react_mvp).

---

## The experience (5-step journey)

| Step | Screen | What happens |
|------|--------|--------------|
| 1 | **Found your city** | Set a few plain-language levers (population, shape, green space, transit, budget, season). A living SVG skyline grows as you go. |
| 2 | **Pulse** | All four models run. The city gets one **Quality-of-Life** score + a status per system (Calm → Critical), shown as glowing districts. |
| 3 | **Test** | Pick a scenario — *Population Boom, Heat Wave, Budget Squeeze, Big Event Weekend* — and watch every system react, before → after. |
| 4 | **Diagnose** | The app highlights the **#1 pressure point** and answers the three questions in plain language. |
| 5 | **Improve** | Choose 1–2 actions; the models re-run and the city visibly improves. The AI guide reports the gain. |

An **AI City Guide** narrates the whole journey (offline; no API key needed).

---

## The four models, as one city

All four bundles live in [`models/`](models/) and are loaded once by a single
**shared adapter** ([`core/adapter.py`](core/adapter.py)):

| System | Bundle | Model | Predicts |
|--------|--------|-------|----------|
| Mobility | `transportation_bundle.joblib` | Hurdle LightGBM (2-stage) | collision risk |
| Energy | `energy_bundle.joblib` | HistGradientBoosting | building electricity demand |
| Public Services | `governance_bundle.joblib` | Random Forest | request-delay risk |
| Waste | `waste_bundle.joblib` | Extra Trees | monthly waste tonnage |

**How it stays "one city":** the user only ever edits a small `CityProfile`.
The adapter translates that profile into each model's real feature vector
(using representative city-like defaults for the rest), runs every model, and
maps each raw output onto one shared **0–100 pressure** scale via a percentile
calibration across a broad grid of plausible cities. The UI only ever sees the
unified reading — so the four models feel like one connected smart-city system.

The models genuinely drive the results: scenarios and actions move the
meaningful inputs (season, demand, traffic, budget, load), and the predictions —
and therefore the city — move with them.

---

## Run locally

```bash
cd citypulse_streamlit_mvp
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
streamlit run app.py
```

Then open http://localhost:8501.

### macOS note (LightGBM)
The transportation model uses LightGBM, which needs the OpenMP runtime:

```bash
brew install libomp
```

On Linux / Streamlit Community Cloud this is handled automatically by
[`packages.txt`](packages.txt) (`libgomp1`).

### First launch
On first boot the adapter calibrates its pressure bands across a grid of
cities (~30s) and caches the result to `models/_calibration_cache.json`.
Subsequent launches load in ~1s. The cache auto-invalidates if the model files
or calibration logic change.

---

## Deploy to Streamlit Community Cloud

1. Push this branch to GitHub.
2. New app → point at `citypulse_streamlit_mvp/app.py`.
3. `requirements.txt` and `packages.txt` are picked up automatically.

Optional: set an `OPENAI_API_KEY` secret to let the guide rephrase its lines
more naturally. **The app runs fully without it** — the guide is deterministic
by default.

---

## Project layout

```
citypulse_streamlit_mvp/
├── app.py                  # the 5-step journey (Streamlit)
├── core/
│   ├── city_profile.py     # CityProfile, scenarios, actions
│   ├── adapter.py          # shared adapter: 4 models → one CityReading
│   └── narrative.py        # the AI City Guide (offline; optional LLM polish)
├── ui/
│   ├── theme.py            # brand palette + CSS
│   ├── city_svg.py         # the living, animated city skyline
│   └── components.py       # cards, health ring, guide bubble, etc.
├── models/                 # the 4 joblib bundles (+ calibration cache)
├── assets/                 # CityPulse AI logo
├── requirements.txt
└── packages.txt            # apt deps for Streamlit Cloud (libgomp1)
```

---

## Notes for reviewers

- The **team's original app** (`../citypulse_streamlit/`) is **untouched**;
  this MVP is a separate, self-contained folder on the `citypulse-gameful-mvp`
  branch.
- Model bundles here are **copies** of the team's originals — nothing was
  retrained or modified.
- Absolute predictions are anchored to each model's training domain (NYC waste,
  London air quality, etc.); the MVP presents them as a **normalized,
  comparable city story**, which is the right altitude for non-technical
  municipal users.
