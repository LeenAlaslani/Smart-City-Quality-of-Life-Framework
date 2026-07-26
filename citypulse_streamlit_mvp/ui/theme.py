"""CityPulse AI — visual theme (brand palette + injected CSS)."""

# Brand palette, pulled from the CityPulse AI logo (navy + teal pulse).
NAVY_DEEP = "#0a1a33"
NAVY = "#12305c"
NAVY_SOFT = "#1b4076"
TEAL = "#23b0c6"
TEAL_BRIGHT = "#3ad6e6"
INK = "#e8f1fb"
MUTED = "#9fb6d4"

CSS = f"""
<style>
:root {{
  --navy-deep: {NAVY_DEEP};
  --navy: {NAVY};
  --teal: {TEAL};
  --teal-bright: {TEAL_BRIGHT};
  --ink: {INK};
  --muted: {MUTED};
}}

/* App background: deep city-at-night gradient */
.stApp {{
  background:
    radial-gradient(1200px 600px at 80% -10%, rgba(58,214,230,0.10), transparent 60%),
    radial-gradient(900px 500px at 0% 100%, rgba(35,176,198,0.08), transparent 55%),
    linear-gradient(160deg, {NAVY_DEEP} 0%, #0c2246 60%, #0a1c39 100%);
  color: var(--ink);
}}
/* tighten default padding, center the experience */
.block-container {{ padding-top: 2.2rem; max-width: 1080px; }}

h1,h2,h3,h4 {{ color: var(--ink); letter-spacing:.2px; }}
p, li, label, span, div {{ color: var(--ink); }}

/* ---- Guide bubble ---- */
.cp-guide {{
  display:flex; gap:.85rem; align-items:flex-start;
  background: linear-gradient(180deg, rgba(35,176,198,.14), rgba(18,48,92,.35));
  border:1px solid rgba(58,214,230,.35); border-left:4px solid var(--teal-bright);
  border-radius:14px; padding:.85rem 1.05rem; margin:.4rem 0 1.1rem;
  box-shadow: 0 6px 22px rgba(0,0,0,.25);
}}
.cp-guide .avatar {{
  flex:0 0 auto; width:38px; height:38px; border-radius:50%;
  background: radial-gradient(circle at 30% 30%, var(--teal-bright), var(--navy));
  display:flex; align-items:center; justify-content:center; font-size:20px;
  box-shadow:0 0 14px rgba(58,214,230,.6);
}}
.cp-guide .body {{ font-size:.98rem; line-height:1.5; }}
.cp-guide .who {{ font-size:.72rem; text-transform:uppercase; letter-spacing:.14em;
  color: var(--teal-bright); margin-bottom:.15rem; font-weight:700; }}

/* ---- System cards ---- */
.cp-cards {{ display:grid; grid-template-columns:repeat(4,1fr); gap:.8rem; margin:.4rem 0 .6rem; }}
@media (max-width: 820px) {{ .cp-cards {{ grid-template-columns:repeat(2,1fr); }} }}
.cp-card {{
  position:relative; border-radius:16px; padding:1rem .95rem 1.1rem;
  background: linear-gradient(180deg, rgba(255,255,255,.05), rgba(10,26,51,.5));
  border:1px solid rgba(159,182,212,.18); overflow:hidden;
  transition: transform .25s ease;
}}
.cp-card:hover {{ transform: translateY(-3px); }}
.cp-card .ico {{ font-size:1.5rem; }}
.cp-card .name {{ font-weight:700; font-size:.95rem; margin-top:.15rem; }}
.cp-card .status {{ font-size:.82rem; font-weight:700; margin-top:.5rem; }}
.cp-card .bar {{ height:8px; border-radius:6px; background:rgba(255,255,255,.10); margin-top:.5rem; overflow:hidden; }}
.cp-card .bar > i {{ display:block; height:100%; border-radius:6px; }}
.cp-card .glow {{ position:absolute; inset:-40% -40% auto auto; width:130px; height:130px;
  border-radius:50%; filter:blur(30px); opacity:.55; }}
.cp-card .live {{ position:absolute; top:.6rem; right:.7rem; font-size:.6rem;
  letter-spacing:.1em; color:var(--muted); }}

/* ---- Health ring wrapper ---- */
.cp-health {{ text-align:center; }}
.cp-health .big {{ font-size:3.2rem; font-weight:800; line-height:1; }}
.cp-health .lab {{ color:var(--muted); text-transform:uppercase; letter-spacing:.16em; font-size:.72rem; }}

/* ---- Scenario / action tiles use native buttons; style them ---- */
.stButton > button {{
  border-radius:12px; border:1px solid rgba(58,214,230,.35);
  background: linear-gradient(180deg, rgba(35,176,198,.18), rgba(18,48,92,.5));
  color: var(--ink); font-weight:600; padding:.55rem 1rem;
  transition: all .2s ease;
}}
.stButton > button:hover {{
  border-color: var(--teal-bright);
  box-shadow:0 0 0 2px rgba(58,214,230,.25), 0 8px 20px rgba(0,0,0,.3);
  transform: translateY(-1px);
}}
/* primary CTA */
.stButton > button[kind="primary"] {{
  background: linear-gradient(180deg, var(--teal-bright), var(--teal));
  color:#06263a; border:none; font-weight:800;
}}

/* pill row */
.cp-step {{ display:flex; gap:.4rem; justify-content:center; margin:.2rem 0 1.4rem; flex-wrap:wrap; }}
.cp-step .dot {{ font-size:.72rem; padding:.28rem .7rem; border-radius:999px;
  border:1px solid rgba(159,182,212,.25); color:var(--muted); }}
.cp-step .dot.active {{ background:var(--teal); color:#06263a; border-color:var(--teal);
  font-weight:800; }}
.cp-step .dot.done {{ color:var(--teal-bright); border-color:rgba(58,214,230,.5); }}

/* delta chips */
.cp-delta {{ display:inline-block; padding:.12rem .5rem; border-radius:8px; font-size:.78rem; font-weight:700; }}
.cp-delta.up {{ background:rgba(239,68,68,.18); color:#ffb4b4; }}
.cp-delta.down {{ background:rgba(34,197,94,.18); color:#b7f5c9; }}
.cp-delta.flat {{ background:rgba(159,182,212,.14); color:var(--muted); }}

/* 3-question cards */
.cp-q {{ border-radius:14px; padding:1rem 1.1rem; margin-bottom:.7rem;
  background:linear-gradient(180deg, rgba(255,255,255,.045), rgba(10,26,51,.45));
  border:1px solid rgba(159,182,212,.16); }}
.cp-q .qh {{ font-size:.74rem; text-transform:uppercase; letter-spacing:.14em; color:var(--teal-bright); font-weight:800; }}
.cp-q .qb {{ font-size:1.02rem; line-height:1.55; margin-top:.25rem; }}

hr {{ border-color: rgba(159,182,212,.15); }}
#MainMenu, footer {{ visibility:hidden; }}
</style>
"""


def inject(st):
    st.markdown(CSS, unsafe_allow_html=True)
