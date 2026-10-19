import {
  PieChart, Pie, Cell,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const COLORS = [
  '#E1306C', // Instagram — pink
  '#1877F2', // Facebook — blue
  '#EA4335', // Google — red
  '#375623', // Organic — green
  '#6B7280', // Direct — grey
]

const TrafficSourceChart = ({ data }) => {
  if (!data || data.length === 0) return null

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={70}
          outerRadius={100}
          paddingAngle={3}
          dataKey="sessions"
          nameKey="source"
        >
          {data.map((entry, index) => (
            <Cell
              key={entry.source}
              fill={COLORS[index % COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [
            value.toLocaleString(),
            name
          ]}
          contentStyle={{ borderRadius: '8px' }}
        />
        <Legend
          iconType="circle"
          iconSize={10}
          formatter={(value) =>
            value.charAt(0).toUpperCase() + value.slice(1)
          }
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

export default TrafficSourceChart