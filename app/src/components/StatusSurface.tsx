import { AlertIcon, RefreshIcon } from './Icons'

interface StatusSurfaceProps {
  kind: 'loading' | 'empty' | 'disconnected' | 'unavailable'
  title: string
  detail: string
  onRetry?: () => void
}

export function StatusSurface({ kind, title, detail, onRetry }: StatusSurfaceProps) {
  return (
    <div className={`status-surface status-surface--${kind}`} role={kind === 'disconnected' ? 'alert' : 'status'}>
      <span className="status-surface__mark" aria-hidden="true">
        {kind === 'loading' ? <span className="loading-bars"><i /><i /><i /></span> : <AlertIcon />}
      </span>
      <div className="status-surface__copy">
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
      {onRetry && (
        <button className="button button--secondary" type="button" onClick={onRetry}>
          <RefreshIcon /> Retry read
        </button>
      )}
    </div>
  )
}
