import { APPS } from '@shared/catalog/apps'
import type { InstalledApp } from '@shared/types/system'
import type { QueueItem } from '@shared/types/queue'
import { wingetManager } from './packageManager/wingetManager'
import { chocoManager } from './packageManager/chocoManager'
import { getAvailability, resolveManagerForApp, packageIdFor } from './packageManager/packageManagerRouter'
import { installedAppsRepo } from '../db/repositories/installedApps.repo'
import { historyRepo } from '../db/repositories/history.repo'
import { installQueueManager } from './installQueueManager'

export const uninstallService = {
  /** Live scan of everything winget/choco report as installed, cross-referenced against
   *  the catalog so known apps show rich metadata; unmatched packages still show up
   *  (appId: null) since this is meant to detect the whole system, not just SetupForge installs. */
  async detectInstalled(): Promise<InstalledApp[]> {
    const availability = await getAvailability()
    const results: InstalledApp[] = []
    const seen = new Set<string>()

    if (availability.winget) {
      const wingetList = await wingetManager.listInstalled()
      for (const pkg of wingetList) {
        const app = APPS.find((a) => a.wingetId === pkg.id)
        const key = app?.id ?? `winget:${pkg.id}`
        if (seen.has(key)) continue
        seen.add(key)
        results.push({
          appId: app?.id ?? null,
          name: app?.name ?? pkg.name,
          version: pkg.version,
          installedAt: installedAppsRepo.get(app?.id ?? '')?.installedAt ?? null,
          source: 'winget'
        })
      }
    }

    if (availability.chocolatey) {
      const chocoList = await chocoManager.listInstalled()
      for (const pkg of chocoList) {
        const app = APPS.find((a) => a.chocoId === pkg.id)
        const key = app?.id ?? `choco:${pkg.id}`
        if (seen.has(key)) continue
        seen.add(key)
        results.push({
          appId: app?.id ?? null,
          name: app?.name ?? pkg.name,
          version: pkg.version,
          installedAt: installedAppsRepo.get(app?.id ?? '')?.installedAt ?? null,
          source: 'chocolatey'
        })
      }
    }

    return results
  },

  async uninstall(appId: string): Promise<void> {
    const app = APPS.find((a) => a.id === appId)
    if (!app) throw new Error('Unknown app')

    const record = installedAppsRepo.get(appId)
    const manager = record?.source === 'chocolatey' ? chocoManager : await resolveManagerForApp(app)
    const pkgId = packageIdFor(app, manager)

    const historyId = historyRepo.add({ appId, action: 'uninstall', status: 'started', startedAt: new Date().toISOString() })
    try {
      await manager.uninstall(pkgId)
      installedAppsRepo.remove(appId)
      historyRepo.finish(historyId, 'success')
    } catch (err) {
      historyRepo.finish(historyId, 'failed', err instanceof Error ? err.message : String(err))
      throw err
    }
  },

  /** winget/choco have no native "repair" verb — re-running install over an existing
   *  installation is the documented workaround most installers support (repairs missing
   *  files / resets config) and is what we do here. */
  async repair(appId: string): Promise<void> {
    const app = APPS.find((a) => a.id === appId)
    if (!app) throw new Error('Unknown app')

    const record = installedAppsRepo.get(appId)
    const manager = record?.source === 'chocolatey' ? chocoManager : await resolveManagerForApp(app)
    const pkgId = packageIdFor(app, manager)

    const historyId = historyRepo.add({ appId, action: 'repair', status: 'started', startedAt: new Date().toISOString() })
    try {
      await new Promise<void>((resolve, reject) => {
        const handle = manager.install(pkgId, () => {})
        handle.done.then(resolve, reject)
      })
      historyRepo.finish(historyId, 'success')
    } catch (err) {
      historyRepo.finish(historyId, 'failed', err instanceof Error ? err.message : String(err))
      throw err
    }
  },

  async reinstall(appId: string): Promise<QueueItem> {
    await uninstallService.uninstall(appId).catch(() => undefined) // best-effort; proceed even if not currently detected
    const [item] = installQueueManager.add([{ appId }])
    return item
  }
}
