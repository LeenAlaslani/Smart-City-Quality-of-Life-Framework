// CityPulse AI — high-fidelity landing prototype (preview route /preview/landing).
// Original identity: navy/teal/controlled-cyan, an animated particle "orb" hero
// (lazy-loaded, reduced-motion + mobile aware), then calm light product sections.
import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/icons'

const CityPulseOrb = lazy(() => import('../components/CityPulseOrb'))

function Reveal({ children, delay = 0, as = 'div', className = '' }) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect() } }, { threshold: 0.18 })
    io.observe(el); return () => io.disconnect()
  }, [])
  const Tag = as
  return <Tag ref={ref} className={`rv ${inView ? 'in' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</Tag>
}

const DOMAINS = [
  { icon: 'mobility', name: 'Mobility', line: 'Congestion and road-risk pressure, read early.' },
  { icon: 'energy', name: 'Energy', line: 'Demand peaks and building efficiency.' },
  { icon: 'governance', name: 'Public Services', line: 'Where requests risk falling behind.' },
  { icon: 'waste', name: 'Environment', line: 'Collection load and sustainability.' },
]
const STEPS = [
  { n: '01', t: 'Connected models', d: 'Four trained ML domains read the city continuously — as one engine, not four tools.' },
  { n: '02', t: 'City intelligence', d: 'Priorities, operational pressure and forecasts, combined into one clear picture.' },
  { n: '03', t: 'Government decision', d: 'A recommended action and roadmap, with the evidence and its limitations.' },
]

export default function LandingV2() {
  const nav = useNavigate()
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [formed, setFormed] = useState(reduce)

  // Safety net: never leave the hero copy hidden if the orb's onFormed
  // callback fails to fire (slow lazy chunk, throttled rAF, canvas error).
  useEffect(() => {
    if (formed) return
    const t = setTimeout(() => setFormed(true), 2200)
    return () => clearTimeout(t)
  }, [formed])

  return (
    <div className={`lv2 ${formed ? 'formed' : ''}`}>
      {/* nav — logo returns home */}
      <header className="nav">
        <a className="brand" onClick={() => nav('/')} role="button" tabIndex={0}>
          <img src="/citypulse-logo.png" alt="CityPulse AI" />
        </a>
        <nav className="links">
          <a>Platform</a><a>Approach</a><a>Contact</a>
          <button className="btn-ghost" onClick={() => nav('/onboarding')}>Open platform</button>
        </nav>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="grid-tex" aria-hidden="true" />
        <Suspense fallback={<div className="orb-wrap"><div className="orb-halo" /></div>}>
          <CityPulseOrb onFormed={() => setFormed(true)} />
        </Suspense>
        <div className="hero-copy">
          <div className="ey r1">City decision intelligence</div>
          <h1 className="r2">Run your city with<br />clarity and confidence.</h1>
          <p className="sub r3">One connected workspace to understand city performance, anticipate pressure, and turn insight into action.</p>
          <div className="cta r4">
            <button className="btn-primary" onClick={() => nav('/onboarding')}>Request a demo <Icon name="arrowRight" size={17} /></button>
            <button className="btn-line" onClick={() => document.getElementById('story')?.scrollIntoView({ behavior: 'smooth' })}>See how it works</button>
          </div>
        </div>
        <div className="scroll-cue r4" aria-hidden="true"><span /></div>
      </section>

      {/* DOMAINS */}
      <section className="story light" id="story">
        <div className="wrap">
          <Reveal><div className="eyebrow">One connected engine</div></Reveal>
          <Reveal delay={60}><h2>Four domains. One city intelligence.</h2></Reveal>
          <Reveal delay={120}><p className="lead">CityPulse reads the whole city — not four separate tools — so priorities and trade-offs are seen together.</p></Reveal>
          <div className="dcards">
            {DOMAINS.map((d, i) => (
              <Reveal key={d.name} delay={160 + i * 70} className="dcard-w">
                <div className="dcard">
                  <span className="di"><Icon name={d.icon} size={20} /></span>
                  <div className="dn">{d.name}</div>
                  <div className="dl">{d.line}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="steps light2">
        <div className="wrap">
          <Reveal><div className="eyebrow">How it works</div></Reveal>
          <Reveal delay={60}><h2>From city signals to confident decisions.</h2></Reveal>
          <div className="srow">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={120 + i * 90} className="step-w">
                <div className="step">
                  <div className="sn">{s.n}</div>
                  <div className="st">{s.t}</div>
                  <div className="sd">{s.d}</div>
                </div>
                {i < 2 && <div className="sline" aria-hidden="true" />}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CLOSING */}
      <section className="closing">
        <div className="grid-tex" aria-hidden="true" />
        <Reveal><h2>See your city clearly.</h2></Reveal>
        <Reveal delay={80}><p>Built for Saudi municipalities and government entities — one connected workspace for confident city decisions.</p></Reveal>
        <Reveal delay={140}><button className="btn-primary lg" onClick={() => nav('/onboarding')}>Request a demo <Icon name="arrowRight" size={18} /></button></Reveal>
        <footer className="foot">
          <img src="/citypulse-logo.png" alt="CityPulse AI" />
          <div className="fl"><a onClick={() => nav('/')}>Home</a><a>Platform</a><a>Approach</a><a>Contact</a></div>
          <span className="muted">An intelligent decision platform for Saudi cities and municipalities</span>
        </footer>
      </section>

      <style>{styles}</style>
    </div>
  )
}

const styles = `
.lv2{--nv:#0a1a30;--nv2:#0e2a4f;--ink:#16233b;--i2:#43536b;--mut:#6b7a90;--tl:#159bb3;--cy:#3fd0e6;--tl0:#e9f4f7;--bd:#e8edf4;--light:#f6f8fb;
  font-family:"IBM Plex Sans",system-ui,sans-serif;color:var(--ink);background:#fff;overflow-x:hidden}
.lv2 a{cursor:pointer}
.lv2 .rv{opacity:0;transform:translateY(16px);transition:opacity .7s cubic-bezier(.2,.7,.2,1),transform .7s cubic-bezier(.2,.7,.2,1)}
.lv2 .rv.in{opacity:1;transform:none}
@media(prefers-reduced-motion:reduce){.lv2 .rv{opacity:1;transform:none;transition:none}}

/* nav */
.lv2 .nav{position:absolute;top:0;left:0;right:0;z-index:20;display:flex;align-items:center;justify-content:space-between;padding:20px 40px}
.lv2 .nav .brand img{height:40px;display:block}
.lv2 .links{display:flex;align-items:center;gap:26px;font-size:14px;color:rgba(233,241,251,.82)}
.lv2 .links a:hover{color:#fff}
.lv2 .btn-ghost{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.22);color:#fff;padding:9px 16px;border-radius:9px;font:inherit;font-size:14px;font-weight:600;cursor:pointer;transition:.2s}
.lv2 .btn-ghost:hover{background:rgba(255,255,255,.16)}

/* hero */
.lv2 .hero{position:relative;min-height:100svh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;
  background:radial-gradient(120% 90% at 50% 22%,#12305c 0%,#0b2038 42%,#081a30 100%);color:#fff;overflow:hidden;padding:0 24px}
.lv2 .grid-tex{position:absolute;inset:0;pointer-events:none;
  background-image:linear-gradient(rgba(120,170,210,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(120,170,210,.06) 1px,transparent 1px);
  background-size:48px 48px;mask:radial-gradient(70% 60% at 50% 40%,#000,transparent 78%)}
.lv2 .orb-wrap{position:absolute;inset:0;z-index:1}
.lv2 .orb-canvas{position:absolute;inset:0}
.lv2 .orb-halo{position:absolute;left:50%;top:44%;width:min(58vw,560px);aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;
  background:radial-gradient(closest-side,rgba(35,176,198,.18),transparent 70%);filter:blur(6px)}
.lv2 .hero-copy{position:relative;z-index:2;max-width:820px;pointer-events:none}
.lv2 .hero-copy::before{content:"";position:absolute;inset:-14% -16%;z-index:-1;pointer-events:none;
  background:radial-gradient(58% 56% at 50% 46%,rgba(7,19,38,.62),rgba(7,19,38,.28) 55%,transparent 74%)}
.lv2 .hero-copy .cta,.lv2 .hero-copy .btn-ghost{pointer-events:auto}
.lv2 .ey{font-size:13px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#7fdbe8}
.lv2 .hero h1{color:#fff;font-size:clamp(34px,6vw,62px);line-height:1.05;letter-spacing:-.025em;font-weight:700;margin:16px 0 0;
  text-shadow:0 2px 30px rgba(6,16,32,.5)}
.lv2 .sub{font-size:clamp(15px,1.7vw,19px);line-height:1.55;color:rgba(224,236,248,.86);max-width:60ch;margin:20px auto 0}
.lv2 .cta{display:flex;gap:14px;align-items:center;justify-content:center;margin-top:30px;flex-wrap:wrap}
.lv2 .btn-primary{display:inline-flex;align-items:center;gap:9px;background:linear-gradient(180deg,#1aa6c0,#14839a);color:#fff;border:none;
  padding:13px 24px;border-radius:11px;font:inherit;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 8px 26px rgba(20,131,154,.4);transition:.18s}
.lv2 .btn-primary:hover{transform:translateY(-1px);box-shadow:0 12px 32px rgba(20,131,154,.5)}
.lv2 .btn-primary.lg{padding:15px 30px;font-size:16px}
.lv2 .btn-line{background:transparent;border:1px solid rgba(255,255,255,.28);color:#fff;padding:13px 22px;border-radius:11px;font:inherit;font-size:15px;font-weight:600;cursor:pointer;transition:.18s}
.lv2 .btn-line:hover{background:rgba(255,255,255,.08)}
/* reveal-after-form: hero copy waits for the orb to form */
.lv2 .hero-copy .r1,.lv2 .hero-copy .r2,.lv2 .hero-copy .r3,.lv2 .hero-copy .r4,.lv2 .scroll-cue{opacity:0;transform:translateY(14px);
  transition:opacity .9s ease,transform .9s cubic-bezier(.2,.7,.2,1)}
.lv2.formed .r1{opacity:1;transform:none;transition-delay:.05s}
.lv2.formed .r2{opacity:1;transform:none;transition-delay:.22s}
.lv2.formed .r3{opacity:1;transform:none;transition-delay:.40s}
.lv2.formed .r4{opacity:1;transform:none;transition-delay:.58s}
.lv2.formed .scroll-cue{opacity:1;transform:none;transition-delay:.9s}
@media(prefers-reduced-motion:reduce){.lv2 .hero-copy .r1,.lv2 .hero-copy .r2,.lv2 .hero-copy .r3,.lv2 .hero-copy .r4,.lv2 .scroll-cue{opacity:1;transform:none;transition:none}}
.lv2 .scroll-cue{position:absolute;bottom:26px;left:50%;transform:translateX(-50%);z-index:2;width:24px;height:38px;border:1px solid rgba(255,255,255,.3);border-radius:14px;display:flex;justify-content:center}
.lv2 .scroll-cue span{width:3px;height:8px;border-radius:2px;background:#7fdbe8;margin-top:7px;animation:cue 1.8s infinite}
@keyframes cue{0%{opacity:0;transform:translateY(0)}30%{opacity:1}100%{opacity:0;transform:translateY(12px)}}

/* sections */
.lv2 .wrap{max-width:1080px;margin:0 auto;padding:0 40px}
.lv2 .light{background:var(--light);padding:96px 0}
.lv2 .light2{background:#fff;padding:96px 0;border-top:1px solid var(--bd)}
.lv2 .eyebrow{font-size:12px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--tl)}
.lv2 section h2{font-size:clamp(26px,3.4vw,38px);line-height:1.12;letter-spacing:-.02em;font-weight:700;margin:12px 0 0}
.lv2 .lead{font-size:17px;line-height:1.55;color:var(--i2);max-width:56ch;margin:16px 0 0}
.lv2 .dcards{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:38px}
.lv2 .dcard{background:#fff;border:1px solid var(--bd);border-radius:16px;padding:22px;height:100%;transition:transform .2s,box-shadow .2s}
.lv2 .dcard-w:hover .dcard{transform:translateY(-3px);box-shadow:0 12px 30px rgba(16,42,77,.09)}
.lv2 .di{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;background:var(--tl0);color:var(--tl);margin-bottom:14px}
.lv2 .dn{font-size:16px;font-weight:700}
.lv2 .dl{font-size:13.5px;color:var(--i2);margin-top:6px;line-height:1.5}
.lv2 .srow{display:grid;grid-template-columns:repeat(3,1fr);gap:0;margin-top:40px;position:relative}
.lv2 .step-w{position:relative;padding-right:34px}
.lv2 .step{position:relative}
.lv2 .sn{font-size:13px;font-weight:700;color:var(--tl);letter-spacing:.05em}
.lv2 .st{font-size:19px;font-weight:700;margin:8px 0 8px}
.lv2 .sd{font-size:14.5px;color:var(--i2);line-height:1.55;max-width:34ch}
.lv2 .sline{position:absolute;top:8px;right:16px;width:20px;height:1px;background:linear-gradient(90deg,var(--tl),transparent)}

/* closing */
.lv2 .closing{position:relative;background:radial-gradient(120% 100% at 50% 0,#12305c,#0b2038 60%,#081a30);color:#fff;text-align:center;padding:96px 24px 40px;overflow:hidden}
.lv2 .closing h2{color:#fff}
.lv2 .closing p{color:rgba(224,236,248,.82);font-size:17px;margin:14px auto 26px;max-width:52ch}
.lv2 .foot{position:relative;z-index:2;max-width:1080px;margin:70px auto 0;padding-top:26px;border-top:1px solid rgba(255,255,255,.12);
  display:flex;align-items:center;gap:20px;flex-wrap:wrap}
.lv2 .foot img{height:30px;opacity:.9}
.lv2 .foot .fl{display:flex;gap:20px;font-size:13px;color:rgba(233,241,251,.75)}
.lv2 .foot .fl a:hover{color:#fff}
.lv2 .foot .muted{margin-left:auto;font-size:12px;color:rgba(180,198,221,.7)}

@media(max-width:820px){
  .lv2 .nav{padding:16px 22px}.lv2 .links a{display:none}
  .lv2 .dcards{grid-template-columns:1fr 1fr}.lv2 .srow{grid-template-columns:1fr;gap:26px}.lv2 .sline{display:none}.lv2 .step-w{padding-right:0}
  .lv2 .light,.lv2 .light2{padding:64px 0}.lv2 .wrap{padding:0 22px}.lv2 .foot .muted{margin-left:0;flex-basis:100%}
}
`
