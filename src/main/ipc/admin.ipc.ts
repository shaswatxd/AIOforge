import { ipcMain } from 'electron'
import type { AdminBundleOptions } from '@shared/types/system'
import { adminBundleService } from '../services/adminBundleService'

export function registerAdminIpc(): void {
  ipcMain.handle('admin:generateBundle', (_e, options: AdminBundleOptions) => adminBundleService.generateBundle(options))
}
