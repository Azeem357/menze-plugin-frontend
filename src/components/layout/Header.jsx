import { useState } from 'react'
import { MdNotifications, MdRefresh } from 'react-icons/md'
import { triggerCalculation } from '../../api/analyticsApi'
import { toast } from 'react-toastify'

const Header = ({ title, days, setDays }) => {
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      await triggerCalculation()
      toast.success('Metrics recalculated successfully')
      window.location.reload()
    } catch {
      toast.error('Failed to recalculate metrics')
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="
      bg-white shadow-sm px-6 py-4
      flex items-center justify-between
      sticky top-0 z-40
    ">
      {/* Page title */}
      <h2 className="text-xl font-bold text-navy">
        {title}
      </h2>

      {/* Right side controls */}
      <div className="flex items-center gap-4">

        {/* Date range */}
        {setDays && (
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="
              text-sm border border-gray-200
              rounded-lg px-3 py-2 text-gray-600
              focus:outline-none focus:border-navy
            "
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        )}

        {/* Refresh button */}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="
            flex items-center gap-2 text-sm
            bg-navy text-white px-4 py-2
            rounded-lg hover:bg-navy-light
            transition-colors disabled:opacity-50
          "
        >
          <MdRefresh
            size={18}
            className={refreshing ? 'animate-spin' : ''}
          />
          {refreshing ? 'Calculating...' : 'Refresh'}
        </button>

        {/* Notification bell */}
        <button className="relative p-2">
          <MdNotifications
            size={24}
            className="text-gray-500"
          />
          <span className="
            absolute top-1 right-1
            w-4 h-4 bg-red-500 rounded-full
            text-white text-xs
            flex items-center justify-center
          ">
            3
          </span>
        </button>
      </div>
    </div>
  )
}

export default Header