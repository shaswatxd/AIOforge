import { useEffect, useState, type ReactNode } from 'react'
import { Download, ExternalLink } from 'lucide-react'
import type { InstallOptionField } from '@shared/types/catalog'
import { Modal } from '../common/Modal'
import { Badge } from '../common/Badge'
import { Rating } from '../common/Rating'
import { IconBadge } from '../common/IconBadge'
import { useCatalogApp } from '../../queries/useCatalog'
import { useAddToQueue } from '../../queries/useQueue'
import { useUiStore } from '../../state/uiStore'
import { formatBytes, formatDownloads, formatDate } from '../../lib/utils'

function defaultsFor(fields: InstallOptionField[]): Record<string, unknown> {
  const values: Record<string, unknown> = {}
  for (const f of fields) {
    if (f.kind === 'action') continue
    values[f.key] = f.default
  }
  return values
}

export function AppInstallOptionsDrawer() {
  const selectedAppId = useUiStore((s) => s.selectedAppId)
  const closeAppDetail = useUiStore((s) => s.closeAppDetail)
  const pushToast = useUiStore((s) => s.pushToast)
  const { data: app } = useCatalogApp(selectedAppId)
  const addToQueue = useAddToQueue()
  const [values, setValues] = useState<Record<string, unknown>>({})

  useEffect(() => {
    if (app?.installOptions) setValues(defaultsFor(app.installOptions))
  }, [app?.id])

  if (!app) return <Modal open={!!selectedAppId} onClose={closeAppDetail} title="Loading…" children={null} />

  const handleInstall = () => {
    addToQueue.mutate([{ appId: app.id, options: values }], {
      onSuccess: () => {
        pushToast(`${app.name} added to install queue`, 'success')
        closeAppDetail()
      },
      onError: (err) => pushToast(err instanceof Error ? err.message : 'Failed to queue install', 'error')
    })
  }

  return (
    <Modal open={!!selectedAppId} onClose={closeAppDetail} title={app.name} width={560}>
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-4">
          <IconBadge id={app.id} name={app.name} size={56} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{app.name}</h3>
              <button
                onClick={() => window.api.system.openExternal(app.homepage)}
                className="text-secondary hover:text-accent"
                title="Open homepage"
              >
                <ExternalLink size={14} />
              </button>
            </div>
            <p className="text-sm text-secondary">{app.developer}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge>{app.license}</Badge>
              <Badge variant="accent">{app.category}</Badge>
              <Badge>v{app.stats.latestVersion}</Badge>
            </div>
          </div>
        </div>

        <p className="text-sm text-secondary">{app.description}</p>

        <div className="grid grid-cols-2 gap-3 rounded-fluent bg-black/5 dark:bg-white/5 p-3 text-xs sm:grid-cols-3">
          <Stat label="Rating">
            <Rating value={app.stats.rating} count={app.stats.ratingCount} />
          </Stat>
          <Stat label="Downloads">{formatDownloads(app.stats.downloads)}</Stat>
          <Stat label="Download size">{formatBytes(app.stats.downloadSizeMb * 1024 * 1024)}</Stat>
          <Stat label="Install size">{formatBytes(app.stats.installSizeMb * 1024 * 1024)}</Stat>
          <Stat label="Added">{formatDate(app.stats.addedAt)}</Stat>
          <Stat label="Package source">{app.wingetId ? 'winget' : app.chocoId ? 'chocolatey' : 'n/a'}</Stat>
        </div>

        {app.installOptions && app.installOptions.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-subtle pt-4">
            <h4 className="text-sm font-semibold">Advanced Install Options</h4>
            {app.installOptions.map((field) => (
              <OptionField
                key={field.key}
                field={field}
                value={values[field.key]}
                onChange={(v) => setValues((s) => ({ ...s, [field.key]: v }))}
                onAction={() =>
                  pushToast(
                    'SSH key generation isn\'t automated in this build — run "ssh-keygen -t ed25519" in a terminal (OpenSSH ships with Windows).',
                    'info'
                  )
                }
              />
            ))}
          </div>
        )}

        <div className="flex gap-2 border-t border-subtle pt-4">
          <button
            onClick={handleInstall}
            disabled={addToQueue.isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-fluent bg-accent py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
          >
            <Download size={16} /> Install {app.name}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-secondary">{label}</div>
      <div className="mt-0.5 font-medium text-primary">{children}</div>
    </div>
  )
}

function OptionField({
  field,
  value,
  onChange,
  onAction
}: {
  field: InstallOptionField
  value: unknown
  onChange: (v: unknown) => void
  onAction: () => void
}) {
  if (field.kind === 'checkbox') {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} className="accent-accent" />
        {field.label}
      </label>
    )
  }

  if (field.kind === 'select') {
    return (
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-secondary">{field.label}</span>
        <select
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-fluent border border-subtle bg-transparent px-2 py-1.5 outline-none"
        >
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    )
  }

  if (field.kind === 'checkbox-group') {
    const selected = (value as string[]) ?? []
    return (
      <div className="flex flex-col gap-1.5 text-sm">
        <span className="text-secondary">{field.label}</span>
        <div className="grid grid-cols-2 gap-1.5">
          {field.items.map((item) => (
            <label key={item.value} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selected.includes(item.value)}
                onChange={(e) =>
                  onChange(e.target.checked ? [...selected, item.value] : selected.filter((v) => v !== item.value))
                }
                className="accent-accent"
              />
              {item.label}
            </label>
          ))}
        </div>
      </div>
    )
  }

  if (field.kind === 'text') {
    return (
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-secondary">{field.label}</span>
        <input
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="rounded-fluent border border-subtle bg-transparent px-2 py-1.5 outline-none"
        />
      </label>
    )
  }

  return (
    <button
      onClick={onAction}
      type="button"
      className="self-start rounded-fluent border border-subtle px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10"
    >
      {field.buttonLabel}
    </button>
  )
}
