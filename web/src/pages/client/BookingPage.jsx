// Simplified Booking Page - Full implementation in final version
import { useParams } from 'react-router-dom'
import Card from '../../components/ui/Card'

const BookingPage = () => {
  const { salonId } = useParams()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Book Appointment</h1>
        <p className="text-gray-600 mt-1">Select a service and time slot</p>
      </div>

      <Card className="p-8 text-center text-gray-500">
        Booking interface will be here<br />
        Salon ID: {salonId}
      </Card>
    </div>
  )
}

export default BookingPage

