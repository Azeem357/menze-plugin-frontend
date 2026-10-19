import { useState, useEffect } from 'react'
import {
  getSuggestions,
  getSuggestionStats,
  markActedOn
} from '../api/suggestionsApi'

export const useSuggestions = (filters = {}) => {
  const [suggestions, setSuggestions] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchAll = async () => {
    try {
      setLoading(true)
      const [suggRes, statsRes] = await Promise.all([
        getSuggestions(filters),
        getSuggestionStats()
      ])
      setSuggestions(suggRes.data)
      setStats(statsRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [JSON.stringify(filters)])

  const handleMarkDone = async (id) => {
    await markActedOn(id)
    fetchAll()
  }

  return { suggestions, stats, loading, handleMarkDone }
}