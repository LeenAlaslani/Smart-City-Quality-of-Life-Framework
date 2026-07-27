// CityPulse AI — Decision Scenarios. Saved scenarios from City Intelligence,
// with a side-by-side compare view.
import { useNavigate } from 'react-router-dom'
import { useWorkspace } from '../lib/workspace'
import { Card, Button, EmptyState } from '../components/ui'
import Icon from '../components/icons'

export default function Scenarios() {
  const nav = useNavigate()
  const ws = useWorkspace()
  return (
    <>
      <div className="pagehead between">
        <div><div className="eyebrow">Decision Scenarios</div><h1>Saved scenarios</h1>
          <p className="lead">Planning scenarios you've saved from City Intelligence.</p></div>
        <Button icon="scenarios" onClick={() => nav('/app/intelligence')}>Explore a decision</Button>
      </div>

      {ws.scenarios.length === 0 ? (
        <Card><EmptyState icon="layers" title="No saved scenarios yet">
          Explore a decision in City Intelligence and choose “Save scenario” to keep it here for comparison.
          <div className="mt-4"><Button variant="secondary" iconRight="arrowRight" onClick={() => nav('/app/intelligence')}>Go to City Intelligence</Button></div>
        </EmptyState></Card>
      ) : (
        <>
          <div className="grid cols-2">
            {ws.scenarios.map((s) => (
              <Card key={s.id} title={s.title} sub={`Saved ${new Date(s.savedAt).toLocaleDateString()}`} icon="scenarios"
                right={<button className="linkbtn" onClick={() => ws.removeScenario(s.id)}><Icon name="alert" size={15} /></button>}>
                <p style={{ fontSize: 14, lineHeight: 1.5, margin: '4px 0 12px' }}>{s.summary}</p>
                <div className="between" style={{ marginBottom: 10 }}>
                  <span className="muted" style={{ fontSize: 13 }}>Focus area</span>
                  <span className="chip chip-info">{s.focus}</span>
                </div>
                {s.movers?.length > 0 && (
                  <div className="asm">
                    {s.movers.map((m, i) => (
                      <span className="asm-chip" key={i}><span className="k">{m.label.split(' & ')[0]}</span>
                        <span className="v" style={{ color: m.direction === 'up' ? 'var(--cp-high)' : 'var(--cp-stable)' }}>{m.delta > 0 ? '+' : ''}{m.delta}</span></span>
                    ))}
                  </div>
                )}
                <div className="row mt-4">
                  <Button size="sm" variant="secondary" iconRight="arrowRight" onClick={() => nav('/app/intelligence')}>Re-open</Button>
                  <Button size="sm" variant="ghost" icon="roadmap" onClick={() => ws.addRoadmap({ title: s.title, objective: s.summary, department: 'City Strategy', horizon: 'near', priority: 'Medium', domain: 'governance', next: 'Review' })}>Add to roadmap</Button>
                </div>
              </Card>
            ))}
          </div>
          <style>{`.linkbtn{background:none;border:none;color:var(--cp-muted);cursor:pointer;padding:4px;border-radius:6px}.linkbtn:hover{color:var(--cp-high)}`}</style>
        </>
      )}
    </>
  )
}
