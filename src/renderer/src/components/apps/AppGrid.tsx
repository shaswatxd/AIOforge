import type { AppDefinition } from '@shared/types/catalog'
import { AppCard } from './AppCard'

export function AppGrid({ apps, emptyLabel = 'No apps found' }: { apps: AppDefinition[]; emptyLabel?: string }) {
  if (apps.length === 0) {
    return <div className="flex h-40 items-center justify-center text-sm text-secondary">{emptyLabel}</div>
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {apps.map((app) => (
        <AppCard key={app.id} app={app} />
      ))}
    </div>
  )
}
