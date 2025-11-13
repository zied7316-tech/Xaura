import { getStatusColor, capitalize } from '../../utils/helpers'

const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  }

  return (
    <span className={`badge ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}

export const StatusBadge = ({ status }) => {
  return (
    <span className={`badge ${getStatusColor(status)}`}>
      {capitalize(status)}
    </span>
  )
}

export default Badge

