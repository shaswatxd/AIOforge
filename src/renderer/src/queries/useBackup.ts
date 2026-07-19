import { useMutation } from '@tanstack/react-query'
import type { AdminBundleOptions } from '@shared/types/system'

export function useCreateBackup() {
  return useMutation({ mutationFn: (filePath: string) => window.api.backup.create(filePath) })
}

export function useRestoreBackup() {
  return useMutation({ mutationFn: (filePath: string) => window.api.backup.restore(filePath) })
}

export function useExportData() {
  return useMutation({
    mutationFn: ({ filePath, scope }: { filePath: string; scope: { apps: boolean; profiles: boolean; settings: boolean } }) =>
      window.api.exportImport.exportData(filePath, scope)
  })
}

export function useImportData() {
  return useMutation({ mutationFn: (filePath: string) => window.api.exportImport.importData(filePath) })
}

export function useGenerateAdminBundle() {
  return useMutation({ mutationFn: (options: AdminBundleOptions) => window.api.admin.generateBundle(options) })
}
