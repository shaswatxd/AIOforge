import { useMemo, useState } from 'react'
import { Check, Wand2 } from 'lucide-react'
import { useTweaks, useApplyTweaks } from '../queries/useTweaks'
import { useUiStore } from '../state/uiStore'
import type { TweakDefinition } from '@shared/types/system'

const CATEGORY_LABEL: Record<TweakDefinition['category'], string> = {
  appearance: 'Appearance',
  explorer: 'File Explorer',
  system: 'System',
  developer: 'Developer'
}

export function PCSetup() {
  const { data: tweaks } = useTweaks()
  const apply = useApplyTweaks()
  const pushToast = useUiStore((s) => s.pushToast)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const grouped = useMemo(() => {
    const map = new Map<string, TweakDefinition[]>()
    for (const t of tweaks ?? []) {
      if (!map.has(t.category)) map.set(t.category, [])
      map.get(t.category)!.push(t)
    }
    return map
  }, [tweaks])

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleApply = () => {
    apply.mutate([...selected], {
      onSuccess: () => {
        pushToast('Tweaks applied', 'success')
        setSelected(new Set())
      },
      onError: (err) => pushToast(err instanceof Error ? err.message : 'Some tweaks failed', 'error')
    })
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">PC Setup</h1>
          <p className="text-sm text-secondary">Optional tweaks to configure Windows the way developers like it.</p>
        </div>
        <button
          onClick={handleApply}
          disabled={selected.size === 0 || apply.isPending}
          className="flex items-center gap-2 rounded-fluent bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
        >
          <Wand2 size={15} /> {apply.isPending ? 'Applying…' : `Apply Selected (${selected.size})`}
        </button>
      </div>

      {[...grouped.entries()].map(([category, items]) => (
        <section key={category} className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-secondary">{CATEGORY_LABEL[category as TweakDefinition['category']]}</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {items.map((tweak) => (
              <label
                key={tweak.id}
                className="flex items-start gap-3 rounded-fluent border border-subtle p-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
              >
                <input
                  type="checkbox"
                  checked={selected.has(tweak.id)}
                  onChange={() => toggle(tweak.id)}
                  className="mt-0.5 accent-accent"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    {tweak.label}
                    {tweak.applied && <Check size={13} className="text-emerald-500" />}
                  </div>
                  <p className="text-xs text-secondary">{tweak.description}</p>
                </div>
              </label>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
