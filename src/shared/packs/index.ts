import type { Profile } from '../types/profiles'

const now = '2025-01-15T00:00:00.000Z'

function pack(
  id: string,
  name: string,
  description: string,
  icon: string,
  category: Profile['category'],
  appIds: string[]
): Profile {
  return {
    id,
    name,
    description,
    icon,
    category,
    apps: appIds.map((appId) => ({ appId })),
    createdAt: now,
    updatedAt: now,
    isBuiltin: true
  }
}

/** Curated starter profiles bundled with the app (local-first stand-in for a live
 *  "community profiles" catalog — see README "mocked vs real"). */
export const BUILTIN_PACKS: Profile[] = [
  pack('pack-react-developer', 'React Developer', 'Everything for modern React web development.', 'Atom', 'developer', [
    'google-chrome',
    'vscode',
    'git',
    'nodejs-lts',
    'docker-desktop',
    'postman',
    'mysql',
    'python'
  ]),
  pack('pack-developer', 'Developer Pack', 'General-purpose full-stack development kit.', 'Code', 'developer', [
    'vscode',
    'git',
    'github-desktop',
    'nodejs-lts',
    'postman',
    'docker-desktop',
    'dbeaver'
  ]),
  pack('pack-student', 'Student Pack', 'Essentials for coursework, notes and research.', 'GraduationCap', 'student', [
    'google-chrome',
    'microsoft-office',
    'notion',
    'vscode',
    '7zip',
    'adobe-reader'
  ]),
  pack('pack-gaming', 'Gaming Pack', 'Launchers for all the major PC game stores.', 'Gamepad2', 'gaming', [
    'steam',
    'epic-games',
    'riot-client',
    'ubisoft-connect',
    'ea-app',
    'discord'
  ]),
  pack('pack-office', 'Office Pack', 'Productivity suite for documents and communication.', 'Briefcase', 'office', [
    'microsoft-office',
    'libreoffice',
    'adobe-reader',
    'microsoft-teams',
    'notion',
    'zoom'
  ]),
  pack('pack-cybersecurity', 'Cybersecurity Pack', 'Network analysis, VPN and password security tools.', 'ShieldCheck', 'cybersecurity', [
    'wireshark',
    'bitwarden',
    'keepassxc',
    'wireguard',
    'openvpn',
    'malwarebytes'
  ]),
  pack('pack-flutter', 'Flutter Pack', 'Mobile development toolkit for Flutter/Android.', 'Smartphone', 'developer', [
    'android-studio',
    'vscode',
    'git',
    'java-jdk'
  ]),
  pack('pack-python', 'Python Pack', 'Python development environment.', 'FileCode', 'developer', [
    'python',
    'pycharm',
    'vscode',
    'git'
  ]),
  pack('pack-data-science', 'Data Science Pack', 'Python data-science stack with DB tooling.', 'BarChart3', 'developer', [
    'python',
    'pycharm',
    'dbeaver',
    'git',
    'vscode'
  ])
]
