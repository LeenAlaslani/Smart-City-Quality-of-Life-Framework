// CityPulse AI — Reports. A concise executive city summary for stakeholders,
// composed from the live city picture, roadmap and actions.
import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useProfile } from '../lib/store'
import { useWorkspace } from '../lib/workspace'
import { Card, Button, Loading, ErrorState, StatusChip } from '../components/ui'
import Icon from '../components/icons'

export default function Reports() {
  const { profile } = useProfile()
  const ws = useWorkspace()
  const [r, setR] = useState(null)
  const [err, setErr] = useState(null)
  const load = () => { setErr(null); setR(null); api.analyze(profile, 'baseline').then(setR).catch((e) => setErr(e.message)) }
  useEffect(load, [])

  if (err) return <><Head /><ErrorState onRetry={load}>{err}</ErrorState></>
  if (!r) return <><Head /><Loading label="Composing report…" /></>

  const s = r.reading.signals
  const focus = s[r.impact.focus_domain]
  const ordered = Object.values(s).sort((a, b) => b.pressure - a.pressure)

  return (
    <>
      <div className="pagehead between">
        <div><div className="eyebrow">Reports</div><h1>Executive city summary</h1>
          <p className="lead">A concise, shareable snapshot for government stakeholders.</p></div>
        <Button icon="evidence" onClick={() => window.print()}>Export / print</Button>
      </div>

      <Card className="pad-lg report">
        <div className="between" style={{ borderBottom: '1px solid var(--cp-border)', paddingBottom: 16, marginBottom: 18 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <img src="/citypulse-logo.png" alt="CityPulse AI" style={{ height: 34 }} />
            <div><div style={{ fontWeight: 700, fontSize: 17 }}>{r.city} — City Summary</div>
              <div className="muted" style={{ fontSize: 12 }}>{new Date().toLocaleDateString()} · CityPulse AI</div></div>
          </div>
          <StatusChip status={focus.status} color={focus.color} />
        </div>

        <Section n="1" title="Priority for attention">
          <b>{focus.domain_label}</b> — {focus.status.toLowerCase()} operational pressure. {r.impact.why}
        </Section>
        <Section n="2" title="City operational picture">
          <ul className="rlist">
            {ordered.map((x) => <li key={x.domain}><span>{x.domain_label}</span><span className="chip" style={{ color: x.color }}><span className="led" style={{ background: x.color }} />{x.status}</span></li>)}
          </ul>
        </Section>
        <Section n="3" title="Recommended first move">{r.impact.recommended_response}</Section>
        <Section n="4" title="Roadmap">
          {ws.roadmap.length ? <ul className="rul">{ws.roadmap.slice(0, 4).map((i) => <li key={i.id}><b>{i.title}</b> — {i.objective} <span className="muted">({i.horizon}-term · {i.status})</span></li>)}</ul> : <span className="muted">No initiatives yet.</span>}
        </Section>
        <Section n="5" title="Tracked actions">
          {ws.actions.length ? <ul className="rul">{ws.actions.slice(0, 4).map((a) => <li key={a.id}><b>{a.title}</b> <span className="muted">({a.status} · {a.department})</span></li>)}</ul> : <span className="muted">No actions yet.</span>}
        </Section>

        <div className="report-note"><Icon name="info" size={14} /> Model-supported intelligence. A validated local forecast requires connected Saudi municipal data.</div>
      </Card>

      <style>{`
        .report .rlist { list-style:none; padding:0; margin:6px 0 0; display:grid; grid-template-columns:1fr 1fr; gap:8px 24px; }
        .report .rlist li { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--cp-border); font-size:14px; }
        .report .rul { margin:6px 0 0; padding-inline-start:18px; font-size:14px; line-height:1.6; color:var(--cp-ink-2); }
        .report-note { display:flex; align-items:center; gap:8px; margin-top:20px; padding-top:16px; border-top:1px solid var(--cp-border); font-size:12px; color:var(--cp-muted); }
        @media print { .header,.sidenav,.pagehead .btn,.btn { display:none !important; } .main{ padding:0 !important; } }
      `}</style>
    </>
  )
}

const Section = ({ n, title, children }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
      <span className="narr" /><span style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--cp-teal-050)', color: 'var(--cp-navy-700)', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700 }}>{n}</span>
      <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--cp-muted)', fontWeight: 700 }}>{title}</span>
    </div>
    <div style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--cp-ink)', paddingInlineStart: 32 }}>{children}</div>
  </div>
)
const Head = () => (
  <div className="pagehead"><div className="eyebrow">Reports</div><h1>Executive city summary</h1></div>
)
