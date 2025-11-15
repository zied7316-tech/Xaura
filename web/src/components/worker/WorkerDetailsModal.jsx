import Modal from '../ui/Modal'
import Badge from '../ui/Badge'
import { uploadService } from '../../services/uploadService'
import { User, X, Award, Briefcase, GraduationCap, Star } from 'lucide-react'

const WorkerDetailsModal = ({ isOpen, onClose, worker }) => {
  if (!worker) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="space-y-6">
        {/* Header with Avatar and Name */}
        <div className="flex items-start gap-4 pb-4 border-b">
          <div className="flex-shrink-0">
            {worker.avatar ? (
              <img
                src={uploadService.getImageUrl(worker.avatar)}
                alt={worker.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-primary-200"
              />
            ) : (
              <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center border-4 border-primary-200">
                <User className="text-primary-600" size={40} />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{worker.name}</h2>
            {worker.currentStatus && (
              <Badge 
                variant={
                  worker.currentStatus === 'available' ? 'success' : 
                  worker.currentStatus === 'on_break' ? 'warning' : 
                  'default'
                }
                className="mb-2"
              >
                {worker.currentStatus === 'available' && '🟢 Available'}
                {worker.currentStatus === 'on_break' && '☕ On Break'}
                {worker.currentStatus === 'offline' && '🔴 Offline'}
              </Badge>
            )}
            <p className="text-gray-600">
              {worker.currentStatus === 'available' 
                ? 'Online now and ready to serve you' 
                : worker.currentStatus === 'on_break'
                ? 'Currently on break - can book for later'
                : 'Offline - can book for future dates'}
            </p>
          </div>
        </div>

        {/* Bio */}
        {worker.bio && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">About</h3>
            <p className="text-gray-700 leading-relaxed">{worker.bio}</p>
          </div>
        )}

        {/* Skills */}
        {worker.skills && worker.skills.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Star className="text-primary-600" size={20} />
              Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {worker.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {worker.experience && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Briefcase className="text-primary-600" size={20} />
              Experience
            </h3>
            <p className="text-gray-700 whitespace-pre-line leading-relaxed">{worker.experience}</p>
          </div>
        )}

        {/* Education */}
        {worker.education && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <GraduationCap className="text-primary-600" size={20} />
              Education
            </h3>
            <p className="text-gray-700 leading-relaxed">{worker.education}</p>
          </div>
        )}

        {/* Certifications */}
        {worker.certifications && worker.certifications.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Award className="text-primary-600" size={20} />
              Certifications
            </h3>
            <div className="space-y-2">
              {worker.certifications.map((cert, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg"
                >
                  <Award className="text-green-600" size={18} />
                  <span className="text-gray-700 font-medium">{cert}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State if no additional info */}
        {!worker.bio && (!worker.skills || worker.skills.length === 0) && !worker.experience && !worker.education && (!worker.certifications || worker.certifications.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            <User className="mx-auto mb-2 text-gray-400" size={32} />
            <p>No additional information available</p>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default WorkerDetailsModal

