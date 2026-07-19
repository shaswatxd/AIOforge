import { ipcMain } from 'electron'
import { tweaksService } from '../services/tweaksService'

export function registerTweaksIpc(): void {
  ipcMain.handle('tweaks:list', () => tweaksService.list())
  ipcMain.handle('tweaks:apply', (_e, ids: string[]) => tweaksService.apply(ids))
}
