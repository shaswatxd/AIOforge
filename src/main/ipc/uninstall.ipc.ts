import { ipcMain } from 'electron'
import { uninstallService } from '../services/uninstallService'

export function registerUninstallIpc(): void {
  ipcMain.handle('uninstall:detectInstalled', () => uninstallService.detectInstalled())
  ipcMain.handle('uninstall:uninstall', (_e, appId: string) => uninstallService.uninstall(appId))
  ipcMain.handle('uninstall:repair', (_e, appId: string) => uninstallService.repair(appId))
  ipcMain.handle('uninstall:reinstall', (_e, appId: string) => uninstallService.reinstall(appId))
}
