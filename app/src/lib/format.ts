export function formatAge(ageMs: number | null): string {
  if (ageMs === null || !Number.isFinite(ageMs)) return 'age unknown'
  const seconds = Math.max(0, Math.floor(ageMs / 1_000))
  if (seconds < 10) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function formatDuration(durationMs: number | null): string {
  if (durationMs === null || !Number.isFinite(durationMs)) return 'unknown'
  const seconds = Math.max(0, Math.floor(durationMs / 1_000))
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ${minutes % 60}m`
  return `${Math.floor(hours / 24)}d ${hours % 24}h`
}

export function formatTimestamp(value: string | null): string {
  if (!value) return 'unknown time'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'unknown time'
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(date)
}

export function formatCount(value: number | null): string {
  return value === null || !Number.isFinite(value) ? 'unknown' : String(value)
}

export function shortSha(value: string | null): string {
  return value ? value.slice(0, 8) : 'unknown'
}

export function safeExternalUrl(value: string | null): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null
  } catch {
    return null
  }
}
