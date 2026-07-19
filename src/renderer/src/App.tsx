import { Routes, Route } from 'react-router-dom'
import { TitleBar } from './components/layout/TitleBar'
import { Sidebar } from './components/layout/Sidebar'
import { ToastHost } from './components/common/ToastHost'
import { AppInstallOptionsDrawer } from './components/apps/AppInstallOptionsDrawer'
import { useThemeSync } from './state/useThemeSync'
import { useQueueProgressSync } from './queries/useQueue'
import { Home } from './routes/Home'
import { Queue } from './routes/Queue'
import { Profiles } from './routes/Profiles'
import { ProfileDetail } from './routes/ProfileDetail'
import { Updates } from './routes/Updates'
import { Uninstall } from './routes/Uninstall'
import { PCSetup } from './routes/PCSetup'
import { Backup } from './routes/Backup'
import { SettingsPage } from './routes/Settings'
import { Admin } from './routes/Admin'

export default function App() {
  useThemeSync()
  useQueueProgressSync()

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-base-light dark:bg-base-dark text-primary">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/profiles" element={<Profiles />} />
            <Route path="/profiles/:id" element={<ProfileDetail />} />
            <Route path="/queue" element={<Queue />} />
            <Route path="/updates" element={<Updates />} />
            <Route path="/uninstall" element={<Uninstall />} />
            <Route path="/pc-setup" element={<PCSetup />} />
            <Route path="/backup" element={<Backup />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
      <ToastHost />
      <AppInstallOptionsDrawer />
    </div>
  )
}
