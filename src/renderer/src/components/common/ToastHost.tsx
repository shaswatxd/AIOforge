import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { useUiStore } from '../../state/uiStore'
import { cn } from '../../lib/utils'

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info }

export function ToastHost() {
  const toasts = useUiStore((s) => s.toasts)
  const dismissToast = useUiStore((s) => s.dismissToast)

  useEffect(() => {
    if (toasts.length === 0) return
    const timers = toasts.map((t) => setTimeout(() => dismissToast(t.id), 4500))
    return () => timers.forEach(clearTimeout)
  }, [toasts, dismissToast])

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 no-drag">
      <AnimatePresence>
        {toasts.map((toast) => {
          const IconCmp = ICONS[toast.variant]
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              className={cn(
                'acrylic flex items-center gap-2 rounded-fluent px-4 py-3 text-sm shadow-fluent max-w-sm',
                toast.variant === 'error' && 'border-rose-500/30',
                toast.variant === 'success' && 'border-emerald-500/30'
              )}
            >
              <IconCmp
                size={16}
                className={cn(
                  toast.variant === 'success' && 'text-emerald-500',
                  toast.variant === 'error' && 'text-rose-500',
                  toast.variant === 'info' && 'text-accent'
                )}
              />
              <span className="flex-1">{toast.message}</span>
              <button onClick={() => dismissToast(toast.id)} className="text-secondary hover:text-primary">
                <X size={14} />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
