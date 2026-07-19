import { cn } from '../../lib/utils'

export function ProgressBar({ progress, status }: { progress: number; status: string }) {
  const isFailed = status === 'failed'
  const isPaused = status === 'paused'

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
      <div
        className={cn(
          'h-full rounded-full transition-all duration-300',
          isFailed ? 'bg-rose-500' : isPaused ? 'bg-amber-500' : 'bg-accent'
        )}
        style={{ width: `${Math.max(2, progress)}%` }}
      />
    </div>
  )
}
