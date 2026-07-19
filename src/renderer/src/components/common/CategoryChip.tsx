import { motion } from 'framer-motion'
import { Icon } from './Icon'
import { cn } from '../../lib/utils'

export function CategoryChip({
  icon,
  label,
  count,
  active,
  onClick
}: {
  icon: string
  label: string
  count?: number
  active?: boolean
  onClick?: () => void
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 whitespace-nowrap rounded-fluent border px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-accent text-white border-accent'
          : 'border-subtle bg-black/5 dark:bg-white/5 text-primary hover:bg-black/10 dark:hover:bg-white/10'
      )}
    >
      <Icon name={icon} size={15} />
      {label}
      {count !== undefined && (
        <span className={cn('text-xs', active ? 'text-white/80' : 'text-secondary')}>{count}</span>
      )}
    </motion.button>
  )
}
