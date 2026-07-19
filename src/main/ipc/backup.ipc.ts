import { ipcMain } from 'electron'
import { backupService } from '../services/backupService'
import { exportImportService } from '../services/exportImportService'

export function registerBackupIpc(): void {
  ipcMain.handle('backup:create', (_e, filePath: string) => backupService.create(filePath))
  ipcMain.handle('backup:restore', (_e, filePath: string) => backupService.restore(filePath))

  ipcMain.handle(
    'exportImport:exportData',
    (_e, filePath: string, scope: { apps: boolean; profiles: boolean; settings: boolean }) =>
      exportImportService.exportData(filePath, scope)
  )
  ipcMain.handle('exportImport:importData', (_e, filePath: string) => exportImportService.importData(filePath))
}
