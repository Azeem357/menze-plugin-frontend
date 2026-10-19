import { useState, useEffect } from 'react'
import { getFunnel } from '../api/analyticsApi'

export const useFunnel = (days = 30) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await getFunnel(days)
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