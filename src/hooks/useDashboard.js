import { useState, useEffect } from 'react'
import { getDashboardOverview } from '../api/analyticsApi'

export const useDashboard = (days = 30) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await getDashboardOverview(days)
        setData(res.data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [days])

  return { data, loading, error }
}