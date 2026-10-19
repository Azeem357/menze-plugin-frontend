import {
  MdTrendingUp,
  MdTrendingDown
} from 'react-icons/md'

const KPICard = ({
  title,
  value,
  trend,
  trendValue,
  icon,
  iconBg,
  prefix = '',
  suffix = ''
}) => {
  const isPositive = trend === 'up'

  return (
    <div className="
      bg-white rounded-xl shadow-sm p-6
      border border-gray-100
      hover:shadow-md transition-shadow
    ">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-navy">
            {prefix}{value}{suffix}
          </p>
        </div>
        <div className={`
          w-12 h-12 rounded-xl
          flex items-center justify-center
          ${iconBg}
        `}>
          {icon}
        </div>
      </div>

      {/* Trend indicator */}
      {trendValue && (
        <div className={`
          flex items-center gap-1 mt-3 text-sm
          ${isPositive ? 'text-green-600' : 'text-red-500'}
        `}>
          {isPositive
            ? <MdTrendingUp size={18} />
            : <MdTrendingDown size={18} />
          }
          <span className="font-medium">
            {trendValue}
          </span>
          <span className="text-gray-400">
            vs last period
          </span>
        </div>
      )}
    </div>
  )
}

export default KPICard