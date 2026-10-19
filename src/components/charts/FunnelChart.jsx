const FunnelChart = ({ data }) => {
  if (!data || data.length === 0) return null

  return (
    <div className="space-y-3">
      {data.map((stage, index) => (
        <div key={stage.stage}>
          <div className="
            flex justify-between text-sm mb-1
          ">
            <span className="font-medium text-gray-700">
              {stage.stage}
            </span>
            <span className="text-gray-500">
              {stage.count.toLocaleString()}
              ({stage.percentage}%)
            </span>
          </div>
          <div className="
            w-full bg-gray-100 rounded-full h-8
            overflow-hidden relative
          ">
            <div
              className="h-full rounded-full
                flex items-center pl-3
                transition-all duration-500"
              style={{
                width: `${stage.percentage}%`,
                backgroundColor: stage.color
              }}
            >
              {stage.percentage > 15 && (
                <span className="
                  text-white text-xs font-medium
                ">
                  {stage.percentage}%
                </span>
              )}
            </div>
          </div>
          {/* Drop off indicator */}
          {index < data.length - 1 && stage.drop_off > 0 && (
            <p className="
              text-xs text-red-500 mt-1 text-right
            ">
              ▼ {stage.drop_off?.toFixed(1)}% dropped here
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

export default FunnelChart