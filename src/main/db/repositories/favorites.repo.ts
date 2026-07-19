import { getDb } from '../index'

export const favoritesRepo = {
  all(): string[] {
    const rows = getDb().prepare('SELECT app_id FROM favorites').all() as { app_id: string }[]
    return rows.map((r) => r.app_id)
  },

  toggle(appId: string): string[] {
    const db = getDb()
    const existing = db.prepare('SELECT app_id FROM favorites WHERE app_id = ?').get(appId)
    if (existing) {
      db.prepare('DELETE FROM favorites WHERE app_id = ?').run(appId)
    } else {
      db.prepare('INSERT INTO favorites (app_id) VALUES (?)').run(appId)
    }
    return favoritesRepo.all()
  }
}
