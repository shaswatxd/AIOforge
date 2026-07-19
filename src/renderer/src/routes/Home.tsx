import { useMemo, useState, useEffect } from 'react'
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
  const openAppDetail = useUiStore((s) => s.openAppDetail)
  const pushToast = useUiStore((s) => s.pushToast)

  const [onlineResults, setOnlineResults] = useState<any[]>([])
  const [isSearchingOnline, setIsSearchingOnline] = useState(false)
  const [searchTriggered, setSearchTriggered] = useState(false)

  useEffect(() => {
    setOnlineResults([])
    setSearchTriggered(false)
  }, [filters.query])

  const handleOnlineSearch = async () => {
    if (!filters.query) return
    setIsSearchingOnline(true)
    setSearchTriggered(true)
    try {
      const results = await window.api.catalog.searchOnline(filters.query)
      setOnlineResults(results)
    } catch (err) {
      pushToast('Online search failed', 'error')
    } finally {
      setIsSearchingOnline(false)
    }
  }

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

          {filters.query && (
            <div className="mt-6 border-t border-subtle pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold">Online Repositories</h3>
                  <p className="text-xs text-secondary">Search the full Winget and Chocolatey online package repositories for "{filters.query}".</p>
                </div>
                <button
                  onClick={handleOnlineSearch}
                  disabled={isSearchingOnline}
                  className="flex items-center gap-2 rounded-fluent bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
                >
                  {isSearchingOnline ? 'Searching...' : 'Search Online'}
                </button>
              </div>

              {onlineResults.length > 0 ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {onlineResults.map((pkg) => (
                    <div key={`${pkg.source}:${pkg.id}`} className="acrylic flex items-center justify-between gap-3 rounded-fluent-lg border border-subtle p-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold truncate">{pkg.name}</span>
                        </div>
                        <div className="text-xs text-secondary truncate mt-0.5">{pkg.id}</div>
                        <div className="text-xs text-secondary mt-0.5">Version: {pkg.version}</div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="rounded bg-black/5 dark:bg-white/10 px-2 py-0.5 text-[10px] uppercase font-semibold text-secondary">
                          {pkg.source}
                        </span>
                        <button
                          onClick={() => openAppDetail(`${pkg.source}:${pkg.id}`)}
                          className="rounded-fluent bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover whitespace-nowrap"
                        >
                          Configure &amp; Install
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                searchTriggered && !isSearchingOnline && (
                  <div className="text-sm text-secondary text-center py-4">No online packages found matching "{filters.query}".</div>
                )
              )}
            </div>
          )}
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
