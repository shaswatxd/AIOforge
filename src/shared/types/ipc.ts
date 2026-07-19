import type { AppDefinition, CatalogFilters, CategoryId } from './catalog'
import type { QueueItem, QueueProgressEvent } from './queue'
import type { Profile, CommunityProfileSummary } from './profiles'
import type { AppSettings } from './settings'
import type {
  InstalledApp,
  UpdateCheckResult,
  TweakDefinition,
  BackupManifest,
  AdminBundleOptions,
  PackageManagerAvailability,
  UninstallTarget,
  AppUpdateStatus
} from './system'

export interface InstallRequest {
  appId: string
  options?: Record<string, unknown>
}

/** The full contract exposed on window.api by the preload script. Kept in one place so
 *  main (handler registration) and renderer (typed calls) never drift out of sync. */
export interface SetupForgeApi {
  catalog: {
    list: (filters?: Partial<CatalogFilters>) => Promise<AppDefinition[]>
    get: (appId: string) => Promise<AppDefinition | null>
    categories: () => Promise<{ id: CategoryId; name: string; icon: string; description: string; count: number }[]>
    favorites: () => Promise<string[]>
    toggleFavorite: (appId: string) => Promise<string[]>
    recommended: () => Promise<AppDefinition[]>
  }
  queue: {
    list: () => Promise<QueueItem[]>
    add: (requests: InstallRequest[]) => Promise<QueueItem[]>
    pause: (id: string) => Promise<void>
    resume: (id: string) => Promise<void>
    cancel: (id: string) => Promise<void>
    retry: (id: string) => Promise<void>
    clearFinished: () => Promise<void>
    onProgress: (cb: (event: QueueProgressEvent) => void) => () => void
  }
  profiles: {
    list: () => Promise<Profile[]>
    get: (id: string) => Promise<Profile | null>
    create: (profile: Omit<Profile, 'id' | 'createdAt' | 'updatedAt' | 'isBuiltin'>) => Promise<Profile>
    update: (id: string, patch: Partial<Profile>) => Promise<Profile>
    remove: (id: string) => Promise<void>
    installProfile: (id: string) => Promise<QueueItem[]>
    generateShareCode: (id: string) => Promise<string>
    importByCode: (code: string) => Promise<Profile>
    exportToFile: (id: string, filePath: string) => Promise<void>
    importFromFile: (filePath: string) => Promise<Profile>
    community: () => Promise<CommunityProfileSummary[]>
    packs: () => Promise<Profile[]>
  }
  updates: {
    scan: () => Promise<UpdateCheckResult>
    /** Keyed by packageId (the real winget/choco id) — covers every update found, not
     *  just catalog apps, so this always matches what "Update All" would act on. */
    updateSelected: (packageIds: string[]) => Promise<QueueItem[]>
    updateAll: () => Promise<QueueItem[]>
  }
  uninstall: {
    detectInstalled: () => Promise<InstalledApp[]>
    uninstall: (target: UninstallTarget) => Promise<void>
    repair: (target: UninstallTarget) => Promise<void>
    reinstall: (target: UninstallTarget) => Promise<QueueItem>
  }
  tweaks: {
    list: () => Promise<TweakDefinition[]>
    apply: (ids: string[]) => Promise<void>
  }
  backup: {
    create: (filePath: string) => Promise<BackupManifest>
    restore: (filePath: string) => Promise<void>
  }
  exportImport: {
    exportData: (filePath: string, scope: { apps: boolean; profiles: boolean; settings: boolean }) => Promise<void>
    importData: (filePath: string) => Promise<void>
  }
  settings: {
    get: () => Promise<AppSettings>
    set: (patch: Partial<AppSettings>) => Promise<AppSettings>
    packageManagerAvailability: () => Promise<PackageManagerAvailability>
  }
  admin: {
    generateBundle: (options: AdminBundleOptions) => Promise<string>
  }
  system: {
    pickDirectory: () => Promise<string | null>
    pickSaveFile: (defaultName: string) => Promise<string | null>
    pickOpenFile: () => Promise<string | null>
    openExternal: (url: string) => Promise<void>
    getAppVersion: () => Promise<string>
  }
  app: {
    checkForUpdates: () => Promise<void>
    downloadUpdate: () => Promise<void>
    quitAndInstall: () => Promise<void>
    onUpdateStatus: (cb: (status: AppUpdateStatus) => void) => () => void
  }
}

export interface WindowControlsApi {
  minimize: () => Promise<void>
  maximizeToggle: () => Promise<void>
  close: () => Promise<void>
  isMaximized: () => Promise<boolean>
}

declare global {
  interface Window {
    api: SetupForgeApi
    windowControls: WindowControlsApi
  }
}
