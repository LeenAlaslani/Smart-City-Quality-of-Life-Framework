# CityPulse AI — React Mobile-First MVP (concept)

A **mobile-first, app-like** exploration of the same CityPulse AI journey —
*build a city, test it, improve it* — designed to feel more flexible and native
than the Streamlit app.

> **No backend.** This concept uses **realistic demo model outputs** computed
> client-side. Its architecture keeps a single `readCity(profile)` seam so the
> four real ML models can be wired in later behind an API, with no UI changes.
> The fully-functional, model-running MVP is the Streamlit app in
> [`../citypulse_streamlit_mvp`](../citypulse_streamlit_mvp).

---

## What it demonstrates

- A phone-shaped, thumb-friendly journey: **Found → Pulse → Test → Diagnose → Improve**.
- The same **AI City Guide**, four systems (mobility, energy, public services,
  waste), scenarios and actions as the Streamlit MVP — expressed as an app.
- A **living, animated city** (SVG) that grows with the profile and glows with
  the city's health, echoing the logo's heartbeat pulse line.
- Smooth screen transitions, segmented controls, sliders, and reactive
  before → after comparisons.

---

## Run locally

```bash
cd citypulse_react_mvp
npm install
npm run dev
```

Open the printed URL (default http://localhost:5178) and, in your browser dev
tools, switch to a mobile device frame for the intended experience.

Build a static bundle:

```bash
npm run build && npm run preview
```

The build is fully static — deploy `dist/` to any static host (Netlify, Vercel,
GitHub Pages, S3).

---

## Wiring in the real models later

Everything the UI needs comes from one function,
[`src/engine/cityModel.js → readCity(profile)`](src/engine/cityModel.js). Today
it computes demo pressures locally. To use the real models, replace its body
with a call to a backend that hosts the four `joblib` bundles (see the Streamlit
app's `core/adapter.py` for the exact model contract):

```js
export async function readCity(profile) {
  const res = await fetch(`${API}/city`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  })
  return await res.json() // same { systems, sorted, health, priority } shape
}
```

No component changes are required — the reading shape is already the contract.

---

## Project layout

```
citypulse_react_mvp/
├── index.html
├── src/
│   ├── App.jsx                 # the mobile journey + state machine
│   ├── engine/
│   │   ├── cityModel.js        # demo model + the readCity() seam
│   │   ├── scenarios.js        # profile, scenarios, actions
│   │   └── guide.js            # the AI City Guide narration
│   └── components/
│       ├── CityScene.jsx       # the living animated city (SVG)
│       └── Bits.jsx            # health ring, cards, guide, 3-questions
├── public/citypulse-logo.png
└── package.json                # React + Vite only (no heavy deps)
```

---

## Relationship to the Streamlit MVP

The two MVPs deliberately share the **same product model** — identical systems,
scenarios, actions, guide voice and journey — so this concept can graduate to
real models by pointing `readCity()` at the same backend the Streamlit adapter
already implements. The team's original app (`../citypulse_streamlit/`) is left
untouched.
