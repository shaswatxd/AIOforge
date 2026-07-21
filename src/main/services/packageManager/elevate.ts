import { spawn, execSync } from 'child_process'
import { mkdtempSync, readFileSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

let isAdminCached: boolean | null = null

export function isAdmin(): boolean {
  if (isAdminCached !== null) return isAdminCached
  try {
    // on Windows, 'net session' command returns exit code 0 if admin, otherwise non-zero
    execSync('net session', { stdio: 'ignore' })
    isAdminCached = true
  } catch {
    isAdminCached = false
  }
  return isAdminCached
}

/** Runs a single command elevated via one UAC prompt (Start-Process -Verb RunAs) — used
 *  only for the specific operations that genuinely need machine-wide permissions (MSI
 *  uninstalls, HKLM writes, enabling WSL). Everything else in the app runs unelevated on
 *  purpose: Windows blocks non-elevated tools (screenshot utilities, some window
 *  managers) from capturing/interacting with an always-elevated window, so we only ask
 *  for admin the moment an action actually needs it, not for the whole app. No live
 *  stdout streaming is possible across the UAC boundary — this is for one-shot actions,
 *  not the install queue's progress-driven installs (see wingetManager/chocoManager). */
export function runElevated(command: string, args: string[]): Promise<{ code: number; output: string }> {
  // If the application is already running as Administrator, spawn the child process directly
  // with inherited elevation, bypassing UAC prompts and the Start-Process parameter set limitation.
  if (isAdmin()) {
    return new Promise((resolve) => {
      const child = spawn(command, args, { windowsHide: true })
      let output = ''
      child.stdout?.on('data', (d) => (output += d.toString()))
      child.stderr?.on('data', (d) => (output += d.toString()))
      child.on('error', (err) => {
        resolve({ code: 1, output: err.message })
      })
      child.on('close', (code) => {
        resolve({ code: code ?? 1, output })
      })
    })
  }

  return new Promise((resolve, reject) => {
    const dir = mkdtempSync(join(tmpdir(), 'aioforge-'))
    const outFile = join(dir, 'out.txt')
    const errFile = join(dir, 'err.txt')
    
    // Construct command execution line inside cmd.exe wrapper to perform redirection inside the elevated context,
    // avoiding the incompatible combination of -Verb RunAs and -RedirectStandardOutput in Start-Process.
    const cmdArgs = [
      '/c',
      `""${command}" ` + args.map((a) => `"${a.replace(/"/g, '\\"')}"`).join(' ') + ` > "${outFile}" 2> "${errFile}""`
    ]
    const argList = '@(' + cmdArgs.map((a) => `'${a.replace(/'/g, "''")}'`).join(',') + ')'
    const psCommand =
      `$p = Start-Process -FilePath 'cmd.exe' -ArgumentList ${argList} -Verb RunAs -Wait -PassThru -WindowStyle Hidden; ` +
      `exit $p.ExitCode`

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

import { app } from 'electron'

/** Runs a command without Administrator privileges (drops elevation using Shell.Application COM object via PowerShell).
 *  Used when winget refuses to uninstall a user-scope package while the calling process is elevated. */
export function runUnelevated(command: string, args: string[]): Promise<{ code: number; output: string }> {
  if (!isAdmin()) {
    return new Promise((resolve) => {
      const child = spawn(command, args, { windowsHide: true })
      let output = ''
      child.stdout?.on('data', (d) => (output += d.toString()))
      child.stderr?.on('data', (d) => (output += d.toString()))
      child.on('error', (err) => resolve({ code: 1, output: err.message }))
      child.on('close', (code) => resolve({ code: code ?? 1, output }))
    })
  }

  return new Promise((resolve, reject) => {
    const dir = mkdtempSync(join(tmpdir(), 'aioforge-unel-'))
    const outFile = join(dir, 'out.txt')
    const errFile = join(dir, 'err.txt')
    const codeFile = join(dir, 'code.txt')

    const formattedArgs = args.map((a) => (a.includes(' ') ? `"${a.replace(/"/g, '""')}"` : a)).join(' ')
    const fullCmd = `${command} ${formattedArgs}`.trim()

    const script = `
$s = New-Object -ComObject Shell.Application
$cmdArgs = '/c ${fullCmd.replace(/'/g, "''")} > "${outFile.replace(/\\/g, '\\\\')}" 2> "${errFile.replace(/\\/g, '\\\\')}" & echo %errorlevel% > "${codeFile.replace(/\\/g, '\\\\')}"'
$s.ShellExecute('cmd.exe', $cmdArgs, '', '', 0)

$waited = 0
while (-not (Test-Path '${codeFile.replace(/'/g, "''")}') -and $waited -lt 600) {
    Start-Sleep -Milliseconds 100
    $waited += 1
}
`

    const encoded = Buffer.from(script, 'utf16le').toString('base64')
    const child = spawn('powershell', ['-NoProfile', '-NonInteractive', '-EncodedCommand', encoded], { windowsHide: true })
    child.on('error', reject)
    child.on('close', () => {
      let output = ''
      let code = 1
      try {
        output = (readFileSync(outFile, 'utf-8') + readFileSync(errFile, 'utf-8')).trim()
      } catch {}
      try {
        code = parseInt(readFileSync(codeFile, 'utf-8').trim(), 10)
        if (isNaN(code)) code = 1
      } catch {}
      try {
        rmSync(dir, { recursive: true, force: true })
      } catch {}
      resolve({ code, output })
    })
  })
}

/** Relaunches the current application elevated (with RunAs prompt). */
export function relaunchAsAdmin(): void {
  const exePath = app.getPath('exe')
  const args = process.argv.slice(1)
  const argList = '@(' + args.map((a) => `'${a.replace(/'/g, "''")}'`).join(',') + ')'
  const psCommand = `Start-Process -FilePath '${exePath.replace(/'/g, "''")}' -ArgumentList ${argList} -Verb RunAs`
  spawn('powershell', ['-NoProfile', '-NonInteractive', '-Command', psCommand], { detached: true, windowsHide: true })
  app.quit()
}

/** Same as runElevated(), but for an arbitrary PowerShell script instead of a fixed
 *  command + args list — the script is passed as -EncodedCommand to sidestep quoting
 *  issues when nesting it inside the outer Start-Process invocation. */
export function runElevatedPowerShell(script: string): Promise<{ code: number; output: string }> {
  const encoded = Buffer.from(script, 'utf16le').toString('base64')
  return runElevated('powershell', ['-NoProfile', '-NonInteractive', '-EncodedCommand', encoded])
}
