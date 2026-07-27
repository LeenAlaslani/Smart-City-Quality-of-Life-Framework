// CityPulse AI — City Overview: an executive command center. Map, KPIs with
// trends, a priority focus, domain balance, upcoming pressure and decisions —
// visual-first, minimal text. Models run silently.
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useProfile } from '../lib/store'
import { useWorkspace } from '../lib/workspace'
import { Card, Button, Loading, ErrorState, Insight, StatusChip } from '../components/ui'
import { PhaseStrip } from '../components/charts'
import { Kpi, Donut, DistrictMap, Compare, Sparkline } from '../components/viz'
import Icon, { DOMAIN_ICON } from '../components/icons'

const SEV = { Critical: 'var(--cp-critical)', High: 'var(--cp-high)', Elevated: 'var(--cp-elevated)' }

export default function Overview() {
  const nav = useNavigate()
  const { profile } = useProfile()
  const ws = useWorkspace()
  const [base, setBase] = useState(null)
  const [proj, setProj] = useState(null)
  const [err, setErr] = useState(null)

  const load = () => {
    setErr(null); setBase(null)
    Promise.all([api.analyze(profile, 'baseline'), api.analyze(profile, 'visitor_surge')])
      .then(([b, p]) => { setBase(b); setProj(p) }).catch((e) => setErr(e.message))
  }
  useEffect(load, [])

  const openActions = ws.actions.filter((a) => a.status !== 'Done').length
  const cityName = base?.city || (profile.city ? profile.city[0].toUpperCase() + profile.city.slice(1) : 'Your city')

  if (err) return <><Head city={cityName} /><ErrorState onRetry={load}>{err}</ErrorState></>
  if (!base) return <><Head city={cityName} /><Loading label="Preparing your city command center…" /></>

  const signals = base.reading.signals
  const impact = base.impact
  const focus = signals[impact.focus_domain]
  const watch = Object.values(signals).filter((s) => SEV[s.status]).length
  const ordered = Object.values(signals).sort((a, b) => b.pressure - a.pressure)

  return (
    <>
      <Head city={cityName} region={profile.city_type} />

      {/* KPI row */}
      <div className="kpi-grid">
        <Kpi icon="target" label="Priority for attention" value={focus.domain_label.split(' & ')[0]}
          chip={focus.status} chipTone={chipTone(focus.status)} seed={7} dir={0.4} color={focus.color} />
        <Kpi icon="alert" label="Domains to watch" value={watch} chip="live" chipTone="info" seed={3} dir={0.2} color="var(--cp-elevated)" />
        <Kpi icon="actions" label="Open actions" value={openActions} chip={`${ws.actions.length} total`} chipTone="neutral" seed={11} dir={-0.3} color="var(--cp-teal-600)" />
        <Kpi icon="roadmap" label="Roadmap initiatives" value={ws.roadmap.length} chip="Discovery" chipTone="neutral" seed={5} dir={0.5} color="var(--cp-navy-600)" />
      </div>

      {/* map + priority */}
      <div className="dash r-2a mt-4">
        <Card title={`${cityName} — operational map`} sub="Priority area highlighted across the city" icon="pin">
          <div className="mt-2"><DistrictMap focusColor={focus.color} focusName="Central" height={252} /></div>
          <Insight>{focus.domain_label.split(' & ')[0]} carries the most pressure — concentrated around the central corridor.</Insight>
        </Card>

        <div className="grid" style={{ gap: 16 }}>
          <Card className="accent" title="Requires attention" icon="target">
            <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
              <Donut value={focus.pressure} color={focus.color} label={focus.status} sub={focus.domain_label.split(' & ')[0]} />
              <div>
                <StatusChip status={focus.status} color={focus.color} />
                <p className="muted" style={{ fontSize: 13, lineHeight: 1.5, margin: '10px 0 0' }}>{impact.why}</p>
              </div>
            </div>
            <Button variant="primary" icon="arrowRight" block className="mt-4" onClick={() => nav('/app/intelligence')}>
              Explore in City Intelligence
            </Button>
          </Card>
          <Card title="Transformation roadmap" icon="roadmap">
            <div className="mt-2" style={{ padding: '4px 2px' }}><PhaseStrip stage={0} /></div>
          </Card>
        </div>
      </div>

      {/* domain balance + upcoming pressure */}
      <div className="dash r-2b mt-4">
        <Card title="Domain balance" sub="How the four connected domains are performing" icon="layers">
          <div className="dom-grid mt-3">
            {ordered.map((s, i) => (
              <div className="dom-tile" key={s.domain}>
                <div className="dh">
                  <span className="dn"><Icon name={DOMAIN_ICON[s.domain]} size={16} /> {s.domain_label.split(' & ')[0]}</span>
                  <StatusChip status={s.status} color={s.color} />
                </div>
                <div className="dsp"><Sparkline seed={i * 4 + 2} dir={i % 2 ? -0.3 : 0.3} color={s.color} w={200} h={30} /></div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Upcoming pressure" sub="Projected under a peak-demand period" icon="up"
          right={<span className="chip chip-neutral">Projection</span>}>
          <div className="mt-3"><Compare signals={proj.reading.signals} baseline={base.reading.signals} /></div>
        </Card>
      </div>

      {/* alerts & decisions */}
      <div className="dash r-2b mt-4">
        <Card title="Alerts requiring attention" icon="alert">
          <div className="plist mt-1">
            {ordered.filter((s) => SEV[s.status]).slice(0, 3).map((s) => (
              <div className="pl-row" key={s.domain}>
                <span style={{ width: 8, height: 8, borderRadius: 8, background: SEV[s.status], flex: '0 0 auto' }} />
                <div><div className="pt">{s.domain_label} — {s.status.toLowerCase()} pressure</div><div className="pm">{s.driver}</div></div>
                <span className="pa"><Button size="sm" variant="secondary" iconRight="arrowRight" onClick={() => nav('/app/intelligence')}>Review</Button></span>
              </div>
            ))}
            {!ordered.some((s) => SEV[s.status]) && <div className="pl-row"><span style={{ width: 8, height: 8, borderRadius: 8, background: 'var(--cp-stable)' }} /><div className="pt">All domains within normal range</div></div>}
          </div>
        </Card>
        <Card title="Decisions to review" icon="actions"
          right={<Button size="sm" variant="ghost" iconRight="arrowRight" onClick={() => nav('/app/actions')}>Action Center</Button>}>
          <div className="plist mt-1">
            {ws.actions.filter((a) => a.status === 'To review').slice(0, 3).map((a) => (
              <div className="pl-row" key={a.id}>
                <Icon name="clock" size={16} style={{ color: 'var(--cp-muted)' }} />
                <div><div className="pt">{a.title}</div><div className="pm">{a.department} · due {a.due}</div></div>
                <span className="pa"><span className="chip chip-info">{a.priority}</span></span>
              </div>
            ))}
            {!ws.actions.some((a) => a.status === 'To review') && <div className="pl-row"><Icon name="check" size={16} style={{ color: 'var(--cp-stable)' }} /><div className="pt">No decisions awaiting review</div></div>}
          </div>
        </Card>
      </div>
    </>
  )
}

const chipTone = (s) => ({ Stable: 'stable', Watch: 'watch', Elevated: 'elevated', High: 'high', Critical: 'critical' }[s] || 'neutral')

function Head({ city }) {
  return (
    <div className="pagehead">
      <div className="eyebrow">City Overview</div>
      <h1>{city}</h1>
      <p className="lead">Your city at a glance — priorities, pressure and decisions, from connected intelligence.</p>
    </div>
  )
}
