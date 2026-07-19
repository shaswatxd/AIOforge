import { NavLink } from 'react-router-dom'
import {
  Home,
  ListChecks,
  LayoutGrid,
  RefreshCw,
  Trash2,
  Wrench,
  Archive,
  Settings,
  ShieldCheck
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useQueueList } from '../../queries/useQueue'

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/profiles', label: 'Profiles', icon: LayoutGrid },
  { to: '/queue', label: 'Install Queue', icon: ListChecks, showQueueBadge: true },
  { to: '/updates', label: 'Updates', icon: RefreshCw },
  { to: '/uninstall', label: 'Uninstall', icon: Trash2 },
  { to: '/pc-setup', label: 'PC Setup', icon: Wrench },
  { to: '/backup', label: 'Backup', icon: Archive },
  { to: '/admin', label: 'Admin Mode', icon: ShieldCheck },
  { to: '/settings', label: 'Settings', icon: Settings }
]

export function Sidebar() {
  const { data: queue } = useQueueList()
  const activeCount = queue?.filter((q) => q.status === 'downloading' || q.status === 'installing').length ?? 0

  return (
    <aside className="no-drag flex w-56 shrink-0 flex-col gap-1 border-r border-subtle bg-black/[0.02] dark:bg-white/[0.02] p-3">
      <div className="mb-2 px-2 py-1">
        <span className="text-lg font-bold tracking-tight">SetupForge</span>
      </div>
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-fluent px-3 py-2 text-sm font-medium transition-colors',
              isActive ? 'bg-accent text-white' : 'text-primary hover:bg-black/5 dark:hover:bg-white/10'
            )
          }
        >
          <item.icon size={17} />
          <span className="flex-1">{item.label}</span>
          {item.showQueueBadge && activeCount > 0 && (
            <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {activeCount}
            </span>
          )}
        </NavLink>
      ))}
    </aside>
  )
}
