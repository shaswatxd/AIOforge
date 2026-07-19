import type { PackageProgressUpdate } from './IPackageManager'

export class ProgressTracker {
  private lastPercent = 0
  private lastSampleTime = Date.now()
  private lastSamplePercent = 0
  private smoothedSpeedBps = 0
  private totalBytes: number | null = null

  /** Parses a single line of winget/choco output. Returns null if the line carries no
   *  progress signal (most lines don't — only the carriage-return progress bar does). */
  parseLine(line: string, totalBytesHint?: number): PackageProgressUpdate | null {
    const percentMatch = line.match(/(\d{1,3})\s*%/)
    const sizeMatch = line.match(/([\d.]+)\s*(B|KB|MB|GB|TB)\s*(?:\/|of|out of)\s*([\d.]+)\s*(B|KB|MB|GB|TB)/i)

    let percent: number | null = null
    let downloadedBytes: number | null = null
    let total: number | null = null

    if (sizeMatch) {
      downloadedBytes = toBytes(parseFloat(sizeMatch[1]), sizeMatch[2])
      this.totalBytes = toBytes(parseFloat(sizeMatch[3]), sizeMatch[4])
      total = this.totalBytes
      if (total > 0) percent = Math.min(100, Math.round((downloadedBytes / total) * 100))
    } else if (percentMatch) {
      percent = Math.min(100, Math.max(0, parseInt(percentMatch[1], 10)))
      total = this.totalBytes ?? totalBytesHint ?? null
      if (total && total > 0) {
        downloadedBytes = Math.round((percent / 100) * total)
      }
    }

    if (percent === null) return null

    const now = Date.now()
    const dt = (now - this.lastSampleTime) / 1000
    const dPercent = percent - this.lastSamplePercent

    const activeTotalBytes = total ?? totalBytesHint
    if (dt > 0.15 && dPercent > 0 && activeTotalBytes) {
      const bytesDelta = (dPercent / 100) * activeTotalBytes
      const instantSpeed = bytesDelta / dt
      this.smoothedSpeedBps = this.smoothedSpeedBps === 0 ? instantSpeed : this.smoothedSpeedBps * 0.6 + instantSpeed * 0.4
      this.lastSampleTime = now
      this.lastSamplePercent = percent
    }

    this.lastPercent = percent
    const remainingPercent = 100 - percent
    const etaSeconds =
      this.smoothedSpeedBps > 0 && activeTotalBytes
        ? Math.round(((remainingPercent / 100) * activeTotalBytes) / this.smoothedSpeedBps)
        : null

    return {
      progress: percent,
      speedBps: Math.round(this.smoothedSpeedBps),
      etaSeconds,
      downloadedBytes,
      totalBytes: total,
      logLine: line.trim()
    }
  }

  get current(): number {
    return this.lastPercent
  }
}

function toBytes(value: number, unit: string): number {
  const mult = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4 }[unit.toUpperCase()] ?? 1
  return value * mult
}

/** Splits a raw stdout chunk into logical progress lines — winget/choco redraw their
 *  progress bar using carriage returns rather than newlines. */
export function splitProgressChunk(chunk: string): string[] {
  return chunk.split(/\r\n|\r|\n/).filter((l) => l.trim().length > 0)
}
