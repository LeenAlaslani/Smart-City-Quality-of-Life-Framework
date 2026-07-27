// CityPulse AI — landing page. Premium product-marketing feel: expressive but
// calm, centered hero with a beautiful floating product preview. Navy/teal on
// light. One headline, one line, one CTA. No ML content, no "Vision 2030".
import { useNavigate } from 'react-router-dom'
import { useProfile } from '../lib/store'
import { Button } from '../components/ui'
import AppPreview from '../components/AppPreview'

export default function Landing() {
  const nav = useNavigate()
  const { isOnboarded } = useProfile()
  return (
    <div className="lp">
      <div className="lp-bg" aria-hidden="true" />
      <header className="lp-head">
        <div className="brand"><img src="/citypulse-logo.png" alt="CityPulse AI" /></div>
        <Button variant="secondary" className="btn-pill"
          onClick={() => nav(isOnboarded ? '/app/overview' : '/onboarding')}>
          {isOnboarded ? 'Open platform' : 'Open platform'}
        </Button>
      </header>

      <main className="lp-main">
        <div className="lp-ey">Smart-city decision intelligence</div>
        <h1 className="lp-h1">Run your city with<br /><span className="grad">clarity and confidence.</span></h1>
        <p className="lp-lead">
          One intelligent workspace that turns city data into clear decisions across
          mobility, energy, services and environment — for Saudi municipalities.
        </p>
        <div className="lp-cta">
          <Button size="lg" className="btn-pill" iconRight="arrowRight" onClick={() => nav('/onboarding')}>
            Set up your city
          </Button>
        </div>

        <div className="lp-preview"><AppPreview /></div>
      </main>

      <footer className="lp-foot">
        <img src="/citypulse-logo.png" alt="" />
        <span className="muted">An intelligent decision platform for Saudi cities and municipalities</span>
      </footer>

      <style>{`
        .lp { position:relative; min-height:100dvh; display:flex; flex-direction:column; overflow:hidden; background:var(--cp-bg); }
        .lp-bg { position:absolute; inset:0; z-index:0; pointer-events:none;
          background:
            radial-gradient(60% 40% at 82% -6%, rgba(21,155,179,.16), transparent 70%),
            radial-gradient(52% 42% at 10% 8%, rgba(29,74,130,.10), transparent 70%),
            linear-gradient(180deg, #fbfdff 0%, var(--cp-bg) 40%); }
        .lp-bg::after { content:''; position:absolute; inset:0;
          background-image:radial-gradient(circle at 1px 1px, rgba(29,74,130,.05) 1px, transparent 0);
          background-size:26px 26px; mask:linear-gradient(180deg, #000, transparent 55%); }
        .lp-head, .lp-main, .lp-foot { position:relative; z-index:1; }
        .lp-head { height:76px; display:flex; align-items:center; justify-content:space-between; padding:0 var(--sp-10); }
        .lp-head .brand img { height:52px; display:block; }
        .lp-main { flex:1; max-width:1060px; width:100%; margin:0 auto; padding:var(--sp-10) var(--sp-8) var(--sp-12); text-align:center; }
        .lp-ey { font-size:var(--fs-13); font-weight:600; letter-spacing:.14em; text-transform:uppercase; color:var(--cp-teal-600); }
        .lp-h1 { font-size:56px; line-height:1.06; letter-spacing:-0.025em; margin-top:var(--sp-4); font-weight:700; }
        .lp-h1 .grad { background:linear-gradient(100deg, #1d4a82 10%, #159bb3 90%); -webkit-background-clip:text; background-clip:text; color:transparent; }
        .lp-lead { font-size:var(--fs-18); color:var(--cp-ink-2); max-width:56ch; margin:var(--sp-5) auto 0; line-height:1.55; }
        .lp-cta { margin-top:var(--sp-8); }
        .lp-preview { margin-top:var(--sp-12); }
        .lp-foot { display:flex; align-items:center; gap:var(--sp-4); justify-content:center; text-align:center;
          padding:var(--sp-6) var(--sp-8); flex-wrap:wrap; }
        .lp-foot img { height:26px; opacity:.85; }
        @media (max-width:960px){ .lp-h1{ font-size:38px;} .lp-head{ padding:0 var(--sp-6);} .lp-head .brand img{ height:44px;} .lp-main{ padding:var(--sp-8) var(--sp-5) var(--sp-10);} }
      `}</style>
    </div>
  )
}
