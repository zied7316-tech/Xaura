import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Check if user has required role
  // Normalize role for comparison (handle both 'SuperAdmin' and 'super-admin')
  const normalizedRole = user.role === 'super-admin' ? 'SuperAdmin' : user.role
  
  // SECURITY: If roles are specified, verify user has one of the required roles
  if (roles.length > 0) {
    const hasRequiredRole = roles.includes(user.role) || roles.includes(normalizedRole)
    
    if (!hasRequiredRole) {
      // Redirect to appropriate dashboard based on user role
      const dashboards = {
        SuperAdmin: '/super-admin/dashboard',
        'super-admin': '/super-admin/dashboard',
        Owner: '/owner/dashboard',
        Worker: '/worker/dashboard',
        Client: '/client/dashboard',
      }
      return <Navigate to={dashboards[user.role] || dashboards[normalizedRole] || '/'} replace />
    }
  }

  return children
}

export default ProtectedRoute

