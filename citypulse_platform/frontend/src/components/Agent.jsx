// CityPulse AI — the agent's presence outside the Copilot page. A compact,
// recognisable strip: spark mark + short contextual guidance composed ONLY from
// real data the caller passes in (model output, workspace state). Optional
// actions let the user act on the guidance immediately.
import Icon from './icons'

export function AgentBrief({ lines = [], actions = [], compact = false }) {
  const shown = lines.filter((l) => l && l.v)
  if (!shown.length) return null
  return (
    <div className={`agent${compact ? ' compact' : ''}`}>
      <span className="ag-mark" aria-hidden="true"><Icon name="spark" size={compact ? 14 : 16} /></span>
      <div className="ag-body">
        <div className="ag-who">CityPulse agent</div>
        <div className="ag-lines">
          {shown.map((l, i) => (
            <span className="ag-line" key={i}>
              {l.k && <b className="ag-k">{l.k}</b>}
              <span className="ag-v">{l.v}</span>
            </span>
          ))}
        </div>
        {actions.length > 0 && (
          <div className="ag-acts">
            {actions.map((a, i) => (
              <button key={i} className="ag-btn" onClick={a.fn}>
                {a.icon && <Icon name={a.icon} size={13} />}{a.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <style>{agentCss}</style>
    </div>
  )
}

const agentCss = `
.agent{display:flex;gap:12px;align-items:flex-start;background:linear-gradient(135deg,#f2fafc,#f7fbfd 60%,#f6f8fb);
  border:1px solid #d9edf2;border-radius:14px;padding:14px 16px;position:relative;overflow:hidden}
.agent::after{content:"";position:absolute;right:-24px;top:-24px;width:110px;height:110px;border-radius:50%;
  background:radial-gradient(closest-side,rgba(63,208,230,.10),transparent);pointer-events:none}
.agent.compact{padding:10px 13px;border-radius:11px}
.ag-mark{width:30px;height:30px;border-radius:9px;flex:0 0 auto;display:grid;place-items:center;color:#fff;
  background:linear-gradient(135deg,#1aa6c0,#14839a);box-shadow:0 4px 12px rgba(20,131,154,.28)}
.agent.compact .ag-mark{width:26px;height:26px;border-radius:8px}
.ag-who{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--cp-teal-600);margin-bottom:3px}
.agent.compact .ag-who{margin-bottom:2px}
.ag-lines{display:flex;flex-direction:column;gap:3px}
.ag-line{font-size:13px;line-height:1.5;color:var(--cp-ink)}
.agent.compact .ag-line{font-size:12.5px}
.ag-k{font-weight:700;color:var(--cp-navy-700);margin-inline-end:6px}
.ag-v{color:var(--cp-ink-2)}
.ag-acts{display:flex;gap:8px;flex-wrap:wrap;margin-top:9px}
.ag-btn{display:inline-flex;align-items:center;gap:6px;background:#fff;border:1px solid var(--cp-border-strong);
  border-radius:8px;padding:6px 11px;font:inherit;font-size:12px;font-weight:600;color:var(--cp-navy-700);cursor:pointer;transition:.14s}
.ag-btn:hover{border-color:var(--cp-teal-500);color:var(--cp-teal-600)}
`
