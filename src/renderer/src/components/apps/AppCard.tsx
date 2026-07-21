import { Settings2, Download, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import type { AppDefinition } from '@shared/types/catalog'
import { IconBadge } from '../common/IconBadge'
import { Badge } from '../common/Badge'
import { Rating } from '../common/Rating'
import { FavoriteButton } from './FavoriteButton'
import { useAddToQueue, useQueueList } from '../../queries/useQueue'
import { useInstalledApps } from '../../queries/useUninstall'
import { useUiStore } from '../../state/uiStore'
import { formatBytes, formatDownloads } from '../../lib/utils'

export function AppCard({ app }: { app: AppDefinition }) {
  const addToQueue = useAddToQueue()
  const { data: queue } = useQueueList()
  const { data: installedApps } = useInstalledApps()
  const openAppDetail = useUiStore((s) => s.openAppDetail)
  const pushToast = useUiStore((s) => s.pushToast)

  const queueEntry = queue?.find((q) => q.appId === app.id && ['queued', 'downloading', 'installing'].includes(q.status))
  // "Installed" reflects the real system (a live winget/choco scan), not just apps we
  // personally installed through the queue this session — otherwise anything that was
  // already on the machine before AIOforge existed would still show an Install button.
  const isInstalled = Boolean(
    installedApps?.some(
      (a) =>
        a.appId === app.id ||
        (app.wingetId && a.packageId.toLowerCase() === app.wingetId.toLowerCase()) ||
        (app.chocoId && a.packageId.toLowerCase() === app.chocoId.toLowerCase())
    )
  )

  const handleInstall = () => {
    addToQueue.mutate([{ appId: app.id }], {
      onSuccess: () => pushToast(`${app.name} added to install queue`, 'success'),
      onError: (err) => pushToast(err instanceof Error ? err.message : 'Failed to queue install', 'error')
    })
  }

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      onClick={() => openAppDetail(app.id)}
      className="acrylic group flex cursor-pointer flex-col gap-3 rounded-fluent-lg border-subtle p-4 shadow-fluent transition-shadow hover:shadow-fluent-lg"
    >
      <div className="flex items-start gap-3">
        <IconBadge id={app.id} name={app.name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-sm font-semibold">{app.name}</h3>
          </div>
          <p className="truncate text-xs text-secondary">{app.developer}</p>
        </div>
        <FavoriteButton appId={app.id} />
      </div>

      <p className="line-clamp-2 text-xs text-secondary">{app.description}</p>

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge>{app.license}</Badge>
        <Badge variant="accent">v{app.stats.latestVersion}</Badge>
        <Badge>{formatBytes(app.stats.downloadSizeMb * 1024 * 1024)}</Badge>
      </div>

      <div className="flex items-center justify-between text-xs text-secondary">
        <Rating value={app.stats.rating} count={app.stats.ratingCount} />
        <span>{formatDownloads(app.stats.downloads)} downloads</span>
      </div>

      <div className="mt-auto flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
        {isInstalled ? (
          <button disabled className="flex flex-1 items-center justify-center gap-1.5 rounded-fluent bg-emerald-500/15 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <Check size={14} /> Installed
          </button>
        ) : queueEntry ? (
          <button disabled className="flex flex-1 items-center justify-center gap-1.5 rounded-fluent bg-black/5 dark:bg-white/10 py-2 text-xs font-semibold text-secondary">
            {queueEntry.status === 'queued' ? 'Queued' : `${queueEntry.progress}%`}
          </button>
        ) : (
          <button
            onClick={handleInstall}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-fluent bg-accent py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            <Download size={14} /> Install
          </button>
        )}
        <button
          onClick={() => openAppDetail(app.id)}
          title="Advanced install options"
          className="flex h-8 w-8 items-center justify-center rounded-fluent border border-subtle text-secondary hover:text-primary"
        >
          <Settings2 size={15} />
        </button>
      </div>
    </motion.div>
  )
}
