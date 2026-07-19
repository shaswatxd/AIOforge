export interface InstalledApp {
  appId: string | null // null if detected but not in catalog
  /** The real winget/Chocolatey package id — always present, even when appId is null,
   *  so actions (upgrade, uninstall) work on apps we don't have curated catalog data for. */
  packageId: string
  name: string
  version: string
  installedAt: string | null
  source: 'winget' | 'chocolatey' | 'unknown'
  installPath?: string
  updateAvailable?: string // latest version if update available
}

export interface UpdateCheckResult {
  scannedAt: string
  apps: InstalledApp[]
}

export interface TweakDefinition {
  id: string
  label: string
  description: string
  category: 'appearance' | 'explorer' | 'system' | 'developer'
  applied?: boolean
}

export interface BackupManifest {
  createdAt: string
  version: string
  installedApps: InstalledApp[]
  profiles: number
  settingsIncluded: boolean
  checksum?: string
}

export interface AdminBundleOptions {
  name: string
  profileIds: string[]
  includeOfflineInstallers: boolean
  outputDir: string
}

export interface PackageManagerAvailability {
  winget: boolean
  chocolatey: boolean
}

/** State of AIOforge's own self-update check (electron-updater), pushed to the renderer
 *  as it progresses so Settings can show a real "Check for Updates" flow. */
export interface AppUpdateStatus {
  state: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'
  version?: string
  progress?: number
  /** Bytes transferred / total so far — populated during 'downloading'. */
  transferredBytes?: number
  totalBytes?: number
  bytesPerSecond?: number
  error?: string
}

/** Identifies a package for uninstall/repair/reinstall — works for catalog apps
 *  (appId set) and for anything else winget/Chocolatey report as installed (appId null,
 *  packageId is the real winget/choco id instead). */
export interface UninstallTarget {
  appId: string | null
  packageId: string
  name: string
  source: 'winget' | 'chocolatey'
}
