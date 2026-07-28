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
import Simulation from './pages/simulation'
import Login from './pages/login'
import Signup from './pages/signup'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        <Route path="/" element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="reading" element={<Reading />} />
            <Route path="writing" element={<Writing />} />
            <Route path="listening" element={<Listening />} />
            <Route path="speaking" element={<Speaking />} />
            <Route path="vocabulary" element={<Vocabulary />} />
            <Route path="simulation" element={<Simulation />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
