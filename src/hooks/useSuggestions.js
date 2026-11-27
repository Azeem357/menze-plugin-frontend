import { useState, useEffect } from 'react'
import {
  getSuggestions,
  getSuggestionStats,
  generateSuggestions,
  markActedOn
} from '../api/suggestionsApi'

export const useSuggestions = (filters = {}) => {
  const [suggestions, setSuggestions] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAll = async () => {
    try {
      setLoading(true)
      setError('')
      await generateSuggestions()
      const [suggRes, statsRes] = await Promise.all([
        getSuggestions(filters),
        getSuggestionStats()
      ])
      setSuggestions(suggRes.data)
      setStats(statsRes.data)
    } catch (err) {
      setError(
        err.response?.data?.error
        || err.message
        || 'Could not load suggestions.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [JSON.stringify(filters)])

  const handleMarkDone = async (id) => {
    try {
      await markActedOn(id)
      await fetchAll()
    } catch (err) {
      setError(
        err.response?.data?.error
        || err.message
        || 'Could not update the suggestion.'
      )
    }
  }

  return { suggestions, stats, loading, error, refresh: fetchAll, handleMarkDone }
}