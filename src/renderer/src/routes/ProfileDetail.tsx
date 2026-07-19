import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Download, FileDown, Trash2, Share2 } from 'lucide-react'
import { useState } from 'react'
import { useProfile, useInstallProfile, useRemoveProfile, useExportProfile } from '../queries/useProfiles'
import { useCatalogList } from '../queries/useCatalog'
import { Icon } from '../components/common/Icon'
import { IconBadge } from '../components/common/IconBadge'
import { ShareDialog } from '../components/profiles/ShareDialog'
import { useUiStore } from '../state/uiStore'

export function ProfileDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: profile } = useProfile(id ?? null)
  const { data: allApps } = useCatalogList()
  const install = useInstallProfile()
  const remove = useRemoveProfile()
  const exportProfile = useExportProfile()
  const pushToast = useUiStore((s) => s.pushToast)
  const [sharing, setSharing] = useState(false)

  if (!profile) return <div className="p-6 text-sm text-secondary">Loading…</div>

  const apps = profile.apps.map((pa) => allApps?.find((a) => a.id === pa.appId)).filter(Boolean)

  const handleExport = async () => {
    const filePath = await window.api.system.pickSaveFile(`${profile.name.replace(/\s+/g, '-').toLowerCase()}.json`)
    if (!filePath) return
    exportProfile.mutate(
      { id: profile.id, filePath },
      { onSuccess: () => pushToast('Profile exported', 'success') }
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <Link to="/profiles" className="flex w-fit items-center gap-1.5 text-sm text-secondary hover:text-primary">
        <ArrowLeft size={15} /> Back to Profiles
      </Link>

      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-fluent-lg bg-accent/15 text-accent">
          <Icon name={profile.icon} size={26} />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{profile.name}</h1>
          <p className="text-sm text-secondary">{profile.description}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() =>
            install.mutate(profile.id, {
              onSuccess: (items) => pushToast(`${items.length} apps added to queue`, 'success')
            })
          }
          className="flex items-center gap-2 rounded-fluent bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
        >
          <Download size={15} /> Install Profile
        </button>
        <button
          onClick={() => setSharing(true)}
          className="flex items-center gap-2 rounded-fluent border border-subtle px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10"
        >
          <Share2 size={15} /> Share
        </button>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 rounded-fluent border border-subtle px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10"
        >
          <FileDown size={15} /> Export
        </button>
        {!profile.isBuiltin && (
          <button
            onClick={() =>
              remove.mutate(profile.id, {
                onSuccess: () => {
                  pushToast('Profile deleted', 'success')
                  navigate('/profiles')
                }
              })
            }
            className="flex items-center gap-2 rounded-fluent border border-subtle px-4 py-2 text-sm text-rose-500 hover:bg-rose-500/10"
          >
            <Trash2 size={15} /> Delete
          </button>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-secondary">Includes {profile.apps.length} apps</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {apps.map(
            (app) =>
              app && (
                <div key={app.id} className="flex items-center gap-3 rounded-fluent border border-subtle p-3">
                  <IconBadge id={app.id} name={app.name} size={32} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{app.name}</div>
                    <div className="truncate text-xs text-secondary">{app.developer}</div>
                  </div>
                </div>
              )
          )}
        </div>
      </div>

      <ShareDialog profile={sharing ? profile : null} onClose={() => setSharing(false)} />
    </div>
  )
}
