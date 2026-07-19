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
function summarizeWingetOutput(output: string): string {
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

  install(packageId: string, onProgress: (u: PackageProgressUpdate) => void): InstallHandle {
    return spawnWithProgress(['install', '--id', packageId, '-e', '--silent', ...COMMON_FLAGS], onProgress)
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

  upgrade(packageId: string, onProgress: (u: PackageProgressUpdate) => void): InstallHandle {
    return spawnWithProgress(['upgrade', '--id', packageId, '-e', '--silent', ...COMMON_FLAGS], onProgress)
  }
}

function spawnWithProgress(args: string[], onProgress: (u: PackageProgressUpdate) => void): InstallHandle {
  const tracker = new ProgressTracker()
  const child = spawn('winget', args, { windowsHide: true })
  let output = ''

  const handleChunk = (chunk: Buffer) => {
    const text = chunk.toString()
    output += text
    for (const line of splitProgressChunk(text)) {
      const update = tracker.parseLine(line, 100 * 1024 * 1024) // heuristic size hint; winget rarely reports totals up front
      if (update) onProgress(update)
    }
  }

  child.stdout.on('data', handleChunk)
  child.stderr.on('data', handleChunk)

  const done = new Promise<void>((resolve, reject) => {
    child.on('error', reject)
    child.on('close', (code) => {
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
    cancel: () => child.kill()
  }
}
