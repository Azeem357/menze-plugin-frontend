/* Fetch the summary format returned by the backend dashboard endpoint. */
import { useEffect, useState } from 'react'
import { getDashboardOverview } from '../api/analyticsApi'
import { financialDemoData } from '../data/financialDemoData'

export const useFinancials = (days = 30, granularity = 'monthly') => {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const demoMode = import.meta.env.DEV
    && new URLSearchParams(window.location.search).get('demo') === 'true'

  useEffect(() => {
    let active = true
    setState((s) => ({ ...s, loading: true, error: null }))

    if (demoMode) {
      setState({ data: financialDemoData, loading: false, error: null })
      return () => { active = false }
    }

    getDashboardOverview(days)
      .then((res) => {
        if (active) setState({ data: res.data, loading: false, error: null })
      })
      .catch((err) => {
        if (active) {
          setState({ data: null, loading: false, error: err.message || 'Could not load financial data' })
        }
      })

    return () => { active = false }
  }, [days, demoMode, granularity])

  return state
}
