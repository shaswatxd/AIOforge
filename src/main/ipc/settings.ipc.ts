import { ipcMain } from 'electron'
import type { AppSettings } from '@shared/types/settings'
import { settingsRepo } from '../db/repositories/settings.repo'
import { getAvailability, resetAvailabilityCache } from '../services/packageManager/packageManagerRouter'

export function registerSettingsIpc(): void {
  ipcMain.handle('settings:get', () => settingsRepo.getAll())

  ipcMain.handle('settings:set', (_e, patch: Partial<AppSettings>) => settingsRepo.setMany(patch))

  ipcMain.handle('settings:packageManagerAvailability', () => {
    resetAvailabilityCache()
    return getAvailability(true)
  })
}
