import { ipcMain } from 'electron'
import type { UninstallTarget } from '@shared/types/system'
import { uninstallService } from '../services/uninstallService'

export function registerUninstallIpc(): void {
  ipcMain.handle('uninstall:detectInstalled', () => uninstallService.detectInstalled())
  ipcMain.handle('uninstall:uninstall', (_e, target: UninstallTarget) => uninstallService.uninstall(target))
  ipcMain.handle('uninstall:repair', (_e, target: UninstallTarget) => uninstallService.repair(target))
  ipcMain.handle('uninstall:reinstall', (_e, target: UninstallTarget) => uninstallService.reinstall(target))
}
