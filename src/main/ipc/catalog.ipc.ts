import { ipcMain } from 'electron'
import { APPS } from '@shared/catalog/apps'
import { CATEGORIES } from '@shared/catalog/categories'
import type { CatalogFilters } from '@shared/types/catalog'
import { favoritesRepo } from '../db/repositories/favorites.repo'
import { recommendationService } from '../services/recommendationService'
import { getAvailability } from '../services/packageManager/packageManagerRouter'
import { wingetManager } from '../services/packageManager/wingetManager'
import { chocoManager } from '../services/packageManager/chocoManager'

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

  ipcMain.handle('catalog:get', (_e, appId: string) => {
    if (appId.startsWith('winget:') || appId.startsWith('chocolatey:')) {
      const [source, pkgId] = appId.split(':')
      return {
        id: appId,
        name: pkgId,
        developer: `${source === 'winget' ? 'Windows' : 'Chocolatey'} Repository`,
        category: 'developer',
        wingetId: source === 'winget' ? pkgId : undefined,
        chocoId: source === 'chocolatey' ? pkgId : undefined,
        homepage: source === 'winget' ? 'https://github.com/microsoft/winget-cli' : 'https://chocolatey.org',
        license: 'Open Source / Proprietary',
        description: `This is an online package from the remote ${source} repository. You can customize the settings below to install it on your system.`,
        stats: {
          downloads: 5000,
          rating: 4.8,
          ratingCount: 15,
          downloadSizeMb: 50,
          installSizeMb: 100,
          addedAt: new Date().toISOString().slice(0, 10),
          latestVersion: 'latest',
          featured: false,
          popular: false
        },
        tags: [],
        installOptions: []
      }
    }
    return APPS.find((a) => a.id === appId) ?? null
  })

  ipcMain.handle('catalog:searchOnline', async (_e, query: string) => {
    const results: { id: string; name: string; version: string; source: 'winget' | 'chocolatey' }[] = []
    const availability = await getAvailability()
    if (availability.winget) {
      try {
        const wingetRes = await wingetManager.search(query)
        results.push(...wingetRes.map((r) => ({ ...r, source: 'winget' as const })))
      } catch (err) {
        // ignore errors from search
      }
    }
    if (availability.chocolatey) {
      try {
        const chocoRes = await chocoManager.search(query)
        results.push(...chocoRes.map((r) => ({ ...r, source: 'chocolatey' as const })))
      } catch (err) {
        // ignore errors from search
      }
    }
    return results
  })

  ipcMain.handle('catalog:categories', () =>
    CATEGORIES.map((c) => ({ ...c, count: APPS.filter((a) => a.category === c.id).length }))
  )

  ipcMain.handle('catalog:favorites', () => favoritesRepo.all())

  ipcMain.handle('catalog:toggleFavorite', (_e, appId: string) => favoritesRepo.toggle(appId))

  ipcMain.handle('catalog:recommended', () => recommendationService.getRecommendations())
}
