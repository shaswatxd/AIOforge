export type CategoryId =
  | 'browsers'
  | 'programming-languages'
  | 'ides'
  | 'databases'
  | 'database-tools'
  | 'devops'
  | 'development-tools'
  | 'communication'
  | 'design'
  | 'media'
  | 'office'
  | 'utilities'
  | 'security'
  | 'gaming'

export interface Category {
  id: CategoryId
  name: string
  icon: string
  description: string
}

/** A single configurable install-time option shown in the App Detail advanced-install drawer. */
export type InstallOptionField =
  | { kind: 'select'; key: string; label: string; options: { value: string; label: string }[]; default: string }
  | { kind: 'checkbox'; key: string; label: string; default: boolean }
  | { kind: 'checkbox-group'; key: string; label: string; items: { value: string; label: string }[]; default: string[] }
  | { kind: 'text'; key: string; label: string; placeholder?: string; default?: string }
  | { kind: 'action'; key: string; label: string; buttonLabel: string }

export interface AppDefinition {
  id: string
  name: string
  description: string
  developer: string
  category: CategoryId
  /** winget package identifier, e.g. "Microsoft.VisualStudioCode" */
  wingetId?: string
  /** chocolatey package id, e.g. "vscode" */
  chocoId?: string
  homepage: string
  license: 'Free' | 'Open Source' | 'Freemium' | 'Paid' | 'Subscription'
  tags: string[]
  /** Sample/local metadata — not sourced from a live store backend. See README "mocked vs real". */
  stats: {
    rating: number
    ratingCount: number
    downloads: number
    downloadSizeMb: number
    installSizeMb: number
    latestVersion: string
    addedAt: string
    featured?: boolean
    popular?: boolean
    recommended?: boolean
  }
  installOptions?: InstallOptionField[]
}

export interface CatalogFilters {
  query: string
  category: CategoryId | 'all'
  sort: 'popular' | 'name' | 'recent' | 'rating' | 'size'
}
