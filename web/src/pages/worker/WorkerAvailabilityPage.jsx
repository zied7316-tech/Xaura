import { useState, useEffect } from 'react'
import { availabilityService } from '../../services/availabilityService'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Calendar, Clock, Save, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday'
}

const WorkerAvailabilityPage = () => {
  const [availability, setAvailability] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadAvailability()
  }, [])

  const loadAvailability = async () => {
    try {
      const data = await availabilityService.getMyAvailability()
      
      // If no availability exists, create a default template
      if (!data) {
        setAvailability({
          weeklySchedule: {
            monday: { isAvailable: false, slots: [] },
            tuesday: { isAvailable: false, slots: [] },
            wednesday: { isAvailable: false, slots: [] },
            thursday: { isAvailable: false, slots: [] },
            friday: { isAvailable: false, slots: [] },
            saturday: { isAvailable: false, slots: [] },
            sunday: { isAvailable: false, slots: [] }
          },
          defaultHours: { start: '09:00', end: '17:00' }
        })
      } else {
        setAvailability(data)
      }
    } catch (error) {
      console.error('Error loading availability:', error)
      toast.error('Failed to load availability')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleDay = (day) => {
    const currentDay = availability.weeklySchedule[day]
    const newIsAvailable = !currentDay.isAvailable
    
    // If toggling ON and no slots exist, add default slot
    const newSlots = newIsAvailable && currentDay.slots.length === 0
      ? [{ start: '09:00', end: '17:00' }]
      : currentDay.slots
    
    setAvailability({
      ...availability,
      weeklySchedule: {
        ...availability.weeklySchedule,
        [day]: {
          isAvailable: newIsAvailable,
          slots: newSlots
        }
      }
    })
  }

  const handleTimeChange = (day, index, field, value) => {
    const newSlots = [...availability.weeklySchedule[day].slots]
    newSlots[index][field] = value

    setAvailability({
      ...availability,
      weeklySchedule: {
        ...availability.weeklySchedule,
        [day]: {
          ...availability.weeklySchedule[day],
          slots: newSlots
        }
      }
    })
  }

  const handleAddSlot = (day) => {
    const newSlots = [
      ...availability.weeklySchedule[day].slots,
      { start: '09:00', end: '17:00' }
    ]

    setAvailability({
      ...availability,
      weeklySchedule: {
        ...availability.weeklySchedule,
        [day]: {
          ...availability.weeklySchedule[day],
          slots: newSlots
        }
      }
    })
  }

  const handleRemoveSlot = (day, index) => {
    const newSlots = availability.weeklySchedule[day].slots.filter((_, i) => i !== index)

    setAvailability({
      ...availability,
      weeklySchedule: {
        ...availability.weeklySchedule,
        [day]: {
          ...availability.weeklySchedule[day],
          slots: newSlots
        }
      }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await availabilityService.updateMyAvailability({
        weeklySchedule: availability.weeklySchedule,
        defaultHours: availability.defaultHours
      })
      toast.success('Availability updated successfully!')
    } catch (error) {
      console.error('Error saving availability:', error)
      toast.error('Failed to save availability')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Availability</h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">Set your working hours for each day</p>
        </div>
        <Button onClick={handleSave} loading={saving} className="w-full md:w-auto">
          <Save size={18} />
          <span className="hidden sm:inline">Save Changes</span>
          <span className="sm:hidden">Save</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {DAYS_OF_WEEK.map((day) => {
              const daySchedule = availability.weeklySchedule[day]
              
              return (
                <div key={day} className="border border-gray-200 rounded-lg p-3 md:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2 md:gap-3">
                      <Calendar size={18} className="text-primary-600 flex-shrink-0 md:w-5 md:h-5" />
                      <h3 className="font-semibold text-gray-900 text-base md:text-lg">{DAY_LABELS[day]}</h3>
                    </div>
                    
                    <button
                      onClick={() => handleToggleDay(day)}
                      className={`flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-lg transition-colors text-sm md:text-base ${
                        daySchedule.isAvailable
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {daySchedule.isAvailable ? (
                        <>
                          <ToggleRight size={18} className="md:w-5 md:h-5" />
                          <span className="font-medium">Available</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft size={18} className="md:w-5 md:h-5" />
                          <span className="font-medium">Not Available</span>
                        </>
                      )}
                    </button>
                  </div>

                  {daySchedule.isAvailable && (
                    <div className="space-y-3 ml-0 sm:ml-4 md:ml-8">
                      {daySchedule.slots.map((slot, index) => (
                        <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                            <Clock size={16} className="text-gray-400 flex-shrink-0" />
                            <Input
                              type="time"
                              value={slot.start}
                              onChange={(e) => handleTimeChange(day, index, 'start', e.target.value)}
                              className="flex-1 sm:w-32"
                            />
                            <span className="text-gray-500 text-sm sm:text-base">to</span>
                            <Input
                              type="time"
                              value={slot.end}
                              onChange={(e) => handleTimeChange(day, index, 'end', e.target.value)}
                              className="flex-1 sm:w-32"
                            />
                          </div>
                          {daySchedule.slots.length > 1 && (
                            <button
                              onClick={() => handleRemoveSlot(day, index)}
                              className="text-red-600 hover:text-red-700 text-sm font-medium px-2 py-1 sm:px-0 sm:py-0"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                      
                      <button
                        onClick={() => handleAddSlot(day)}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1 px-2 py-1"
                      >
                        + Add Time Slot
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end px-4 md:px-0">
        <Button onClick={handleSave} loading={saving} size="lg" className="w-full sm:w-auto">
          <Save size={20} />
          <span className="hidden sm:inline">Save Availability</span>
          <span className="sm:hidden">Save</span>
        </Button>
      </div>
    </div>
  )
}

export default WorkerAvailabilityPage

