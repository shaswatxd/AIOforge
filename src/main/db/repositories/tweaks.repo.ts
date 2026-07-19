import { getDb } from '../index'

export const tweaksRepo = {
  appliedIds(): string[] {
    const rows = getDb().prepare('SELECT tweak_id FROM applied_tweaks').all() as { tweak_id: string }[]
    return rows.map((r) => r.tweak_id)
  },

  markApplied(ids: string[]): void {
    const db = getDb()
    const stmt = db.prepare(
      'INSERT INTO applied_tweaks (tweak_id, applied_at) VALUES (@id, @appliedAt) ON CONFLICT(tweak_id) DO UPDATE SET applied_at = excluded.applied_at'
    )
    const tx = db.transaction((list: string[]) => {
      for (const id of list) stmt.run({ id, appliedAt: new Date().toISOString() })
    })
    tx(ids)
  }
}
