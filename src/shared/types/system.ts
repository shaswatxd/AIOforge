export interface InstalledApp {
  appId: string | null // null if detected but not in catalog
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
