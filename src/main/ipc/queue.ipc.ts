import { ipcMain, type BrowserWindow } from 'electron'
import type { InstallRequest } from '@shared/types/ipc'
import { installQueueManager } from '../services/installQueueManager'

export function registerQueueIpc(getWindow: () => BrowserWindow | null): void {
  ipcMain.handle('queue:list', () => installQueueManager.list())

  ipcMain.handle('queue:add', (_e, requests: InstallRequest[]) => installQueueManager.add(requests))

  ipcMain.handle('queue:pause', (_e, id: string) => installQueueManager.pause(id))

  ipcMain.handle('queue:resume', (_e, id: string) => installQueueManager.resume(id))

  ipcMain.handle('queue:cancel', (_e, id: string) => installQueueManager.cancel(id))

  ipcMain.handle('queue:retry', (_e, id: string) => installQueueManager.retry(id))

  ipcMain.handle('queue:clearFinished', () => installQueueManager.clearFinished())

  installQueueManager.onProgress((event) => {
    getWindow()?.webContents.send('queue:progress', event)
  })
}
