import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryClient'

export function useInstalledApps() {
  return useQuery({ queryKey: queryKeys.installedApps, queryFn: () => window.api.uninstall.detectInstalled() })
}

function useInvalidatingAction(fn: (appId: string) => Promise<unknown>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.installedApps })
  })
}

export function useUninstallApp() {
  return useInvalidatingAction((appId) => window.api.uninstall.uninstall(appId))
}
export function useRepairApp() {
  return useInvalidatingAction((appId) => window.api.uninstall.repair(appId))
}
export function useReinstallApp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (appId: string) => window.api.uninstall.reinstall(appId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.queueList })
  })
}
