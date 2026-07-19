import { useState } from 'react'
import { Archive, RotateCcw, FileDown, FileUp } from 'lucide-react'
import { useCreateBackup, useRestoreBackup, useExportData, useImportData } from '../queries/useBackup'
import { useUiStore } from '../state/uiStore'

export function Backup() {
  const createBackup = useCreateBackup()
  const restoreBackup = useRestoreBackup()
  const exportData = useExportData()
  const importData = useImportData()
  const pushToast = useUiStore((s) => s.pushToast)

  const [scope, setScope] = useState({ apps: true, profiles: true, settings: true })

  const handleBackup = async () => {
    const filePath = await window.api.system.pickSaveFile('setupforge-backup.json')
    if (!filePath) return
    createBackup.mutate(filePath, {
      onSuccess: (manifest) => pushToast(`Backup created — ${manifest.installedApps.length} apps, ${manifest.profiles} profiles`, 'success'),
      onError: (err) => pushToast(err instanceof Error ? err.message : 'Backup failed', 'error')
    })
  }

  const handleRestore = async () => {
    const filePath = await window.api.system.pickOpenFile()
    if (!filePath) return
    restoreBackup.mutate(filePath, {
      onSuccess: () => pushToast('Backup restored', 'success'),
      onError: (err) => pushToast(err instanceof Error ? err.message : 'Restore failed', 'error')
    })
  }

  const handleExport = async () => {
    const filePath = await window.api.system.pickSaveFile('setupforge-export.json')
    if (!filePath) return
    exportData.mutate(
      { filePath, scope },
      {
        onSuccess: () => pushToast('Export complete', 'success'),
        onError: (err) => pushToast(err instanceof Error ? err.message : 'Export failed', 'error')
      }
    )
  }

  const handleImport = async () => {
    const filePath = await window.api.system.pickOpenFile()
    if (!filePath) return
    importData.mutate(filePath, {
      onSuccess: () => pushToast('Import complete', 'success'),
      onError: (err) => pushToast(err instanceof Error ? err.message : 'Import failed', 'error')
    })
  }

  return (
    <div className="flex flex-col gap-8 p-6">
      <div>
        <h1 className="text-xl font-bold">Backup & Restore</h1>
        <p className="text-sm text-secondary">Snapshot your installed apps, profiles and configuration, and restore with one click.</p>
      </div>

      <section className="acrylic flex flex-col gap-3 rounded-fluent-lg border-subtle p-5 shadow-fluent">
        <h2 className="text-sm font-semibold">Full Backup</h2>
        <p className="text-xs text-secondary">Includes installed apps, custom profiles and settings, with a SHA256 checksum for tamper detection.</p>
        <div className="flex gap-2">
          <button
            onClick={handleBackup}
            disabled={createBackup.isPending}
            className="flex items-center gap-2 rounded-fluent bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
          >
            <Archive size={15} /> Create Backup
          </button>
          <button
            onClick={handleRestore}
            disabled={restoreBackup.isPending}
            className="flex items-center gap-2 rounded-fluent border border-subtle px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50"
          >
            <RotateCcw size={15} /> Restore from Backup
          </button>
        </div>
      </section>

      <section className="acrylic flex flex-col gap-3 rounded-fluent-lg border-subtle p-5 shadow-fluent">
        <h2 className="text-sm font-semibold">Export / Import</h2>
        <p className="text-xs text-secondary">Export just what you need as JSON, or import profiles / app lists / a full backup.</p>
        <div className="flex flex-wrap gap-4 text-sm">
          {(['apps', 'profiles', 'settings'] as const).map((key) => (
            <label key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={scope[key]}
                onChange={(e) => setScope((s) => ({ ...s, [key]: e.target.checked }))}
                className="accent-accent"
              />
              {key === 'apps' ? 'Installed Apps' : key === 'profiles' ? 'Profiles' : 'Settings'}
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            disabled={exportData.isPending}
            className="flex items-center gap-2 rounded-fluent border border-subtle px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50"
          >
            <FileDown size={15} /> Export
          </button>
          <button
            onClick={handleImport}
            disabled={importData.isPending}
            className="flex items-center gap-2 rounded-fluent border border-subtle px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50"
          >
            <FileUp size={15} /> Import
          </button>
        </div>
      </section>
    </div>
  )
}
