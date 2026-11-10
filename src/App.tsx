import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/protected-route'
import DashboardLayout from './layouts/dashboard-layout'
import { Loader2 } from 'lucide-react'
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary'

// Route-level code splitting for performance and fast initial page loads
const Dashboard = lazy(() => import('./pages/dashboard'))
const Writing = lazy(() => import('./pages/writing'))
const Speaking = lazy(() => import('./pages/speaking'))
const Reading = lazy(() => import('./pages/reading'))
const Listening = lazy(() => import('./pages/listening'))
const Vocabulary = lazy(() => import('./pages/vocabulary'))
const Login = lazy(() => import('./pages/login'))
const PrivacyPolicy = lazy(() => import('./pages/privacy'))
const Simulation = lazy(() => import('./pages/simulation'))

function PageFallback() {
  return (
    <div className="flex h-64 w-full items-center justify-center p-8">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  )
}

function App() {
  return (
    <GlobalErrorBoundary>
      <AuthProvider>
        <Suspense fallback={<PageFallback />}>
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
                <Route path="privacy" element={<PrivacyPolicy />} />
                <Route path="simulation" element={<Simulation />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </GlobalErrorBoundary>
  )
}

export default App
