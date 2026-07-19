import { useEffect } from 'react'
import { useSettings } from '../queries/useSettings'
import { useUiStore } from './uiStore'

/** Applies the persisted theme preference (light/dark/system) to <html class="dark">,
 *  re-evaluating whenever the OS theme changes while "system" is selected. */
export function useThemeSync(): void {
  const { data: settings } = useSettings()
  const setResolvedDark = useUiStore((s) => s.setResolvedDark)

  useEffect(() => {
    const mode = settings?.theme ?? 'system'
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    const apply = () => {
      const dark = mode === 'dark' || (mode === 'system' && media.matches)
      document.documentElement.classList.toggle('dark', dark)
      setResolvedDark(dark)
    }

    apply()
    if (mode === 'system') {
      media.addEventListener('change', apply)
      return () => media.removeEventListener('change', apply)
    }
  }, [settings?.theme, setResolvedDark])
}
