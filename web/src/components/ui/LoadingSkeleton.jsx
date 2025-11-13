import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

// Card Skeleton
export const CardSkeleton = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <Skeleton height={24} width="60%" className="mb-2" />
    <Skeleton count={3} />
  </div>
)

// Table Skeleton
export const TableSkeleton = ({ rows = 5, columns = 5 }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full">
      <thead>
        <tr>
          {Array(columns).fill(0).map((_, i) => (
            <th key={i} className="px-6 py-3">
              <Skeleton width={80} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array(rows).fill(0).map((_, rowIndex) => (
          <tr key={rowIndex}>
            {Array(columns).fill(0).map((_, colIndex) => (
              <td key={colIndex} className="px-6 py-4">
                <Skeleton width={100} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

// Stats Card Skeleton
export const StatsCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <Skeleton width={100} height={14} className="mb-2" />
        <Skeleton width={80} height={32} />
      </div>
      <Skeleton circle width={48} height={48} />
    </div>
  </div>
)

// List Item Skeleton
export const ListItemSkeleton = () => (
  <div className="border rounded-lg p-4">
    <div className="flex items-center gap-4">
      <Skeleton circle width={48} height={48} />
      <div className="flex-1">
        <Skeleton width="60%" height={20} className="mb-2" />
        <Skeleton width="40%" height={16} />
      </div>
    </div>
  </div>
)

export default Skeleton




