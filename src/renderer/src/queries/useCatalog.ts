import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CatalogFilters } from '@shared/types/catalog'
import { queryKeys } from '../lib/queryClient'

export function useCatalogList(filters?: Partial<CatalogFilters>) {
  return useQuery({
    queryKey: queryKeys.catalogList(filters),
    queryFn: () => window.api.catalog.list(filters)
  })
}

export function useCatalogApp(appId: string | null) {
  return useQuery({
    queryKey: queryKeys.catalogGet(appId ?? ''),
    queryFn: () => window.api.catalog.get(appId as string),
    enabled: !!appId
  })
}

export function useCategories() {
  return useQuery({ queryKey: queryKeys.categories, queryFn: () => window.api.catalog.categories() })
}

export function useFavorites() {
  return useQuery({ queryKey: queryKeys.favorites, queryFn: () => window.api.catalog.favorites() })
}

export function useToggleFavorite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (appId: string) => window.api.catalog.toggleFavorite(appId),
    onSuccess: (favorites) => qc.setQueryData(queryKeys.favorites, favorites)
  })
}

export function useRecommended() {
  return useQuery({ queryKey: queryKeys.recommended, queryFn: () => window.api.catalog.recommended() })
}
