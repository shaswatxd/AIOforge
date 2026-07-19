import { autoUpdater } from 'electron-updater'
import { is } from '@electron-toolkit/utils'
import { ipcMain, type BrowserWindow } from 'electron'
import type { AppUpdateStatus } from '@shared/types/system'

/** Wires electron-updater against the GitHub Releases feed configured in
 *  electron-builder.yml, and exposes a real check/download/install flow to the renderer
 *  (Settings → "Check for Updates") instead of only a silent background check. */
export function initAutoUpdater(getWindow: () => BrowserWindow | null): void {
  autoUpdater.logger = null
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  const send = (status: AppUpdateStatus) => getWindow()?.webContents.send('app:updateStatus', status)

  autoUpdater.on('checking-for-update', () => send({ state: 'checking' }))
  autoUpdater.on('update-available', (info) => send({ state: 'available', version: info.version }))
  autoUpdater.on('update-not-available', () => send({ state: 'not-available' }))
  autoUpdater.on('download-progress', (p) =>
    send({
      state: 'downloading',
      progress: Math.round(p.percent),
      transferredBytes: p.transferred,
      totalBytes: p.total,
      bytesPerSecond: p.bytesPerSecond
    })
  )
  autoUpdater.on('update-downloaded', (info) => send({ state: 'downloaded', version: info.version }))
  autoUpdater.on('error', (err) => send({ state: 'error', error: err.message }))

  ipcMain.handle('app:checkForUpdates', async () => {
    if (is.dev) {
      send({ state: 'error', error: "Auto-update only works in a packaged build, not 'npm run dev'." })
      return
    }
    try {
      await autoUpdater.checkForUpdates()
    } catch (err) {
      send({ state: 'error', error: err instanceof Error ? err.message : String(err) })
    }
  })

  ipcMain.handle('app:downloadUpdate', () => autoUpdater.downloadUpdate())
  ipcMain.handle('app:quitAndInstall', () => autoUpdater.quitAndInstall())

  // Silent background check on launch — same flow as the manual button, just unattended.
  if (!is.dev) {
    autoUpdater.checkForUpdates().catch(() => {
      // No publish target configured yet, or offline — the manual "Check for Updates"
      // button will surface a real error next time the user tries it.
    })
  }
}
