export type ThemeMode = 'light' | 'dark' | 'system'
export type PackageManagerPref = 'winget' | 'chocolatey' | 'both'

export interface AppSettings {
  theme: ThemeMode
  language: string
  downloadLocation: string
  packageManager: PackageManagerPref
  autoUpdateApps: boolean
  backgroundUpdateChecking: boolean
  queueConcurrency: number
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  language: 'en',
  downloadLocation: '',
  packageManager: 'winget',
  autoUpdateApps: false,
  backgroundUpdateChecking: true,
  queueConcurrency: 2
}
