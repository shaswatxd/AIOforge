import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { getDb, closeDb } from './db'
import { registerCatalogIpc } from './ipc/catalog.ipc'
import { registerQueueIpc } from './ipc/queue.ipc'
import { registerProfilesIpc } from './ipc/profiles.ipc'
import { registerUpdatesIpc } from './ipc/updates.ipc'
import { registerUninstallIpc } from './ipc/uninstall.ipc'
import { registerTweaksIpc } from './ipc/tweaks.ipc'
import { registerBackupIpc } from './ipc/backup.ipc'
import { registerSettingsIpc } from './ipc/settings.ipc'
import { registerAdminIpc } from './ipc/admin.ipc'
import { registerSystemIpc } from './ipc/system.ipc'
import { settingsRepo } from './db/repositories/settings.repo'
import { updateCheckerService } from './services/updateCheckerService'
import { initAutoUpdater } from './autoUpdater'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    frame: false,
    backgroundColor: '#00000000',
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())

  mainWindow.webContents.setWindowOpenHandler((details) => {
    void shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    void mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function registerWindowControlsIpc(): void {
  ipcMain.handle('window:minimize', () => mainWindow?.minimize())
  ipcMain.handle('window:maximizeToggle', () => {
    if (!mainWindow) return
    mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize()
  })
  ipcMain.handle('window:close', () => mainWindow?.close())
  ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized() ?? false)
}

function startBackgroundUpdateChecking(): void {
  const intervalMs = 30 * 60 * 1000
  setInterval(() => {
    const settings = settingsRepo.getAll()
    if (settings.backgroundUpdateChecking) {
      updateCheckerService.scan().catch((err) => console.warn('[background update check] failed:', err))
    }
  }, intervalMs)
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.setupforge.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  getDb() // initialize + run migrations before any IPC handler touches it

  registerWindowControlsIpc()
  registerCatalogIpc()
  registerQueueIpc(() => mainWindow)
  registerProfilesIpc()
  registerUpdatesIpc()
  registerUninstallIpc()
  registerTweaksIpc()
  registerBackupIpc()
  registerSettingsIpc()
  registerAdminIpc()
  registerSystemIpc(() => mainWindow)

  createWindow()
  initAutoUpdater()
  startBackgroundUpdateChecking()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  closeDb()
  if (process.platform !== 'darwin') app.quit()
})
