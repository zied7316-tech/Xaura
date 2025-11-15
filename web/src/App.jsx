import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Layout
import MainLayout from './components/layout/MainLayout'
import ProtectedRoute from './components/auth/ProtectedRoute'

// Public pages
import LandingPage from './pages/public/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import RegisterSalonPage from './pages/auth/RegisterSalonPage'
import VerifyEmailPage from './pages/auth/VerifyEmailPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import ScanQRPage from './pages/public/ScanQRPage'

// Owner pages
import OwnerDashboard from './pages/owner/OwnerDashboard'
import SalonSettings from './pages/owner/SalonSettings'
import ServicesPage from './pages/owner/ServicesPage'
import WorkersPage from './pages/owner/WorkersPage'
import FinancesPage from './pages/owner/FinancesPage'
import CustomersPage from './pages/owner/CustomersPage'
import InventoryPage from './pages/owner/InventoryPage'
import OwnerReportsPage from './pages/owner/ReportsPage'
import WorkerPaymentsPage from './pages/owner/WorkerPaymentsPage'
import WorkerAnalyticsPage from './pages/owner/WorkerAnalyticsPage'
import SalonClientsPage from './pages/owner/SalonClientsPage'
import ReminderSettingsPage from './pages/owner/ReminderSettingsPage'
import LoyaltySettingsPage from './pages/owner/LoyaltySettingsPage'
import MySalonsPage from './pages/owner/MySalonsPage'

// Super Admin pages
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard'
import SalonManagementPage from './pages/superadmin/SalonManagementPage'
import UsersPage from './pages/superadmin/UsersPage'
import AnalyticsPage from './pages/superadmin/AnalyticsPage'
import SubscriptionsPage from './pages/superadmin/SubscriptionsPage'
import ActivityLogsPage from './pages/superadmin/ActivityLogsPage'
import BillingPage from './pages/superadmin/BillingPage'
import SuperAdminReportsPage from './pages/superadmin/ReportsPage'
import EmailCampaignsPage from './pages/superadmin/EmailCampaignsPage'
import SupportTicketsPage from './pages/superadmin/SupportTicketsPage'

// Worker pages
import WorkerDashboard from './pages/worker/WorkerDashboard'
import WorkerFinancePage from './pages/worker/WorkerFinancePage'
import WorkerAvailabilityPage from './pages/worker/WorkerAvailabilityPage'
import WorkerAppointmentsPage from './pages/worker/WorkerAppointmentsPage'
import WorkerWalkInPage from './pages/worker/WorkerWalkInPage'

// Client pages
import ClientDashboard from './pages/client/ClientDashboard'
import BookingPage from './pages/client/BookingPage'
import BookAppointmentPage from './pages/client/BookAppointmentPage'
import SalonSearchPage from './pages/client/SalonSearchPage'
import SalonDetailsPage from './pages/client/SalonDetailsPage'
import JoinSalonPage from './pages/client/JoinSalonPage'
import ClientRewardsPage from './pages/client/ClientRewardsPage'
import AdvancedBookingPage from './pages/client/AdvancedBookingPage'

// Shared pages
import AppointmentsPage from './pages/shared/AppointmentsPage'
import ProfilePage from './pages/shared/ProfilePage'
import ChatPage from './pages/shared/ChatPage'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Redirect to appropriate dashboard based on role
  const getDashboardRoute = () => {
    if (!user) return '/login'
    switch (user.role) {
      case 'SuperAdmin':
      case 'super-admin': // Support both formats
        return '/super-admin/dashboard'
      case 'Owner':
        return '/owner/dashboard'
      case 'Worker':
        return '/worker/dashboard'
      case 'Client':
        return '/client/dashboard'
      default:
        return '/login'
    }
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={user ? <Navigate to={getDashboardRoute()} /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to={getDashboardRoute()} /> : <RegisterPage />} />
      <Route path="/register-salon" element={user ? <Navigate to={getDashboardRoute()} /> : <RegisterSalonPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/scan/:qrCode" element={<ScanQRPage />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        {/* Super Admin routes */}
        <Route path="/super-admin/dashboard" element={<ProtectedRoute roles={['SuperAdmin']}><SuperAdminDashboard /></ProtectedRoute>} />
        <Route path="/super-admin/salons" element={<ProtectedRoute roles={['SuperAdmin']}><SalonManagementPage /></ProtectedRoute>} />
        <Route path="/super-admin/users" element={<ProtectedRoute roles={['SuperAdmin']}><UsersPage /></ProtectedRoute>} />
        <Route path="/super-admin/analytics" element={<ProtectedRoute roles={['SuperAdmin']}><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/super-admin/subscriptions" element={<ProtectedRoute roles={['SuperAdmin']}><SubscriptionsPage /></ProtectedRoute>} />
        <Route path="/super-admin/activity-logs" element={<ProtectedRoute roles={['SuperAdmin']}><ActivityLogsPage /></ProtectedRoute>} />
        <Route path="/super-admin/billing" element={<ProtectedRoute roles={['SuperAdmin']}><BillingPage /></ProtectedRoute>} />
        <Route path="/super-admin/reports" element={<ProtectedRoute roles={['SuperAdmin']}><SuperAdminReportsPage /></ProtectedRoute>} />
        <Route path="/super-admin/campaigns" element={<ProtectedRoute roles={['SuperAdmin']}><EmailCampaignsPage /></ProtectedRoute>} />
        <Route path="/super-admin/support" element={<ProtectedRoute roles={['SuperAdmin']}><SupportTicketsPage /></ProtectedRoute>} />
        
        {/* Owner routes */}
        <Route path="/owner/dashboard" element={<ProtectedRoute roles={['Owner']}><OwnerDashboard /></ProtectedRoute>} />
        <Route path="/owner/salons" element={<ProtectedRoute roles={['Owner']}><MySalonsPage /></ProtectedRoute>} />
        <Route path="/owner/salon" element={<ProtectedRoute roles={['Owner']}><SalonSettings /></ProtectedRoute>} />
        <Route path="/owner/services" element={<ProtectedRoute roles={['Owner']}><ServicesPage /></ProtectedRoute>} />
        <Route path="/owner/workers" element={<ProtectedRoute roles={['Owner']}><WorkersPage /></ProtectedRoute>} />
        <Route path="/owner/finances" element={<ProtectedRoute roles={['Owner']}><FinancesPage /></ProtectedRoute>} />
        <Route path="/owner/customers" element={<ProtectedRoute roles={['Owner']}><CustomersPage /></ProtectedRoute>} />
            <Route path="/owner/inventory" element={<ProtectedRoute roles={['Owner']}><InventoryPage /></ProtectedRoute>} />
            <Route path="/owner/reports" element={<ProtectedRoute roles={['Owner']}><OwnerReportsPage /></ProtectedRoute>} />
            <Route path="/owner/worker-payments" element={<ProtectedRoute roles={['Owner']}><WorkerPaymentsPage /></ProtectedRoute>} />
            <Route path="/owner/worker-analytics" element={<ProtectedRoute roles={['Owner']}><WorkerAnalyticsPage /></ProtectedRoute>} />
            <Route path="/owner/salon-clients" element={<ProtectedRoute roles={['Owner']}><SalonClientsPage /></ProtectedRoute>} />
            <Route path="/owner/reminders" element={<ProtectedRoute roles={['Owner']}><ReminderSettingsPage /></ProtectedRoute>} />
            <Route path="/owner/loyalty" element={<ProtectedRoute roles={['Owner']}><LoyaltySettingsPage /></ProtectedRoute>} />
            
            {/* Worker Routes */}
            <Route path="/worker/finances" element={<ProtectedRoute roles={['Worker']}><WorkerFinancePage /></ProtectedRoute>} />

        {/* Worker routes */}
        <Route path="/worker/dashboard" element={<ProtectedRoute roles={['Worker']}><WorkerDashboard /></ProtectedRoute>} />
        <Route path="/worker/availability" element={<ProtectedRoute roles={['Worker']}><WorkerAvailabilityPage /></ProtectedRoute>} />
        <Route path="/worker/appointments" element={<ProtectedRoute roles={['Worker']}><WorkerAppointmentsPage /></ProtectedRoute>} />
        <Route path="/worker/walk-in" element={<ProtectedRoute roles={['Worker']}><WorkerWalkInPage /></ProtectedRoute>} />

        {/* Client routes */}
        <Route path="/client/dashboard" element={<ProtectedRoute roles={['Client']}><ClientDashboard /></ProtectedRoute>} />
        <Route path="/search-salons" element={<ProtectedRoute roles={['Client']}><SalonSearchPage /></ProtectedRoute>} />
        <Route path="/join-salon" element={<ProtectedRoute roles={['Client']}><JoinSalonPage /></ProtectedRoute>} />
        <Route path="/salon/:salonId" element={<ProtectedRoute roles={['Client']}><SalonDetailsPage /></ProtectedRoute>} />
        <Route path="/book" element={<ProtectedRoute roles={['Client']}><BookAppointmentPage /></ProtectedRoute>} />
        <Route path="/client/book/:salonId" element={<ProtectedRoute roles={['Client']}><BookingPage /></ProtectedRoute>} />
        <Route path="/client/rewards" element={<ProtectedRoute roles={['Client']}><ClientRewardsPage /></ProtectedRoute>} />
        <Route path="/client/advanced-booking" element={<ProtectedRoute roles={['Client']}><AdvancedBookingPage /></ProtectedRoute>} />

        {/* Shared routes */}
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/messages" element={<ChatPage />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to={getDashboardRoute()} />} />
    </Routes>
  )
}

export default App

