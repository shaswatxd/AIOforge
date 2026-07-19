import type { AppDefinition } from '@shared/types/catalog'
import { AppCard } from './AppCard'

export function AppRail({ title, apps }: { title: string; apps: AppDefinition[] }) {
  if (apps.length === 0) return null

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {apps.map((app) => (
          <div key={app.id} className="w-72 shrink-0">
            <AppCard app={app} />
          </div>
        ))}
      </div>
    </section>
  )
}
