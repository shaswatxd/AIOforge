import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { SCHEMA_SQL } from './schema'

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (db) return db

  const userDataDir = app.getPath('userData')
  if (!existsSync(userDataDir)) mkdirSync(userDataDir, { recursive: true })

  const dbPath = join(userDataDir, 'setupforge.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(SCHEMA_SQL)

  return db
}

export function closeDb(): void {
  db?.close()
  db = null
}
