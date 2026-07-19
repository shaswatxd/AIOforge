import { Star } from 'lucide-react'

export function Rating({ value, count }: { value: number; count?: number }) {
  return (
    <div className="flex items-center gap-1 text-xs text-secondary">
      <Star size={13} className="fill-amber-400 text-amber-400" />
      <span className="font-medium text-primary">{value.toFixed(1)}</span>
      {count !== undefined && <span>({count.toLocaleString()})</span>}
    </div>
  )
}
