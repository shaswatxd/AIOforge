import { randomInt } from 'crypto'
import type { Profile, CommunityProfileSummary } from '@shared/types/profiles'
import { communityCacheRepo } from '../db/repositories/communityCache.repo'
import { profilesRepo } from '../db/repositories/profiles.repo'
import { BUILTIN_PACKS } from '@shared/packs'

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I — avoids ambiguous codes

function randomCode(prefix: string): string {
  let suffix = ''
  for (let i = 0; i < 5; i++) suffix += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]
  return `${prefix}-${suffix}`
}

/** Local-first stand-in for a real "SetupForge Cloud" backend. Share codes and community
 *  profiles are generated/stored on THIS machine (SQLite) rather than a hosted service, so
 *  importByCode() only resolves codes generated locally or bundled starter packs — see
 *  README "mocked vs real" for the swap-in point (implement this same interface against a
 *  real HTTP API and nothing else in the app needs to change). */
export const cloudClient = {
  generateShareCode(profile: Profile): string {
    const prefix = profile.category ? profile.category.slice(0, 3).toUpperCase() : 'SFG'
    let code = randomCode(prefix)
    while (communityCacheRepo.get(code)) code = randomCode(prefix) // avoid collision

    communityCacheRepo.set(code, profile)
    return code
  },

  importByCode(code: string): Profile {
    const normalized = code.trim().toUpperCase()
    const cached = communityCacheRepo.get(normalized) as Profile | null
    if (cached) return cached

    const byShareCode = profilesRepo.all().find((p) => p.shareCode === normalized)
    if (byShareCode) return byShareCode

    throw new Error(
      `Share code "${code}" was not found. Codes are shared locally on this machine (or via an exported file) until SetupForge Cloud is connected — see README.`
    )
  },

  community(): CommunityProfileSummary[] {
    return BUILTIN_PACKS.map((p) => ({
      code: p.id.toUpperCase(),
      name: p.name,
      description: p.description,
      appCount: p.apps.length,
      installs: hashToInstalls(p.id),
      trending: ['pack-react-developer', 'pack-python', 'pack-data-science'].includes(p.id)
    }))
  }
}

function hashToInstalls(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash << 5) - hash + seed.charCodeAt(i)
  return 500 + (Math.abs(hash) % 15000)
}
