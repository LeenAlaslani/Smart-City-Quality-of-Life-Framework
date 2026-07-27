// CityPulse AI — Reports: a concise, printable executive summary composed from
// the live model reading and the real workspace (initiatives + operational
// tasks). Concrete outcomes with units; one honest provenance line.
import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useProfile } from '../lib/store'
import { useWorkspace } from '../lib/workspace'
import { OUTCOME_LABEL, fmtOutcome, PROTOTYPE_NOTE } from '../lib/cityContext'
import { Card, Button, Loading, ErrorState, StatusChip } from '../components/ui'
import Icon, { DOMAIN_ICON } from '../components/icons'

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
  const inits = ws.initiatives || []
  const inReview = inits.filter((i) => i.status === 'In review')
  const inDelivery = inits.filter((i) => i.status === 'In delivery')
  const openTasks = (ws.tasks || []).filter((t) => t.status !== 'Done')

  return (
    <>
      <div className="pg">
        <div><div className="pg-eyebrow">Reports · {r.city}</div><h1>Executive city summary</h1>
          <p className="pg-purpose">A concise, shareable snapshot composed from live model readings and the workspace.</p></div>
        <div className="pg-r"><Button icon="reports" onClick={() => window.print()}>Export / print</Button></div>
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
          <b>{focus.domain_label}</b> — {focus.status.toLowerCase()}. {r.impact.why}{' '}
          Recommended first move: {r.impact.recommended_response}
        </Section>

        <Section n="2" title="Service outcomes (live model readings)">
          <div className="rep-outs">
            {ordered.map((x) => (
              <div className="rep-out" key={x.domain}>
                <span className="ro-ic"><Icon name={DOMAIN_ICON[x.domain]} size={15} /></span>
                <span className="ro-l">{OUTCOME_LABEL[x.domain]}</span>
                <span className="ro-v">{fmtOutcome(x)}</span>
                <span className="ro-st" style={{ color: x.color }}>{x.status}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section n="3" title="Initiatives & delivery">
          <b>{inits.length}</b> initiative{inits.length === 1 ? '' : 's'} in the pipeline
          {inReview.length ? <> · <b>{inReview.length}</b> awaiting review (first: {inReview[0].title})</> : null}
          {inDelivery.length ? <> · <b>{inDelivery.length}</b> in delivery</> : null}.
          {inits.length ? <ul className="rul">{inits.slice(0, 5).map((i) => <li key={i.id}><b>{i.title}</b> — {i.status} · owner {i.owner}</li>)}</ul> : ' No initiatives yet.'}
        </Section>

        <Section n="4" title="Operational tasks">
          {openTasks.length ? <ul className="rul">{openTasks.slice(0, 5).map((t) => <li key={t.id}><b>{t.title}</b> <span className="muted">({t.status} · {t.department})</span></li>)}</ul> : <span className="muted">No open tasks.</span>}
        </Section>

        <div className="report-note"><Icon name="info" size={14} /> {PROTOTYPE_NOTE}</div>
      </Card>

      <style>{`
        .report .rul{margin:6px 0 0;padding-inline-start:18px;font-size:14px;line-height:1.6;color:var(--cp-ink-2)}
        .rep-outs{display:grid;grid-template-columns:1fr 1fr;gap:8px 22px;margin-top:6px}
        .rep-out{display:flex;align-items:center;gap:9px;padding:8px 0;border-bottom:1px solid var(--cp-border);font-size:13.5px}
        .ro-ic{color:var(--cp-teal-600);display:inline-flex}
        .ro-l{color:var(--cp-ink-2);font-weight:600}
        .ro-v{margin-inline-start:auto;color:var(--cp-ink);font-weight:700}
        .ro-st{font-size:11px;font-weight:800;text-transform:uppercase}
        .report-note{display:flex;align-items:center;gap:8px;margin-top:20px;padding-top:16px;border-top:1px solid var(--cp-border);font-size:12px;color:var(--cp-muted)}
        @media print { .rail,.cbar,.pg .btn,.btn{display:none !important} .stagex{padding:0 !important} }
        @media (max-width:760px){ .rep-outs{grid-template-columns:1fr} }
      `}</style>
    </>
  )
}

const Section = ({ n, title, children }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
      <span style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--cp-teal-050)', color: 'var(--cp-navy-700)', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700 }}>{n}</span>
      <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--cp-muted)', fontWeight: 700 }}>{title}</span>
    </div>
    <div style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--cp-ink)', paddingInlineStart: 32 }}>{children}</div>
  </div>
)
const Head = () => (
  <div className="pg"><div><div className="pg-eyebrow">Reports</div><h1>Executive city summary</h1></div></div>
)
