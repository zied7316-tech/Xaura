import { useAuth } from '../../context/AuthContext'
import Card from '../../components/ui/Card'
import { User, Mail, Phone, Briefcase } from 'lucide-react'

const ProfilePage = () => {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-1">Manage your account information</p>
      </div>

      <div className="max-w-2xl">
        <Card>
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="text-primary-600" size={40} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{user?.name}</h2>
                <p className="text-gray-600">{user?.role}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-gray-700">
                <Mail size={20} />
                <span>{user?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <Phone size={20} />
                <span>{user?.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <Briefcase size={20} />
                <span>{user?.role}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default ProfilePage

