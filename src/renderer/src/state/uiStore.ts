import { create } from 'zustand'
import type { CatalogFilters } from '@shared/types/catalog'

export interface Toast {
  id: string
  message: string
  variant: 'success' | 'error' | 'info'
}

interface UiState {
  resolvedDark: boolean
  setResolvedDark: (dark: boolean) => void

  filters: CatalogFilters
  setQuery: (query: string) => void
  setCategory: (category: CatalogFilters['category']) => void
  setSort: (sort: CatalogFilters['sort']) => void

  selectedAppId: string | null
  openAppDetail: (id: string) => void
  closeAppDetail: () => void

  toasts: Toast[]
  pushToast: (message: string, variant?: Toast['variant']) => void
  dismissToast: (id: string) => void
}

export const useUiStore = create<UiState>((set) => ({
  resolvedDark: false,
  setResolvedDark: (dark) => set({ resolvedDark: dark }),

  filters: { query: '', category: 'all', sort: 'popular' },
  setQuery: (query) => set((s) => ({ filters: { ...s.filters, query } })),
  setCategory: (category) => set((s) => ({ filters: { ...s.filters, category } })),
  setSort: (sort) => set((s) => ({ filters: { ...s.filters, sort } })),

  selectedAppId: null,
  openAppDetail: (id) => set({ selectedAppId: id }),
  closeAppDetail: () => set({ selectedAppId: null }),

  toasts: [],
  pushToast: (message, variant = 'info') =>
    set((s) => ({ toasts: [...s.toasts, { id: crypto.randomUUID(), message, variant }] })),
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
}))
