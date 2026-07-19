import { spawn } from 'child_process'
import type {
  IPackageManager,
  InstallHandle,
  PackageProgressUpdate,
  RemotePackageInfo,
  UpgradeCandidate
} from './IPackageManager'
import { ProgressTracker, splitProgressChunk } from './progressParser'

/** Same idea as wingetManager's summarizeWingetOutput — pick the last meaningful
 *  lines out of choco's output so the Queue UI shows a real reason, not just an exit code. */
export function summarizeChocoOutput(output: string): string {
  const noise = /^[\s\-\\|/]*\d{0,3}\s*%?[\s\-\\|/]*$/
  const lines = output
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !noise.test(l))

  return lines.slice(-3).join(' | ').slice(0, 300)
}

function run(args: string[]): Promise<{ stdout: string; code: number }> {
  return new Promise((resolve, reject) => {
    const child = spawn('choco', args, { windowsHide: true })
    let stdout = ''
    child.stdout.on('data', (d) => (stdout += d.toString()))
    child.stderr.on('data', (d) => (stdout += d.toString()))
    child.on('error', reject)
    child.on('close', (code) => resolve({ stdout, code: code ?? 1 }))
  })
}

/** Parses `choco search`/`choco list` output — one `id|version` pair per line with --limit-output. */
function parsePipeList(stdout: string): RemotePackageInfo[] {
  return stdout
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.includes('|') && !l.startsWith('Chocolatey'))
    .map((l) => {
      const [id, version] = l.split('|')
      return { id, name: id, version: version ?? 'unknown' }
    })
}

export const chocoManager: IPackageManager = {
  id: 'chocolatey',

  async isAvailable(): Promise<boolean> {
    try {
      const { code } = await run(['--version'])
      return code === 0
    } catch {
      return false
    }
  },

  async search(query: string): Promise<RemotePackageInfo[]> {
    const { stdout } = await run(['search', query, '--limit-output'])
    return parsePipeList(stdout)
  },

  async listInstalled(): Promise<RemotePackageInfo[]> {
    const { stdout } = await run(['list', '--limit-output'])
    return parsePipeList(stdout)
  },

  async checkUpgrades(): Promise<UpgradeCandidate[]> {
    const { stdout } = await run(['outdated', '--limit-output'])
    return stdout
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.includes('|'))
      .map((l) => {
        const [id, current, available] = l.split('|')
        return { id, name: id, currentVersion: current, availableVersion: available }
      })
      .filter((c) => c.currentVersion && c.availableVersion)
  },

  install(
    packageId: string,
    onProgress: (u: PackageProgressUpdate) => void,
    totalBytesHint?: number,
    options?: { installPath?: string; scope?: 'user' | 'machine'; interactive?: boolean }
  ): InstallHandle {
    const args = ['install', packageId, '--no-progress']
    if (!options?.interactive) {
      args.push('-y')
    }
    if (options?.installPath) {
      args.push('--install-directory', options.installPath)
    }
    return spawnWithProgress(args, onProgress, totalBytesHint)
  },

  async uninstall(packageId: string): Promise<void> {
    const { code, stdout } = await run(['uninstall', packageId, '-y'])
    if (code !== 0) throw new Error(`choco uninstall failed (exit ${code}): ${stdout.slice(-500)}`)
  },

  upgrade(
    packageId: string,
    onProgress: (u: PackageProgressUpdate) => void,
    totalBytesHint?: number,
    options?: { installPath?: string; scope?: 'user' | 'machine'; interactive?: boolean }
  ): InstallHandle {
    const args = ['upgrade', packageId, '--no-progress']
    if (!options?.interactive) {
      args.push('-y')
    }
    if (options?.installPath) {
      args.push('--install-directory', options.installPath)
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
  const child = spawn('choco', args, {
    windowsHide: true
  })

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
  // If choco's redirected stdout doesn't emit progress lines, we smoothly update progress
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
      const reason = summarizeChocoOutput(output)
      reject(new Error(reason ? `${reason} (exit ${code})` : `choco exited with code ${code}`))
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
