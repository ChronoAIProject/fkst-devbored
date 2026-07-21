import { resolveNewWorkAvailability } from '../../app/src/lib/presentation.ts'
import { parseSnapshotV1 } from '../../app/src/lib/snapshot.ts'

const snapshotJson = process.env.FKST_READ_ONLY_SNAPSHOT
if (!snapshotJson) throw new Error('FKST_READ_ONLY_SNAPSHOT is required.')

const parsed = parseSnapshotV1(JSON.parse(snapshotJson) as unknown, { fallbackMode: 'live' })

if (!parsed.ok || !parsed.snapshot) {
  throw new Error(parsed.error ?? 'The representative read-only BFF snapshot did not parse.')
}

console.log(`READ_ONLY_POSTURE=${JSON.stringify({
  mode: parsed.snapshot.mode,
  posture: parsed.snapshot.posture,
  availability: resolveNewWorkAvailability(parsed.snapshot.mode, parsed.snapshot.posture),
})}`)
