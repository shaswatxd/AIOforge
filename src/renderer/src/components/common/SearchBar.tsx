import { Search, X } from 'lucide-react'
import { useUiStore } from '../../state/uiStore'

export function SearchBar({ placeholder = 'Search apps, developers, categories…' }: { placeholder?: string }) {
  const query = useUiStore((s) => s.filters.query)
  const setQuery = useUiStore((s) => s.setQuery)

  return (
    <div className="relative flex-1 max-w-xl">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="no-drag w-full rounded-fluent bg-black/5 dark:bg-white/10 border border-subtle py-2 pl-9 pr-8 text-sm outline-none focus:ring-2 focus:ring-accent/50 transition-shadow"
      />
      {query && (
        <button
          onClick={() => setQuery('')}
          className="no-drag absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary hover:text-primary"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
