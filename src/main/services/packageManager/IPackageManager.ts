export interface PackageProgressUpdate {
  progress: number // 0-100
  speedBps: number
  etaSeconds: number | null
  downloadedBytes?: number | null
  totalBytes?: number | null
  logLine: string
}

export interface RemotePackageInfo {
  id: string
  name: string
  version: string
}

export interface UpgradeCandidate {
  id: string
  name: string
  currentVersion: string
  availableVersion: string
}

export interface InstallHandle {
  /** Resolves when the install/uninstall/upgrade process exits. Rejects on non-zero exit. */
  done: Promise<void>
  /** Kills the underlying process tree. Used for both cancel and pause — winget/choco expose
   *  no OS-level suspend/resume, so "pause" is implemented at the queue level: the running
   *  process is killed and the same command is re-run on resume (see installQueueManager). */
  cancel: () => void
}

/** Shared contract both the winget and chocolatey backends implement, so the rest of the
 *  app (queue manager, IPC handlers) never branches on which package manager is active. */
export interface IPackageManager {
  readonly id: 'winget' | 'chocolatey'
  isAvailable(): Promise<boolean>
  search(query: string): Promise<RemotePackageInfo[]>
  listInstalled(): Promise<RemotePackageInfo[]>
  checkUpgrades(): Promise<UpgradeCandidate[]>
  install(
    packageId: string,
    onProgress: (u: PackageProgressUpdate) => void,
    totalBytesHint?: number,
    options?: { installPath?: string; scope?: 'user' | 'machine'; interactive?: boolean }
  ): InstallHandle
  uninstall(packageId: string): Promise<void>
  upgrade(
    packageId: string,
    onProgress: (u: PackageProgressUpdate) => void,
    totalBytesHint?: number,
    options?: { installPath?: string; scope?: 'user' | 'machine'; interactive?: boolean }
  ): InstallHandle
}
