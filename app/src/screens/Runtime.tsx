import { effectiveAgeMs } from '../lib/snapshot'
import { formatAge, formatCount, formatTimestamp } from '../lib/format'
import type { SnapshotV1 } from '../types/snapshot'
import type { TransportState } from '../hooks/useSnapshot'
import { PanelFooter } from '../components/PanelFooter'
import { StatusSurface } from '../components/StatusSurface'

interface RuntimeProps {
  snapshot: SnapshotV1 | null
  transport: TransportState
  error: string | null
  nowMs: number
  onRetry: () => void
}

function factClass(value: string | null): string {
  const normalized = value?.toLowerCase()
  if (normalized && ['healthy', 'ok', 'pass', 'available', 'connected', 'live'].includes(normalized)) return 'runtime-fact--good'
  if (normalized && ['failed', 'unhealthy', 'dead', 'error'].includes(normalized)) return 'runtime-fact--bad'
  return ''
}

export function Runtime({ snapshot, transport, error, nowMs, onRetry }: RuntimeProps) {
  const runtime = snapshot?.runtime ?? null
  const age = snapshot && runtime ? effectiveAgeMs(runtime.source, snapshot, nowMs) : null
  return (
    <div className="page page--runtime">
      <header className="page-intro">
        <div>
          <span className="eyebrow">Runtime · observation only</span>
          <h1>Delivery facts without invented calm</h1>
          <p>Substrate reports its current delivery ledger. These numbers do not describe business progress, and this console cannot mutate the ledger.</p>
        </div>
        <div className="page-intro__facts">
          <span><b>Subscriber</b> {runtime?.subscriberStatus ?? 'unknown'}</span>
          <span><b>Snapshot</b> {formatAge(age)}</span>
          <span><b>Posture</b> {snapshot?.posture.label ?? 'unknown'}</span>
        </div>
      </header>

      {transport === 'loading' && !snapshot && <StatusSurface kind="loading" title="Reading local runtime" detail="Waiting for the normalized snapshot." />}
      {transport === 'disconnected' && !snapshot && <StatusSurface kind="disconnected" title="Runtime source disconnected" detail={error ?? 'Runtime facts are unknown.'} onRetry={onRetry} />}
      {snapshot && !runtime && <StatusSurface kind="unavailable" title="Runtime facts unknown" detail="The snapshot did not include validated substrate observation or health output." />}

      {runtime && (
        <>
          <section className="panel runtime-vitals" aria-labelledby="delivery-facts-heading">
            <header className="panel-heading">
              <div><span className="eyebrow">Engine delivery facts</span><h2 id="delivery-facts-heading">Current ledger snapshot</h2></div>
              <span className="panel-heading__note">At-least-once · duplicate delivery IDs are normal</span>
            </header>
            <div className="vital-band">
              <div className="vital"><strong>{formatCount(runtime.queueDepth)}</strong><span>queue depth</span><small>{runtime.queueDepth === null ? 'unreachable or absent' : 'current delivery fact'}</small></div>
              <div className={`vital ${runtime.deadLetterCount && runtime.deadLetterCount > 0 ? 'vital--danger' : ''}`}><strong>{formatCount(runtime.deadLetterCount)}</strong><span>dead letters</span><small>{runtime.deadLetterCount === null ? 'unreachable or absent' : 'current delivery fact'}</small></div>
              <div className={`vital ${factClass(runtime.subscriberStatus)}`}><strong>{runtime.subscriberStatus ?? 'unknown'}</strong><span>subscriber status</span><small>offline unknown is not a fault</small></div>
              <div className="vital"><strong>{runtime.deliveries === null ? 'unknown' : runtime.deliveries.length}</strong><span>projected rows</span><small>not an authoritative history</small></div>
            </div>
            <PanelFooter source={runtime.source} effectiveAgeMs={age} note="Engine delivery facts · not business status" />
          </section>

          <div className="runtime-grid">
            <section className="panel health-panel" aria-labelledby="health-heading">
              <header className="panel-heading">
                <div><span className="eyebrow">Verbatim health</span><h2 id="health-heading">Engine verdict</h2></div>
                <span className={`health-verdict ${factClass(runtime.healthVerdict)}`}>{runtime.healthVerdict ?? 'unknown'}</span>
              </header>
              <pre className="health-output">{runtime.healthVerbatim ?? 'No verbatim health output was included. Health is unknown.'}</pre>
              <PanelFooter source={{ ...runtime.source, artifact: 'health verdict · verbatim output' }} effectiveAgeMs={age} note="Rendered without reinterpretation" />
            </section>

            <section className="panel semantics-panel" aria-labelledby="semantics-heading">
              <header className="panel-heading"><div><span className="eyebrow">Read semantics</span><h2 id="semantics-heading">What this cannot prove</h2></div></header>
              <dl className="semantics-list">
                <div><dt>History</dt><dd>{runtime.historySemantics ?? 'Acknowledged deliveries may be removed; polling can silently miss them.'}</dd></div>
                <div><dt>Delivery</dt><dd>{runtime.deliverySemantics ?? 'At-least-once. A duplicate delivery ID across polls is not necessarily a defect.'}</dd></div>
                <div><dt>Control surface</dt><dd>None. No requeue, retry, resume, topology, database, or posture mutation is exposed.</dd></div>
              </dl>
              <PanelFooter source={runtime.source} effectiveAgeMs={age} note="Unknown remains unknown, never 0" />
            </section>
          </div>

          <section className="panel deliveries-panel" aria-labelledby="deliveries-heading">
            <header className="panel-heading"><div><span className="eyebrow">Current projection</span><h2 id="deliveries-heading">Delivery rows</h2></div><span className="panel-heading__note">Snapshot rows, not a timeline</span></header>
            {runtime.deliveries === null && <StatusSurface kind="unavailable" title="Delivery rows unknown" detail="No validated delivery collection was included." />}
            {runtime.deliveries?.length === 0 && <StatusSurface kind="empty" title="No current delivery rows" detail="The available ledger snapshot proved this current projection empty." />}
            {runtime.deliveries && runtime.deliveries.length > 0 && (
              <div className="delivery-list">
                <div className="delivery-row delivery-row--head"><span>Delivery ID</span><span>Queue</span><span>State</span><span>Attempts</span><span>Observed</span></div>
                {runtime.deliveries.map((delivery) => (
                  <div className="delivery-row" key={delivery.id}>
                    <code>{delivery.id}</code>
                    <code>{delivery.queue ?? 'unknown'}</code>
                    <span>{delivery.state ?? 'unknown'}</span>
                    <span>{delivery.attempts ?? 'unknown'}</span>
                    <span>{formatTimestamp(delivery.updatedAt)}</span>
                  </div>
                ))}
              </div>
            )}
            <PanelFooter source={runtime.source} effectiveAgeMs={age} note="Acknowledged rows may disappear between polls" />
          </section>
        </>
      )}
    </div>
  )
}
