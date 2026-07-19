import { autoUpdater } from 'electron-updater'
import { is } from '@electron-toolkit/utils'

/** Wires electron-updater against whatever publish target is configured in
 *  electron-builder.yml (GitHub Releases by default). Until that target points at a real
 *  release feed this is inert — checkForUpdatesAndNotify() simply fails silently in dev and
 *  logs a warning in packaged builds, per README "mocked vs real". */
export function initAutoUpdater(): void {
  if (is.dev) return

  autoUpdater.logger = null
  autoUpdater.autoDownload = false

  autoUpdater.on('error', (err) => {
    console.warn('[auto-updater] not configured or check failed:', err.message)
  })

  autoUpdater.checkForUpdatesAndNotify().catch(() => {
    // No publish target configured yet — expected until electron-builder.yml is filled in.
  })
}
