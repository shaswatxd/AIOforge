import { ipcMain, dialog, shell, app, type BrowserWindow } from 'electron'

export function registerSystemIpc(getWindow: () => BrowserWindow | null): void {
  ipcMain.handle('system:pickDirectory', async () => {
    const win = getWindow()
    if (!win) return null
    const result = await dialog.showOpenDialog(win, { properties: ['openDirectory', 'createDirectory'] })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('system:pickSaveFile', async (_e, defaultName: string) => {
    const win = getWindow()
    if (!win) return null
    const result = await dialog.showSaveDialog(win, {
      defaultPath: defaultName,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    return result.canceled ? null : result.filePath ?? null
  })

  ipcMain.handle('system:pickOpenFile', async () => {
    const win = getWindow()
    if (!win) return null
    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('system:openExternal', (_e, url: string) => {
    if (!/^https:\/\//i.test(url)) throw new Error('Only https:// links can be opened')
    return shell.openExternal(url)
  })

  ipcMain.handle('system:getAppVersion', () => app.getVersion())
}
