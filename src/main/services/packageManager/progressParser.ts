import type { PackageProgressUpdate } from './IPackageManager'

/** Tracks byte/percentage progress across a stream of CLI output lines and derives
 *  download speed + ETA from wall-clock deltas between updates. */
export class ProgressTracker {
  private lastPercent = 0
  private lastSampleTime = Date.now()
  private lastSamplePercent = 0
  private smoothedSpeedBps = 0

  /** Parses a single line of winget/choco output. Returns null if the line carries no
   *  progress signal (most lines don't — only the carriage-return progress bar does). */
  parseLine(line: string, totalBytesHint?: number): PackageProgressUpdate | null {
    const percentMatch = line.match(/(\d{1,3})\s*%/)
    const sizeMatch = line.match(/([\d.]+)\s*(KB|MB|GB)\s*\/\s*([\d.]+)\s*(KB|MB|GB)/i)

    let percent: number | null = null
    if (percentMatch) {
      percent = Math.min(100, Math.max(0, parseInt(percentMatch[1], 10)))
    } else if (sizeMatch) {
      const done = toBytes(parseFloat(sizeMatch[1]), sizeMatch[2])
      const total = toBytes(parseFloat(sizeMatch[3]), sizeMatch[4])
      if (total > 0) percent = Math.min(100, Math.round((done / total) * 100))
    }

    if (percent === null) return null

    const now = Date.now()
    const dt = (now - this.lastSampleTime) / 1000
    const dPercent = percent - this.lastSamplePercent

    if (dt > 0.15 && dPercent > 0 && totalBytesHint) {
      const bytesDelta = (dPercent / 100) * totalBytesHint
      const instantSpeed = bytesDelta / dt
      this.smoothedSpeedBps = this.smoothedSpeedBps === 0 ? instantSpeed : this.smoothedSpeedBps * 0.6 + instantSpeed * 0.4
      this.lastSampleTime = now
      this.lastSamplePercent = percent
    }

    this.lastPercent = percent
    const remainingPercent = 100 - percent
    const etaSeconds =
      this.smoothedSpeedBps > 0 && totalBytesHint
        ? Math.round(((remainingPercent / 100) * totalBytesHint) / this.smoothedSpeedBps)
        : null

    return {
      progress: percent,
      speedBps: Math.round(this.smoothedSpeedBps),
      etaSeconds,
      logLine: line.trim()
    }
  }

  get current(): number {
    return this.lastPercent
  }
}

function toBytes(value: number, unit: string): number {
  const mult = { KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3 }[unit.toUpperCase()] ?? 1
  return value * mult
}

/** Splits a raw stdout chunk into logical progress lines — winget/choco redraw their
 *  progress bar using carriage returns rather than newlines. */
export function splitProgressChunk(chunk: string): string[] {
  return chunk.split(/\r\n|\r|\n/).filter((l) => l.trim().length > 0)
}
