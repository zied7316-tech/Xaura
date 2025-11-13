import { useState, useEffect } from 'react'
import { workerStatusService } from '../../services/workerStatusService'
import { CheckCircle, Coffee, XCircle, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

const WorkerStatusToggle = () => {
  const [currentStatus, setCurrentStatus] = useState('available')
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    try {
      const data = await workerStatusService.getMyStatus()
      setCurrentStatus(data.currentStatus || 'offline')
    } catch (error) {
      console.error('Error loading status:', error)
    }
  }

  const handleStatusChange = async (newStatus) => {
    setLoading(true)
    try {
      await workerStatusService.toggleStatus(newStatus)
      setCurrentStatus(newStatus)
      setShowDropdown(false)
      
      const messages = {
        available: '✅ You are now Available for appointments',
        on_break: '☕ Status set to On Break',
        offline: '🔴 You are now Offline'
      }
      toast.success(messages[newStatus])
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  const statusConfig = {
    available: {
      label: 'Available',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      hoverBg: 'hover:bg-green-200',
      borderColor: 'border-green-300'
    },
    on_break: {
      label: 'On Break',
      icon: Coffee,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      hoverBg: 'hover:bg-orange-200',
      borderColor: 'border-orange-300'
    },
    offline: {
      label: 'Offline',
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      hoverBg: 'hover:bg-red-200',
      borderColor: 'border-red-300'
    }
  }

  const current = statusConfig[currentStatus]
  const CurrentIcon = current.icon

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={loading}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${current.bgColor} ${current.borderColor} ${current.hoverBg} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <CurrentIcon size={18} className={current.color} />
        <span className={`font-medium text-sm ${current.color}`}>
          {current.label}
        </span>
        <ChevronDown size={16} className={current.color} />
      </button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
            <div className="px-3 py-2 border-b border-gray-100">
              <p className="text-xs text-gray-500 font-medium">Change Status</p>
            </div>
            
            {Object.entries(statusConfig).map(([status, config]) => {
              const Icon = config.icon
              const isActive = status === currentStatus
              
              return (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={loading || isActive}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors ${
                    isActive 
                      ? `${config.bgColor} cursor-default`
                      : 'hover:bg-gray-50 cursor-pointer'
                  } ${loading ? 'opacity-50' : ''}`}
                >
                  <Icon size={18} className={config.color} />
                  <span className={`font-medium text-sm ${config.color}`}>
                    {config.label}
                  </span>
                  {isActive && (
                    <span className="ml-auto text-xs text-gray-500">✓</span>
                  )}
                </button>
              )
            })}

            <div className="px-3 py-2 border-t border-gray-100 mt-2">
              <p className="text-xs text-gray-500">
                ℹ️ Your status affects booking availability
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default WorkerStatusToggle

