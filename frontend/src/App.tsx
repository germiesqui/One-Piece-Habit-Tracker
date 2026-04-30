import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useAuthStore } from '@/store/authStore'
import { AppShell } from '@/components/layout/AppShell'
import { LoginPage, RegisterPage } from '@/pages/AuthPages'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { TasksPage } from '@/pages/TasksPage'
import { PartyPage } from '@/pages/PartyPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { Spinner } from '@/components/ui'
import { motion, AnimatePresence } from 'framer-motion'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, initialized, profile } = useAuthStore()
  const location = useLocation()

  if (!initialized) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="font-heading text-xs uppercase tracking-widest text-ink-400">Setting sail…</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Has session but no party → onboarding
  if (profile && !profile.party_id && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Onboarding (auth required, no party yet) */}
      <Route path="/onboarding" element={
        <RequireAuth>
          <OnboardingPage />
        </RequireAuth>
      } />

      {/* Main app (auth + party required) */}
      <Route path="/dashboard" element={<RequireAuth><AppShell><DashboardPage /></AppShell></RequireAuth>} />
      <Route path="/tasks"     element={<RequireAuth><AppShell><TasksPage /></AppShell></RequireAuth>} />
      <Route path="/party"     element={<RequireAuth><AppShell><PartyPage /></AppShell></RequireAuth>} />
      <Route path="/profile"   element={<RequireAuth><AppShell><ProfilePage /></AppShell></RequireAuth>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export function App() {
  const { initialize } = useAuthStore()

  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW()

  useEffect(() => {
    initialize()
  }, [])

  return (
    <BrowserRouter>
      <AppRoutes />
      {/* PWA update toast */}
      <AnimatePresence>
        {needRefresh && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            className="fixed bottom-24 left-4 right-4 max-w-sm mx-auto z-50
                       bg-ink-900 text-parchment-50 rounded-lg px-4 py-3
                       shadow-parchment-lg flex items-center justify-between gap-3"
          >
            <div>
              <p className="font-heading text-xs uppercase tracking-wide text-parchment-300">New Version</p>
              <p className="font-body text-sm">A new version is ready to sail.</p>
            </div>
            <button
              onClick={() => updateServiceWorker(true)}
              className="font-heading text-xs uppercase tracking-wider bg-sea-600 hover:bg-sea-500
                         text-white px-3 py-1.5 rounded transition-colors shrink-0"
            >
              Update
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </BrowserRouter>
  )
}