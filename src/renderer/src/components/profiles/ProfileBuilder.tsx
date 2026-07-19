import { useState } from 'react'
import { Modal } from '../common/Modal'
import { IconBadge } from '../common/IconBadge'
import { useCatalogList } from '../../queries/useCatalog'
import { useCreateProfile } from '../../queries/useProfiles'
import { useUiStore } from '../../state/uiStore'

export function ProfileBuilder({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const { data: apps } = useCatalogList({ query: search })
  const create = useCreateProfile()
  const pushToast = useUiStore((s) => s.pushToast)

  const reset = () => {
    setName('')
    setDescription('')
    setSearch('')
    setSelected(new Set())
  }

  const toggle = (appId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(appId) ? next.delete(appId) : next.add(appId)
      return next
    })
  }

  const handleCreate = () => {
    if (!name.trim() || selected.size === 0) return
    create.mutate(
      {
        name: name.trim(),
        description: description.trim() || `Custom profile with ${selected.size} apps`,
        icon: 'Folder',
        category: 'custom',
        apps: [...selected].map((appId) => ({ appId }))
      },
      {
        onSuccess: () => {
          pushToast(`Profile "${name}" created`, 'success')
          reset()
          onClose()
        }
      }
    )
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title="Create Profile"
      width={560}
    >
      <div className="flex flex-col gap-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Profile name (e.g. React Developer)"
          className="rounded-fluent border border-subtle bg-transparent px-3 py-2 text-sm outline-none"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="rounded-fluent border border-subtle bg-transparent px-3 py-2 text-sm outline-none"
        />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">Select apps ({selected.size})</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search apps…"
              className="rounded-fluent border border-subtle bg-transparent px-2 py-1 text-xs outline-none"
            />
          </div>
          <div className="flex max-h-64 flex-col gap-1 overflow-y-auto rounded-fluent border border-subtle p-2">
            {apps?.map((app) => (
              <label
                key={app.id}
                className="flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 hover:bg-black/5 dark:hover:bg-white/10"
              >
                <input type="checkbox" checked={selected.has(app.id)} onChange={() => toggle(app.id)} className="accent-accent" />
                <IconBadge id={app.id} name={app.name} size={24} />
                <span className="text-sm">{app.name}</span>
              </label>
            ))}
            {apps?.length === 0 && <div className="p-3 text-center text-xs text-secondary">No apps match "{search}"</div>}
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={!name.trim() || selected.size === 0 || create.isPending}
          className="rounded-fluent bg-accent py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
        >
          Create Profile
        </button>
      </div>
    </Modal>
  )
}
