import { Link } from 'react-router-dom'
import { Download, Share2 } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Profile } from '@shared/types/profiles'
import { Icon } from '../common/Icon'
import { Badge } from '../common/Badge'
import { useInstallProfile } from '../../queries/useProfiles'
import { useUiStore } from '../../state/uiStore'

export function ProfileCard({ profile, onShare }: { profile: Profile; onShare?: () => void }) {
  const install = useInstallProfile()
  const pushToast = useUiStore((s) => s.pushToast)

  return (
    <motion.div whileHover={{ y: -2 }} className="acrylic flex flex-col gap-3 rounded-fluent-lg border-subtle p-4 shadow-fluent">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-fluent bg-accent/15 text-accent">
          <Icon name={profile.icon} size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <Link to={`/profiles/${profile.id}`} className="truncate text-sm font-semibold hover:underline">
            {profile.name}
          </Link>
          <p className="text-xs text-secondary">{profile.apps.length} apps</p>
        </div>
        {profile.isBuiltin && <Badge variant="accent">Starter Pack</Badge>}
      </div>

      <p className="line-clamp-2 text-xs text-secondary">{profile.description}</p>

      <div className="mt-auto flex gap-2 pt-1">
        <button
          onClick={() =>
            install.mutate(profile.id, {
              onSuccess: (items) => pushToast(`${items.length} apps from "${profile.name}" added to queue`, 'success')
            })
          }
          className="flex flex-1 items-center justify-center gap-1.5 rounded-fluent bg-accent py-2 text-xs font-semibold text-white hover:bg-accent-hover"
        >
          <Download size={13} /> Install Profile
        </button>
        {onShare && (
          <button
            onClick={onShare}
            className="flex h-8 w-8 items-center justify-center rounded-fluent border border-subtle text-secondary hover:text-primary"
            title="Share"
          >
            <Share2 size={14} />
          </button>
        )}
      </div>
    </motion.div>
  )
}
