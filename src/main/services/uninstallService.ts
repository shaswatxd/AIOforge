import { APPS } from '@shared/catalog/apps'
import type { InstalledApp, UninstallTarget } from '@shared/types/system'
import type { QueueItem } from '@shared/types/queue'
import { wingetManager } from './packageManager/wingetManager'
import { chocoManager } from './packageManager/chocoManager'
import { getAvailability } from './packageManager/packageManagerRouter'
import { installedAppsRepo } from '../db/repositories/installedApps.repo'
import { historyRepo } from '../db/repositories/history.repo'
import { installQueueManager } from './installQueueManager'

function managerFor(source: 'winget' | 'chocolatey') {
  return source === 'chocolatey' ? chocoManager : wingetManager
}

export const uninstallService = {
  /** Live scan of everything winget/choco report as installed, cross-referenced against
   *  the catalog so known apps show rich metadata; unmatched packages still show up
   *  (appId: null) since this is meant to detect the whole system, not just AIOforge installs. */
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
          packageId: pkg.id,
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
          packageId: pkg.id,
          name: app?.name ?? pkg.name,
          version: pkg.version,
          installedAt: installedAppsRepo.get(app?.id ?? '')?.installedAt ?? null,
          source: 'chocolatey'
        })
      }
    }

    return results
  },

  /** Works for any detected app, catalog or not — uninstall only ever needs the real
   *  package id + which manager owns it, both of which every detectInstalled() row has. */
  async uninstall(target: UninstallTarget): Promise<void> {
    const manager = managerFor(target.source)
    const historyId = historyRepo.add({
      appId: target.appId ?? target.packageId,
      action: 'uninstall',
      status: 'started',
      startedAt: new Date().toISOString()
    })
    try {
      await manager.uninstall(target.packageId)
      if (target.appId) installedAppsRepo.remove(target.appId)
      historyRepo.finish(historyId, 'success')
    } catch (err) {
      historyRepo.finish(historyId, 'failed', err instanceof Error ? err.message : String(err))
      throw err
    }
  },

  /** winget/choco have no native "repair" verb — re-running install over an existing
   *  installation is the documented workaround most installers support (repairs missing
   *  files / resets config) and is what we do here. Works for any detected app. */
  async repair(target: UninstallTarget): Promise<void> {
    const manager = managerFor(target.source)
    const historyId = historyRepo.add({
      appId: target.appId ?? target.packageId,
      action: 'repair',
      status: 'started',
      startedAt: new Date().toISOString()
    })
    try {
      await new Promise<void>((resolve, reject) => {
        const handle = manager.install(target.packageId, () => {})
        handle.done.then(resolve, reject)
      })
      historyRepo.finish(historyId, 'success')
    } catch (err) {
      historyRepo.finish(historyId, 'failed', err instanceof Error ? err.message : String(err))
      throw err
    }
  },

  async reinstall(target: UninstallTarget): Promise<QueueItem> {
    await uninstallService.uninstall(target).catch(() => undefined) // best-effort; proceed even if not currently detected
    const [item] = target.appId
      ? installQueueManager.add([{ appId: target.appId }])
      : installQueueManager.addPackageTargets(
          [{ appId: null, packageId: target.packageId, name: target.name, source: target.source, newVersion: '' }],
          'install'
        )
    return item
  }
}
