import { APPS } from '@shared/catalog/apps'
import type { InstalledApp, UninstallTarget } from '@shared/types/system'
import type { QueueItem } from '@shared/types/queue'
import { wingetManager, summarizeWingetOutput } from './packageManager/wingetManager'
import { chocoManager, summarizeChocoOutput } from './packageManager/chocoManager'
import { getAvailability } from './packageManager/packageManagerRouter'
import { runElevated } from './packageManager/elevate'
import { installedAppsRepo } from '../db/repositories/installedApps.repo'
import { historyRepo } from '../db/repositories/history.repo'
import { installQueueManager } from './installQueueManager'

const WINGET_COMMON_FLAGS = ['--accept-package-agreements', '--accept-source-agreements', '--disable-interactivity']

/** Uninstall/repair frequently touch machine-scope installs (MSI packages, registry
 *  entries under HKLM) that fail with opaque errors like MSI 1603 unless elevated. Rather
 *  than run the whole app as Administrator (which breaks screenshotting/window capture
 *  for non-elevated tools — Windows blocks that across the privilege boundary), we ask
 *  for elevation with a single UAC prompt only for this one command. */
async function runElevatedPackageCommand(
  source: 'winget' | 'chocolatey',
  args: string[]
): Promise<{ code: number; reason: string }> {
  const command = source === 'chocolatey' ? 'choco' : 'winget'
  const { code, output } = await runElevated(command, args)
  const reason = source === 'chocolatey' ? summarizeChocoOutput(output) : summarizeWingetOutput(output)
  return { code, reason }
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

  /** Tries unelevated first, only escalates to a single UAC prompt on failure — works for
   *  any detected app, catalog or not. Order matters: winget actively *refuses* to
   *  uninstall a user-scope package while the calling process is elevated ("cannot be
   *  uninstalled when running with administrator privileges"), so going elevated-first
   *  broke every user-scope uninstall. Machine-scope packages (MSI/HKLM) that genuinely
   *  need admin still work — they just fail unelevated and fall through to the elevated
   *  retry below. */
  async uninstall(target: UninstallTarget): Promise<void> {
    const historyId = historyRepo.add({
      appId: target.appId ?? target.packageId,
      action: 'uninstall',
      status: 'started',
      startedAt: new Date().toISOString()
    })
    try {
      const args =
        target.source === 'chocolatey'
          ? ['uninstall', target.packageId, '-y']
          : ['uninstall', '--id', target.packageId, '-e', '--silent', '--disable-interactivity']

      let code = 0
      let reason = ''
      try {
        if (target.source === 'chocolatey') await chocoManager.uninstall(target.packageId)
        else await wingetManager.uninstall(target.packageId)
      } catch (unelevatedErr) {
        const elevated = await runElevatedPackageCommand(target.source, args)
        code = elevated.code
        reason = elevated.reason || (unelevatedErr instanceof Error ? unelevatedErr.message : String(unelevatedErr))
      }
      if (code !== 0) throw new Error(reason ? `${reason} (exit ${code})` : `Uninstall failed (exit ${code})`)
      if (target.appId) installedAppsRepo.remove(target.appId)
      historyRepo.finish(historyId, 'success')
    } catch (err) {
      historyRepo.finish(historyId, 'failed', err instanceof Error ? err.message : String(err))
      throw err
    }
  },

  /** winget/choco have no native "repair" verb — re-running install over an existing
   *  installation is the documented workaround most installers support (repairs missing
   *  files / resets config) and is what we do here. Elevated for the same reason as
   *  uninstall(). Works for any detected app. */
  async repair(target: UninstallTarget): Promise<void> {
    const historyId = historyRepo.add({
      appId: target.appId ?? target.packageId,
      action: 'repair',
      status: 'started',
      startedAt: new Date().toISOString()
    })
    try {
      const args =
        target.source === 'chocolatey'
          ? ['install', target.packageId, '-y']
          : ['install', '--id', target.packageId, '-e', '--silent', ...WINGET_COMMON_FLAGS]
      const { code, reason } = await runElevatedPackageCommand(target.source, args)
      if (code !== 0) throw new Error(reason ? `${reason} (exit ${code})` : `Repair failed (exit ${code})`)
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
