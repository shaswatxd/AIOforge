import { ipcMain } from 'electron'
import { updateCheckerService } from '../services/updateCheckerService'

export function registerUpdatesIpc(): void {
  ipcMain.handle('updates:scan', () => updateCheckerService.scan())
  ipcMain.handle('updates:updateSelected', (_e, appIds: string[]) => updateCheckerService.updateSelected(appIds))
  ipcMain.handle('updates:updateAll', () => updateCheckerService.updateAll())
}
