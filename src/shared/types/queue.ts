export type QueueItemStatus =
  | 'queued'
  | 'downloading'
  | 'installing'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled'

export interface QueueItem {
  id: string
  appId: string
  appName: string
  status: QueueItemStatus
  progress: number // 0-100
  speedBps: number
  etaSeconds: number | null
  error?: string
  optionsJson?: Record<string, unknown>
  order: number
  createdAt: string
}

export interface QueueProgressEvent {
  id: string
  status: QueueItemStatus
  progress: number
  speedBps: number
  etaSeconds: number | null
  error?: string
  logLine?: string
}
