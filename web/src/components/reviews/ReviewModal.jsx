import { useState } from 'react'
import { reviewService } from '../../services/reviewService'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Textarea from '../ui/Textarea'
import { Star } from 'lucide-react'
import toast from 'react-hot-toast'

const ReviewModal = ({ isOpen, onClose, appointment, onReviewSubmitted }) => {
  const [ratings, setRatings] = useState({
    overallRating: 0,
    qualityRating: 0,
    punctualityRating: 0,
    friendlinessRating: 0
  })
  const [comment, setComment] = useState('')
  const [wouldRecommend, setWouldRecommend] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const handleRatingClick = (category, value) => {
    setRatings({ ...ratings, [category]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (ratings.overallRating === 0) {
      toast.error('Please select an overall rating')
      return
    }

    setSubmitting(true)

    try {
      await reviewService.createReview({
        appointmentId: appointment._id,
        ...ratings,
        comment,
        wouldRecommend
      })
      toast.success('Thank you for your review! ⭐')
      onClose()
      if (onReviewSubmitted) onReviewSubmitted()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const StarRating = ({ value, onChange, label }) => {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className="focus:outline-none"
            >
              <Star
                size={32}
                className={star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
              />
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (!appointment) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rate Your Experience" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Service Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-600">Service</p>
          <p className="font-semibold">{appointment.serviceId?.name}</p>
          <p className="text-sm text-gray-600 mt-1">with {appointment.workerId?.name}</p>
        </div>

        {/* Overall Rating */}
        <StarRating
          label="Overall Rating"
          value={ratings.overallRating}
          onChange={(value) => handleRatingClick('overallRating', value)}
        />

        {/* Detailed Ratings */}
        <div className="border-t pt-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Detailed Ratings (Optional)</p>
          
          <StarRating
            label="Service Quality"
            value={ratings.qualityRating}
            onChange={(value) => handleRatingClick('qualityRating', value)}
          />

          <StarRating
            label="Punctuality"
            value={ratings.punctualityRating}
            onChange={(value) => handleRatingClick('punctualityRating', value)}
          />

          <StarRating
            label="Friendliness"
            value={ratings.friendlinessRating}
            onChange={(value) => handleRatingClick('friendlinessRating', value)}
          />
        </div>

        {/* Comment */}
        <Textarea
          label="Your Review (Optional)"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience..."
          maxLength={1000}
        />

        {/* Would Recommend */}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={wouldRecommend}
            onChange={(e) => setWouldRecommend(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700">I would recommend this service</span>
        </label>

        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <Button type="submit" fullWidth loading={submitting}>
            <Star size={18} />
            Submit Review
          </Button>
          <Button type="button" variant="outline" onClick={onClose} fullWidth>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default ReviewModal




