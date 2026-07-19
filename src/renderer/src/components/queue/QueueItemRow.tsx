import type { ReactNode } from 'react'
import { Pause, Play, X, RotateCw, Clock } from 'lucide-react'
import type { QueueItem } from '@shared/types/queue'
import { IconBadge } from '../common/IconBadge'
import { Badge } from '../common/Badge'
import { ProgressBar } from './ProgressBar'
import { formatSpeed, formatEta } from '../../lib/utils'
import { usePauseQueueItem, useResumeQueueItem, useCancelQueueItem, useRetryQueueItem } from '../../queries/useQueue'

const STATUS_LABEL: Record<QueueItem['status'], string> = {
  queued: 'Queued',
  downloading: 'Downloading',
  installing: 'Installing',
  paused: 'Paused',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled'
}

const STATUS_VARIANT: Record<QueueItem['status'], 'default' | 'accent' | 'success' | 'warning' | 'danger'> = {
  queued: 'default',
  downloading: 'accent',
  installing: 'accent',
  paused: 'warning',
  completed: 'success',
  failed: 'danger',
  cancelled: 'default'
}

export function QueueItemRow({ item }: { item: QueueItem }) {
  const pause = usePauseQueueItem()
  const resume = useResumeQueueItem()
  const cancel = useCancelQueueItem()
  const retry = useRetryQueueItem()

  const isActive = item.status === 'downloading' || item.status === 'installing'
  const isPausable = isActive || item.status === 'queued'
  const canRetry = item.status === 'failed' || item.status === 'cancelled'

  return (
    <div className="acrylic flex items-center gap-4 rounded-fluent-lg border-subtle p-4 shadow-fluent">
      <IconBadge id={item.appId} name={item.appName} size={40} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold">{item.appName}</span>
          <Badge variant={STATUS_VARIANT[item.status]}>{STATUS_LABEL[item.status]}</Badge>
        </div>

        {(isActive || item.status === 'paused') && (
          <div className="mt-2 flex flex-col gap-1.5">
            <ProgressBar progress={item.progress} status={item.status} />
            <div className="flex items-center gap-3 text-xs text-secondary">
              <span>{item.progress}%</span>
              {isActive && (
                <>
                  <span>{formatSpeed(item.speedBps)}</span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} /> {formatEta(item.etaSeconds)}
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {item.error && <p className="mt-1 truncate text-xs text-rose-500">{item.error}</p>}
      </div>

      <div className="flex items-center gap-1.5">
        {isPausable && item.status !== 'paused' && (
          <IconButton title="Pause" onClick={() => pause.mutate(item.id)}>
            <Pause size={15} />
          </IconButton>
        )}
        {item.status === 'paused' && (
          <IconButton title="Resume" onClick={() => resume.mutate(item.id)}>
            <Play size={15} />
          </IconButton>
        )}
        {canRetry && (
          <IconButton title="Retry" onClick={() => retry.mutate(item.id)}>
            <RotateCw size={15} />
          </IconButton>
        )}
        {item.status !== 'completed' && (
          <IconButton title="Cancel" onClick={() => cancel.mutate(item.id)} danger>
            <X size={15} />
          </IconButton>
        )}
      </div>
    </div>
  )
}

function IconButton({
  children,
  onClick,
  title,
  danger
}: {
  children: ReactNode
  onClick: () => void
  title: string
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex h-8 w-8 items-center justify-center rounded-fluent border border-subtle text-secondary hover:text-primary ${
        danger ? 'hover:bg-rose-500/15 hover:text-rose-500' : 'hover:bg-black/5 dark:hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  )
}
