import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/protected-route'
import DashboardLayout from './layouts/dashboard-layout'
import Dashboard from './pages/dashboard'
import Writing from './pages/writing'
import Speaking from './pages/speaking'
import Reading from './pages/reading'
import Listening from './pages/listening'
import Vocabulary from './pages/vocabulary'
import Login from './pages/login'
import { lazy, Suspense } from 'react'
import { Loader2 } from 'lucide-react'

const Simulation = lazy(() => import('./pages/simulation'))

import { GlobalErrorBoundary } from './components/GlobalErrorBoundary'

function App() {
  return (
    <GlobalErrorBoundary>
      <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="reading" element={<Reading />} />
            <Route path="writing" element={<Writing />} />
            <Route path="listening" element={<Listening />} />
            <Route path="speaking" element={<Speaking />} />
            <Route path="vocabulary" element={<Vocabulary />} />
            <Route path="simulation" element={
              <Suspense fallback={<div className="flex h-full items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
                <Simulation />
              </Suspense>
            } />
          </Route>
        </Route>
      </Routes>
      </AuthProvider>
    </GlobalErrorBoundary>
  )
}

export default App
