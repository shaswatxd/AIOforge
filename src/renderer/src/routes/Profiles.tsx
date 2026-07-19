import { useState } from 'react'
import { Plus, Import, TrendingUp } from 'lucide-react'
import type { Profile } from '@shared/types/profiles'
import { ProfileCard } from '../components/profiles/ProfileCard'
import { ProfileBuilder } from '../components/profiles/ProfileBuilder'
import { ImportDialog } from '../components/profiles/ImportDialog'
import { ShareDialog } from '../components/profiles/ShareDialog'
import { useProfiles, useCommunityProfiles } from '../queries/useProfiles'

export function Profiles() {
  const { data: profiles } = useProfiles()
  const { data: community } = useCommunityProfiles()
  const [builderOpen, setBuilderOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [sharingProfile, setSharingProfile] = useState<Profile | null>(null)

  const mine = profiles?.filter((p) => !p.isBuiltin) ?? []
  const packs = profiles?.filter((p) => p.isBuiltin) ?? []
  const trendingIds = new Set((community ?? []).filter((c) => c.trending).map((c) => c.code.toLowerCase()))
  const trending = packs.filter((p) => trendingIds.has(p.id))

  return (
    <div className="flex flex-col gap-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Profiles</h1>
          <p className="text-sm text-secondary">Install a curated set of apps in one click, or build your own.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-2 rounded-fluent border border-subtle px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10"
          >
            <Import size={15} /> Import
          </button>
          <button
            onClick={() => setBuilderOpen(true)}
            className="flex items-center gap-2 rounded-fluent bg-accent px-3 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
          >
            <Plus size={15} /> Create Profile
          </button>
        </div>
      </div>

      {trending.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <TrendingUp size={17} className="text-accent" /> Trending Profiles
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trending.map((p) => (
              <ProfileCard key={p.id} profile={p} onShare={() => setSharingProfile(p)} />
            ))}
          </div>
        </section>
      )}

      {mine.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">My Profiles</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mine.map((p) => (
              <ProfileCard key={p.id} profile={p} onShare={() => setSharingProfile(p)} />
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Starter & Bonus Packs</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packs.map((p) => (
            <ProfileCard key={p.id} profile={p} onShare={() => setSharingProfile(p)} />
          ))}
        </div>
      </section>

      <ProfileBuilder open={builderOpen} onClose={() => setBuilderOpen(false)} />
      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
      <ShareDialog profile={sharingProfile} onClose={() => setSharingProfile(null)} />
    </div>
  )
}
