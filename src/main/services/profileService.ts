import { randomUUID } from 'crypto'
import { writeFile, readFile } from 'fs/promises'
import type { Profile, CommunityProfileSummary } from '@shared/types/profiles'
import type { QueueItem } from '@shared/types/queue'
import { BUILTIN_PACKS } from '@shared/packs'
import { profilesRepo } from '../db/repositories/profiles.repo'
import { installQueueManager } from './installQueueManager'
import { cloudClient } from './cloudClient'

function ensureBuiltinsSeeded(): void {
  for (const pack of BUILTIN_PACKS) {
    if (!profilesRepo.get(pack.id)) profilesRepo.insert(pack)
  }
}

export const profileService = {
  list(): Profile[] {
    ensureBuiltinsSeeded()
    return profilesRepo.all()
  },

  get(id: string): Profile | null {
    return profilesRepo.get(id)
  },

  create(input: Omit<Profile, 'id' | 'createdAt' | 'updatedAt' | 'isBuiltin'>): Profile {
    const now = new Date().toISOString()
    const profile: Profile = { ...input, id: randomUUID(), createdAt: now, updatedAt: now, isBuiltin: false }
    profilesRepo.insert(profile)
    return profile
  },

  update(id: string, patch: Partial<Profile>): Profile {
    const existing = profilesRepo.get(id)
    if (!existing) throw new Error('Profile not found')
    if (existing.isBuiltin) throw new Error('Built-in profiles cannot be edited — duplicate it first')
    profilesRepo.update(id, patch)
    return profilesRepo.get(id)!
  },

  remove(id: string): void {
    const existing = profilesRepo.get(id)
    if (existing?.isBuiltin) throw new Error('Built-in profiles cannot be deleted')
    profilesRepo.remove(id)
  },

  installProfile(id: string): QueueItem[] {
    const profile = profilesRepo.get(id)
    if (!profile) throw new Error('Profile not found')
    return installQueueManager.add(profile.apps.map((a) => ({ appId: a.appId, options: a.optionsJson })))
  },

  generateShareCode(id: string): string {
    const profile = profilesRepo.get(id)
    if (!profile) throw new Error('Profile not found')
    const code = cloudClient.generateShareCode(profile)
    profilesRepo.update(id, { shareCode: code })
    return code
  },

  importByCode(code: string): Profile {
    const shared = cloudClient.importByCode(code)
    const now = new Date().toISOString()
    const imported: Profile = { ...shared, id: randomUUID(), createdAt: now, updatedAt: now, isBuiltin: false, shareCode: undefined }
    profilesRepo.insert(imported)
    return imported
  },

  async exportToFile(id: string, filePath: string): Promise<void> {
    const profile = profilesRepo.get(id)
    if (!profile) throw new Error('Profile not found')
    await writeFile(filePath, JSON.stringify(profile, null, 2), 'utf-8')
  },

  async importFromFile(filePath: string): Promise<Profile> {
    const raw = await readFile(filePath, 'utf-8')
    const data = JSON.parse(raw) as Profile
    if (!data.apps || !Array.isArray(data.apps)) throw new Error('File is not a valid SetupForge profile')
    const now = new Date().toISOString()
    const imported: Profile = { ...data, id: randomUUID(), createdAt: now, updatedAt: now, isBuiltin: false, shareCode: undefined }
    profilesRepo.insert(imported)
    return imported
  },

  community(): CommunityProfileSummary[] {
    return cloudClient.community()
  },

  packs(): Profile[] {
    return BUILTIN_PACKS
  }
}
