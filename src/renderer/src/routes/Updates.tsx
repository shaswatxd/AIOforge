import { useState } from 'react'
import { RefreshCw, DownloadCloud } from 'lucide-react'
import { IconBadge } from '../components/common/IconBadge'
import { Badge } from '../components/common/Badge'
import { useUpdatesScan, useUpdateAll, useUpdateSelected } from '../queries/useUpdates'
import { useSettings, useSetSettings } from '../queries/useSettings'
import { useUiStore } from '../state/uiStore'

export function Updates() {
  const { data: scan, isFetching, refetch } = useUpdatesScan()
  const updateAll = useUpdateAll()
  const updateSelected = useUpdateSelected()
  const { data: settings } = useSettings()
  const setSettings = useSetSettings()
  const pushToast = useUiStore((s) => s.pushToast)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Every real update winget/Chocolatey reports shows up here — not just the ones that
  // happen to be in the curated catalog — so the count here always matches what "Update
  // All" actually acts on.
  const apps = scan?.apps ?? []

  const toggle = (packageId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(packageId) ? next.delete(packageId) : next.add(packageId)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Update Manager</h1>
          <p className="text-sm text-secondary">Scan installed apps and update the ones that have newer versions available.</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 rounded-fluent border border-subtle px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-60"
        >
          <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} /> {isFetching ? 'Scanning…' : 'Scan for Updates'}
        </button>
      </div>

      <label className="flex w-fit items-center gap-2 rounded-fluent border border-subtle px-3 py-2 text-sm">
        <input
          type="checkbox"
          checked={settings?.autoUpdateApps ?? false}
          onChange={(e) => setSettings.mutate({ autoUpdateApps: e.target.checked })}
          className="accent-accent"
        />
        Automatic Updates
      </label>

      {apps.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-sm text-secondary">
          {isFetching ? 'Scanning for updates…' : 'No updates found. Everything is up to date.'}
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                updateSelected.mutate([...selected], {
                  onSuccess: (items) => pushToast(`${items.length} updates queued`, 'success')
                })
              }
              disabled={selected.size === 0}
              className="flex items-center gap-2 rounded-fluent border border-subtle px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50"
            >
              Update Selected ({selected.size})
            </button>
            <button
              onClick={() =>
                updateAll.mutate(undefined, {
                  onSuccess: (items) => pushToast(`${items.length} updates queued`, 'success')
                })
              }
              className="flex items-center gap-2 rounded-fluent bg-accent px-3 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
            >
              <DownloadCloud size={15} /> Update All ({apps.length})
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {apps.map((app) => (
              <label
                key={app.packageId}
                className="flex items-center gap-3 rounded-fluent border border-subtle p-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
              >
                <input
                  type="checkbox"
                  checked={selected.has(app.packageId)}
                  onChange={() => toggle(app.packageId)}
                  className="accent-accent"
                />
                <IconBadge id={app.appId ?? app.packageId} name={app.name} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{app.name}</div>
                  <div className="text-xs text-secondary">
                    {app.version} → {app.updateAvailable}
                  </div>
                </div>
                {!app.appId && <Badge>Not in catalog</Badge>}
                <Badge>{app.source}</Badge>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
