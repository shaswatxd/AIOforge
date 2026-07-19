import { Heart } from 'lucide-react'
import { useFavorites, useToggleFavorite } from '../../queries/useCatalog'
import { cn } from '../../lib/utils'

export function FavoriteButton({ appId, size = 16 }: { appId: string; size?: number }) {
  const { data: favorites } = useFavorites()
  const toggle = useToggleFavorite()
  const isFavorite = favorites?.includes(appId) ?? false

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        toggle.mutate(appId)
      }}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-fluent border border-subtle transition-colors',
        isFavorite ? 'text-rose-500' : 'text-secondary hover:text-rose-500'
      )}
    >
      <Heart size={size} className={cn(isFavorite && 'fill-rose-500')} />
    </button>
  )
}
