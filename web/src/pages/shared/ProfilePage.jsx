import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { profileService } from '../../services/profileService'
import { uploadService } from '../../services/uploadService'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import ImageUpload from '../../components/ui/ImageUpload'
import PushNotificationSetup from '../../components/notifications/PushNotificationSetup'
import { User, Mail, Phone, Briefcase, Edit2, Save, X, Trash2, Hash } from 'lucide-react'
import toast from 'react-hot-toast'

const ProfilePage = () => {
  const { user, updateUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState(null)
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    skills: user?.skills || [],
    experience: user?.experience || '',
    education: user?.education || '',
    certifications: user?.certifications || [],
    worksAsWorker: user?.worksAsWorker || false
  })

  const [newSkill, setNewSkill] = useState('')
  const [newCertification, setNewCertification] = useState('')

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        bio: user.bio || '',
        skills: user.skills || [],
        experience: user.experience || '',
        education: user.education || '',
        certifications: user.certifications || [],
        worksAsWorker: user.worksAsWorker || false
      })
    }
  }, [user])

  const handleSave = async () => {
    setLoading(true)
    try {
      // Upload avatar FIRST if selected (before updating profile to avoid conflicts)
      if (selectedAvatar && user?._id) {
        try {
          console.log('📤 Uploading user avatar for:', user._id, 'Role:', user.role)
          const uploadResult = await uploadService.uploadUserImage(user._id, selectedAvatar)
          console.log('✅ Avatar upload result:', uploadResult)
          toast.success('Profile picture updated!')
          // Refresh user data immediately after upload
          const refreshedUser = await profileService.getProfile()
          updateUser(refreshedUser)
        } catch (error) {
          console.error('❌ Avatar upload failed:', error)
          toast.error('Failed to upload profile picture: ' + (error.response?.data?.message || error.message))
          return // Stop here if upload fails
        }
      }
      
      // Then update profile data
      const updatedUser = await profileService.updateProfile(formData)
      updateUser(updatedUser)
      
      toast.success('Profile updated successfully!')
      setIsEditing(false)
      setSelectedAvatar(null)
    } catch (error) {
      console.error('❌ Profile update failed:', error)
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAvatar = async () => {
    if (!confirm('Are you sure you want to delete your profile picture?')) return
    
    try {
      console.log('🗑️ Deleting user avatar for:', user._id)
      await uploadService.deleteUserImage(user._id)
      toast.success('Profile picture deleted!')
      setSelectedAvatar(null)
      // Refresh user data
      const refreshedUser = await profileService.getProfile()
      updateUser(refreshedUser)
    } catch (error) {
      console.error('❌ Delete avatar failed:', error)
      toast.error('Failed to delete profile picture: ' + (error.response?.data?.message || error.message))
    }
  }

  const addSkill = () => {
    if (newSkill.trim()) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()]
      })
      setNewSkill('')
    }
  }

  const removeSkill = (index) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((_, i) => i !== index)
    })
  }

  const addCertification = () => {
    if (newCertification.trim()) {
      setFormData({
        ...formData,
        certifications: [...formData.certifications, newCertification.trim()]
      })
      setNewCertification('')
    }
  }

  const removeCertification = (index) => {
    setFormData({
      ...formData,
      certifications: formData.certifications.filter((_, i) => i !== index)
    })
  }

  const isWorker = user?.role === 'Worker'
  const isOwner = user?.role === 'Owner'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-1">Manage your account information</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Edit2 size={18} />
            Edit Profile
          </Button>
        )}
      </div>

      <div className="max-w-4xl">
        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Profile Picture */}
            <div className="flex items-center gap-6">
              {isEditing ? (
                <div className="flex-1 space-y-2">
                  <ImageUpload
                    label="Profile Picture"
                    currentImage={user?.avatar ? uploadService.getImageUrl(user.avatar) : null}
                    onImageSelect={setSelectedAvatar}
                    accept="image/*"
                    maxSize={5}
                  />
                  {user?.avatar && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeleteAvatar}
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                      Delete Current Picture
                    </Button>
                  )}
                </div>
              ) : (
                <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center overflow-hidden">
                  {user?.avatar ? (
                    <img
                      src={uploadService.getImageUrl(user.avatar)}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="text-primary-600" size={40} />
                  )}
                </div>
              )}
              <div className="flex-1">
                {isEditing ? (
                  <Input
                    label="Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                ) : (
                  <>
                    <h2 className="text-2xl font-bold">{user?.name}</h2>
                    <p className="text-gray-600">{user?.role}</p>
                  </>
                )}
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-gray-700">
                <Mail size={20} />
                <span>{user?.email}</span>
              </div>
              {isEditing ? (
                <Input
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              ) : (
                <div className="flex items-center gap-3 text-gray-700">
                  <Phone size={20} />
                  <span>{user?.phone}</span>
                </div>
              )}
            </div>

            {/* User ID Section */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-3">
                <Hash size={20} className="text-gray-500" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-mono font-semibold text-primary-600">
                      {user?.userID || 'Not assigned'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Your unique 4-digit identifier</p>
                </div>
              </div>
            </div>

            {/* Owner: Work as Worker Toggle */}
            {isOwner && (
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Work as Worker
                    </label>
                    <p className="text-xs text-gray-500">
                      Enable this to work as a barber and receive appointments. You'll appear in the workers list and can create walk-in appointments.
                    </p>
                  </div>
                  {isEditing ? (
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.worksAsWorker}
                        onChange={(e) => setFormData({ ...formData, worksAsWorker: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      user?.worksAsWorker 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {user?.worksAsWorker ? 'Enabled' : 'Disabled'}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Worker-Specific Fields */}
            {isWorker && (
              <>
                {/* Bio */}
                {isEditing ? (
                  <Textarea
                    label="Bio"
                    placeholder="Tell us about yourself..."
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                  />
                ) : (
                  formData.bio && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                      <p className="text-gray-700">{formData.bio}</p>
                    </div>
                  )
                )}

                {/* Skills */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          placeholder="Add a skill"
                          onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                        />
                        <Button type="button" onClick={addSkill}>Add</Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm flex items-center gap-2"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => removeSkill(index)}
                              className="text-primary-700 hover:text-primary-900"
                            >
                              <X size={14} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.length > 0 ? (
                        formData.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No skills added</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Experience */}
                {isEditing ? (
                  <Textarea
                    label="Experience"
                    placeholder="Describe your work experience..."
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    rows={3}
                  />
                ) : (
                  formData.experience && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
                      <p className="text-gray-700 whitespace-pre-line">{formData.experience}</p>
                    </div>
                  )
                )}

                {/* Education */}
                {isEditing ? (
                  <Textarea
                    label="Education"
                    placeholder="Your educational background..."
                    value={formData.education}
                    onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                    rows={2}
                  />
                ) : (
                  formData.education && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Education</label>
                      <p className="text-gray-700">{formData.education}</p>
                    </div>
                  )
                )}

                {/* Certifications */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Certifications</label>
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={newCertification}
                          onChange={(e) => setNewCertification(e.target.value)}
                          placeholder="Add a certification"
                          onKeyPress={(e) => e.key === 'Enter' && addCertification()}
                        />
                        <Button type="button" onClick={addCertification}>Add</Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.certifications.map((cert, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-2"
                          >
                            {cert}
                            <button
                              type="button"
                              onClick={() => removeCertification(index)}
                              className="text-green-700 hover:text-green-900"
                            >
                              <X size={14} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {formData.certifications.length > 0 ? (
                        formData.certifications.map((cert, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                          >
                            {cert}
                          </span>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No certifications added</p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex gap-3 pt-4 border-t">
                <Button onClick={handleSave} loading={loading} fullWidth>
                  <Save size={18} />
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false)
                    setSelectedAvatar(null)
                    // Reset form data
                    if (user) {
                      setFormData({
                        name: user.name || '',
                        phone: user.phone || '',
                        bio: user.bio || '',
                        skills: user.skills || [],
                        experience: user.experience || '',
                        education: user.education || '',
                        certifications: user.certifications || [],
                        worksAsWorker: user.worksAsWorker || false
                      })
                    }
                  }}
                  fullWidth
                >
                  <X size={18} />
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Push Notifications Setup */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Push Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <PushNotificationSetup />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ProfilePage
