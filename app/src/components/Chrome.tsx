import type { ReactNode } from 'react'

import { formatAge } from '../lib/format'
import { resolveSourceStatus } from '../lib/presentation'
import type { SnapshotMode, WritePosture } from '../types/snapshot'
import type { TransportState } from '../hooks/useSnapshot'
import { BoardIcon, CouncilIcon, PlusIcon, RuntimeIcon } from './Icons'

export type ViewName = 'overview' | 'council' | 'runtime'

interface ChromeProps {
  view: ViewName
  mode: SnapshotMode
  transport: TransportState
  posture: WritePosture
  ageMs: number | null
  stale: boolean
  onNavigate: (view: ViewName) => void
  onNewWork: () => void
  children: ReactNode
}

const NAV_ITEMS: readonly { id: ViewName; label: string; role: string; step: string; icon: typeof BoardIcon }[] = [
  { id: 'overview', label: 'Workflow', role: 'Primary mechanism', step: '01', icon: BoardIcon },
  { id: 'council', label: 'Council', role: 'Decision evidence', step: '02', icon: CouncilIcon },
  { id: 'runtime', label: 'Runtime', role: 'Delivery evidence', step: '03', icon: RuntimeIcon },
]

export function Chrome({ view, mode, transport, posture, ageMs, stale, onNavigate, onNewWork, children }: ChromeProps) {
  const sourceStatus = resolveSourceStatus(transport, stale, mode)

  return (
    <div className="app-shell">
      {mode === 'fixture' && (
        <div className="fixture-banner" role="status">
          <strong>Recorded demo data</strong>
          <span>Fixture mode · no BFF, GitHub, substrate, credentials, or writes</span>
        </div>
      )}
      <div className="topbar">
        <div className="topbar__inner">
          <div className="brand-lockup">
            <button className="wordmark" type="button" aria-label="Open FKST Workflow" onClick={() => onNavigate('overview')}>
              F<span className="wordmark__k">K<i aria-hidden="true" /></span>ST
            </button>
            <span className="brand-lockup__context"><strong>Development loop</strong><small>Observation console</small></span>
          </div>
          <nav className="primary-nav" aria-label="Development loop evidence path">
            <ol>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={view === item.id ? 'primary-nav__item primary-nav__item--active' : 'primary-nav__item'}
                      aria-current={view === item.id ? 'page' : undefined}
                      aria-label={`${item.label}: ${item.role}`}
                      onClick={() => onNavigate(item.id)}
                    >
                      <Icon />
                      <span className="primary-nav__copy"><span><b>{item.step}</b>{item.label}</span><small>{item.role}</small></span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </nav>
          <div className="topbar__status">
            <span
              className={`source-chip source-chip--${sourceStatus.state}`}
              title={`Snapshot ${formatAge(ageMs)}`}
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              <i aria-hidden="true" />
              {sourceStatus.label}
            </span>
            <span className={`posture-chip ${posture.label === 'LIVE' ? 'posture-chip--live' : ''}`} title={posture.reason ?? 'Deployment posture'}>{posture.label}</span>
            <button className="button button--primary new-work-trigger" type="button" onClick={onNewWork}><PlusIcon /> New work</button>
          </div>
        </div>
      </div>
      <main className="main-content">{children}</main>
    </div>
  )
}
