import { getDb } from '../index'

export const communityCacheRepo = {
  get(code: string): unknown | null {
    const row = getDb().prepare('SELECT payload_json FROM community_profiles_cache WHERE code = ?').get(code) as
      | { payload_json: string }
      | undefined
    return row ? JSON.parse(row.payload_json) : null
  },

  set(code: string, payload: unknown): void {
    getDb()
      .prepare(
        `INSERT INTO community_profiles_cache (code, payload_json, cached_at) VALUES (@code, @payload, @cachedAt)
         ON CONFLICT(code) DO UPDATE SET payload_json = excluded.payload_json, cached_at = excluded.cached_at`
      )
      .run({ code, payload: JSON.stringify(payload), cachedAt: new Date().toISOString() })
  }
}
