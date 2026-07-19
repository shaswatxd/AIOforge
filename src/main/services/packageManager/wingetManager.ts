import { spawn } from 'child_process'
import type {
  IPackageManager,
  InstallHandle,
  PackageProgressUpdate,
  RemotePackageInfo,
  UpgradeCandidate
} from './IPackageManager'
import { ProgressTracker, splitProgressChunk } from './progressParser'

const COMMON_FLAGS = [
  '--accept-package-agreements',
  '--accept-source-agreements',
  '--disable-interactivity',
  '--source',
  'winget'
]

/** Picks the last few meaningful lines out of raw winget output, dropping the
 *  progress-bar noise (spinner/percentage redraws) so the real reason — "already
 *  installed", "no package found matching input criteria", a hash mismatch, etc. —
 *  surfaces in the UI instead of just an opaque exit code. */
export function summarizeWingetOutput(output: string): string {
  const noise = /^[\s\-\\|/█▒░]*\d{0,3}\s*%?[\s\-\\|/█▒░]*$/
  const lines = output
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !noise.test(l))

  return lines.slice(-3).join(' | ').slice(0, 300)
}

function isAlreadyUpToDate(output: string): boolean {
  return /no newer package versions? are available|no applicable upgrade found|no available upgrade found/i.test(
    output
  )
}

function run(args: string[]): Promise<{ stdout: string; code: number }> {
  return new Promise((resolve, reject) => {
    const child = spawn('winget', args, { windowsHide: true })
    let stdout = ''
    child.stdout.on('data', (d) => (stdout += d.toString()))
    child.stderr.on('data', (d) => (stdout += d.toString()))
    child.on('error', reject)
    child.on('close', (code) => resolve({ stdout, code: code ?? 1 }))
  })
}

/** Parses `winget list`/`winget search` table output. winget's column widths vary by
 *  locale/terminal width, so we split on runs of 2+ spaces rather than fixed offsets. */
function parseTable(stdout: string): RemotePackageInfo[] {
  const lines = stdout.split(/\r?\n/).filter((l) => l.trim().length > 0)
  const headerIdx = lines.findIndex((l) => /^Name\s+Id\s+Version/i.test(l.trim()))
  if (headerIdx === -1) return []

  const results: RemotePackageInfo[] = []
  for (let i = headerIdx + 2; i < lines.length; i++) {
    const line = lines[i]
    if (/^-+$/.test(line.trim())) continue
    const cols = line.trim().split(/\s{2,}/)
    if (cols.length >= 3) {
      results.push({ name: cols[0], id: cols[1], version: cols[2] })
    }
  }
  return results
}

export const wingetManager: IPackageManager = {
  id: 'winget',

  async isAvailable(): Promise<boolean> {
    try {
      const { code } = await run(['--version'])
      return code === 0
    } catch {
      return false
    }
  },

  async search(query: string): Promise<RemotePackageInfo[]> {
    const { stdout } = await run(['search', query, '--source', 'winget', '--disable-interactivity'])
    return parseTable(stdout)
  },

  async listInstalled(): Promise<RemotePackageInfo[]> {
    const { stdout } = await run(['list', '--disable-interactivity'])
    return parseTable(stdout)
  },

  async checkUpgrades(): Promise<UpgradeCandidate[]> {
    const { stdout } = await run(['upgrade', '--disable-interactivity'])
    const lines = stdout.split(/\r?\n/).filter((l) => l.trim().length > 0)
    const headerIdx = lines.findIndex((l) => /^Name\s+Id\s+Version\s+Available/i.test(l.trim()))
    if (headerIdx === -1) return []

    const results: UpgradeCandidate[] = []
    for (let i = headerIdx + 2; i < lines.length; i++) {
      const line = lines[i]
      if (/^-+$/.test(line.trim()) || /upgrades available/i.test(line)) continue
      const cols = line.trim().split(/\s{2,}/)
      if (cols.length >= 4) {
        results.push({ name: cols[0], id: cols[1], currentVersion: cols[2], availableVersion: cols[3] })
      }
    }
    return results
  },

  install(
    packageId: string,
    onProgress: (u: PackageProgressUpdate) => void,
    totalBytesHint?: number,
    options?: { installPath?: string; scope?: 'user' | 'machine'; interactive?: boolean }
  ): InstallHandle {
    const args = ['install', '--id', packageId, '-e']
    if (options?.interactive) {
      args.push('--interactive')
    } else {
      args.push('--silent')
    }
    args.push('--accept-package-agreements', '--accept-source-agreements', '--source', 'winget')
    if (!options?.interactive) {
      args.push('--disable-interactivity')
    }
    if (options?.installPath) {
      args.push('--location', options.installPath)
    }
    if (options?.scope) {
      args.push('--scope', options.scope)
    }
    return spawnWithProgress(args, onProgress, totalBytesHint)
  },

  async uninstall(packageId: string): Promise<void> {
    // `winget uninstall` doesn't accept install-time flags like --source or the
    // agreement flags (passing them makes winget print its usage/help and exit
    // non-zero instead of actually uninstalling) — only the flags below are valid here.
    const { code, stdout } = await run(['uninstall', '--id', packageId, '-e', '--silent', '--disable-interactivity'])
    if (code !== 0) {
      const reason = summarizeWingetOutput(stdout)
      throw new Error(reason ? `${reason} (exit ${code})` : `winget uninstall failed (exit ${code})`)
    }
  },

  upgrade(
    packageId: string,
    onProgress: (u: PackageProgressUpdate) => void,
    totalBytesHint?: number,
    options?: { installPath?: string; scope?: 'user' | 'machine'; interactive?: boolean }
  ): InstallHandle {
    const args = ['upgrade', '--id', packageId, '-e']
    if (options?.interactive) {
      args.push('--interactive')
    } else {
      args.push('--silent')
    }
    args.push('--accept-package-agreements', '--accept-source-agreements', '--source', 'winget')
    if (!options?.interactive) {
      args.push('--disable-interactivity')
    }
    if (options?.installPath) {
      args.push('--location', options.installPath)
    }
    if (options?.scope) {
      args.push('--scope', options.scope)
    }
    return spawnWithProgress(args, onProgress, totalBytesHint)
  }
}

function spawnWithProgress(
  args: string[],
  onProgress: (u: PackageProgressUpdate) => void,
  totalBytesHint?: number
): InstallHandle {
  const tracker = new ProgressTracker()
  const child = spawn('winget', args, { windowsHide: true })
  let output = ''
  let lastUpdate: PackageProgressUpdate | null = null

  const handleChunk = (chunk: Buffer) => {
    const text = chunk.toString()
    output += text
    for (const line of splitProgressChunk(text)) {
      const update = tracker.parseLine(line, totalBytesHint ?? 100 * 1024 * 1024)
      if (update) {
        lastUpdate = update
        onProgress(update)
      }
    }
  }

  child.stdout.on('data', handleChunk)
  child.stderr.on('data', handleChunk)

  // Smooth progress simulation fallback:
  // If winget's redirected stdout doesn't emit progress lines, we smoothly update progress
  // up to 90% in the UI, which will immediately jump to 100% on successful completion.
  const startTime = Date.now()
  const bytesPerSecond = 1.5 * 1024 * 1024 // assume 1.5 MB/s speed
  const size = totalBytesHint ?? 50 * 1024 * 1024 // default 50 MB
  const durationSeconds = size / bytesPerSecond

  const timer = setInterval(() => {
    if (lastUpdate && lastUpdate.progress > 0) return
    const elapsed = (Date.now() - startTime) / 1000
    const progress = Math.round(90 * (1 - Math.exp(-elapsed / (durationSeconds / 2))))
    onProgress({
      progress,
      speedBps: Math.round(bytesPerSecond * (0.85 + Math.random() * 0.3)),
      etaSeconds: Math.max(0, Math.round(durationSeconds - elapsed)),
      downloadedBytes: Math.round((progress / 100) * size),
      totalBytes: size,
      logLine: 'Downloading...'
    })
  }, 500)

  const done = new Promise<void>((resolve, reject) => {
    child.on('error', (err) => {
      clearInterval(timer)
      reject(err)
    })
    child.on('close', (code) => {
      clearInterval(timer)
      if (code === 0) return resolve()
      // winget install on an already-installed, up-to-date package auto-attempts an
      // upgrade and exits non-zero when there's nothing newer — that's not a real
      // failure from the user's point of view (the app is already there), so treat it
      // as success rather than surfacing a scary "Failed" badge in the Queue.
      if (isAlreadyUpToDate(output)) return resolve()
      // Otherwise surface winget's actual human-readable reason (hash mismatch, no
      // applicable installer, ...) instead of just the opaque exit code.
      const reason = summarizeWingetOutput(output)
      reject(new Error(reason ? `${reason} (exit ${code})` : `winget exited with code ${code}`))
    })
  })

  return {
    done,
    cancel: () => {
      clearInterval(timer)
      child.kill()
    }
  }
}
