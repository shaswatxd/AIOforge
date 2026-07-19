import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AppSettings } from '@shared/types/settings'
import { queryKeys } from '../lib/queryClient'

export function useSettings() {
  return useQuery({ queryKey: queryKeys.settings, queryFn: () => window.api.settings.get() })
}

export function useSetSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (patch: Partial<AppSettings>) => window.api.settings.set(patch),
    onSuccess: (settings) => qc.setQueryData(queryKeys.settings, settings)
  })
}

export function usePackageManagerAvailability() {
  return useQuery({
    queryKey: queryKeys.packageManagerAvailability,
    queryFn: () => window.api.settings.packageManagerAvailability(),
    staleTime: 5 * 60_000
  })
}
