import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { QueueItem, QueueProgressEvent } from '@shared/types/queue'
import type { InstallRequest } from '@shared/types/ipc'
import { queryKeys } from '../lib/queryClient'

export function useQueueList() {
  return useQuery({ queryKey: queryKeys.queueList, queryFn: () => window.api.queue.list(), refetchInterval: 5000 })
}

/** Subscribes once to the main process's push-based progress events and merges them
 *  straight into the React Query cache — no polling needed while installs are running. */
export function useQueueProgressSync(): void {
  const qc = useQueryClient()

  useEffect(() => {
    const unsubscribe = window.api.queue.onProgress((event: QueueProgressEvent) => {
      qc.setQueryData<QueueItem[]>(queryKeys.queueList, (current) => {
        if (!current) return current
        return current.map((item) =>
          item.id === event.id
            ? { ...item, status: event.status, progress: event.progress, speedBps: event.speedBps, etaSeconds: event.etaSeconds, error: event.error }
            : item
        )
      })
    })
    return unsubscribe
  }, [qc])
}

export function useAddToQueue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (requests: InstallRequest[]) => window.api.queue.add(requests),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.queueList })
  })
}

function useQueueAction(action: (id: string) => Promise<void>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: action,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.queueList })
  })
}

export function usePauseQueueItem() {
  return useQueueAction((id) => window.api.queue.pause(id))
}
export function useResumeQueueItem() {
  return useQueueAction((id) => window.api.queue.resume(id))
}
export function useCancelQueueItem() {
  return useQueueAction((id) => window.api.queue.cancel(id))
}
export function useRetryQueueItem() {
  return useQueueAction((id) => window.api.queue.retry(id))
}
export function useClearFinishedQueue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => window.api.queue.clearFinished(),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.queueList })
  })
}
