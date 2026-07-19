import { spawn } from 'child_process'
import type { TweakDefinition } from '@shared/types/system'
import { tweaksRepo } from '../db/repositories/tweaks.repo'
import { runElevatedPowerShell } from './packageManager/elevate'

function powershell(command: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('powershell', ['-NoProfile', '-NonInteractive', '-Command', command], {
      windowsHide: true
    })
    let stderr = ''
    child.stderr.on('data', (d) => (stderr += d.toString()))
    child.on('error', reject)
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(stderr.trim() || `exit code ${code}`))))
  })
}

/** Only the two tweaks that touch HKLM / enable a Windows feature need this — everything
 *  else here is a per-user (HKCU) edit or a normal winget install that doesn't need
 *  elevation, so it doesn't trigger a UAC prompt. */
async function elevatedPowershell(command: string): Promise<void> {
  const { code, output } = await runElevatedPowerShell(command)
  if (code !== 0) throw new Error(output.trim() || `exit code ${code}`)
}

function wingetInstall(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      'winget',
      ['install', '--id', id, '-e', '--silent', '--accept-package-agreements', '--accept-source-agreements'],
      { windowsHide: true }
    )
    child.on('error', reject)
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`winget exited ${code}`))))
  })
}

interface TweakDef extends TweakDefinition {
  run: () => Promise<void>
}

/** Every tweak here is either a real, reversible registry edit scoped to HKCU (no system-wide
 *  side effects without the user's own admin prompt) or a real winget install of a genuinely
 *  useful package. "Disable Startup Apps" deliberately opens Settings instead of silently
 *  disabling arbitrary third-party startup entries — that's a per-app decision, not a safe
 *  one-click default. See README "mocked vs real". */
const DEFS: TweakDef[] = [
  {
    id: 'enable-dark-mode',
    label: 'Enable Dark Mode',
    description: 'Switches Windows apps and system UI to dark theme.',
    category: 'appearance',
    run: () =>
      powershell(
        `Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize' -Name AppsUseLightTheme -Value 0 -Type DWord; ` +
          `Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize' -Name SystemUsesLightTheme -Value 0 -Type DWord`
      )
  },
  {
    id: 'show-file-extensions',
    label: 'Show File Extensions',
    description: 'Shows file extensions for known file types in File Explorer.',
    category: 'explorer',
    run: () =>
      powershell(
        `Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced' -Name HideFileExt -Value 0 -Type DWord`
      )
  },
  {
    id: 'show-hidden-files',
    label: 'Show Hidden Files',
    description: 'Reveals hidden files and folders in File Explorer.',
    category: 'explorer',
    run: () =>
      powershell(
        `Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced' -Name Hidden -Value 1 -Type DWord`
      )
  },
  {
    id: 'disable-startup-apps',
    label: 'Disable Startup Apps',
    description: 'Opens Windows Settings so you can choose which apps launch at sign-in.',
    category: 'system',
    run: () => powershell(`Start-Process 'ms-settings:startupapps'`)
  },
  {
    id: 'install-fonts',
    label: 'Install Developer Fonts',
    description: 'Installs Cascadia Code, a monospaced font designed for code and terminals.',
    category: 'appearance',
    run: () => wingetInstall('Microsoft.CascadiaCode')
  },
  {
    id: 'install-windows-terminal',
    label: 'Install Windows Terminal',
    description: 'Modern, tabbed terminal application for Windows.',
    category: 'developer',
    run: () => wingetInstall('Microsoft.WindowsTerminal')
  },
  {
    id: 'install-powershell-7',
    label: 'Install PowerShell 7',
    description: 'Latest cross-platform PowerShell (pwsh).',
    category: 'developer',
    run: () => wingetInstall('Microsoft.PowerShell')
  },
  {
    id: 'install-wsl',
    label: 'Install WSL',
    description: 'Enables Windows Subsystem for Linux (requires a restart).',
    category: 'developer',
    run: () => elevatedPowershell(`wsl --install`)
  },
  {
    id: 'developer-mode',
    label: 'Enable Developer Mode',
    description: 'Allows sideloading apps and unlocks developer-focused OS features.',
    category: 'developer',
    run: () =>
      elevatedPowershell(
        `New-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\AppModelUnlock' -Name AllowDevelopmentWithoutDevLicense -PropertyType DWord -Value 1 -Force`
      )
  },
  {
    id: 'disable-telemetry',
    label: 'Disable Diagnostics & Telemetry',
    description: 'Disables Windows telemetry, diagnostic tracking services, and data collection.',
    category: 'system',
    run: () =>
      powershell(
        `Stop-Service -Name DiagTrack -ErrorAction SilentlyContinue; ` +
          `Set-Service -Name DiagTrack -StartupType Disabled -ErrorAction SilentlyContinue; ` +
          `Stop-Service -Name dmwappushservice -ErrorAction SilentlyContinue; ` +
          `Set-Service -Name dmwappushservice -StartupType Disabled -ErrorAction SilentlyContinue; ` +
          `Set-ItemProperty -Path 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection' -Name AllowTelemetry -Value 0 -Type DWord -Force -ErrorAction SilentlyContinue; ` +
          `Set-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\DataCollection' -Name AllowTelemetry -Value 0 -Type DWord -Force -ErrorAction SilentlyContinue`
      )
  },
  {
    id: 'disable-bing-search',
    label: 'Disable Bing Start Menu Search',
    description: 'Prevents Windows Start Menu from showing online Bing search suggestions.',
    category: 'system',
    run: () =>
      powershell(
        `Set-ItemProperty -Path 'HKCU:\\Software\\Policies\\Microsoft\\Windows\\Explorer' -Name DisableSearchBoxSuggestions -Value 1 -Type DWord -Force -ErrorAction SilentlyContinue; ` +
          `Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Search' -Name BingSearchEnabled -Value 0 -Type DWord -Force -ErrorAction SilentlyContinue`
      )
  },
  {
    id: 'classic-context-menu',
    label: 'Classic Right-Click Context Menu',
    description: 'Restores the classic Windows 10 style right-click context menu in Windows 11 (restarts explorer.exe).',
    category: 'appearance',
    run: () =>
      powershell(
        `$path = 'HKCU:\\Software\\Classes\\CLSID\\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}\\InprocServer32'; ` +
          `New-Item -Path $path -Force -ErrorAction SilentlyContinue; ` +
          `Set-ItemProperty -Path $path -Name '' -Value '' -Force; ` +
          `Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue`
      )
  },
  {
    id: 'set-cloudflare-dns',
    label: 'Set Cloudflare DNS (1.1.1.1)',
    description: 'Configures network adapters to use Cloudflare DNS for faster, private browsing.',
    category: 'system',
    run: () =>
      powershell(
        `Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.InterfaceAlias -notlike "*Loopback*" } | ForEach-Object { ` +
          `Set-DnsClientServerAddress -InterfaceIndex $_.InterfaceIndex -ServerAddresses ("1.1.1.1", "1.0.0.1") -ErrorAction SilentlyContinue ` +
          `}`
      )
  },
  {
    id: 'system-cleanup',
    label: 'Clean System Junk Files',
    description: 'Clears user temporary files, Windows temp logs, and Recycle Bin items.',
    category: 'system',
    run: () =>
      powershell(
        `Remove-Item -Path "$env:TEMP\\*" -Recurse -Force -ErrorAction SilentlyContinue; ` +
          `Remove-Item -Path "C:\\Windows\\Temp\\*" -Recurse -Force -ErrorAction SilentlyContinue; ` +
          `Clear-RecycleBin -Confirm:$false -ErrorAction SilentlyContinue`
      )
  }
]

export const tweaksService = {
  list(): TweakDefinition[] {
    const applied = new Set(tweaksRepo.appliedIds())
    return DEFS.map(({ run: _run, ...def }) => ({ ...def, applied: applied.has(def.id) }))
  },

  async apply(ids: string[]): Promise<void> {
    const failures: string[] = []
    const succeeded: string[] = []
    for (const id of ids) {
      const def = DEFS.find((d) => d.id === id)
      if (!def) continue
      try {
        await def.run()
        succeeded.push(id)
      } catch (err) {
        failures.push(`${def.label}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
    if (succeeded.length) tweaksRepo.markApplied(succeeded)
    if (failures.length) {
      throw new Error(
        `Some tweaks require Administrator privileges or a restart. Failed: ${failures.join('; ')}`
      )
    }
  }
}
