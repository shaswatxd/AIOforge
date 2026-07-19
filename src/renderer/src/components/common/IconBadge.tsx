import { cn } from '../../lib/utils'

const PALETTE = [
  'from-blue-500 to-blue-700',
  'from-violet-500 to-violet-700',
  'from-emerald-500 to-emerald-700',
  'from-amber-500 to-amber-700',
  'from-rose-500 to-rose-700',
  'from-cyan-500 to-cyan-700',
  'from-fuchsia-500 to-fuchsia-700',
  'from-indigo-500 to-indigo-700'
]

function paletteIndex(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash << 5) - hash + seed.charCodeAt(i)
  return Math.abs(hash) % PALETTE.length
}

/** Deterministic initials-on-gradient logo, used for every catalog app instead of fetched
 *  brand marks (see README "mocked vs real" — drop real PNGs into /resources/icons/<id>.png
 *  and swap this component for an <img> to upgrade later). */
export function IconBadge({ id, name, size = 44, className }: { id: string; name: string; size?: number; className?: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-fluent font-semibold text-white bg-gradient-to-br shrink-0',
        PALETTE[paletteIndex(id)],
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials || '?'}
    </div>
  )
}
