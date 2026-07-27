// CityPulse AI — design-system primitives (buttons, cards, chips, fields,
// tooltip, table, alert, states, tabs, model-result + action components).
import Icon from './icons'

// Shared page header — eyebrow · title · single purpose line · right actions.
export const PageHead = ({ eyebrow, title, purpose, children }) => (
  <div className="pg">
    <div>
      {eyebrow && <div className="pg-eyebrow">{eyebrow}</div>}
      <h1>{title}</h1>
      {purpose && <p className="pg-purpose">{purpose}</p>}
    </div>
    {children && <div className="pg-r">{children}</div>}
  </div>
)

// Small-caps section label with optional trailing link/action.
export const Sect = ({ label, action, onAction, children }) => (
  <div className="sect">
    <span>{label}</span>
    {action && <button className="sect-link" onClick={onAction}>{action}{children}</button>}
  </div>
)

export const Button = ({ variant = 'primary', size, icon, iconRight, block, className = '', children, ...p }) => (
  <button className={`btn btn-${variant}${size ? ' btn-' + size : ''}${block ? ' btn-block' : ''} ${className}`} {...p}>
    {icon && <Icon name={icon} size={size === 'lg' ? 18 : 16} />}
    {children}
    {iconRight && <Icon name={iconRight} size={size === 'lg' ? 18 : 16} />}
  </button>
)

export const Card = ({ title, sub, right, icon, children, className = '', pad }) => (
  <section className={`card${pad ? ' pad-' + pad : ''} ${className}`}>
    {(title || right) && (
      <div className="card-head">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {icon && <span className="card-icon"><Icon name={icon} size={18} /></span>}
          <div>
            {title && <div className="card-title">{title}</div>}
            {sub && <div className="card-sub">{sub}</div>}
          </div>
        </div>
        {right}
      </div>
    )}
    {children}
  </section>
)

const STATUS_CLASS = {
  Stable: 'chip-stable', Watch: 'chip-watch', Elevated: 'chip-elevated',
  High: 'chip-high', Critical: 'chip-critical',
}
export const StatusChip = ({ status, color }) => (
  <span className={`chip ${STATUS_CLASS[status] || 'chip-neutral'}`}>
    <span className="led" style={{ background: color }} />{status}
  </span>
)
export const Chip = ({ tone = 'neutral', children }) => (
  <span className={`chip chip-${tone}`}>{children}</span>
)

export const Tooltip = ({ text }) => (
  <span className="tip" tabIndex={0} aria-label={text}>
    <span className="dot" aria-hidden="true"><Icon name="info" size={12} strokeWidth={2} /></span>
    <span className="bubble" role="tooltip">{text}</span>
  </span>
)

export function Field({ label, tip, hint, children }) {
  return (
    <div className="field">
      {label && <label>{label}{tip && <Tooltip text={tip} />}</label>}
      {children}
      {hint && <div className="hint">{hint}</div>}
    </div>
  )
}

export const Select = ({ value, onChange, options, placeholder = 'Select…' }) => (
  <select className="control" value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
    <option value="" disabled>{placeholder}</option>
    {options.map((o) => <option key={o.id} value={o.id}>{o.label || o.name}</option>)}
  </select>
)

export function ChoiceGroup({ options, value = [], onChange, single = false }) {
  const toggle = (id) => {
    if (single) return onChange(id)
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])
  }
  const active = (id) => (single ? value === id : value.includes(id))
  return (
    <div className="choices">
      {options.map((o) => (
        <button key={o.id} type="button" className={`choice${active(o.id) ? ' on' : ''}`}
          aria-pressed={active(o.id)} onClick={() => toggle(o.id)}>{o.label || o.name}</button>
      ))}
    </div>
  )
}

export const Alert = ({ tone = 'info', icon, children }) => (
  <div className={`alert alert-${tone}`}>
    {icon && <span className="ai">{icon}</span>}<div>{children}</div>
  </div>
)

export const EmptyState = ({ icon = 'info', title, children }) => (
  <div className="state"><div className="ico"><Icon name={icon} size={26} /></div><div className="t">{title}</div><div className="mt-2">{children}</div></div>
)
export const Loading = ({ label = 'Running models…' }) => (
  <div className="state"><span className="spinner" /><div className="t mt-2">{label}</div></div>
)
export const ErrorState = ({ title = 'Something went wrong', children, onRetry }) => (
  <div className="state"><div className="ico"><Icon name="alert" size={26} /></div><div className="t">{title}</div>
    <div className="mt-2">{children}</div>
    {onRetry && <div className="mt-4"><Button variant="secondary" size="sm" onClick={onRetry}>Try again</Button></div>}
  </div>
)

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <div key={t.id} role="tab" aria-selected={value === t.id} tabIndex={0}
          className={`tab${value === t.id ? ' on' : ''}`}
          onClick={() => onChange(t.id)} onKeyDown={(e) => e.key === 'Enter' && onChange(t.id)}>
          {t.label}
        </div>
      ))}
    </div>
  )
}

// Insight row: a short model-supported insight beside a visual (plain language).
export const Insight = ({ children }) => (
  <div className="insight"><span className="ii"><Icon name="intelligence" size={16} /></span><div className="it">{children}</div></div>
)

// Action item — a municipal action that can be created from an insight.
export function ActionItem({ title, department, onAdd }) {
  return (
    <div className="action-row between">
      <div><div className="t">{title}</div><div className="dept">{department}</div></div>
      {onAdd && <Button variant="secondary" size="sm" icon="plus" onClick={onAdd}>Create action</Button>}
    </div>
  )
}
