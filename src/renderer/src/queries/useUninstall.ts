import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UninstallTarget } from '@shared/types/system'
import { queryKeys } from '../lib/queryClient'

export function useInstalledApps() {
  return useQuery({ queryKey: queryKeys.installedApps, queryFn: () => window.api.uninstall.detectInstalled() })
}

function useInvalidatingAction(fn: (target: UninstallTarget) => Promise<unknown>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.installedApps })
  })
}

export function useUninstallApp() {
  return useInvalidatingAction((target) => window.api.uninstall.uninstall(target))
}
export function useRepairApp() {
  return useInvalidatingAction((target) => window.api.uninstall.repair(target))
}
export function useReinstallApp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (target: UninstallTarget) => window.api.uninstall.reinstall(target),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.queueList })
  })
}
