import { useState } from 'react'
import { FolderOpen, ShieldCheck, FolderCheck } from 'lucide-react'
import { useProfiles } from '../queries/useProfiles'
import { useGenerateAdminBundle } from '../queries/useBackup'
import { useUiStore } from '../state/uiStore'

export function Admin() {
  const { data: profiles } = useProfiles()
  const generate = useGenerateAdminBundle()
  const pushToast = useUiStore((s) => s.pushToast)

  const [name, setName] = useState('Company Setup')
  const [outputDir, setOutputDir] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [includeOfflineInstallers, setIncludeOfflineInstallers] = useState(false)
  const [resultPath, setResultPath] = useState<string | null>(null)

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const pickOutputDir = async () => {
    const dir = await window.api.system.pickDirectory()
    if (dir) setOutputDir(dir)
  }

  const handleGenerate = () => {
    if (!outputDir || selected.size === 0) return
    generate.mutate(
      { name, profileIds: [...selected], includeOfflineInstallers, outputDir },
      {
        onSuccess: (bundlePath) => {
          setResultPath(bundlePath)
          pushToast('Deployment bundle generated', 'success')
        },
        onError: (err) => pushToast(err instanceof Error ? err.message : 'Bundle generation failed', 'error')
      }
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-2">
        <ShieldCheck size={22} className="text-accent" />
        <div>
          <h1 className="text-xl font-bold">Admin Mode</h1>
          <p className="text-sm text-secondary">Build a company setup bundle to deploy the same apps across multiple PCs.</p>
        </div>
      </div>

      <div className="acrylic flex flex-col gap-4 rounded-fluent-lg border-subtle p-5 shadow-fluent">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-secondary">Bundle Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-fluent border border-subtle bg-transparent px-3 py-2 outline-none"
          />
        </label>

        <div>
          <div className="mb-2 text-sm text-secondary">Include Profiles</div>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {profiles?.map((p) => (
              <label key={p.id} className="flex items-center gap-2 rounded-fluent border border-subtle p-2 text-sm">
                <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} className="accent-accent" />
                {p.name}
              </label>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includeOfflineInstallers}
            onChange={(e) => setIncludeOfflineInstallers(e.target.checked)}
            className="accent-accent"
          />
          Include offline installer binaries (downloads each app via <code>winget download</code>)
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-secondary">Output Folder</span>
          <div className="flex gap-2">
            <input
              readOnly
              value={outputDir || 'Choose a folder…'}
              className="flex-1 rounded-fluent border border-subtle bg-transparent px-3 py-2 text-secondary outline-none"
            />
            <button
              onClick={pickOutputDir}
              className="flex items-center gap-2 rounded-fluent border border-subtle px-3 py-2 hover:bg-black/5 dark:hover:bg-white/10"
            >
              <FolderOpen size={15} /> Browse
            </button>
          </div>
        </label>

        <button
          onClick={handleGenerate}
          disabled={!outputDir || selected.size === 0 || generate.isPending}
          className="rounded-fluent bg-accent py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {generate.isPending ? 'Generating…' : 'Generate Setup Bundle'}
        </button>

        {resultPath && (
          <div className="flex items-center gap-2 rounded-fluent bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">
            <FolderCheck size={15} /> Bundle created at {resultPath}
          </div>
        )}
      </div>

      <p className="text-xs text-secondary">
        The bundle includes a manifest, a PowerShell deploy script (run as Administrator on each target machine or push
        via GPO/Intune/PsExec), and — if selected — pre-downloaded installer binaries for fully offline deployment.
      </p>
    </div>
  )
}
