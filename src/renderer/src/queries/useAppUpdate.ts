import { useEffect, useState } from 'react'
import type { AppUpdateStatus } from '@shared/types/system'

/** Drives the Settings → "Check for Updates" flow. electron-updater pushes progress via
 *  IPC events (checking → available/not-available → downloading → downloaded), mirrored
 *  here as local state rather than React Query since it's a one-off push stream, not a
 *  cacheable request. */
export function useAppUpdate() {
  const [status, setStatus] = useState<AppUpdateStatus>({ state: 'idle' })

  useEffect(() => {
    return window.api.app.onUpdateStatus(setStatus)
  }, [])

  return {
    status,
    checkForUpdates: () => window.api.app.checkForUpdates(),
    downloadUpdate: () => window.api.app.downloadUpdate(),
    quitAndInstall: () => window.api.app.quitAndInstall()
  }
}
