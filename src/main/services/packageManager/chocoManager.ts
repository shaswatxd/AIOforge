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

  install(packageId: string, onProgress: (u: PackageProgressUpdate) => void, totalBytesHint?: number): InstallHandle {
    return spawnWithProgress(['install', packageId, '-y', '--no-progress'], onProgress, totalBytesHint)
  },

  async uninstall(packageId: string): Promise<void> {
    const { code, stdout } = await run(['uninstall', packageId, '-y'])
    if (code !== 0) throw new Error(`choco uninstall failed (exit ${code}): ${stdout.slice(-500)}`)
  },

  upgrade(packageId: string, onProgress: (u: PackageProgressUpdate) => void, totalBytesHint?: number): InstallHandle {
    return spawnWithProgress(['upgrade', packageId, '-y', '--no-progress'], onProgress, totalBytesHint)
  }
}

function spawnWithProgress(
  args: string[],
  onProgress: (u: PackageProgressUpdate) => void,
  totalBytesHint?: number
): InstallHandle {
  const tracker = new ProgressTracker()
  // choco's own progress bar is disabled (--no-progress) so we drive percentage from
  // its "Progress: Downloading ... 45%" status lines instead, which are newline-terminated.
  const child = spawn('choco', args.filter((a) => a !== '--no-progress').concat(['--limit-output']), {
    windowsHide: true
  })

  let output = ''
  const handleChunk = (chunk: Buffer) => {
    const text = chunk.toString()
    output += text
    for (const line of splitProgressChunk(text)) {
      const update = tracker.parseLine(line, totalBytesHint ?? 100 * 1024 * 1024)
      if (update) onProgress(update)
    }
  }

  child.stdout.on('data', handleChunk)
  child.stderr.on('data', handleChunk)

  const done = new Promise<void>((resolve, reject) => {
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) return resolve()
      const reason = summarizeChocoOutput(output)
      reject(new Error(reason ? `${reason} (exit ${code})` : `choco exited with code ${code}`))
    })
  })

  return {
    done,
    cancel: () => child.kill()
  }
}
