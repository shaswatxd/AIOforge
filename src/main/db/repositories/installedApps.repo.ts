import { getDb } from '../index'
import type { InstalledApp } from '@shared/types/system'

interface Row {
  app_id: string
  name: string
  version: string
  installed_at: string
  source: string
  install_path: string | null
}

function toDomain(row: Row): InstalledApp {
  return {
    appId: row.app_id,
    name: row.name,
    version: row.version,
    installedAt: row.installed_at,
    source: row.source as InstalledApp['source'],
    installPath: row.install_path ?? undefined
  }
}

export const installedAppsRepo = {
  all(): InstalledApp[] {
    const rows = getDb().prepare('SELECT * FROM installed_apps ORDER BY installed_at DESC').all() as Row[]
    return rows.map(toDomain)
  },

  get(appId: string): InstalledApp | null {
    const row = getDb().prepare('SELECT * FROM installed_apps WHERE app_id = ?').get(appId) as Row | undefined
    return row ? toDomain(row) : null
  },

  upsert(app: InstalledApp): void {
    getDb()
      .prepare(
        `INSERT INTO installed_apps (app_id, name, version, installed_at, source, install_path)
         VALUES (@appId, @name, @version, @installedAt, @source, @installPath)
         ON CONFLICT(app_id) DO UPDATE SET
           name = excluded.name,
           version = excluded.version,
           installed_at = excluded.installed_at,
           source = excluded.source,
           install_path = excluded.install_path`
      )
      .run({
        appId: app.appId,
        name: app.name,
        version: app.version,
        installedAt: app.installedAt ?? new Date().toISOString(),
        source: app.source,
        installPath: app.installPath ?? null
      })
  },

  remove(appId: string): void {
    getDb().prepare('DELETE FROM installed_apps WHERE app_id = ?').run(appId)
  }
}
