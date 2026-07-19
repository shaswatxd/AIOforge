import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
})

/** Central place naming every query key used across the app so invalidations
 *  (e.g. after a mutation) can't drift out of sync with the keys queries subscribe to. */
export const queryKeys = {
  catalogList: (filters?: unknown) => ['catalog', 'list', filters] as const,
  catalogGet: (id: string) => ['catalog', 'get', id] as const,
  categories: ['catalog', 'categories'] as const,
  favorites: ['catalog', 'favorites'] as const,
  recommended: ['catalog', 'recommended'] as const,
  queueList: ['queue', 'list'] as const,
  profilesList: ['profiles', 'list'] as const,
  profileGet: (id: string) => ['profiles', 'get', id] as const,
  community: ['profiles', 'community'] as const,
  updatesScan: ['updates', 'scan'] as const,
  installedApps: ['uninstall', 'detectInstalled'] as const,
  tweaksList: ['tweaks', 'list'] as const,
  settings: ['settings'] as const,
  packageManagerAvailability: ['settings', 'packageManagerAvailability'] as const
}
