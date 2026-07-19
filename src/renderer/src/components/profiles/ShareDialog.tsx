import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Modal } from '../common/Modal'
import { useGenerateShareCode } from '../../queries/useProfiles'
import { useUiStore } from '../../state/uiStore'
import type { Profile } from '@shared/types/profiles'

export function ShareDialog({ profile, onClose }: { profile: Profile | null; onClose: () => void }) {
  const generate = useGenerateShareCode()
  const pushToast = useUiStore((s) => s.pushToast)
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)

  const code = generate.data ?? profile?.shareCode

  const copy = (text: string, which: 'code' | 'link') => {
    navigator.clipboard.writeText(text)
    setCopied(which)
    setTimeout(() => setCopied(null), 1500)
  }

  const handleOpen = () => {
    if (profile && !code) generate.mutate(profile.id)
  }

  return (
    <Modal open={!!profile} onClose={onClose} title={`Share "${profile?.name ?? ''}"`}>
      {profile && (
        <div className="flex flex-col gap-4">
          {!code ? (
            <button
              onClick={handleOpen}
              disabled={generate.isPending}
              className="rounded-fluent bg-accent py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
            >
              {generate.isPending ? 'Generating…' : 'Generate Share Code'}
            </button>
          ) : (
            <>
              <div>
                <div className="mb-1 text-xs text-secondary">Share Code</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-fluent border border-subtle bg-black/5 dark:bg-white/5 px-3 py-2 text-center text-lg font-bold tracking-wider">
                    {code}
                  </code>
                  <button
                    onClick={() => copy(code, 'code')}
                    className="flex h-9 w-9 items-center justify-center rounded-fluent border border-subtle hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    {copied === 'code' ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <div className="mb-1 text-xs text-secondary">Share Link</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded-fluent border border-subtle bg-black/5 dark:bg-white/5 px-3 py-2 text-xs">
                    https://aioforge.vercel.app/profile/{code}
                  </code>
                  <button
                    onClick={() => copy(`https://aioforge.vercel.app/profile/${code}`, 'link')}
                    className="flex h-9 w-9 items-center justify-center rounded-fluent border border-subtle hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    {copied === 'link' ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
                  </button>
                </div>
              </div>

              <p className="text-xs text-secondary">
                This code is stored locally on this machine. Send the recipient an exported profile file (Profiles →
                Export) or connect AIOforge Cloud for cross-device codes — see README.
              </p>
            </>
          )}
        </div>
      )}
    </Modal>
  )
}
