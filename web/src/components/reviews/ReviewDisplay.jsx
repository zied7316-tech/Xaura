import { Star } from 'lucide-react'
import { formatDate } from '../../utils/helpers'
import { uploadService } from '../../services/uploadService'
import { User } from 'lucide-react'

const ReviewDisplay = ({ reviews, stats }) => {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <Star className="mx-auto mb-2 text-gray-400" size={24} />
        <p className="text-sm">No reviews yet</p>
      </div>
    )
  }

  const renderStars = (rating) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      {stats && stats.totalReviews > 0 && (
        <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Star className="text-yellow-400 fill-yellow-400" size={20} />
              <span className="text-2xl font-bold text-gray-900">
                {stats.averageOverall?.toFixed(1) || '0.0'}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
              </p>
              {stats.recommendPercentage > 0 && (
                <p className="text-xs text-gray-500">
                  {stats.recommendPercentage}% recommend
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {reviews.map((review) => (
          <div
            key={review._id}
            className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
          >
            <div className="flex items-start gap-3">
              {/* Client Avatar */}
              <div className="flex-shrink-0">
                {review.clientId?.avatar ? (
                  <img
                    src={uploadService.getImageUrl(review.clientId.avatar)}
                    alt={review.clientId.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="text-gray-400" size={20} />
                  </div>
                )}
              </div>

              {/* Review Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {review.clientId?.name || 'Anonymous'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(review.createdAt)}
                    </p>
                  </div>
                  {renderStars(review.overallRating)}
                </div>

                {review.comment && (
                  <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                    {review.comment}
                  </p>
                )}

                {/* Service Info */}
                {review.serviceId && (
                  <p className="text-xs text-gray-500 mt-2">
                    Service: {review.serviceId.name}
                  </p>
                )}

                {/* Would Recommend */}
                {review.wouldRecommend && (
                  <div className="mt-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                      ✓ Recommended
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ReviewDisplay

