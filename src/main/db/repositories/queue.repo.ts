import { getDb } from '../index'
import type { QueueItem, QueueItemStatus } from '@shared/types/queue'

interface Row {
  id: string
  app_id: string
  app_name: string
  status: string
  progress: number
  speed_bps: number
  eta_seconds: number | null
  error: string | null
  options_json: string | null
  item_order: number
  created_at: string
}

function toDomain(row: Row): QueueItem {
  return {
    id: row.id,
    appId: row.app_id,
    appName: row.app_name,
    status: row.status as QueueItemStatus,
    progress: row.progress,
    speedBps: row.speed_bps,
    etaSeconds: row.eta_seconds,
    error: row.error ?? undefined,
    optionsJson: row.options_json ? JSON.parse(row.options_json) : undefined,
    order: row.item_order,
    createdAt: row.created_at
  }
}

export const queueRepo = {
  all(): QueueItem[] {
    const rows = getDb().prepare('SELECT * FROM queue_items ORDER BY item_order ASC').all() as Row[]
    return rows.map(toDomain)
  },

  get(id: string): QueueItem | null {
    const row = getDb().prepare('SELECT * FROM queue_items WHERE id = ?').get(id) as Row | undefined
    return row ? toDomain(row) : null
  },

  nextOrder(): number {
    const row = getDb().prepare('SELECT MAX(item_order) as maxOrder FROM queue_items').get() as {
      maxOrder: number | null
    }
    return (row.maxOrder ?? 0) + 1
  },

  insert(item: QueueItem): void {
    getDb()
      .prepare(
        `INSERT INTO queue_items (id, app_id, app_name, status, progress, speed_bps, eta_seconds, error, options_json, item_order, created_at)
         VALUES (@id, @appId, @appName, @status, @progress, @speedBps, @etaSeconds, @error, @optionsJson, @order, @createdAt)`
      )
      .run({
        ...item,
        error: item.error ?? null,
        optionsJson: item.optionsJson ? JSON.stringify(item.optionsJson) : null
      })
  },

  update(id: string, patch: Partial<QueueItem>): void {
    const existing = queueRepo.get(id)
    if (!existing) return
    const merged = { ...existing, ...patch }
    getDb()
      .prepare(
        `UPDATE queue_items SET status=@status, progress=@progress, speed_bps=@speedBps, eta_seconds=@etaSeconds, error=@error WHERE id=@id`
      )
      .run({
        id,
        status: merged.status,
        progress: merged.progress,
        speedBps: merged.speedBps,
        etaSeconds: merged.etaSeconds,
        error: merged.error ?? null
      })
  },

  remove(id: string): void {
    getDb().prepare('DELETE FROM queue_items WHERE id = ?').run(id)
  },

  clearFinished(): void {
    getDb()
      .prepare(`DELETE FROM queue_items WHERE status IN ('completed', 'cancelled', 'failed')`)
      .run()
  }
}
