import { useEffect, useState, type ReactNode } from 'react'
import { FolderOpen, CheckCircle2, XCircle, RefreshCw, DownloadCloud, RotateCw } from 'lucide-react'
import { useSettings, useSetSettings, usePackageManagerAvailability } from '../queries/useSettings'
import { useAppUpdate } from '../queries/useAppUpdate'
import { formatBytes, formatSpeed } from '../lib/utils'
import type { PackageManagerPref, ThemeMode } from '@shared/types/settings'

const THEMES: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'Match System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' }
]

const PACKAGE_MANAGERS: { value: PackageManagerPref; label: string; description: string }[] = [
  { value: 'winget', label: 'Winget', description: 'Built into Windows 11 (recommended)' },
  { value: 'chocolatey', label: 'Chocolatey', description: 'Community package manager' },
  { value: 'both', label: 'Both', description: 'Prefer winget, fall back to Chocolatey' }
]

export function SettingsPage() {
  const { data: settings } = useSettings()
  const setSettings = useSetSettings()
  const { data: availability } = usePackageManagerAvailability()

  if (!settings) return <div className="p-6 text-sm text-secondary">Loading…</div>

  const pickDownloadLocation = async () => {
    const dir = await window.api.system.pickDirectory()
    if (dir) setSettings.mutate({ downloadLocation: dir })
  }

  return (
    <div className="flex flex-col gap-8 p-6">
      <div>
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="text-sm text-secondary">Configure appearance, downloads and package manager preferences.</p>
      </div>

      <Section title="Theme">
        <div className="flex gap-2">
          {THEMES.map((t) => (
            <OptionPill key={t.value} active={settings.theme === t.value} onClick={() => setSettings.mutate({ theme: t.value })}>
              {t.label}
            </OptionPill>
          ))}
        </div>
      </Section>

      <Section title="Language">
        <select
          value={settings.language}
          onChange={(e) => setSettings.mutate({ language: e.target.value })}
          className="w-56 rounded-fluent border border-subtle bg-transparent px-3 py-2 text-sm outline-none"
        >
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="de">Deutsch</option>
          <option value="hi">हिन्दी</option>
        </select>
      </Section>

      <Section title="Download Location">
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={settings.downloadLocation || 'System default'}
            className="w-80 rounded-fluent border border-subtle bg-transparent px-3 py-2 text-sm text-secondary outline-none"
          />
          <button
            onClick={pickDownloadLocation}
            className="flex items-center gap-2 rounded-fluent border border-subtle px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10"
          >
            <FolderOpen size={15} /> Browse
          </button>
        </div>
      </Section>

      <Section title="Package Manager">
        <div className="flex flex-col gap-2">
          {PACKAGE_MANAGERS.map((pm) => {
            const isAvailable = pm.value === 'both' || availability?.[pm.value === 'chocolatey' ? 'chocolatey' : 'winget']
            return (
              <label
                key={pm.value}
                className="flex items-center gap-3 rounded-fluent border border-subtle p-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
              >
                <input
                  type="radio"
                  checked={settings.packageManager === pm.value}
                  onChange={() => setSettings.mutate({ packageManager: pm.value })}
                  className="accent-accent"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium">{pm.label}</div>
                  <div className="text-xs text-secondary">{pm.description}</div>
                </div>
                {pm.value !== 'both' &&
                  (isAvailable ? (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  ) : (
                    <XCircle size={16} className="text-rose-500" />
                  ))}
              </label>
            )
          })}
        </div>
      </Section>

      <Section title="Install Queue">
        <label className="flex items-center gap-3 text-sm">
          Concurrent installs
          <input
            type="range"
            min={1}
            max={5}
            value={settings.queueConcurrency}
            onChange={(e) => setSettings.mutate({ queueConcurrency: Number(e.target.value) })}
            className="accent-accent"
          />
          <span className="w-4 text-center font-medium">{settings.queueConcurrency}</span>
        </label>
      </Section>

      <Section title="Updates">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.backgroundUpdateChecking}
            onChange={(e) => setSettings.mutate({ backgroundUpdateChecking: e.target.checked })}
            className="accent-accent"
          />
          Check for updates in the background
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.autoUpdateApps}
            onChange={(e) => setSettings.mutate({ autoUpdateApps: e.target.checked })}
            className="accent-accent"
          />
          Automatically install updates
        </label>
      </Section>

      <Section title="About AIOforge">
        <AppUpdatePanel />
      </Section>
    </div>
  )
}

function AppUpdatePanel() {
  const [version, setVersion] = useState<string | null>(null)
  const { status, checkForUpdates, downloadUpdate, quitAndInstall } = useAppUpdate()

  useEffect(() => {
    window.api.system.getAppVersion().then(setVersion)
  }, [])

  return (
    <div className="flex flex-col gap-3 rounded-fluent border border-subtle p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">AIOforge {version ? `v${version}` : ''}</div>
          <div className="text-xs text-secondary">{statusLabel(status)}</div>
        </div>

        {status.state === 'downloaded' ? (
          <button
            onClick={() => quitAndInstall()}
            className="flex items-center gap-2 rounded-fluent bg-accent px-3 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
          >
            <RotateCw size={14} /> Restart &amp; Install
          </button>
        ) : status.state === 'available' ? (
          <button
            onClick={() => downloadUpdate()}
            className="flex items-center gap-2 rounded-fluent bg-accent px-3 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
          >
            <DownloadCloud size={14} /> Download v{status.version}
          </button>
        ) : (
          <button
            onClick={() => checkForUpdates()}
            disabled={status.state === 'checking' || status.state === 'downloading'}
            className="flex items-center gap-2 rounded-fluent border border-subtle px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-60"
          >
            <RefreshCw size={14} className={status.state === 'checking' ? 'animate-spin' : ''} />
            Check for Updates
          </button>
        )}
      </div>

      {status.state === 'downloading' && (
        <div className="flex flex-col gap-1.5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${status.progress ?? 0}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-secondary">
            <span>
              {formatBytes(status.transferredBytes ?? 0)} of {formatBytes(status.totalBytes ?? 0)}
            </span>
            <span>{formatSpeed(status.bytesPerSecond ?? 0)}</span>
            <span>{status.progress ?? 0}%</span>
          </div>
        </div>
      )}
    </div>
  )
}

function statusLabel(status: ReturnType<typeof useAppUpdate>['status']): string {
  switch (status.state) {
    case 'checking':
      return 'Checking for updates…'
    case 'available':
      return `Version ${status.version} is available`
    case 'not-available':
      return "You're on the latest version"
    case 'downloading':
      return `Downloading v${status.version ?? ''}…`
    case 'downloaded':
      return `Version ${status.version} downloaded — restart to install`
    case 'error':
      return status.error ?? 'Update check failed'
    default:
      return 'Automatically checks in the background on launch'
  }
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-secondary">{title}</h2>
      {children}
    </section>
  )
}

function OptionPill({ children, active, onClick }: { children: ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-fluent border px-4 py-2 text-sm font-medium ${
        active ? 'border-accent bg-accent text-white' : 'border-subtle hover:bg-black/5 dark:hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  )
}
