import { wingetManager } from './wingetManager'
import { chocoManager } from './chocoManager'
import type { IPackageManager } from './IPackageManager'
import type { AppDefinition } from '@shared/types/catalog'
import type { PackageManagerPref } from '@shared/types/settings'
import type { PackageManagerAvailability } from '@shared/types/system'
import { settingsRepo } from '../../db/repositories/settings.repo'

let availabilityCache: PackageManagerAvailability | null = null

export async function getAvailability(forceRefresh = false): Promise<PackageManagerAvailability> {
  if (availabilityCache && !forceRefresh) return availabilityCache
  const [winget, chocolatey] = await Promise.all([wingetManager.isAvailable(), chocoManager.isAvailable()])
  availabilityCache = { winget, chocolatey }
  return availabilityCache
}

/** Resolves which backend to use for a given app + user preference. Falls back to
 *  whichever backend is actually available and supported for the app, so installs don't
 *  silently no-op when a user's preferred manager isn't installed. */
export async function resolveManagerForApp(app: Pick<AppDefinition, 'wingetId' | 'chocoId'>): Promise<IPackageManager> {
  const settings = settingsRepo.getAll()
  const pref: PackageManagerPref = settings.packageManager
  const availability = await getAvailability()

  const wingetUsable = !!app.wingetId && availability.winget
  const chocoUsable = !!app.chocoId && availability.chocolatey

  if (pref === 'winget') {
    if (wingetUsable) return wingetManager
    if (chocoUsable) return chocoManager
  } else if (pref === 'chocolatey') {
    if (chocoUsable) return chocoManager
    if (wingetUsable) return wingetManager
  } else {
    // 'both' — prefer winget (bundled with Windows 11) then fall back to choco
    if (wingetUsable) return wingetManager
    if (chocoUsable) return chocoManager
  }

  throw new Error('No available package manager supports this app. Install winget or Chocolatey, or check Settings.')
}

export function packageIdFor(app: Pick<AppDefinition, 'wingetId' | 'chocoId'>, manager: IPackageManager): string {
  const id = manager.id === 'winget' ? app.wingetId : app.chocoId
  if (!id) throw new Error(`App has no ${manager.id} package id`)
  return id
}

export function resetAvailabilityCache(): void {
  availabilityCache = null
}
