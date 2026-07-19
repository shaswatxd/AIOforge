import type { AppDefinition, InstallOptionField } from '../types/catalog'
import { sampleStats } from './helpers'

const nodeOptions: InstallOptionField[] = [
  {
    kind: 'checkbox',
    key: 'addToPath',
    label: 'Add to PATH',
    default: true
  },
  { kind: 'checkbox', key: 'installNpm', label: 'Install npm', default: true },
  { kind: 'checkbox', key: 'installCorepack', label: 'Install Corepack', default: true },
  { kind: 'checkbox', key: 'installPnpm', label: 'Install pnpm (via Corepack)', default: false },
  { kind: 'checkbox', key: 'installYarn', label: 'Install Yarn (via Corepack)', default: false }
]

const pythonOptions: InstallOptionField[] = [
  { kind: 'checkbox', key: 'addToPath', label: 'Add Python to PATH', default: true },
  { kind: 'checkbox', key: 'installPip', label: 'Install pip', default: true },
  { kind: 'checkbox', key: 'installPipx', label: 'Install pipx', default: false },
  { kind: 'checkbox', key: 'createEnvVars', label: 'Create Environment Variables', default: true }
]

const vscodeOptions: InstallOptionField[] = [
  {
    kind: 'checkbox-group',
    key: 'extensions',
    label: 'Select Extensions',
    items: [
      { value: 'ms-python.python', label: 'Python' },
      { value: 'ms-vscode.cpptools', label: 'C/C++' },
      { value: 'esbenp.prettier-vscode', label: 'Prettier' },
      { value: 'dbaeumer.vscode-eslint', label: 'ESLint' },
      { value: 'ms-azuretools.vscode-docker', label: 'Docker' },
      { value: 'eamodio.gitlens', label: 'GitLens' },
      { value: 'ritwickdey.liveserver', label: 'Live Server' }
    ],
    default: []
  }
]

const gitOptions: InstallOptionField[] = [
  { kind: 'text', key: 'userName', label: 'Git Username', placeholder: 'Jane Doe' },
  { kind: 'text', key: 'userEmail', label: 'Git Email', placeholder: 'jane@example.com' },
  { kind: 'action', key: 'generateSshKey', label: 'SSH Key', buttonLabel: 'Generate SSH Key' },
  {
    kind: 'select',
    key: 'defaultBranch',
    label: 'Default Branch',
    options: [
      { value: 'main', label: 'main' },
      { value: 'master', label: 'master' }
    ],
    default: 'main'
  }
]

const dotnetOptions: InstallOptionField[] = [
  {
    kind: 'select',
    key: 'sdkVersion',
    label: 'SDK Version',
    options: [
      { value: '8', label: '.NET 8 (LTS)' },
      { value: '9', label: '.NET 9 (Current)' }
    ],
    default: '8'
  }
]

const javaOptions: InstallOptionField[] = [
  {
    kind: 'select',
    key: 'jdkVersion',
    label: 'JDK Version',
    options: [
      { value: '21', label: 'JDK 21 (LTS)' },
      { value: '17', label: 'JDK 17 (LTS)' },
      { value: '11', label: 'JDK 11 (LTS)' }
    ],
    default: '21'
  },
  { kind: 'checkbox', key: 'setJavaHome', label: 'Set JAVA_HOME', default: true }
]

const dockerOptions: InstallOptionField[] = [
  { kind: 'checkbox', key: 'useWsl2', label: 'Use WSL 2 backend', default: true },
  { kind: 'checkbox', key: 'startOnLogin', label: 'Start Docker Desktop on login', default: false }
]

interface Seed {
  id: string
  name: string
  description: string
  developer: string
  category: AppDefinition['category']
  wingetId?: string
  chocoId?: string
  homepage: string
  license: AppDefinition['license']
  tags: string[]
  version: string
  installOptions?: InstallOptionField[]
  featured?: boolean
  popular?: boolean
  recommended?: boolean
}

const seeds: Seed[] = [
  // Browsers
  { id: 'google-chrome', name: 'Google Chrome', description: 'Fast, secure web browser built by Google.', developer: 'Google LLC', category: 'browsers', wingetId: 'Google.Chrome', chocoId: 'googlechrome', homepage: 'https://www.google.com/chrome/', license: 'Free', tags: ['browser', 'web'], version: '128.0.6613.138', featured: true, popular: true },
  { id: 'microsoft-edge', name: 'Microsoft Edge', description: 'Chromium-based browser built into Windows.', developer: 'Microsoft Corporation', category: 'browsers', wingetId: 'Microsoft.Edge', chocoId: 'microsoft-edge', homepage: 'https://www.microsoft.com/edge', license: 'Free', tags: ['browser', 'web'], version: '128.0.2739.67', popular: true },
  { id: 'mozilla-firefox', name: 'Mozilla Firefox', description: 'Privacy-focused open source browser.', developer: 'Mozilla Foundation', category: 'browsers', wingetId: 'Mozilla.Firefox', chocoId: 'firefox', homepage: 'https://www.mozilla.org/firefox/', license: 'Open Source', tags: ['browser', 'web', 'privacy'], version: '130.0', popular: true },
  { id: 'brave', name: 'Brave', description: 'Privacy browser with built-in ad blocking.', developer: 'Brave Software', category: 'browsers', wingetId: 'Brave.Brave', chocoId: 'brave', homepage: 'https://brave.com', license: 'Free', tags: ['browser', 'privacy'], version: '1.69.137' },
  { id: 'opera', name: 'Opera', description: 'Feature-rich browser with built-in VPN.', developer: 'Opera Software', category: 'browsers', wingetId: 'Opera.Opera', chocoId: 'opera', homepage: 'https://www.opera.com', license: 'Free', tags: ['browser'], version: '113.0' },
  { id: 'vivaldi', name: 'Vivaldi', description: 'Highly customizable power-user browser.', developer: 'Vivaldi Technologies', category: 'browsers', wingetId: 'VivaldiTechnologies.Vivaldi', chocoId: 'vivaldi', homepage: 'https://vivaldi.com', license: 'Free', tags: ['browser'], version: '6.9' },
  { id: 'tor-browser', name: 'Tor Browser', description: 'Anonymous browsing via the Tor network.', developer: 'The Tor Project', category: 'browsers', wingetId: 'TorProject.TorBrowser', chocoId: 'tor-browser', homepage: 'https://www.torproject.org', license: 'Open Source', tags: ['browser', 'privacy', 'anonymity'], version: '13.5.6' },

  // Programming Languages
  { id: 'nodejs-lts', name: 'Node.js LTS', description: 'Long-term-support JavaScript runtime.', developer: 'OpenJS Foundation', category: 'programming-languages', wingetId: 'OpenJS.NodeJS.LTS', chocoId: 'nodejs-lts', homepage: 'https://nodejs.org', license: 'Open Source', tags: ['javascript', 'runtime'], version: '22.11.0', installOptions: nodeOptions, featured: true, popular: true, recommended: true },
  { id: 'nodejs-current', name: 'Node.js Current', description: 'Latest feature-release JavaScript runtime.', developer: 'OpenJS Foundation', category: 'programming-languages', wingetId: 'OpenJS.NodeJS', chocoId: 'nodejs', homepage: 'https://nodejs.org', license: 'Open Source', tags: ['javascript', 'runtime'], version: '23.1.0', installOptions: nodeOptions },
  { id: 'python', name: 'Python', description: 'General-purpose programming language.', developer: 'Python Software Foundation', category: 'programming-languages', wingetId: 'Python.Python.3.12', chocoId: 'python', homepage: 'https://python.org', license: 'Open Source', tags: ['python', 'runtime'], version: '3.12.7', installOptions: pythonOptions, featured: true, popular: true, recommended: true },
  { id: 'java-jdk', name: 'Java JDK', description: 'Java Development Kit (Eclipse Temurin build).', developer: 'Eclipse Adoptium', category: 'programming-languages', wingetId: 'EclipseAdoptium.Temurin.21.JDK', chocoId: 'temurin21', homepage: 'https://adoptium.net', license: 'Open Source', tags: ['java', 'jdk'], version: '21.0.5', installOptions: javaOptions, popular: true },
  { id: 'go', name: 'Go', description: 'Statically typed, compiled language by Google.', developer: 'Google LLC', category: 'programming-languages', wingetId: 'GoLang.Go', chocoId: 'golang', homepage: 'https://go.dev', license: 'Open Source', tags: ['go', 'golang'], version: '1.23.3' },
  { id: 'rust', name: 'Rust', description: 'Systems language focused on safety & speed.', developer: 'Rust Foundation', category: 'programming-languages', wingetId: 'Rustlang.Rustup', chocoId: 'rustup.install', homepage: 'https://www.rust-lang.org', license: 'Open Source', tags: ['rust'], version: '1.82.0' },
  { id: 'php', name: 'PHP', description: 'Popular server-side scripting language.', developer: 'The PHP Group', category: 'programming-languages', wingetId: 'PHP.PHP.8.3', chocoId: 'php', homepage: 'https://www.php.net', license: 'Open Source', tags: ['php', 'web'], version: '8.3.13' },
  { id: 'ruby', name: 'Ruby', description: 'Dynamic language focused on simplicity.', developer: 'Ruby Core Team', category: 'programming-languages', wingetId: 'RubyInstallerTeam.RubyWithDevKit.3.3', chocoId: 'ruby', homepage: 'https://www.ruby-lang.org', license: 'Open Source', tags: ['ruby'], version: '3.3.5' },
  { id: 'perl', name: 'Perl', description: 'Strawberry Perl distribution for Windows.', developer: 'Strawberry Perl', category: 'programming-languages', wingetId: 'StrawberryPerl.StrawberryPerl', chocoId: 'strawberryperl', homepage: 'https://strawberryperl.com', license: 'Open Source', tags: ['perl'], version: '5.40.0.1' },
  { id: 'dotnet-sdk', name: '.NET SDK', description: 'Microsoft .NET software development kit.', developer: 'Microsoft Corporation', category: 'programming-languages', wingetId: 'Microsoft.DotNet.SDK.8', chocoId: 'dotnet-sdk', homepage: 'https://dotnet.microsoft.com', license: 'Open Source', tags: ['dotnet', 'csharp'], version: '8.0.10', installOptions: dotnetOptions, popular: true },

  // IDEs
  { id: 'vscode', name: 'Visual Studio Code', description: 'Lightweight, extensible source-code editor.', developer: 'Microsoft Corporation', category: 'ides', wingetId: 'Microsoft.VisualStudioCode', chocoId: 'vscode', homepage: 'https://code.visualstudio.com', license: 'Free', tags: ['editor', 'ide'], version: '1.94.2', installOptions: vscodeOptions, featured: true, popular: true, recommended: true },
  { id: 'vs-community', name: 'Visual Studio Community', description: 'Free full-featured IDE for individual developers.', developer: 'Microsoft Corporation', category: 'ides', wingetId: 'Microsoft.VisualStudio.2022.Community', chocoId: 'visualstudio2022community', homepage: 'https://visualstudio.microsoft.com', license: 'Free', tags: ['ide', 'dotnet'], version: '17.11' },
  { id: 'vs-professional', name: 'Visual Studio Professional', description: 'Professional-tier Visual Studio IDE.', developer: 'Microsoft Corporation', category: 'ides', wingetId: 'Microsoft.VisualStudio.2022.Professional', chocoId: 'visualstudio2022professional', homepage: 'https://visualstudio.microsoft.com', license: 'Paid', tags: ['ide', 'dotnet'], version: '17.11' },
  { id: 'android-studio', name: 'Android Studio', description: 'Official IDE for Android app development.', developer: 'Google LLC', category: 'ides', wingetId: 'Google.AndroidStudio', chocoId: 'androidstudio', homepage: 'https://developer.android.com/studio', license: 'Free', tags: ['android', 'mobile', 'ide'], version: '2024.2.1' },
  { id: 'intellij-idea', name: 'IntelliJ IDEA', description: 'JVM-focused IDE by JetBrains (Community).', developer: 'JetBrains s.r.o.', category: 'ides', wingetId: 'JetBrains.IntelliJIDEA.Community', chocoId: 'intellijidea-community', homepage: 'https://www.jetbrains.com/idea/', license: 'Free', tags: ['java', 'ide'], version: '2024.2.3' },
  { id: 'pycharm', name: 'PyCharm', description: 'Python IDE by JetBrains (Community).', developer: 'JetBrains s.r.o.', category: 'ides', wingetId: 'JetBrains.PyCharm.Community', chocoId: 'pycharm-community', homepage: 'https://www.jetbrains.com/pycharm/', license: 'Free', tags: ['python', 'ide'], version: '2024.2.3' },
  { id: 'rider', name: 'Rider', description: '.NET IDE by JetBrains.', developer: 'JetBrains s.r.o.', category: 'ides', wingetId: 'JetBrains.Rider', chocoId: 'jetbrains-rider', homepage: 'https://www.jetbrains.com/rider/', license: 'Paid', tags: ['dotnet', 'ide'], version: '2024.2.6' },
  { id: 'webstorm', name: 'WebStorm', description: 'JavaScript/TypeScript IDE by JetBrains.', developer: 'JetBrains s.r.o.', category: 'ides', wingetId: 'JetBrains.WebStorm', chocoId: 'webstorm', homepage: 'https://www.jetbrains.com/webstorm/', license: 'Paid', tags: ['javascript', 'ide'], version: '2024.2.4' },
  { id: 'eclipse', name: 'Eclipse', description: 'Extensible Java-based IDE platform.', developer: 'Eclipse Foundation', category: 'ides', wingetId: 'EclipseFoundation.Eclipse', chocoId: 'eclipse', homepage: 'https://www.eclipse.org', license: 'Open Source', tags: ['java', 'ide'], version: '2024-09' },
  { id: 'netbeans', name: 'NetBeans', description: 'Apache NetBeans Java IDE.', developer: 'Apache Software Foundation', category: 'ides', wingetId: 'Apache.NetBeans', chocoId: 'netbeans-ide', homepage: 'https://netbeans.apache.org', license: 'Open Source', tags: ['java', 'ide'], version: '23' },
  { id: 'codeblocks', name: 'Code::Blocks', description: 'Free C/C++ IDE.', developer: 'The Code::Blocks Team', category: 'ides', wingetId: 'CodeBlocks.CodeBlocks', chocoId: 'codeblocks', homepage: 'https://www.codeblocks.org', license: 'Open Source', tags: ['c++', 'ide'], version: '20.03' },
  { id: 'sublime-text', name: 'Sublime Text', description: 'Fast, lightweight text/code editor.', developer: 'Sublime HQ', category: 'ides', wingetId: 'SublimeHQ.SublimeText.4', chocoId: 'sublimetext4', homepage: 'https://www.sublimetext.com', license: 'Paid', tags: ['editor'], version: '4.192' },
  { id: 'notepadplusplus', name: 'Notepad++', description: 'Free source-code text editor.', developer: 'Notepad++ Team', category: 'ides', wingetId: 'Notepad++.Notepad++', chocoId: 'notepadplusplus', homepage: 'https://notepad-plus-plus.org', license: 'Open Source', tags: ['editor'], version: '8.7', popular: true },

  // Databases
  { id: 'mysql', name: 'MySQL', description: 'Popular open-source relational database.', developer: 'Oracle Corporation', category: 'databases', wingetId: 'Oracle.MySQL', chocoId: 'mysql', homepage: 'https://www.mysql.com', license: 'Open Source', tags: ['database', 'sql'], version: '9.1.0', popular: true },
  { id: 'postgresql', name: 'PostgreSQL', description: 'Advanced open-source object-relational database.', developer: 'PostgreSQL Global Development Group', category: 'databases', wingetId: 'PostgreSQL.PostgreSQL', chocoId: 'postgresql', homepage: 'https://www.postgresql.org', license: 'Open Source', tags: ['database', 'sql'], version: '17.0', popular: true, recommended: true },
  { id: 'mongodb', name: 'MongoDB', description: 'Document-oriented NoSQL database server.', developer: 'MongoDB Inc.', category: 'databases', wingetId: 'MongoDB.Server', chocoId: 'mongodb', homepage: 'https://www.mongodb.com', license: 'Open Source', tags: ['database', 'nosql'], version: '8.0.3' },
  { id: 'mariadb', name: 'MariaDB', description: 'Community-developed MySQL fork.', developer: 'MariaDB Foundation', category: 'databases', wingetId: 'MariaDB.Server', chocoId: 'mariadb', homepage: 'https://mariadb.org', license: 'Open Source', tags: ['database', 'sql'], version: '11.5.2' },
  { id: 'sqlite', name: 'SQLite', description: 'Self-contained embedded SQL database engine.', developer: 'SQLite Consortium', category: 'databases', wingetId: 'SQLite.SQLite', chocoId: 'sqlite', homepage: 'https://sqlite.org', license: 'Open Source', tags: ['database', 'embedded'], version: '3.47.0' },
  { id: 'sql-server-express', name: 'SQL Server Express', description: 'Free edition of Microsoft SQL Server.', developer: 'Microsoft Corporation', category: 'databases', wingetId: 'Microsoft.SQLServer.2022.Express', chocoId: 'sql-server-express', homepage: 'https://www.microsoft.com/sql-server', license: 'Free', tags: ['database', 'sql'], version: '16.0' },
  { id: 'redis', name: 'Redis', description: 'In-memory data structure store.', developer: 'Redis (Windows port)', category: 'databases', wingetId: 'tporadowski.Redis', chocoId: 'redis-64', homepage: 'https://redis.io', license: 'Open Source', tags: ['database', 'cache'], version: '5.0.14' },

  // Database Tools
  { id: 'mysql-workbench', name: 'MySQL Workbench', description: 'Visual design & administration tool for MySQL.', developer: 'Oracle Corporation', category: 'database-tools', wingetId: 'Oracle.MySQLWorkbench', chocoId: 'mysql.workbench', homepage: 'https://www.mysql.com/products/workbench/', license: 'Free', tags: ['database', 'gui'], version: '8.0.40' },
  { id: 'dbeaver', name: 'DBeaver', description: 'Universal database GUI client.', developer: 'DBeaver Corp', category: 'database-tools', wingetId: 'DBeaver.DBeaver', chocoId: 'dbeaver', homepage: 'https://dbeaver.io', license: 'Free', tags: ['database', 'gui'], version: '24.2.3', popular: true },
  { id: 'heidisql', name: 'HeidiSQL', description: 'Lightweight MySQL/MariaDB/PostgreSQL client.', developer: 'HeidiSQL Team', category: 'database-tools', wingetId: 'HeidiSQL.HeidiSQL', chocoId: 'heidisql', homepage: 'https://www.heidisql.com', license: 'Open Source', tags: ['database', 'gui'], version: '12.8' },
  { id: 'mongodb-compass', name: 'MongoDB Compass', description: 'Official GUI for MongoDB.', developer: 'MongoDB Inc.', category: 'database-tools', wingetId: 'MongoDB.Compass.Full', chocoId: 'mongodb-compass', homepage: 'https://www.mongodb.com/products/compass', license: 'Free', tags: ['database', 'gui'], version: '1.44.7' },
  { id: 'redis-insight', name: 'Redis Insight', description: 'GUI for browsing and managing Redis data.', developer: 'Redis Ltd.', category: 'database-tools', wingetId: 'Redis.RedisInsight', chocoId: 'redisinsight', homepage: 'https://redis.io/insight/', license: 'Free', tags: ['database', 'gui'], version: '2.60' },

  // DevOps
  { id: 'docker-desktop', name: 'Docker Desktop', description: 'Build, share and run containerized apps.', developer: 'Docker Inc.', category: 'devops', wingetId: 'Docker.DockerDesktop', chocoId: 'docker-desktop', homepage: 'https://www.docker.com', license: 'Freemium', tags: ['containers', 'docker'], version: '4.35.1', installOptions: dockerOptions, featured: true, popular: true, recommended: true },
  { id: 'kubernetes', name: 'Kubernetes CLI Tools', description: 'Core Kubernetes command-line tooling.', developer: 'Cloud Native Computing Foundation', category: 'devops', wingetId: 'Kubernetes.kubectl', chocoId: 'kubernetes-cli', homepage: 'https://kubernetes.io', license: 'Open Source', tags: ['kubernetes', 'containers'], version: '1.31.2' },
  { id: 'kubectl', name: 'kubectl', description: 'Kubernetes command-line client.', developer: 'Cloud Native Computing Foundation', category: 'devops', wingetId: 'Kubernetes.kubectl', chocoId: 'kubernetes-cli', homepage: 'https://kubernetes.io/docs/tasks/tools/', license: 'Open Source', tags: ['kubernetes'], version: '1.31.2' },
  { id: 'minikube', name: 'Minikube', description: 'Run a local Kubernetes cluster.', developer: 'Kubernetes Authors', category: 'devops', wingetId: 'Kubernetes.minikube', chocoId: 'minikube', homepage: 'https://minikube.sigs.k8s.io', license: 'Open Source', tags: ['kubernetes', 'local'], version: '1.34.0' },
  { id: 'terraform', name: 'Terraform', description: 'Infrastructure as code tool by HashiCorp.', developer: 'HashiCorp', category: 'devops', wingetId: 'Hashicorp.Terraform', chocoId: 'terraform', homepage: 'https://www.terraform.io', license: 'Open Source', tags: ['iac', 'cloud'], version: '1.9.8' },
  { id: 'aws-cli', name: 'AWS CLI', description: 'Command-line interface for Amazon Web Services.', developer: 'Amazon Web Services', category: 'devops', wingetId: 'Amazon.AWSCLI', chocoId: 'awscli', homepage: 'https://aws.amazon.com/cli/', license: 'Free', tags: ['cloud', 'aws'], version: '2.18.12' },
  { id: 'azure-cli', name: 'Azure CLI', description: 'Command-line interface for Microsoft Azure.', developer: 'Microsoft Corporation', category: 'devops', wingetId: 'Microsoft.AzureCLI', chocoId: 'azure-cli', homepage: 'https://learn.microsoft.com/cli/azure/', license: 'Free', tags: ['cloud', 'azure'], version: '2.65.0' },
  { id: 'google-cloud-cli', name: 'Google Cloud CLI', description: 'Command-line tools for Google Cloud.', developer: 'Google LLC', category: 'devops', wingetId: 'Google.CloudSDK', chocoId: 'gcloudsdk', homepage: 'https://cloud.google.com/cli', license: 'Free', tags: ['cloud', 'gcp'], version: '497.0.0' },

  // Development Tools
  { id: 'git', name: 'Git', description: 'Distributed version control system.', developer: 'Software Freedom Conservancy', category: 'development-tools', wingetId: 'Git.Git', chocoId: 'git', homepage: 'https://git-scm.com', license: 'Open Source', tags: ['vcs', 'git'], version: '2.47.0', installOptions: gitOptions, featured: true, popular: true, recommended: true },
  { id: 'github-desktop', name: 'GitHub Desktop', description: 'GUI client for Git and GitHub.', developer: 'GitHub Inc.', category: 'development-tools', wingetId: 'GitHub.GitHubDesktop', chocoId: 'github-desktop', homepage: 'https://desktop.github.com', license: 'Free', tags: ['git', 'gui'], version: '3.4.9' },
  { id: 'gitkraken', name: 'GitKraken', description: 'Cross-platform Git GUI client.', developer: 'Axosoft LLC', category: 'development-tools', wingetId: 'Axosoft.GitKraken', chocoId: 'gitkraken', homepage: 'https://www.gitkraken.com', license: 'Freemium', tags: ['git', 'gui'], version: '10.7.0' },
  { id: 'postman', name: 'Postman', description: 'API development and testing platform.', developer: 'Postman Inc.', category: 'development-tools', wingetId: 'Postman.Postman', chocoId: 'postman', homepage: 'https://www.postman.com', license: 'Freemium', tags: ['api', 'testing'], version: '11.19.0', popular: true, recommended: true },
  { id: 'insomnia', name: 'Insomnia', description: 'API client for REST, GraphQL & gRPC.', developer: 'Kong Inc.', category: 'development-tools', wingetId: 'Insomnia.Insomnia', chocoId: 'insomnia-rest-api-client', homepage: 'https://insomnia.rest', license: 'Freemium', tags: ['api', 'testing'], version: '10.3.0' },
  { id: 'fiddler', name: 'Fiddler', description: 'Web debugging proxy for HTTP traffic.', developer: 'Progress Software', category: 'development-tools', wingetId: 'Progress.Fiddler', chocoId: 'fiddler', homepage: 'https://www.telerik.com/fiddler', license: 'Freemium', tags: ['network', 'debugging'], version: '5.24.0' },
  { id: 'wireshark', name: 'Wireshark', description: 'Network protocol analyzer.', developer: 'Wireshark Foundation', category: 'development-tools', wingetId: 'WiresharkFoundation.Wireshark', chocoId: 'wireshark', homepage: 'https://www.wireshark.org', license: 'Open Source', tags: ['network', 'analysis'], version: '4.4.1' },

  // Communication
  { id: 'discord', name: 'Discord', description: 'Voice, video and text chat for communities.', developer: 'Discord Inc.', category: 'communication', wingetId: 'Discord.Discord', chocoId: 'discord', homepage: 'https://discord.com', license: 'Free', tags: ['chat', 'voip'], version: '1.0.9178', popular: true },
  { id: 'slack', name: 'Slack', description: 'Team collaboration and messaging.', developer: 'Slack Technologies', category: 'communication', wingetId: 'SlackTechnologies.Slack', chocoId: 'slack', homepage: 'https://slack.com', license: 'Freemium', tags: ['chat', 'team'], version: '4.42.117', popular: true },
  { id: 'zoom', name: 'Zoom', description: 'Video conferencing and webinars.', developer: 'Zoom Video Communications', category: 'communication', wingetId: 'Zoom.Zoom', chocoId: 'zoom', homepage: 'https://zoom.us', license: 'Freemium', tags: ['video', 'meetings'], version: '6.2.6' },
  { id: 'microsoft-teams', name: 'Microsoft Teams', description: 'Chat, meetings and collaboration hub.', developer: 'Microsoft Corporation', category: 'communication', wingetId: 'Microsoft.Teams', chocoId: 'microsoft-teams', homepage: 'https://www.microsoft.com/microsoft-teams', license: 'Freemium', tags: ['chat', 'video'], version: '24270' },
  { id: 'telegram', name: 'Telegram', description: 'Fast, secure cloud-based messaging.', developer: 'Telegram FZ-LLC', category: 'communication', wingetId: 'Telegram.TelegramDesktop', chocoId: 'telegram', homepage: 'https://telegram.org', license: 'Free', tags: ['chat', 'messaging'], version: '5.6.2' },
  { id: 'whatsapp', name: 'WhatsApp', description: 'Desktop client for WhatsApp messaging.', developer: 'WhatsApp LLC', category: 'communication', wingetId: 'WhatsApp.WhatsApp', chocoId: 'whatsapp', homepage: 'https://www.whatsapp.com', license: 'Free', tags: ['chat', 'messaging'], version: '2.24.20' },

  // Design
  { id: 'figma', name: 'Figma', description: 'Collaborative interface design tool.', developer: 'Figma Inc.', category: 'design', wingetId: 'Figma.Figma', chocoId: 'figma', homepage: 'https://www.figma.com', license: 'Freemium', tags: ['design', 'ui'], version: '125.5.4', popular: true },
  { id: 'blender', name: 'Blender', description: 'Free & open-source 3D creation suite.', developer: 'Blender Foundation', category: 'design', wingetId: 'BlenderFoundation.Blender', chocoId: 'blender', homepage: 'https://www.blender.org', license: 'Open Source', tags: ['3d', 'design'], version: '4.2.3' },
  { id: 'gimp', name: 'GIMP', description: 'Free & open-source image editor.', developer: 'GIMP Development Team', category: 'design', wingetId: 'GIMP.GIMP', chocoId: 'gimp', homepage: 'https://www.gimp.org', license: 'Open Source', tags: ['image', 'editing'], version: '2.10.38' },
  { id: 'krita', name: 'Krita', description: 'Digital painting application.', developer: 'Krita Foundation', category: 'design', wingetId: 'KDE.Krita', chocoId: 'krita', homepage: 'https://krita.org', license: 'Open Source', tags: ['painting', 'design'], version: '5.2.6' },
  { id: 'inkscape', name: 'Inkscape', description: 'Free vector graphics editor.', developer: 'Inkscape Project', category: 'design', wingetId: 'Inkscape.Inkscape', chocoId: 'inkscape', homepage: 'https://inkscape.org', license: 'Open Source', tags: ['vector', 'design'], version: '1.3.2' },

  // Media
  { id: 'vlc', name: 'VLC Media Player', description: 'Free, open-source media player.', developer: 'VideoLAN', category: 'media', wingetId: 'VideoLAN.VLC', chocoId: 'vlc', homepage: 'https://www.videolan.org/vlc/', license: 'Open Source', tags: ['media', 'player'], version: '3.0.21', featured: true, popular: true },
  { id: 'spotify', name: 'Spotify', description: 'Music and podcast streaming.', developer: 'Spotify AB', category: 'media', wingetId: 'Spotify.Spotify', chocoId: 'spotify', homepage: 'https://www.spotify.com', license: 'Freemium', tags: ['music', 'streaming'], version: '1.2.53', popular: true },
  { id: 'obs-studio', name: 'OBS Studio', description: 'Free streaming & recording software.', developer: 'OBS Project', category: 'media', wingetId: 'OBSProject.OBSStudio', chocoId: 'obs-studio', homepage: 'https://obsproject.com', license: 'Open Source', tags: ['streaming', 'recording'], version: '31.0.0', recommended: true },
  { id: 'audacity', name: 'Audacity', description: 'Free, open-source audio editor.', developer: 'Audacity Team', category: 'media', wingetId: 'Audacity.Audacity', chocoId: 'audacity', homepage: 'https://www.audacityteam.org', license: 'Open Source', tags: ['audio', 'editing'], version: '3.7.1' },
  { id: 'handbrake', name: 'HandBrake', description: 'Open-source video transcoder.', developer: 'HandBrake Team', category: 'media', wingetId: 'HandBrake.HandBrake', chocoId: 'handbrake', homepage: 'https://handbrake.fr', license: 'Open Source', tags: ['video', 'conversion'], version: '1.9.0' },

  // Office
  { id: 'microsoft-office', name: 'Microsoft Office', description: 'Word, Excel, PowerPoint & more.', developer: 'Microsoft Corporation', category: 'office', wingetId: 'Microsoft.Office', chocoId: 'office365business', homepage: 'https://www.microsoft.com/microsoft-365', license: 'Subscription', tags: ['office', 'productivity'], version: '2409' },
  { id: 'libreoffice', name: 'LibreOffice', description: 'Free & open-source office suite.', developer: 'The Document Foundation', category: 'office', wingetId: 'TheDocumentFoundation.LibreOffice', chocoId: 'libreoffice-fresh', homepage: 'https://www.libreoffice.org', license: 'Open Source', tags: ['office', 'productivity'], version: '24.8.3', popular: true },
  { id: 'adobe-reader', name: 'Adobe Acrobat Reader', description: 'Free PDF viewer by Adobe.', developer: 'Adobe Inc.', category: 'office', wingetId: 'Adobe.Acrobat.Reader.64-bit', chocoId: 'adobereader', homepage: 'https://get.adobe.com/reader/', license: 'Free', tags: ['pdf'], version: '24.4' },
  { id: 'foxit-pdf', name: 'Foxit PDF Editor', description: 'Fast, lightweight PDF editor & viewer.', developer: 'Foxit Software', category: 'office', wingetId: 'Foxit.FoxitReader', chocoId: 'foxitreader', homepage: 'https://www.foxit.com', license: 'Freemium', tags: ['pdf'], version: '2024.3' },
  { id: 'notion', name: 'Notion', description: 'All-in-one workspace for notes & docs.', developer: 'Notion Labs Inc.', category: 'office', wingetId: 'Notion.Notion', chocoId: 'notion', homepage: 'https://www.notion.so', license: 'Freemium', tags: ['notes', 'productivity'], version: '3.13.0', popular: true },
  { id: 'obsidian', name: 'Obsidian', description: 'Local-first markdown knowledge base.', developer: 'Obsidian.md', category: 'office', wingetId: 'Obsidian.Obsidian', chocoId: 'obsidian', homepage: 'https://obsidian.md', license: 'Freemium', tags: ['notes', 'markdown'], version: '1.7.7' },

  // Utilities
  { id: '7zip', name: '7-Zip', description: 'Free file archiver with high compression.', developer: 'Igor Pavlov', category: 'utilities', wingetId: '7zip.7zip', chocoId: '7zip', homepage: 'https://www.7-zip.org', license: 'Open Source', tags: ['archive', 'compression'], version: '24.08', featured: true, popular: true, recommended: true },
  { id: 'winrar', name: 'WinRAR', description: 'Trialware archive manager.', developer: 'RARLAB', category: 'utilities', wingetId: 'RARLab.WinRAR', chocoId: 'winrar', homepage: 'https://www.win-rar.com', license: 'Paid', tags: ['archive', 'compression'], version: '7.01' },
  { id: 'everything', name: 'Everything Search', description: 'Instant file & folder name search.', developer: 'voidtools', category: 'utilities', wingetId: 'voidtools.Everything', chocoId: 'everything', homepage: 'https://www.voidtools.com', license: 'Free', tags: ['search', 'files'], version: '1.4.1' },
  { id: 'powertoys', name: 'PowerToys', description: 'Windows utilities for power users.', developer: 'Microsoft Corporation', category: 'utilities', wingetId: 'Microsoft.PowerToys', chocoId: 'powertoys', homepage: 'https://learn.microsoft.com/windows/powertoys/', license: 'Open Source', tags: ['windows', 'productivity'], version: '0.85.0', featured: true, popular: true, recommended: true },
  { id: 'rufus', name: 'Rufus', description: 'Create bootable USB drives.', developer: 'Pete Batard', category: 'utilities', wingetId: 'Rufus.Rufus', chocoId: 'rufus', homepage: 'https://rufus.ie', license: 'Open Source', tags: ['usb', 'boot'], version: '4.6' },
  { id: 'balena-etcher', name: 'balenaEtcher', description: 'Flash OS images to USB drives & SD cards.', developer: 'balena.io', category: 'utilities', wingetId: 'Balena.Etcher', chocoId: 'etcher', homepage: 'https://etcher.balena.io', license: 'Open Source', tags: ['usb', 'flashing'], version: '1.19.25' },
  { id: 'crystaldiskinfo', name: 'CrystalDiskInfo', description: 'Disk health monitoring utility.', developer: 'Crystal Dew World', category: 'utilities', wingetId: 'CrystalDewWorld.CrystalDiskInfo', chocoId: 'crystaldiskinfo', homepage: 'https://crystalmark.info', license: 'Free', tags: ['disk', 'monitoring'], version: '9.4.0' },
  { id: 'crystaldiskmark', name: 'CrystalDiskMark', description: 'Disk benchmark utility.', developer: 'Crystal Dew World', category: 'utilities', wingetId: 'CrystalDewWorld.CrystalDiskMark', chocoId: 'crystaldiskmark', homepage: 'https://crystalmark.info', license: 'Free', tags: ['disk', 'benchmark'], version: '8.0.6' },
  { id: 'cpu-z', name: 'CPU-Z', description: 'System hardware information tool.', developer: 'CPUID', category: 'utilities', wingetId: 'CPUID.CPU-Z', chocoId: 'cpu-z', homepage: 'https://www.cpuid.com/softwares/cpu-z.html', license: 'Free', tags: ['hardware', 'monitoring'], version: '2.13' },
  { id: 'gpu-z', name: 'GPU-Z', description: 'Lightweight GPU information utility.', developer: 'TechPowerUp', category: 'utilities', wingetId: 'TechPowerUp.GPU-Z', chocoId: 'gpu-z', homepage: 'https://www.techpowerup.com/gpuz/', license: 'Free', tags: ['hardware', 'gpu'], version: '2.61' },
  { id: 'hwinfo', name: 'HWiNFO', description: 'In-depth hardware analysis & monitoring.', developer: 'REALiX', category: 'utilities', wingetId: 'REALiX.HWiNFO', chocoId: 'hwinfo', homepage: 'https://www.hwinfo.com', license: 'Free', tags: ['hardware', 'monitoring'], version: '8.02' },

  // Security
  { id: 'malwarebytes', name: 'Malwarebytes', description: 'Anti-malware and threat protection.', developer: 'Malwarebytes Inc.', category: 'security', wingetId: 'Malwarebytes.Malwarebytes', chocoId: 'malwarebytes', homepage: 'https://www.malwarebytes.com', license: 'Freemium', tags: ['security', 'antivirus'], version: '5.2.6' },
  { id: 'bitwarden', name: 'Bitwarden', description: 'Open-source password manager.', developer: 'Bitwarden Inc.', category: 'security', wingetId: 'Bitwarden.Bitwarden', chocoId: 'bitwarden', homepage: 'https://bitwarden.com', license: 'Freemium', tags: ['security', 'passwords'], version: '2024.10.1', popular: true, recommended: true },
  { id: 'keepassxc', name: 'KeePassXC', description: 'Free cross-platform password manager.', developer: 'KeePassXC Team', category: 'security', wingetId: 'KeePassXCTeam.KeePassXC', chocoId: 'keepassxc', homepage: 'https://keepassxc.org', license: 'Open Source', tags: ['security', 'passwords'], version: '2.7.9' },
  { id: 'wireguard', name: 'WireGuard', description: 'Fast, modern VPN protocol client.', developer: 'WireGuard', category: 'security', wingetId: 'WireGuard.WireGuard', chocoId: 'wireguard', homepage: 'https://www.wireguard.com', license: 'Open Source', tags: ['vpn', 'security'], version: '0.5.3' },
  { id: 'openvpn', name: 'OpenVPN', description: 'Open-source VPN client & protocol.', developer: 'OpenVPN Inc.', category: 'security', wingetId: 'OpenVPNTechnologies.OpenVPN', chocoId: 'openvpn', homepage: 'https://openvpn.net', license: 'Open Source', tags: ['vpn', 'security'], version: '2.6.12' },

  // Gaming
  { id: 'steam', name: 'Steam', description: "Valve's PC gaming platform.", developer: 'Valve Corporation', category: 'gaming', wingetId: 'Valve.Steam', chocoId: 'steam', homepage: 'https://store.steampowered.com', license: 'Free', tags: ['gaming', 'launcher'], version: '3.7.0', featured: true, popular: true },
  { id: 'epic-games', name: 'Epic Games Launcher', description: 'Launcher for the Epic Games Store.', developer: 'Epic Games Inc.', category: 'gaming', wingetId: 'EpicGames.EpicGamesLauncher', chocoId: 'epicgameslauncher', homepage: 'https://www.epicgames.com/store', license: 'Free', tags: ['gaming', 'launcher'], version: '17.4.0' },
  { id: 'riot-client', name: 'Riot Client', description: 'Launcher for Riot Games titles.', developer: 'Riot Games Inc.', category: 'gaming', wingetId: 'RiotGames.RiotClient', chocoId: 'riotclient', homepage: 'https://www.riotgames.com', license: 'Free', tags: ['gaming', 'launcher'], version: '1.0' },
  { id: 'ubisoft-connect', name: 'Ubisoft Connect', description: "Ubisoft's PC game launcher.", developer: 'Ubisoft Entertainment', category: 'gaming', wingetId: 'Ubisoft.Connect', chocoId: 'ubisoft-connect', homepage: 'https://ubisoftconnect.com', license: 'Free', tags: ['gaming', 'launcher'], version: '167.0' },
  { id: 'ea-app', name: 'EA App', description: "Electronic Arts' PC game launcher.", developer: 'Electronic Arts Inc.', category: 'gaming', wingetId: 'ElectronicArts.EAApp', chocoId: 'ea-app', homepage: 'https://www.ea.com/ea-app', license: 'Free', tags: ['gaming', 'launcher'], version: '13.578' }
]

export const APPS: AppDefinition[] = seeds.map((seed) => ({
  id: seed.id,
  name: seed.name,
  description: seed.description,
  developer: seed.developer,
  category: seed.category,
  wingetId: seed.wingetId,
  chocoId: seed.chocoId,
  homepage: seed.homepage,
  license: seed.license,
  tags: seed.tags,
  installOptions: seed.installOptions,
  stats: sampleStats(seed.id, {
    latestVersion: seed.version,
    featured: seed.featured,
    popular: seed.popular,
    recommended: seed.recommended
  })
}))
