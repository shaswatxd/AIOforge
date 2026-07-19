import { ipcMain } from 'electron'
import { APPS } from '@shared/catalog/apps'
import { CATEGORIES } from '@shared/catalog/categories'
import type { CatalogFilters } from '@shared/types/catalog'
import { favoritesRepo } from '../db/repositories/favorites.repo'
import { recommendationService } from '../services/recommendationService'

function applyFilters(filters?: Partial<CatalogFilters>) {
  let results = [...APPS]

  if (filters?.category && filters.category !== 'all') {
    results = results.filter((a) => a.category === filters.category)
  }

  if (filters?.query) {
    const q = filters.query.toLowerCase()
    results = results.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.developer.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
    )
  }

  switch (filters?.sort) {
    case 'name':
      results.sort((a, b) => a.name.localeCompare(b.name))
      break
    case 'recent':
      results.sort((a, b) => (a.stats.addedAt < b.stats.addedAt ? 1 : -1))
      break
    case 'rating':
      results.sort((a, b) => b.stats.rating - a.stats.rating)
      break
    case 'size':
      results.sort((a, b) => a.stats.downloadSizeMb - b.stats.downloadSizeMb)
      break
    default:
      results.sort((a, b) => b.stats.downloads - a.stats.downloads)
  }

  return results
}

export function registerCatalogIpc(): void {
  ipcMain.handle('catalog:list', (_e, filters?: Partial<CatalogFilters>) => applyFilters(filters))

  ipcMain.handle('catalog:get', (_e, appId: string) => APPS.find((a) => a.id === appId) ?? null)

  ipcMain.handle('catalog:categories', () =>
    CATEGORIES.map((c) => ({ ...c, count: APPS.filter((a) => a.category === c.id).length }))
  )

  ipcMain.handle('catalog:favorites', () => favoritesRepo.all())

  ipcMain.handle('catalog:toggleFavorite', (_e, appId: string) => favoritesRepo.toggle(appId))

  ipcMain.handle('catalog:recommended', () => recommendationService.getRecommendations())
}
