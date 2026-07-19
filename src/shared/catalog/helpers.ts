import type { AppDefinition } from '../types/catalog'

/** Deterministic pseudo-random int in [min,max] derived from a string seed.
 *  Used only for sample popularity/rating metadata — see README "mocked vs real". */
function seededInt(seed: string, min: number, max: number): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  const normalized = Math.abs(hash) / 2147483647
  return Math.floor(min + normalized * (max - min + 1))
}

export function sampleStats(
  id: string,
  overrides: Partial<AppDefinition['stats']> & { latestVersion: string }
): AppDefinition['stats'] {
  return {
    rating: overrides.rating ?? Math.round((3.6 + seededInt(id, 0, 14) / 10) * 10) / 10,
    ratingCount: overrides.ratingCount ?? seededInt(id + 'rc', 200, 48000),
    downloads: overrides.downloads ?? seededInt(id + 'dl', 5000, 12000000),
    downloadSizeMb: overrides.downloadSizeMb ?? seededInt(id + 'ds', 2, 850),
    installSizeMb: overrides.installSizeMb ?? seededInt(id + 'is', 5, 2200),
    latestVersion: overrides.latestVersion,
    addedAt: overrides.addedAt ?? '2025-01-15',
    featured: overrides.featured,
    popular: overrides.popular,
    recommended: overrides.recommended
  }
}
