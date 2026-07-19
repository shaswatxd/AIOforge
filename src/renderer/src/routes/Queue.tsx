import { useMemo } from 'react'
import { Trash2 } from 'lucide-react'
import { QueueItemRow } from '../components/queue/QueueItemRow'
import { useClearFinishedQueue, useQueueList } from '../queries/useQueue'

const GROUPS = [
  { key: 'active', label: 'Active', statuses: ['downloading', 'installing'] },
  { key: 'queued', label: 'Queued', statuses: ['queued'] },
  { key: 'paused', label: 'Paused', statuses: ['paused'] },
  { key: 'finished', label: 'Finished', statuses: ['completed', 'failed', 'cancelled'] }
] as const

export function Queue() {
  const { data: queue } = useQueueList()
  const clearFinished = useClearFinishedQueue()

  const grouped = useMemo(() => {
    const items = queue ?? []
    return GROUPS.map((g) => ({ ...g, items: items.filter((i) => (g.statuses as readonly string[]).includes(i.status)) }))
  }, [queue])

  const hasFinished = grouped.find((g) => g.key === 'finished')!.items.length > 0

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Install Queue</h1>
          <p className="text-sm text-secondary">Track downloads and installs — pause, resume, cancel or retry any item.</p>
        </div>
        {hasFinished && (
          <button
            onClick={() => clearFinished.mutate()}
            className="flex items-center gap-2 rounded-fluent border border-subtle px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10"
          >
            <Trash2 size={14} /> Clear Finished
          </button>
        )}
      </div>

      {(!queue || queue.length === 0) && (
        <div className="flex h-48 items-center justify-center text-sm text-secondary">
          Queue is empty — install something from Home to see it here.
        </div>
      )}

      {grouped.map(
        (group) =>
          group.items.length > 0 && (
            <section key={group.key} className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-secondary">
                {group.label} ({group.items.length})
              </h2>
              <div className="flex flex-col gap-2">
                {group.items.map((item) => (
                  <QueueItemRow key={item.id} item={item} />
                ))}
              </div>
            </section>
          )
      )}
    </div>
  )
}
