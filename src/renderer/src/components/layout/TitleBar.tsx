import { useState, useEffect } from 'react'
import { Minus, Square, X, Sun, Moon, Monitor, ShieldCheck, ShieldAlert } from 'lucide-react'
import { useSettings, useSetSettings } from '../../queries/useSettings'
import { cn } from '../../lib/utils'
import type { ThemeMode } from '@shared/types/settings'

const THEME_ICONS: Record<ThemeMode, typeof Sun> = { light: Sun, dark: Moon, system: Monitor }

export function TitleBar() {
  const { data: settings } = useSettings()
  const setSettings = useSetSettings()
  const [isMaximized, setIsMaximized] = useState(false)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    window.api.system.isAdmin().then(setIsAdmin).catch(() => setIsAdmin(false))
  }, [])

  const cycleTheme = () => {
    const order: ThemeMode[] = ['system', 'light', 'dark']
    const current = settings?.theme ?? 'system'
    const next = order[(order.indexOf(current) + 1) % order.length]
    setSettings.mutate({ theme: next })
  }

  const ThemeIcon = THEME_ICONS[settings?.theme ?? 'system']

  return (
    <div className="drag flex h-9 shrink-0 items-center justify-between border-b border-subtle bg-black/[0.03] dark:bg-black/20 px-3">
      <div className="flex items-center gap-2 text-xs text-secondary">
        <span className="font-semibold text-primary">AIOforge</span>
        {isAdmin === true && (
          <span className="no-drag flex items-center gap-1 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            <ShieldCheck size={11} /> Administrator
          </span>
        )}
        {isAdmin === false && (
          <button
            onClick={() => window.api.system.relaunchAsAdmin()}
            title="Click to relaunch AIOforge with Administrator privileges"
            className="no-drag flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 hover:bg-amber-500/25 dark:text-amber-400"
          >
            <ShieldAlert size={11} /> Run as Admin
          </button>
        )}
      </div>
      <div className="no-drag flex items-center gap-1">
        <button
          onClick={cycleTheme}
          title={`Theme: ${settings?.theme ?? 'system'}`}
          className="flex h-7 w-7 items-center justify-center rounded text-secondary hover:bg-black/5 dark:hover:bg-white/10 hover:text-primary"
        >
          <ThemeIcon size={14} />
        </button>
        <button
          onClick={() => window.windowControls.minimize()}
          className="flex h-7 w-7 items-center justify-center rounded text-secondary hover:bg-black/5 dark:hover:bg-white/10 hover:text-primary"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={async () => {
            await window.windowControls.maximizeToggle()
            setIsMaximized(await window.windowControls.isMaximized())
          }}
          className="flex h-7 w-7 items-center justify-center rounded text-secondary hover:bg-black/5 dark:hover:bg-white/10 hover:text-primary"
        >
          <Square size={12} className={cn(isMaximized && 'scale-90')} />
        </button>
        <button
          onClick={() => window.windowControls.close()}
          className="flex h-7 w-7 items-center justify-center rounded text-secondary hover:bg-rose-500 hover:text-white"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  )
}
