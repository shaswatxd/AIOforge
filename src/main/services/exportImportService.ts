import { writeFile, readFile } from 'fs/promises'
import { installedAppsRepo } from '../db/repositories/installedApps.repo'
import { profilesRepo } from '../db/repositories/profiles.repo'
import { settingsRepo } from '../db/repositories/settings.repo'
import { installQueueManager } from './installQueueManager'
import type { Profile } from '@shared/types/profiles'

interface ExportScope {
  apps: boolean
  profiles: boolean
  settings: boolean
}

interface ExportPayload {
  kind: 'setupforge-export'
  exportedAt: string
  apps?: ReturnType<typeof installedAppsRepo.all>
  profiles?: Profile[]
  settings?: ReturnType<typeof settingsRepo.getAll>
}

export const exportImportService = {
  async exportData(filePath: string, scope: ExportScope): Promise<void> {
    const payload: ExportPayload = { kind: 'setupforge-export', exportedAt: new Date().toISOString() }
    if (scope.apps) payload.apps = installedAppsRepo.all()
    if (scope.profiles) payload.profiles = profilesRepo.all().filter((p) => !p.isBuiltin)
    if (scope.settings) payload.settings = settingsRepo.getAll()
    await writeFile(filePath, JSON.stringify(payload, null, 2), 'utf-8')
  },

  /** Accepts a SetupForge export, a raw profile file (single Profile), or an app-id list
   *  ({ appIds: string[] }) and merges whichever shape is present. */
  async importData(filePath: string): Promise<void> {
    const raw = await readFile(filePath, 'utf-8')
    const data = JSON.parse(raw)

    if (data.kind === 'setupforge-export') {
      const payload = data as ExportPayload
      for (const profile of payload.profiles ?? []) {
        if (!profilesRepo.get(profile.id)) profilesRepo.insert(profile)
      }
      if (payload.settings) settingsRepo.setMany(payload.settings)
      const appIds = (payload.apps ?? []).map((a) => a.appId).filter((id): id is string => !!id)
      if (appIds.length) installQueueManager.add(appIds.map((appId) => ({ appId })))
      return
    }

    if (data.id && data.apps && Array.isArray(data.apps)) {
      const profile = data as Profile
      if (!profilesRepo.get(profile.id)) profilesRepo.insert(profile)
      return
    }

    if (Array.isArray(data.appIds)) {
      installQueueManager.add((data.appIds as string[]).map((appId) => ({ appId })))
      return
    }

    throw new Error('Unrecognized import file format')
  }
}
