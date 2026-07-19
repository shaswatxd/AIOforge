import { spawn } from 'child_process'
import { mkdtempSync, readFileSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

/** Runs a single command elevated via one UAC prompt (Start-Process -Verb RunAs) — used
 *  only for the specific operations that genuinely need machine-wide permissions (MSI
 *  uninstalls, HKLM writes, enabling WSL). Everything else in the app runs unelevated on
 *  purpose: Windows blocks non-elevated tools (screenshot utilities, some window
 *  managers) from capturing/interacting with an always-elevated window, so we only ask
 *  for admin the moment an action actually needs it, not for the whole app. No live
 *  stdout streaming is possible across the UAC boundary — this is for one-shot actions,
 *  not the install queue's progress-driven installs (see wingetManager/chocoManager). */
export function runElevated(command: string, args: string[]): Promise<{ code: number; output: string }> {
  return new Promise((resolve, reject) => {
    const dir = mkdtempSync(join(tmpdir(), 'aioforge-'))
    const outFile = join(dir, 'out.txt')
    const errFile = join(dir, 'err.txt')
    const argList = '@(' + args.map((a) => `'${a.replace(/'/g, "''")}'`).join(',') + ')'
    const psCommand =
      `$p = Start-Process -FilePath '${command}' -ArgumentList ${argList} -Verb RunAs -Wait -PassThru -WindowStyle Hidden ` +
      `-RedirectStandardOutput '${outFile}' -RedirectStandardError '${errFile}'; exit $p.ExitCode`

    const child = spawn('powershell', ['-NoProfile', '-NonInteractive', '-Command', psCommand], { windowsHide: true })
    child.on('error', reject)
    child.on('close', (code) => {
      let output = ''
      try {
        output = readFileSync(outFile, 'utf-8') + readFileSync(errFile, 'utf-8')
      } catch {
        // Files may not exist if the user cancelled the UAC prompt — fine, code will be non-zero.
      }
      try {
        rmSync(dir, { recursive: true, force: true })
      } catch {
        // best-effort cleanup
      }
      resolve({ code: code ?? 1, output })
    })
  })
}

/** Same as runElevated(), but for an arbitrary PowerShell script instead of a fixed
 *  command + args list — the script is passed as -EncodedCommand to sidestep quoting
 *  issues when nesting it inside the outer Start-Process invocation. */
export function runElevatedPowerShell(script: string): Promise<{ code: number; output: string }> {
  const encoded = Buffer.from(script, 'utf16le').toString('base64')
  return runElevated('powershell', ['-NoProfile', '-NonInteractive', '-EncodedCommand', encoded])
}
