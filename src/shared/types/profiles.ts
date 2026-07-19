export interface ProfileApp {
  appId: string
  optionsJson?: Record<string, unknown>
}

export interface Profile {
  id: string
  name: string
  description: string
  icon: string
  apps: ProfileApp[]
  createdAt: string
  updatedAt: string
  shareCode?: string
  isBuiltin: boolean
  category?: 'developer' | 'student' | 'gaming' | 'office' | 'cybersecurity' | 'custom'
}

export interface CommunityProfileSummary {
  code: string
  name: string
  description: string
  appCount: number
  installs: number
  trending?: boolean
}
