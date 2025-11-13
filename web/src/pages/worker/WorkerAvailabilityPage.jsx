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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Availability</h1>
          <p className="text-gray-600 mt-1">Set your working hours for each day</p>
        </div>
        <Button onClick={handleSave} loading={saving}>
          <Save size={18} />
          Save Changes
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
                <div key={day} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Calendar size={20} className="text-primary-600" />
                      <h3 className="font-semibold text-gray-900">{DAY_LABELS[day]}</h3>
                    </div>
                    
                    <button
                      onClick={() => handleToggleDay(day)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        daySchedule.isAvailable
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {daySchedule.isAvailable ? (
                        <>
                          <ToggleRight size={20} />
                          <span className="font-medium">Available</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft size={20} />
                          <span className="font-medium">Not Available</span>
                        </>
                      )}
                    </button>
                  </div>

                  {daySchedule.isAvailable && (
                    <div className="space-y-3 ml-8">
                      {daySchedule.slots.map((slot, index) => (
                        <div key={index} className="flex items-center gap-4">
                          <Clock size={16} className="text-gray-400" />
                          <Input
                            type="time"
                            value={slot.start}
                            onChange={(e) => handleTimeChange(day, index, 'start', e.target.value)}
                            className="w-32"
                          />
                          <span className="text-gray-500">to</span>
                          <Input
                            type="time"
                            value={slot.end}
                            onChange={(e) => handleTimeChange(day, index, 'end', e.target.value)}
                            className="w-32"
                          />
                          {daySchedule.slots.length > 1 && (
                            <button
                              onClick={() => handleRemoveSlot(day, index)}
                              className="text-red-600 hover:text-red-700 text-sm font-medium"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                      
                      <button
                        onClick={() => handleAddSlot(day)}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
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

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving} size="lg">
          <Save size={20} />
          Save Availability
        </Button>
      </div>
    </div>
  )
}

export default WorkerAvailabilityPage

