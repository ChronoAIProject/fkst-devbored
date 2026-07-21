import { formatAge } from '../lib/format'
import type { SourceMeta } from '../types/snapshot'

interface PanelFooterProps {
  source: SourceMeta
  effectiveAgeMs?: number | null
  note?: string
}

export function PanelFooter({ source, effectiveAgeMs, note }: PanelFooterProps) {
  const age = effectiveAgeMs === undefined ? source.ageMs : effectiveAgeMs
  return (
    <footer className="panel-footer">
      <span><b>Authority</b> {source.authority}</span>
      <span><b>Artifact</b> {source.artifact}</span>
      <span><b>Age</b> {formatAge(age ?? null)}</span>
      {source.partial && <span className="text-gold"><b>Partial</b> omissions disclosed by source</span>}
      {note && <span>{note}</span>}
    </footer>
  )
}
