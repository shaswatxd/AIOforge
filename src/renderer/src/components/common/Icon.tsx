import type { ComponentType } from 'react'
import { icons, HelpCircle, type LucideProps } from 'lucide-react'

/** Resolves a Lucide icon by name at runtime (catalog/category/pack data stores icon
 *  names as plain strings so they stay JSON-serializable for export/share). Falls back to
 *  a generic icon for unknown names instead of crashing. */
export function Icon({ name, ...props }: { name: string } & LucideProps) {
  const Cmp = (icons as Record<string, ComponentType<LucideProps>>)[name] ?? HelpCircle
  return <Cmp {...props} />
}
