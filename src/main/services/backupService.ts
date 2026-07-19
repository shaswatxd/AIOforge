import { writeFile, readFile } from 'fs/promises'
import type { BackupManifest } from '@shared/types/system'
import type { Profile } from '@shared/types/profiles'
import type { AppSettings } from '@shared/types/settings'
import { installedAppsRepo } from '../db/repositories/installedApps.repo'
import { profilesRepo } from '../db/repositories/profiles.repo'
import { settingsRepo } from '../db/repositories/settings.repo'
import { installQueueManager } from './installQueueManager'
import { sha256 } from './security'

interface BackupFile {
  manifest: BackupManifest & { checksum: string }
  installedApps: ReturnType<typeof installedAppsRepo.all>
  profiles: Profile[]
  settings: AppSettings
}

const BACKUP_VERSION = '1.0'

function checksumOf(installedApps: unknown, profiles: unknown, settings: unknown): string {
  return sha256(JSON.stringify({ installedApps, profiles, settings }))
}

export const backupService = {
  async create(filePath: string): Promise<BackupManifest> {
    const installedApps = installedAppsRepo.all()
    const profiles = profilesRepo.all().filter((p) => !p.isBuiltin)
    const settings = settingsRepo.getAll()

    const manifest: BackupManifest & { checksum: string } = {
      createdAt: new Date().toISOString(),
      version: BACKUP_VERSION,
      installedApps,
      profiles: profiles.length,
      settingsIncluded: true,
      checksum: checksumOf(installedApps, profiles, settings)
    }

    const payload: BackupFile = { manifest, installedApps, profiles, settings }
    await writeFile(filePath, JSON.stringify(payload, null, 2), 'utf-8')
    return manifest
  },

  /** Restores profiles + settings immediately, then queues installs for any backed-up
   *  apps that aren't currently installed — "restore with one click" as requested, but the
   *  actual re-download still runs through the normal (visible, cancellable) install queue. */
  async restore(filePath: string): Promise<void> {
    const raw = await readFile(filePath, 'utf-8')
    const payload = JSON.parse(raw) as BackupFile

    if (!payload.manifest || payload.manifest.version !== BACKUP_VERSION) {
      throw new Error('Unrecognized or incompatible backup file')
    }

    const expected = checksumOf(payload.installedApps, payload.profiles, payload.settings)
    if (payload.manifest.checksum !== expected) {
      throw new Error('Backup file failed checksum verification — it may be corrupted or tampered with')
    }

    for (const profile of payload.profiles) {
      if (!profilesRepo.get(profile.id)) profilesRepo.insert(profile)
    }

    settingsRepo.setMany(payload.settings)

    const currentlyInstalled = new Set(installedAppsRepo.all().map((a) => a.appId))
    const toInstall = payload.installedApps
      .map((a) => a.appId)
      .filter((id): id is string => !!id && !currentlyInstalled.has(id))

    if (toInstall.length) {
      installQueueManager.add(toInstall.map((appId) => ({ appId })))
    }
  }
}
