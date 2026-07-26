"""CityPulse AI — reusable HTML fragments for the Streamlit UI."""
from __future__ import annotations

import re
from typing import List, Optional

from core.adapter import CityReading
from ui.city_svg import health_color

JOURNEY = ["Found", "Pulse", "Test", "Diagnose", "Improve"]


def b(text: str) -> str:
    """Convert markdown **bold** to <b> — needed because our text is injected
    as raw HTML, where Streamlit's markdown never runs."""
    return re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text or "")


def guide(text: str) -> str:
    return (
        '<div class="cp-guide"><div class="avatar">🛰️</div>'
        f'<div class="body"><div class="who">CityPulse Guide</div>{b(text)}</div></div>'
    )


def stepper(active_idx: int) -> str:
    dots = []
    for i, name in enumerate(JOURNEY):
        cls = "dot active" if i == active_idx else ("dot done" if i < active_idx else "dot")
        dots.append(f'<span class="{cls}">{i+1}. {name}</span>')
    return f'<div class="cp-step">{"".join(dots)}</div>'


def system_cards(reading: CityReading) -> str:
    cards = []
    for s in reading.sorted_systems():
        live = "" if s.live else '<span class="live">demo</span>'
        w = max(4, min(100, s.pressure))
        cards.append(
            f'<div class="cp-card"><div class="glow" style="background:{s.color}"></div>'
            f'{live}<div class="ico">{s.icon}</div>'
            f'<div class="name">{s.label}</div>'
            f'<div class="status" style="color:{s.color}">{s.status}</div>'
            f'<div class="bar"><i style="width:{w:.0f}%;background:{s.color}"></i></div>'
            f'</div>'
        )
    return f'<div class="cp-cards">{"".join(cards)}</div>'


def health_ring(health: int, subtitle: str = "Quality of Life") -> str:
    """Self-contained (inline styles) so it renders inside a components.html
    iframe, which does not inherit the app's injected CSS."""
    color = health_color(health)
    circ = 2 * 3.14159 * 52
    dash = circ * health / 100
    return f"""
    <div style="text-align:center;font-family:'Source Sans Pro',sans-serif">
      <svg viewBox="0 0 130 130" width="160" height="160">
        <circle cx="65" cy="65" r="52" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="12"/>
        <circle cx="65" cy="65" r="52" fill="none" stroke="{color}" stroke-width="12"
          stroke-linecap="round" stroke-dasharray="{dash:.1f} {circ:.1f}"
          transform="rotate(-90 65 65)">
          <animate attributeName="stroke-dasharray" from="0 {circ:.1f}"
            to="{dash:.1f} {circ:.1f}" dur="1s" fill="freeze"/>
        </circle>
        <text x="65" y="60" text-anchor="middle" font-size="30" font-weight="800"
          fill="{color}">{health}</text>
        <text x="65" y="82" text-anchor="middle" font-size="10" fill="#9fb6d4">/ 100</text>
      </svg>
      <div style="color:#9fb6d4;text-transform:uppercase;letter-spacing:.16em;
        font-size:.72rem;margin-top:-.4rem">{subtitle}</div>
    </div>"""


def delta_chip(before: float, after: float, invert: bool = True) -> str:
    """Change chip. invert=True means lower pressure is good (green)."""
    d = after - before
    if abs(d) < 1.5:
        return '<span class="cp-delta flat">no change</span>'
    good = (d < 0) if invert else (d > 0)
    cls = "down" if good else "up"
    arrow = "▼" if d < 0 else "▲"
    return f'<span class="cp-delta {cls}">{arrow} {abs(d):.0f}</span>'


def three_questions(diag: dict) -> str:
    return (
        f'<div class="cp-q"><div class="qh">① What is happening</div>'
        f'<div class="qb">{b(diag["happening"])}<br><span style="color:#9fb6d4">'
        f'{b(diag["detail"])}</span></div></div>'
        f'<div class="cp-q"><div class="qh">② Why it matters</div>'
        f'<div class="qb">{b(diag["why"])}</div></div>'
        f'<div class="cp-q"><div class="qh">③ What to do next</div>'
        f'<div class="qb">{b(diag["do_next"])}<br><span style="color:#9fb6d4">'
        f'{b(diag["connection"])}</span></div></div>'
    )


def compare_row(label: str, icon: str, before: float, after: float,
                color: str) -> str:
    """A before→after mini row for the scenario/improve screens."""
    return (
        f'<div style="display:flex;align-items:center;gap:.6rem;padding:.35rem 0;">'
        f'<span style="width:150px">{icon} {label}</span>'
        f'<div style="flex:1;height:8px;border-radius:6px;background:rgba(255,255,255,.08);position:relative">'
        f'<i style="position:absolute;left:0;top:0;height:100%;border-radius:6px;'
        f'width:{max(4,min(100,after)):.0f}%;background:{color}"></i></div>'
        f'<span style="width:70px;text-align:right">{delta_chip(before, after)}</span></div>'
    )
