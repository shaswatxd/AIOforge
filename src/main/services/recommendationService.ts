import { APPS } from '@shared/catalog/apps'
import type { AppDefinition } from '@shared/types/catalog'
import { installedAppsRepo } from '../db/repositories/installedApps.repo'

interface CoInstallRule {
  ifInstalled: string[] // all of these app ids
  suggest: string[]
}

/** Simple, transparent co-install rule engine — not a real ML/LLM recommender (none is
 *  wired up; see README "mocked vs real"). Rules encode common real-world dev workflows,
 *  e.g. "installed VS Code + Git → suggest Node.js + Docker" from the spec's own example. */
const RULES: CoInstallRule[] = [
  { ifInstalled: ['vscode', 'git'], suggest: ['nodejs-lts', 'docker-desktop'] },
  { ifInstalled: ['nodejs-lts'], suggest: ['postman', 'github-desktop'] },
  { ifInstalled: ['nodejs-current'], suggest: ['postman', 'github-desktop'] },
  { ifInstalled: ['python'], suggest: ['pycharm', 'dbeaver'] },
  { ifInstalled: ['docker-desktop'], suggest: ['kubectl', 'terraform'] },
  { ifInstalled: ['git'], suggest: ['github-desktop', 'gitkraken'] },
  { ifInstalled: ['mysql'], suggest: ['mysql-workbench', 'dbeaver'] },
  { ifInstalled: ['postgresql'], suggest: ['dbeaver', 'postman'] },
  { ifInstalled: ['android-studio'], suggest: ['java-jdk'] },
  { ifInstalled: ['obs-studio'], suggest: ['discord'] }
]

export const recommendationService = {
  getRecommendations(limit = 8): AppDefinition[] {
    const installedIds = new Set(installedAppsRepo.all().map((a) => a.appId))
    const scores = new Map<string, number>()

    for (const rule of RULES) {
      if (rule.ifInstalled.every((id) => installedIds.has(id))) {
        for (const suggestion of rule.suggest) {
          if (!installedIds.has(suggestion)) scores.set(suggestion, (scores.get(suggestion) ?? 0) + 2)
        }
      }
    }

    // Backfill with catalog-flagged recommended apps so the rail is never empty on a fresh install.
    for (const app of APPS) {
      if (app.stats.recommended && !installedIds.has(app.id) && !scores.has(app.id)) {
        scores.set(app.id, (scores.get(app.id) ?? 0) + 1)
      }
    }

    return [...scores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => APPS.find((a) => a.id === id))
      .filter((a): a is AppDefinition => !!a)
  }
}
