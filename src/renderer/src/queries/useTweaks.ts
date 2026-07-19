import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryClient'

export function useTweaks() {
  return useQuery({ queryKey: queryKeys.tweaksList, queryFn: () => window.api.tweaks.list() })
}

export function useApplyTweaks() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => window.api.tweaks.apply(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tweaksList })
  })
}
