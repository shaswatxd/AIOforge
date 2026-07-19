import { randomUUID } from 'crypto'
import { getDb } from '../index'

export interface HistoryEntry {
  id: string
  appId: string
  action: 'install' | 'uninstall' | 'update' | 'repair'
  status: 'started' | 'success' | 'failed'
  startedAt: string
  finishedAt?: string
  error?: string
}

export const historyRepo = {
  add(entry: Omit<HistoryEntry, 'id'>): string {
    const id = randomUUID()
    getDb()
      .prepare(
        `INSERT INTO install_history (id, app_id, action, status, started_at, finished_at, error)
         VALUES (@id, @appId, @action, @status, @startedAt, @finishedAt, @error)`
      )
      .run({ id, ...entry, finishedAt: entry.finishedAt ?? null, error: entry.error ?? null })
    return id
  },

  finish(id: string, status: 'success' | 'failed', error?: string): void {
    getDb()
      .prepare('UPDATE install_history SET status = ?, finished_at = ?, error = ? WHERE id = ?')
      .run(status, new Date().toISOString(), error ?? null, id)
  },

  recentForApp(appId: string, limit = 20): HistoryEntry[] {
    const rows = getDb()
      .prepare('SELECT * FROM install_history WHERE app_id = ? ORDER BY started_at DESC LIMIT ?')
      .all(appId, limit) as any[]
    return rows.map((r) => ({
      id: r.id,
      appId: r.app_id,
      action: r.action,
      status: r.status,
      startedAt: r.started_at,
      finishedAt: r.finished_at ?? undefined,
      error: r.error ?? undefined
    }))
  }
}
