import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { formatDate } from '../../utils/formatters'

const RevenueChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="
        h-64 flex items-center justify-center
        text-gray-400 text-sm
      ">
        No data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient
            id="revenueGradient"
            x1="0" y1="0" x2="0" y2="1"
          >
            <stop
              offset="5%"
              stopColor="#002060"
              stopOpacity={0.2}
            />
            <stop
              offset="95%"
              stopColor="#002060"
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#f0f0f0"
        />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fontSize: 11, fill: '#6B7280' }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) =>
            `PKR ${(v / 1000).toFixed(0)}k`
          }
          tick={{ fontSize: 11, fill: '#6B7280' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          formatter={(value) =>
            [`PKR ${value.toLocaleString()}`, 'Revenue']
          }
          labelFormatter={formatDate}
          contentStyle={{
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
          }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#002060"
          strokeWidth={2}
          fill="url(#revenueGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export default RevenueChart