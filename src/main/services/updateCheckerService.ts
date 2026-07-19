import { APPS } from '@shared/catalog/apps'
import type { UpdateCheckResult, InstalledApp } from '@shared/types/system'
import type { QueueItem } from '@shared/types/queue'
import { wingetManager } from './packageManager/wingetManager'
import { chocoManager } from './packageManager/chocoManager'
import { getAvailability } from './packageManager/packageManagerRouter'
import { installedAppsRepo } from '../db/repositories/installedApps.repo'
import { installQueueManager } from './installQueueManager'

let lastScan: UpdateCheckResult | null = null

export const updateCheckerService = {
  async scan(): Promise<UpdateCheckResult> {
    const availability = await getAvailability()
    const apps: InstalledApp[] = []

    if (availability.winget) {
      const upgrades = await wingetManager.checkUpgrades()
      for (const u of upgrades) {
        const app = APPS.find((a) => a.wingetId === u.id)
        apps.push({
          appId: app?.id ?? null,
          packageId: u.id,
          name: app?.name ?? u.name,
          version: u.currentVersion,
          installedAt: app ? installedAppsRepo.get(app.id)?.installedAt ?? null : null,
          source: 'winget',
          updateAvailable: u.availableVersion
        })
      }
    }

    if (availability.chocolatey) {
      const upgrades = await chocoManager.checkUpgrades()
      for (const u of upgrades) {
        const app = APPS.find((a) => a.chocoId === u.id)
        apps.push({
          appId: app?.id ?? null,
          packageId: u.id,
          name: app?.name ?? u.name,
          version: u.currentVersion,
          installedAt: app ? installedAppsRepo.get(app.id)?.installedAt ?? null : null,
          source: 'chocolatey',
          updateAvailable: u.availableVersion
        })
      }
    }

    lastScan = { scannedAt: new Date().toISOString(), apps }
    return lastScan
  },

  getLastScan(): UpdateCheckResult | null {
    return lastScan
  },

  /** Every real update winget/Chocolatey reports is updatable here — not just the ones
   *  that happen to be in our curated catalog. Selection is keyed by packageId (the raw
   *  winget/choco id) since apps outside the catalog have no appId. */
  async updateSelected(packageIds: string[]): Promise<QueueItem[]> {
    const scan = lastScan ?? (await updateCheckerService.scan())
    const targets = scan.apps.filter((a) => packageIds.includes(a.packageId))
    return installQueueManager.addUpgradeTargets(
      targets.map((t) => ({
        appId: t.appId,
        packageId: t.packageId,
        name: t.name,
        source: t.source as 'winget' | 'chocolatey',
        newVersion: t.updateAvailable ?? t.version
      }))
    )
  },

  async updateAll(): Promise<QueueItem[]> {
    const scan = lastScan ?? (await updateCheckerService.scan())
    return installQueueManager.addUpgradeTargets(
      scan.apps.map((t) => ({
        appId: t.appId,
        packageId: t.packageId,
        name: t.name,
        source: t.source as 'winget' | 'chocolatey',
        newVersion: t.updateAvailable ?? t.version
      }))
    )
  }
}
