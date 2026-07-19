import type { Category } from '../types/catalog'

export const CATEGORIES: Category[] = [
  { id: 'browsers', name: 'Browsers', icon: 'Globe', description: 'Web browsers' },
  { id: 'programming-languages', name: 'Programming Languages', icon: 'Code', description: 'Language runtimes & SDKs' },
  { id: 'ides', name: 'IDEs & Editors', icon: 'TerminalSquare', description: 'Code editors and IDEs' },
  { id: 'databases', name: 'Databases', icon: 'Database', description: 'Database servers' },
  { id: 'database-tools', name: 'Database Tools', icon: 'Table', description: 'GUI clients for databases' },
  { id: 'devops', name: 'DevOps', icon: 'Container', description: 'Containers, IaC & cloud CLIs' },
  { id: 'development-tools', name: 'Development Tools', icon: 'Wrench', description: 'Git clients, API tools & network utilities' },
  { id: 'communication', name: 'Communication', icon: 'MessageCircle', description: 'Chat & video conferencing' },
  { id: 'design', name: 'Design', icon: 'PenTool', description: 'Design & creative tools' },
  { id: 'media', name: 'Media', icon: 'PlayCircle', description: 'Audio, video & streaming' },
  { id: 'office', name: 'Office', icon: 'FileText', description: 'Productivity & documents' },
  { id: 'utilities', name: 'Utilities', icon: 'Settings2', description: 'System utilities' },
  { id: 'security', name: 'Security', icon: 'ShieldCheck', description: 'Security & privacy' },
  { id: 'gaming', name: 'Gaming', icon: 'Gamepad2', description: 'Game launchers' }
]
