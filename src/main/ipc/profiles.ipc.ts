import { ipcMain } from 'electron'
import type { Profile } from '@shared/types/profiles'
import { profileService } from '../services/profileService'

export function registerProfilesIpc(): void {
  ipcMain.handle('profiles:list', () => profileService.list())
  ipcMain.handle('profiles:get', (_e, id: string) => profileService.get(id))
  ipcMain.handle('profiles:create', (_e, profile: Omit<Profile, 'id' | 'createdAt' | 'updatedAt' | 'isBuiltin'>) =>
    profileService.create(profile)
  )
  ipcMain.handle('profiles:update', (_e, id: string, patch: Partial<Profile>) => profileService.update(id, patch))
  ipcMain.handle('profiles:remove', (_e, id: string) => profileService.remove(id))
  ipcMain.handle('profiles:installProfile', (_e, id: string) => profileService.installProfile(id))
  ipcMain.handle('profiles:generateShareCode', (_e, id: string) => profileService.generateShareCode(id))
  ipcMain.handle('profiles:importByCode', (_e, code: string) => profileService.importByCode(code))
  ipcMain.handle('profiles:exportToFile', (_e, id: string, filePath: string) => profileService.exportToFile(id, filePath))
  ipcMain.handle('profiles:importFromFile', (_e, filePath: string) => profileService.importFromFile(filePath))
  ipcMain.handle('profiles:community', () => profileService.community())
  ipcMain.handle('profiles:packs', () => profileService.packs())
}
