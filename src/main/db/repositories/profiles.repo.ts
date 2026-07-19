import { getDb } from '../index'
import type { Profile } from '@shared/types/profiles'

interface Row {
  id: string
  name: string
  description: string
  icon: string
  category: string | null
  apps_json: string
  created_at: string
  updated_at: string
  share_code: string | null
  is_builtin: number
}

function toDomain(row: Row): Profile {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    icon: row.icon,
    category: (row.category as Profile['category']) ?? undefined,
    apps: JSON.parse(row.apps_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    shareCode: row.share_code ?? undefined,
    isBuiltin: !!row.is_builtin
  }
}

export const profilesRepo = {
  all(): Profile[] {
    const rows = getDb().prepare('SELECT * FROM profiles ORDER BY created_at DESC').all() as Row[]
    return rows.map(toDomain)
  },

  get(id: string): Profile | null {
    const row = getDb().prepare('SELECT * FROM profiles WHERE id = ?').get(id) as Row | undefined
    return row ? toDomain(row) : null
  },

  findByShareCode(code: string): Profile | null {
    const row = getDb().prepare('SELECT * FROM profiles WHERE share_code = ?').get(code) as Row | undefined
    return row ? toDomain(row) : null
  },

  insert(profile: Profile): void {
    getDb()
      .prepare(
        `INSERT INTO profiles (id, name, description, icon, category, apps_json, created_at, updated_at, share_code, is_builtin)
         VALUES (@id, @name, @description, @icon, @category, @appsJson, @createdAt, @updatedAt, @shareCode, @isBuiltin)`
      )
      .run({
        id: profile.id,
        name: profile.name,
        description: profile.description,
        icon: profile.icon,
        category: profile.category ?? null,
        appsJson: JSON.stringify(profile.apps),
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
        shareCode: profile.shareCode ?? null,
        isBuiltin: profile.isBuiltin ? 1 : 0
      })
  },

  update(id: string, patch: Partial<Profile>): void {
    const existing = profilesRepo.get(id)
    if (!existing) return
    const merged: Profile = { ...existing, ...patch, updatedAt: new Date().toISOString() }
    getDb()
      .prepare(
        `UPDATE profiles SET name=@name, description=@description, icon=@icon, category=@category,
         apps_json=@appsJson, updated_at=@updatedAt, share_code=@shareCode WHERE id=@id`
      )
      .run({
        id,
        name: merged.name,
        description: merged.description,
        icon: merged.icon,
        category: merged.category ?? null,
        appsJson: JSON.stringify(merged.apps),
        updatedAt: merged.updatedAt,
        shareCode: merged.shareCode ?? null
      })
  },

  remove(id: string): void {
    getDb().prepare('DELETE FROM profiles WHERE id = ?').run(id)
  }
}
