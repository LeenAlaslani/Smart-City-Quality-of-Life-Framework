"""
CityPulse AI — the living city.

`render_city(profile, reading)` returns a self-contained animated SVG string.
The skyline *grows* with population and density, greens up with parks, shifts
with the season, and — once the models have run — glows with the city's health
and shows a beacon per system that reacts to its pressure. It deliberately
echoes the logo's heartbeat pulse line along the ground.

Everything is deterministic (seeded by the city name) so the skyline stays
stable across Streamlit reruns instead of jumping around.
"""
from __future__ import annotations

import hashlib
import random
from typing import Optional

from core.city_profile import CityProfile, SYSTEMS, SYSTEM_META

W, H = 900, 400
GROUND = 312


def _seed(name: str) -> random.Random:
    h = int(hashlib.md5(name.encode("utf-8")).hexdigest(), 16)
    return random.Random(h)


def health_color(health: int) -> str:
    """Green (great) -> amber -> red (poor)."""
    if health >= 70:
        return "#22c55e"
    if health >= 55:
        return "#84cc16"
    if health >= 42:
        return "#f59e0b"
    if health >= 28:
        return "#f97316"
    return "#ef4444"


def _sky(season: str) -> str:
    grads = {
        "Summer": ("#0b2a4a", "#123f63", "#f6b26b"),
        "Spring": ("#0a2340", "#123a5c", "#8fd3c7"),
        "Autumn": ("#0a1f38", "#123151", "#d98a4e"),
        "Winter": ("#0a1d33", "#102a49", "#a9c7e8"),
    }
    top, mid, orb = grads.get(season, grads["Summer"])
    orb_y = 90
    orb_el = (f'<circle cx="740" cy="{orb_y}" r="34" fill="{orb}" '
              f'opacity="0.75" filter="url(#soft)"/>')
    return top, mid, orb_el


def render_city(profile: CityProfile, reading: Optional[object] = None,
                height_px: int = 340) -> str:
    rng = _seed(profile.name)
    health = reading.health if reading is not None else 62
    glow = health_color(health)
    top, mid, orb_el = _sky(profile.season)

    # --- skyline geometry driven by the profile --------------------------
    n_buildings = int(min(26, max(7, 7 + profile.population / 55_000)))
    dens = {"Compact": 0.9, "Balanced": 1.0, "Spread out": 1.25}[profile.density]
    gap = 6 * dens
    avail = W - 80
    bw = (avail - gap * (n_buildings - 1)) / n_buildings
    pop_h = min(1.0, profile.population / 900_000)     # tall-city factor

    parts = []
    x = 40.0
    for i in range(n_buildings):
        base_h = 46 + rng.random() * 150 * (0.55 + 0.6 * pop_h)
        bh = base_h
        y = GROUND - bh
        wdt = bw * (0.8 + rng.random() * 0.4)
        # building body
        parts.append(
            f'<g class="bld" style="animation-delay:{i*0.05:.2f}s">'
            f'<rect x="{x:.1f}" y="{y:.1f}" width="{wdt:.1f}" height="{bh:.1f}" '
            f'rx="3" fill="url(#bgrad)" stroke="rgba(58,214,230,.18)"/>'
        )
        # windows (some lit, seeded)
        cols = max(1, int(wdt // 11))
        rows = max(1, int(bh // 15))
        for c in range(cols):
            for r in range(rows):
                if rng.random() < 0.55:
                    wx = x + 5 + c * 11
                    wy = y + 7 + r * 15
                    lit = rng.random() < 0.5
                    fill = "#3ad6e6" if lit else "rgba(159,182,212,.25)"
                    op = 0.9 if lit else 0.5
                    tw = (f'<animate attributeName="opacity" values="{op};.2;{op}" '
                          f'dur="{2.5+rng.random()*3:.1f}s" repeatCount="indefinite"/>'
                          if lit else "")
                    parts.append(
                        f'<rect x="{wx:.1f}" y="{wy:.1f}" width="4.5" height="6" '
                        f'rx="1" fill="{fill}" opacity="{op}">{tw}</rect>')
        parts.append("</g>")
        x += wdt + gap

    # --- greenery (parks / trees) by green_space -------------------------
    n_trees = int(profile.green_space / 7)
    trees = []
    for _ in range(n_trees):
        tx = 40 + rng.random() * (W - 80)
        th = 10 + rng.random() * 10
        trees.append(
            f'<g opacity="0.9"><rect x="{tx:.0f}" y="{GROUND-th:.0f}" width="2.5" '
            f'height="{th:.0f}" fill="#3b6f4a"/>'
            f'<circle cx="{tx+1.2:.0f}" cy="{GROUND-th:.0f}" r="{6+th*0.3:.0f}" '
            f'fill="#2f8f5b" opacity="0.85"/></g>')

    # --- heartbeat pulse line along the ground (echoes the logo) ---------
    amp = 8 + (100 - health) * 0.18          # rougher pulse when unhealthy
    py = GROUND + 40
    seg = (f"M 20 {py} L 250 {py} l 14 -6 l 12 {amp:.0f} l 14 -{amp*1.6:.0f} "
           f"l 12 {amp*1.1:.0f} l 12 -{amp*0.4:.0f} L 640 {py} l 14 -6 "
           f"l 12 {amp:.0f} l 14 -{amp*1.4:.0f} l 12 {amp*0.8:.0f} L 880 {py}")

    # --- system beacons (only after models have run) ---------------------
    beacons = ""
    if reading is not None:
        n = len(SYSTEMS)
        span = W - 160
        for i, s in enumerate(SYSTEMS):
            sr = reading.systems[s]
            bx = 80 + span * (i + 0.5) / n
            by = 70 + (i % 2) * 26
            r = 9 + sr.pressure / 12
            pulse_dur = max(0.7, 2.6 - sr.pressure / 45)
            beacons += (
                f'<g>'
                f'<circle cx="{bx:.0f}" cy="{by:.0f}" r="{r:.0f}" fill="{sr.color}" '
                f'opacity="0.28" filter="url(#soft)">'
                f'<animate attributeName="r" values="{r:.0f};{r+6:.0f};{r:.0f}" '
                f'dur="{pulse_dur:.1f}s" repeatCount="indefinite"/></circle>'
                f'<circle cx="{bx:.0f}" cy="{by:.0f}" r="6" fill="{sr.color}"/>'
                f'<text x="{bx:.0f}" y="{by+3:.0f}" text-anchor="middle" '
                f'font-size="9">{SYSTEM_META[s]["icon"]}</text>'
                f'</g>')

    svg = f"""
<svg viewBox="0 0 {W} {H}" width="100%" height="{height_px}"
     preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"
     style="display:block; border-radius:18px;">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="{top}"/>
      <stop offset="70%" stop-color="{mid}"/>
      <stop offset="100%" stop-color="#0a1c39"/>
    </linearGradient>
    <linearGradient id="bgrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1c477e"/>
      <stop offset="100%" stop-color="#0e2a4f"/>
    </linearGradient>
    <radialGradient id="halo" cx="50%" cy="90%" r="70%">
      <stop offset="0%" stop-color="{glow}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="{glow}" stop-opacity="0"/>
    </radialGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="6"/></filter>
  </defs>

  <rect x="0" y="0" width="{W}" height="{H}" rx="18" fill="url(#sky)"/>
  {orb_el}
  <rect x="0" y="120" width="{W}" height="{H-120}" fill="url(#halo)"/>

  <!-- ground -->
  <rect x="0" y="{GROUND}" width="{W}" height="{H-GROUND}" fill="#0a1830"/>
  <line x1="0" y1="{GROUND}" x2="{W}" y2="{GROUND}" stroke="rgba(58,214,230,.25)"/>

  {''.join(parts)}
  {''.join(trees)}
  {beacons}

  <!-- heartbeat -->
  <path d="{seg}" fill="none" stroke="{glow}" stroke-width="2.6"
        stroke-linecap="round" stroke-linejoin="round" opacity="0.9"
        filter="url(#soft)"/>
  <path d="{seg}" fill="none" stroke="{glow}" stroke-width="2.2"
        stroke-linecap="round" stroke-linejoin="round"
        stroke-dasharray="14 320" opacity="0.95">
    <animate attributeName="stroke-dashoffset" from="0" to="-1200"
             dur="4s" repeatCount="indefinite"/>
  </path>

  <style>
    .bld {{ transform-box: fill-box; transform-origin: bottom;
           animation: rise .8s cubic-bezier(.2,.8,.2,1) both; }}
    @keyframes rise {{ from {{ transform: scaleY(0); opacity:0; }}
                       to {{ transform: scaleY(1); opacity:1; }} }}
  </style>
</svg>
"""
    return svg
