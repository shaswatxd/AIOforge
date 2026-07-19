import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryClient'

export function useUpdatesScan() {
  return useQuery({ queryKey: queryKeys.updatesScan, queryFn: () => window.api.updates.scan(), staleTime: 60_000 })
}

export function useUpdateSelected() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (appIds: string[]) => window.api.updates.updateSelected(appIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.queueList })
  })
}

export function useUpdateAll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => window.api.updates.updateAll(),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.queueList })
  })
}
