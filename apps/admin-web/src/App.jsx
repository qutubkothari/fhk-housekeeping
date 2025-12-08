import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { LanguageProvider } from './contexts/LanguageContext'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import RealTimeMonitor from './pages/RealTimeMonitor'
import AssetManagement from './pages/AssetManagement'
import StaffAssignments from './pages/StaffAssignments'
import Rooms from './pages/Rooms'
import Housekeeping from './pages/Housekeeping'
import Inventory from './pages/Inventory'
import Linen from './pages/Linen'
import ServiceRequests from './pages/ServiceRequests'
import Staff from './pages/Staff'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

// Layout
import Layout from './components/Layout'

// Role-based default page redirect
function RoleBasedRedirect() {
  const { user } = useAuthStore()
  
  if (!user) return <Navigate to="/login" />
  
  // Redirect to role-specific default page
  switch (user.role) {
    case 'inventory':
      return <Navigate to="/inventory" replace />
    case 'laundry':
      return <Navigate to="/linen" replace />
    case 'maintenance':
      return <Navigate to="/service-requests" replace />
    default:
      return <Dashboard />
  }
}

function App() {
  const { user, loading, initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          
          <Route path="/" element={user ? <Layout /> : <Navigate to="/login" />}>
            <Route index element={<RoleBasedRedirect />} />
            <Route path="monitor" element={<RealTimeMonitor />} />
            <Route path="assets" element={<AssetManagement />} />
            <Route path="staff-carts" element={<StaffAssignments />} />
            <Route path="rooms" element={<Rooms />} />
            <Route path="housekeeping" element={<Housekeeping />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="linen" element={<Linen />} />
            <Route path="service-requests" element={<ServiceRequests />} />
            <Route path="staff" element={<Staff />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  )
}

export default App
