import { useMemo } from 'react'
import { ListChecks, Download, PackageCheck, RefreshCw } from 'lucide-react'
import { SearchBar } from '../components/common/SearchBar'
import { CategoryChip } from '../components/common/CategoryChip'
import { AppRail } from '../components/apps/AppRail'
import { AppGrid } from '../components/apps/AppGrid'
import { QuickStatCard } from '../components/common/QuickStatCard'
import { useCatalogList, useCategories, useRecommended } from '../queries/useCatalog'
import { useQueueList } from '../queries/useQueue'
import { useInstalledApps } from '../queries/useUninstall'
import { useUpdatesScan } from '../queries/useUpdates'
import { useUiStore } from '../state/uiStore'
import type { CatalogFilters } from '@shared/types/catalog'

const SORT_OPTIONS: { value: CatalogFilters['sort']; label: string }[] = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'name', label: 'Name' },
  { value: 'recent', label: 'Recently Added' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'size', label: 'Smallest First' }
]

export function Home() {
  const filters = useUiStore((s) => s.filters)
  const setCategory = useUiStore((s) => s.setCategory)
  const setSort = useUiStore((s) => s.setSort)

  const { data: categories } = useCategories()
  const { data: allApps, isLoading } = useCatalogList(filters)
  const { data: recommended } = useRecommended()
  const { data: queue } = useQueueList()
  const { data: installed } = useInstalledApps()
  const { data: updateScan } = useUpdatesScan()

  const isBrowsing = filters.query.length > 0 || filters.category !== 'all'

  const featured = useMemo(() => allApps?.filter((a) => a.stats.featured) ?? [], [allApps])
  const popular = useMemo(() => allApps?.filter((a) => a.stats.popular) ?? [], [allApps])
  const recent = useMemo(
    () => [...(allApps ?? [])].sort((a, b) => (a.stats.addedAt < b.stats.addedAt ? 1 : -1)).slice(0, 8),
    [allApps]
  )

  const activeDownloads = queue?.filter((q) => q.status === 'downloading' || q.status === 'installing').length ?? 0
  const queuedCount = queue?.filter((q) => q.status === 'queued').length ?? 0

  return (
    <div className="flex flex-col gap-8 p-6">
      <div className="flex items-center gap-3">
        <SearchBar />
        <select
          value={filters.sort}
          onChange={(e) => setSort(e.target.value as CatalogFilters['sort'])}
          className="no-drag rounded-fluent border border-subtle bg-transparent px-3 py-2 text-sm outline-none"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <QuickStatCard to="/queue" icon={ListChecks} label="In Queue" value={queuedCount} />
        <QuickStatCard to="/queue" icon={Download} label="Downloading" value={activeDownloads} accent />
        <QuickStatCard to="/uninstall" icon={PackageCheck} label="Installed Apps" value={installed?.length ?? 0} />
        <QuickStatCard to="/updates" icon={RefreshCw} label="Updates Available" value={updateScan?.apps.length ?? 0} />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <CategoryChip icon="LayoutGrid" label="All" active={filters.category === 'all'} onClick={() => setCategory('all')} />
        {categories?.map((cat) => (
          <CategoryChip
            key={cat.id}
            icon={cat.icon}
            label={cat.name}
            count={cat.count}
            active={filters.category === cat.id}
            onClick={() => setCategory(cat.id)}
          />
        ))}
      </div>

      {isBrowsing ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">
            {filters.query ? `Results for "${filters.query}"` : 'Browse'} · {allApps?.length ?? 0} apps
          </h2>
          {isLoading ? <div className="text-sm text-secondary">Loading…</div> : <AppGrid apps={allApps ?? []} />}
        </section>
      ) : (
        <>
          <AppRail title="Featured Apps" apps={featured} />
          <AppRail title="Recommended For You" apps={recommended ?? []} />
          <AppRail title="Popular Apps" apps={popular} />
          <AppRail title="Recently Added" apps={recent} />
          <section className="flex flex-col gap-3">
            <h2 className="text-base font-semibold">All Apps</h2>
            <AppGrid apps={allApps ?? []} />
          </section>
        </>
      )}
    </div>
  )
}
