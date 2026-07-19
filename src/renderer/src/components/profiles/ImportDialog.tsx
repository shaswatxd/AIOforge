import { useState } from 'react'
import { Modal } from '../common/Modal'
import { useImportProfileByCode, useImportProfileFromFile } from '../../queries/useProfiles'
import { useUiStore } from '../../state/uiStore'

export function ImportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [code, setCode] = useState('')
  const byCode = useImportProfileByCode()
  const fromFile = useImportProfileFromFile()
  const pushToast = useUiStore((s) => s.pushToast)

  const handleImportCode = () => {
    if (!code.trim()) return
    byCode.mutate(code.trim(), {
      onSuccess: (profile) => {
        pushToast(`Imported profile "${profile.name}"`, 'success')
        setCode('')
        onClose()
      },
      onError: (err) => pushToast(err instanceof Error ? err.message : 'Import failed', 'error')
    })
  }

  const handleImportFile = async () => {
    const filePath = await window.api.system.pickOpenFile()
    if (!filePath) return
    fromFile.mutate(filePath, {
      onSuccess: (profile) => {
        pushToast(`Imported profile "${profile.name}"`, 'success')
        onClose()
      },
      onError: (err) => pushToast(err instanceof Error ? err.message : 'Import failed', 'error')
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="Import Profile">
      <div className="flex flex-col gap-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Share code</label>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. DEV-X82K9"
              className="flex-1 rounded-fluent border border-subtle bg-transparent px-3 py-2 text-sm outline-none"
            />
            <button
              onClick={handleImportCode}
              disabled={byCode.isPending}
              className="rounded-fluent bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
            >
              Import
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-secondary">
          <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
          or
          <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
        </div>

        <button
          onClick={handleImportFile}
          disabled={fromFile.isPending}
          className="rounded-fluent border border-subtle py-2.5 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50"
        >
          Import from File…
        </button>
      </div>
    </Modal>
  )
}
