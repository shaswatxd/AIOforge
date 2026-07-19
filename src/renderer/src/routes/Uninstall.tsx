import { useState, type ReactNode } from 'react'
import { RefreshCw, Trash2, Wrench, RotateCw, Search } from 'lucide-react'
import { IconBadge } from '../components/common/IconBadge'
import { Badge } from '../components/common/Badge'
import {
  useInstalledApps,
  useUninstallApp,
  useRepairApp,
  useReinstallApp
} from '../queries/useUninstall'
import { useUiStore } from '../state/uiStore'
import type { InstalledApp, UninstallTarget } from '@shared/types/system'

function toTarget(app: InstalledApp): UninstallTarget {
  return { appId: app.appId, packageId: app.packageId, name: app.name, source: app.source as 'winget' | 'chocolatey' }
}

export function Uninstall() {
  const { data: apps, isFetching, refetch } = useInstalledApps()
  const uninstall = useUninstallApp()
  const repair = useRepairApp()
  const reinstall = useReinstallApp()
  const pushToast = useUiStore((s) => s.pushToast)
  const [query, setQuery] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const filtered = (apps ?? []).filter((a) => a.name.toLowerCase().includes(query.toLowerCase()))

  const withBusy = async (id: string, fn: () => Promise<unknown>, successMsg: string) => {
    setBusyId(id)
    try {
      await fn()
      pushToast(successMsg, 'success')
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Action failed', 'error')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Uninstall Manager</h1>
          <p className="text-sm text-secondary">
            Detected via winget/Chocolatey — uninstall, repair, or reinstall any app, catalog or not.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 rounded-fluent border border-subtle px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-60"
        >
          <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} /> {isFetching ? 'Scanning…' : 'Refresh'}
        </button>
      </div>

      <div className="relative max-w-xs">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter installed apps…"
          className="w-full rounded-fluent border border-subtle bg-transparent py-2 pl-9 pr-3 text-sm outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-sm text-secondary">
          {isFetching ? 'Scanning installed software…' : 'No installed apps detected.'}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((app) => {
            const id = app.packageId
            const isBusy = busyId === id
            const target = toTarget(app)
            return (
              <div key={id} className="flex items-center gap-3 rounded-fluent border border-subtle p-3">
                <IconBadge id={app.appId ?? app.packageId} name={app.name} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{app.name}</div>
                  <div className="text-xs text-secondary">v{app.version}</div>
                </div>
                {!app.appId && <Badge>Not in catalog</Badge>}
                <Badge>{app.source}</Badge>
                <div className="flex gap-1.5">
                  <ActionButton
                    title="Repair"
                    disabled={isBusy}
                    onClick={() => withBusy(id, () => repair.mutateAsync(target), `${app.name} repaired`)}
                  >
                    <Wrench size={14} />
                  </ActionButton>
                  <ActionButton
                    title="Reinstall"
                    disabled={isBusy}
                    onClick={() => withBusy(id, () => reinstall.mutateAsync(target), `${app.name} queued for reinstall`)}
                  >
                    <RotateCw size={14} />
                  </ActionButton>
                  <ActionButton
                    title="Uninstall"
                    danger
                    disabled={isBusy}
                    onClick={() => withBusy(id, () => uninstall.mutateAsync(target), `${app.name} uninstalled`)}
                  >
                    <Trash2 size={14} />
                  </ActionButton>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ActionButton({
  children,
  onClick,
  title,
  danger,
  disabled
}: {
  children: ReactNode
  onClick: () => void
  title: string
  danger?: boolean
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`flex h-8 w-8 items-center justify-center rounded-fluent border border-subtle text-secondary hover:text-primary disabled:opacity-50 ${
        danger ? 'hover:bg-rose-500/15 hover:text-rose-500' : 'hover:bg-black/5 dark:hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  )
}
