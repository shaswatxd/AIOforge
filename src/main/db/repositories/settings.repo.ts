import { getDb } from '../index'
import { DEFAULT_SETTINGS, type AppSettings } from '@shared/types/settings'

export const settingsRepo = {
  getAll(): AppSettings {
    const rows = getDb().prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[]
    const stored = Object.fromEntries(rows.map((r) => [r.key, JSON.parse(r.value)]))
    return { ...DEFAULT_SETTINGS, ...stored }
  },

  setMany(patch: Partial<AppSettings>): AppSettings {
    const db = getDb()
    const stmt = db.prepare(
      'INSERT INTO settings (key, value) VALUES (@key, @value) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
    )
    const tx = db.transaction((entries: [string, unknown][]) => {
      for (const [key, value] of entries) stmt.run({ key, value: JSON.stringify(value) })
    })
    tx(Object.entries(patch))
    return settingsRepo.getAll()
  }
}
