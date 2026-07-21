import { contextBridge, ipcRenderer } from 'electron'
import type { SetupForgeApi } from '@shared/types/ipc'
import type { QueueProgressEvent } from '@shared/types/queue'
import type { AppUpdateStatus } from '@shared/types/system'

const api: SetupForgeApi = {
  catalog: {
    list: (filters) => ipcRenderer.invoke('catalog:list', filters),
    get: (appId) => ipcRenderer.invoke('catalog:get', appId),
    categories: () => ipcRenderer.invoke('catalog:categories'),
    favorites: () => ipcRenderer.invoke('catalog:favorites'),
    toggleFavorite: (appId) => ipcRenderer.invoke('catalog:toggleFavorite', appId),
    recommended: () => ipcRenderer.invoke('catalog:recommended'),
    searchOnline: (query) => ipcRenderer.invoke('catalog:searchOnline', query)
  },
  queue: {
    list: () => ipcRenderer.invoke('queue:list'),
    add: (requests) => ipcRenderer.invoke('queue:add', requests),
    pause: (id) => ipcRenderer.invoke('queue:pause', id),
    resume: (id) => ipcRenderer.invoke('queue:resume', id),
    cancel: (id) => ipcRenderer.invoke('queue:cancel', id),
    retry: (id) => ipcRenderer.invoke('queue:retry', id),
    clearFinished: () => ipcRenderer.invoke('queue:clearFinished'),
    onProgress: (cb: (event: QueueProgressEvent) => void) => {
      const listener = (_e: Electron.IpcRendererEvent, event: QueueProgressEvent) => cb(event)
      ipcRenderer.on('queue:progress', listener)
      return () => ipcRenderer.removeListener('queue:progress', listener)
    }
  },
  profiles: {
    list: () => ipcRenderer.invoke('profiles:list'),
    get: (id) => ipcRenderer.invoke('profiles:get', id),
    create: (profile) => ipcRenderer.invoke('profiles:create', profile),
    update: (id, patch) => ipcRenderer.invoke('profiles:update', id, patch),
    remove: (id) => ipcRenderer.invoke('profiles:remove', id),
    installProfile: (id) => ipcRenderer.invoke('profiles:installProfile', id),
    generateShareCode: (id) => ipcRenderer.invoke('profiles:generateShareCode', id),
    importByCode: (code) => ipcRenderer.invoke('profiles:importByCode', code),
    exportToFile: (id, filePath) => ipcRenderer.invoke('profiles:exportToFile', id, filePath),
    importFromFile: (filePath) => ipcRenderer.invoke('profiles:importFromFile', filePath),
    community: () => ipcRenderer.invoke('profiles:community'),
    packs: () => ipcRenderer.invoke('profiles:packs')
  },
  updates: {
    scan: () => ipcRenderer.invoke('updates:scan'),
    updateSelected: (appIds) => ipcRenderer.invoke('updates:updateSelected', appIds),
    updateAll: () => ipcRenderer.invoke('updates:updateAll')
  },
  uninstall: {
    detectInstalled: () => ipcRenderer.invoke('uninstall:detectInstalled'),
    uninstall: (target) => ipcRenderer.invoke('uninstall:uninstall', target),
    repair: (target) => ipcRenderer.invoke('uninstall:repair', target),
    reinstall: (target) => ipcRenderer.invoke('uninstall:reinstall', target)
  },
  tweaks: {
    list: () => ipcRenderer.invoke('tweaks:list'),
    apply: (ids) => ipcRenderer.invoke('tweaks:apply', ids)
  },
  backup: {
    create: (filePath) => ipcRenderer.invoke('backup:create', filePath),
    restore: (filePath) => ipcRenderer.invoke('backup:restore', filePath)
  },
  exportImport: {
    exportData: (filePath, scope) => ipcRenderer.invoke('exportImport:exportData', filePath, scope),
    importData: (filePath) => ipcRenderer.invoke('exportImport:importData', filePath)
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (patch) => ipcRenderer.invoke('settings:set', patch),
    packageManagerAvailability: () => ipcRenderer.invoke('settings:packageManagerAvailability')
  },
  admin: {
    generateBundle: (options) => ipcRenderer.invoke('admin:generateBundle', options)
  },
  system: {
    pickDirectory: () => ipcRenderer.invoke('system:pickDirectory'),
    pickSaveFile: (defaultName) => ipcRenderer.invoke('system:pickSaveFile', defaultName),
    pickOpenFile: () => ipcRenderer.invoke('system:pickOpenFile'),
    openExternal: (url) => ipcRenderer.invoke('system:openExternal', url),
    getAppVersion: () => ipcRenderer.invoke('system:getAppVersion'),
    isAdmin: () => ipcRenderer.invoke('system:isAdmin'),
    relaunchAsAdmin: () => ipcRenderer.invoke('system:relaunchAsAdmin')
  },
  app: {
    checkForUpdates: () => ipcRenderer.invoke('app:checkForUpdates'),
    downloadUpdate: () => ipcRenderer.invoke('app:downloadUpdate'),
    quitAndInstall: () => ipcRenderer.invoke('app:quitAndInstall'),
    onUpdateStatus: (cb) => {
      const listener = (_e: Electron.IpcRendererEvent, status: AppUpdateStatus) => cb(status)
      ipcRenderer.on('app:updateStatus', listener)
      return () => ipcRenderer.removeListener('app:updateStatus', listener)
    }
  }
}

const windowControls = {
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximizeToggle: () => ipcRenderer.invoke('window:maximizeToggle'),
  close: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized')
}

contextBridge.exposeInMainWorld('api', api)
contextBridge.exposeInMainWorld('windowControls', windowControls)

export type WindowControls = typeof windowControls
