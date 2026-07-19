import { EventEmitter } from 'events'
import { randomUUID } from 'crypto'
import type { QueueItem, QueueProgressEvent } from '@shared/types/queue'
import { APPS } from '@shared/catalog/apps'
import { queueRepo } from '../db/repositories/queue.repo'
import { installedAppsRepo } from '../db/repositories/installedApps.repo'
import { historyRepo } from '../db/repositories/history.repo'
import { settingsRepo } from '../db/repositories/settings.repo'
import { resolveManagerForApp, packageIdFor } from './packageManager/packageManagerRouter'
import { wingetManager } from './packageManager/wingetManager'
import { chocoManager } from './packageManager/chocoManager'
import type { InstallHandle } from './packageManager/IPackageManager'

export interface InstallRequest {
  appId: string
  options?: Record<string, unknown>
}

export interface UpgradeTarget {
  /** Catalog app id, when this package happens to be one we curate. */
  appId: string | null
  /** Real winget/choco package id — always present, used directly when appId is null. */
  packageId: string
  name: string
  source: 'winget' | 'chocolatey'
  newVersion: string
}

interface ActiveJob {
  handle: InstallHandle
  historyId: string
  pausedByUser: boolean
  cancelledByUser: boolean
}

/** Orchestrates the install queue: enforces concurrency, drives progress events, and
 *  implements pause/resume by killing and later re-spawning the underlying CLI process —
 *  winget/choco expose no true suspend, so a "paused" item simply waits as status='paused'
 *  and restarts from scratch on resume (packages are re-downloaded; see README). */
class InstallQueueManager extends EventEmitter {
  private active = new Map<string, ActiveJob>()

  list(): QueueItem[] {
    return queueRepo.all()
  }

  add(requests: InstallRequest[]): QueueItem[] {
    return this.enqueue(requests, 'install')
  }

  /** Same queue/concurrency machinery as add(), but drives manager.upgrade() instead of
   *  manager.install() — used by the Update Manager. The action is stashed in optionsJson
   *  under an internal key rather than a new DB column, since it's the only extra bit needed. */
  addUpgrades(appIds: string[]): QueueItem[] {
    return this.enqueue(
      appIds.map((appId) => ({ appId })),
      'upgrade'
    )
  }

  /** Like addUpgrades(), but works for ANY real update/app winget/Chocolatey reports —
   *  not just apps that happen to be in our curated catalog. processNext() falls back to
   *  the raw packageId/source stashed here when a target has no catalog appId. Used by
   *  both the Update Manager (action='upgrade') and non-catalog reinstalls (action='install'). */
  addPackageTargets(targets: UpgradeTarget[], action: 'install' | 'upgrade' = 'upgrade'): QueueItem[] {
    const created: QueueItem[] = []
    const activeIds = new Set(
      queueRepo
        .all()
        .filter((i) => ['queued', 'downloading', 'installing', 'paused'].includes(i.status))
        .map((i) => i.appId)
    )
    for (const t of targets) {
      const targetId = t.appId ?? t.packageId
      if (activeIds.has(targetId)) continue
      const item: QueueItem = {
        id: randomUUID(),
        appId: targetId,
        appName: t.name,
        status: 'queued',
        progress: 0,
        speedBps: 0,
        etaSeconds: null,
        optionsJson: {
          __action: action,
          __packageId: t.packageId,
          __source: t.source,
          __newVersion: t.newVersion
        },
        order: queueRepo.nextOrder(),
        createdAt: new Date().toISOString()
      }
      queueRepo.insert(item)
      created.push(item)
    }
    void this.processNext()
    return created
  }

  addUpgradeTargets(targets: UpgradeTarget[]): QueueItem[] {
    return this.addPackageTargets(targets, 'upgrade')
  }

  private enqueue(requests: InstallRequest[], action: 'install' | 'upgrade'): QueueItem[] {
    const created: QueueItem[] = []
    const activeIds = new Set(
      queueRepo
        .all()
        .filter((i) => ['queued', 'downloading', 'installing', 'paused'].includes(i.status))
        .map((i) => i.appId)
    )
    for (const req of requests) {
      if (activeIds.has(req.appId)) continue
      const app = APPS.find((a) => a.id === req.appId)
      if (!app) {
        if (req.appId.startsWith('winget:') || req.appId.startsWith('chocolatey:')) {
          const [source, pkgId] = req.appId.split(':')
          const item: QueueItem = {
            id: randomUUID(),
            appId: req.appId,
            appName: pkgId,
            status: 'queued',
            progress: 0,
            speedBps: 0,
            etaSeconds: null,
            optionsJson: {
              ...req.options,
              __action: action,
              __packageId: pkgId,
              __source: source
            },
            order: queueRepo.nextOrder(),
            createdAt: new Date().toISOString()
          }
          queueRepo.insert(item)
          created.push(item)
        }
        continue
      }
      const item: QueueItem = {
        id: randomUUID(),
        appId: app.id,
        appName: app.name,
        status: 'queued',
        progress: 0,
        speedBps: 0,
        etaSeconds: null,
        optionsJson: { ...req.options, __action: action },
        order: queueRepo.nextOrder(),
        createdAt: new Date().toISOString()
      }
      queueRepo.insert(item)
      created.push(item)
    }
    void this.processNext()
    return created
  }

  pause(id: string): void {
    const job = this.active.get(id)
    if (job) {
      job.pausedByUser = true
      job.handle?.cancel()
      return
    }
    const item = queueRepo.get(id)
    if (item && item.status === 'queued') {
      queueRepo.update(id, { status: 'paused' })
      this.emitProgress({ id, status: 'paused', progress: item.progress, speedBps: 0, etaSeconds: null })
    }
  }

  resume(id: string): void {
    const item = queueRepo.get(id)
    if (!item || item.status !== 'paused') return
    queueRepo.update(id, { status: 'queued', progress: 0 })
    this.emitProgress({ id, status: 'queued', progress: 0, speedBps: 0, etaSeconds: null })
    void this.processNext()
  }

  cancel(id: string): void {
    const job = this.active.get(id)
    if (job) {
      job.cancelledByUser = true
      job.handle?.cancel()
      return
    }
    const item = queueRepo.get(id)
    if (item) {
      queueRepo.update(id, { status: 'cancelled' })
      this.emitProgress({ id, status: 'cancelled', progress: item.progress, speedBps: 0, etaSeconds: null })
    }
  }

  retry(id: string): void {
    const item = queueRepo.get(id)
    if (!item || !['failed', 'cancelled'].includes(item.status)) return
    queueRepo.update(id, { status: 'queued', progress: 0, error: undefined })
    this.emitProgress({ id, status: 'queued', progress: 0, speedBps: 0, etaSeconds: null })
    void this.processNext()
  }

  clearFinished(): void {
    queueRepo.clearFinished()
  }

  onProgress(cb: (event: QueueProgressEvent) => void): () => void {
    this.on('progress', cb)
    return () => this.off('progress', cb)
  }

  private emitProgress(event: QueueProgressEvent): void {
    this.emit('progress', event)
  }

  private async processNext(): Promise<void> {
    const concurrency = settingsRepo.getAll().queueConcurrency
    if (this.active.size >= concurrency) return

    const next = queueRepo.all().find((i) => i.status === 'queued' && !this.active.has(i.id))
    if (!next) return

    const app = APPS.find((a) => a.id === next.appId)
    // Upgrades queued via addUpgradeTargets() for apps outside the catalog carry the
    // real winget/choco id + source directly — that's the only way to act on the other
    // ~90% of what a system update scan finds that we don't have curated metadata for.
    const overridePackageId = next.optionsJson?.__packageId as string | undefined
    const overrideSource = next.optionsJson?.__source as 'winget' | 'chocolatey' | undefined

    if (!app && !overridePackageId) {
      queueRepo.update(next.id, { status: 'failed', error: 'App not found in catalog' })
      this.emitProgress({ id: next.id, status: 'failed', progress: 0, speedBps: 0, etaSeconds: null, error: 'App not found' })
      void this.processNext()
      return
    }

    const action: 'install' | 'upgrade' = next.optionsJson?.__action === 'upgrade' ? 'upgrade' : 'install'
    const historyId = historyRepo.add({
      appId: next.appId,
      action: action === 'upgrade' ? 'update' : 'install',
      status: 'started',
      startedAt: new Date().toISOString()
    })
    const job: ActiveJob = { handle: undefined as unknown as InstallHandle, pausedByUser: false, cancelledByUser: false, historyId }
    // Reserve the concurrency slot synchronously (before any await) so concurrent
    // processNext() calls can't both pass the concurrency check for the same slot.
    this.active.set(next.id, job)

    try {
      const manager = app ? await resolveManagerForApp(app) : overrideSource === 'chocolatey' ? chocoManager : wingetManager
      const pkgId = app ? packageIdFor(app, manager) : overridePackageId!
      const totalBytesHint = app ? app.stats.downloadSizeMb * 1024 * 1024 : 100 * 1024 * 1024

      queueRepo.update(next.id, { status: 'downloading', progress: 0 })
      this.emitProgress({ id: next.id, status: 'downloading', progress: 0, speedBps: 0, etaSeconds: null })

      const opt = next.optionsJson
        ? {
            installPath: next.optionsJson.installPath as string | undefined,
            scope: next.optionsJson.scope as 'user' | 'machine' | undefined,
            interactive: next.optionsJson.interactive as boolean | undefined
          }
        : undefined

      const spawnInstall = action === 'upgrade' ? manager.upgrade : manager.install
      const handle = spawnInstall(pkgId, (u) => {
        const status = u.progress >= 100 ? 'installing' : 'downloading'
        queueRepo.update(next.id, {
          status,
          progress: u.progress,
          speedBps: u.speedBps,
          etaSeconds: u.etaSeconds,
          downloadedBytes: u.downloadedBytes,
          totalBytes: u.totalBytes
        })
        this.emitProgress({
          id: next.id,
          status,
          progress: u.progress,
          speedBps: u.speedBps,
          etaSeconds: u.etaSeconds,
          downloadedBytes: u.downloadedBytes,
          totalBytes: u.totalBytes,
          logLine: u.logLine
        })
      }, totalBytesHint, opt)
      job.handle = handle
      // Pause/cancel may have been requested while we were still resolving the package
      // manager (before a real process existed to kill) — honor it now.
      if (job.pausedByUser || job.cancelledByUser) handle.cancel()

      await handle.done

      const existing = queueRepo.get(next.id)
      const finalTotal = existing?.totalBytes ?? totalBytesHint
      queueRepo.update(next.id, { status: 'completed', progress: 100, downloadedBytes: finalTotal, totalBytes: finalTotal })
      this.emitProgress({ id: next.id, status: 'completed', progress: 100, speedBps: 0, etaSeconds: 0, downloadedBytes: finalTotal, totalBytes: finalTotal })
      historyRepo.finish(historyId, 'success')
      installedAppsRepo.upsert({
        appId: next.appId,
        packageId: pkgId,
        name: app?.name ?? next.appName,
        version: app?.stats.latestVersion ?? ((next.optionsJson?.__newVersion as string) || 'unknown'),
        installedAt: new Date().toISOString(),
        source: manager.id === 'winget' ? 'winget' : 'chocolatey'
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (job.pausedByUser) {
        queueRepo.update(next.id, { status: 'paused' })
        this.emitProgress({ id: next.id, status: 'paused', progress: 0, speedBps: 0, etaSeconds: null })
      } else if (job.cancelledByUser) {
        queueRepo.update(next.id, { status: 'cancelled' })
        this.emitProgress({ id: next.id, status: 'cancelled', progress: 0, speedBps: 0, etaSeconds: null })
        historyRepo.finish(historyId, 'failed', 'Cancelled by user')
      } else {
        queueRepo.update(next.id, { status: 'failed', error: message })
        this.emitProgress({ id: next.id, status: 'failed', progress: 0, speedBps: 0, etaSeconds: null, error: message })
        historyRepo.finish(historyId, 'failed', message)
      }
    } finally {
      this.active.delete(next.id)
      void this.processNext()
    }
  }
}

export const installQueueManager = new InstallQueueManager()
