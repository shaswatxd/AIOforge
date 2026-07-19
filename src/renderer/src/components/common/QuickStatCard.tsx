import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'

export function QuickStatCard({
  to,
  icon: IconCmp,
  label,
  value,
  accent
}: {
  to: string
  icon: LucideIcon
  label: string
  value: string | number
  accent?: boolean
}) {
  return (
    <Link
      to={to}
      className="acrylic flex items-center gap-3 rounded-fluent-lg border-subtle p-4 shadow-fluent transition-transform hover:-translate-y-0.5"
    >
      <div className={cn('flex h-10 w-10 items-center justify-center rounded-fluent', accent ? 'bg-accent/15 text-accent' : 'bg-black/5 dark:bg-white/10 text-secondary')}>
        <IconCmp size={19} />
      </div>
      <div>
        <div className="text-xl font-bold leading-none">{value}</div>
        <div className="text-xs text-secondary mt-1">{label}</div>
      </div>
    </Link>
  )
}
