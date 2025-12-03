import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Calendar, UserPlus } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

const WorkerDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { t } = useLanguage()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {t('worker.myDashboard', 'Worker Dashboard')}
        </h1>
        <p className="text-gray-600 mt-1">
          {t('worker.welcome', 'Welcome')}, {user?.name}
          {user?.userID && (
            <span className="ml-2 text-sm font-mono text-primary-600">#{user.userID}</span>
          )}
        </p>
      </div>

      {/* Quick Action: Walk-in Client */}
      <Card className="bg-gradient-to-r from-primary-50 to-purple-50 border-2 border-primary-200">
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
              <UserPlus className="text-white" size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {t('worker.walkInClients', 'Walk-in Client')}
              </h3>
              <p className="text-gray-600">
                {t('worker.walkInDescription', 'Client came without booking? Add them here')}
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate('/worker/walk-in')}
            size="lg"
            className="bg-primary-600 hover:bg-primary-700"
          >
            <UserPlus size={20} />
            {t('worker.addWalkInClient', 'Add Walk-in Client')}
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="text-center p-6">
            <Calendar className="mx-auto text-primary-600 mb-4" size={48} />
            <p className="text-2xl font-bold">0</p>
            <p className="text-gray-600">
              {t('worker.todaysAppointments', "Today's Appointments")}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center p-6">
            <Calendar className="mx-auto text-blue-600 mb-4" size={48} />
            <p className="text-2xl font-bold">0</p>
            <p className="text-gray-600">
              {t('worker.thisWeek', 'This Week')}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center p-6">
            <Calendar className="mx-auto text-green-600 mb-4" size={48} />
            <p className="text-2xl font-bold">0</p>
            <p className="text-gray-600">
              {t('worker.completed', 'Completed')}
            </p>
          </div>
        </Card>
      </div>

      <Card className="p-8 text-center text-gray-500">
        {t('worker.appointmentsEmpty', 'Your appointments will appear here')}
      </Card>
    </div>
  )
}

export default WorkerDashboard

