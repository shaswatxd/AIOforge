import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

export function Badge({
  children,
  variant = 'default',
  className
}: {
  children: ReactNode
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'danger'
  className?: string
}) {
  const variants: Record<string, string> = {
    default: 'bg-black/5 dark:bg-white/10 text-secondary',
    accent: 'bg-accent/15 text-accent',
    success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    warning: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    danger: 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
  }

  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}
