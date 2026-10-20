/* ============================================================
   hooks/useFinancials.js
   Same contract as useDashboard / useFunnel: returns
   { data, loading, error }.

   ► Change FINANCIALS_ENDPOINT (or swap the fetch for your axios
     instance) to match your backend. Expected JSON:

   {
     "summary":   { "avg_roas": 3.2, "avg_cac": 847, "avg_ltv": 12400,
                    "roas_change": 14.2, "cac_change": -5.8, "ltv_change": 2.4 },
     "previous_summary": { … }                 // optional, used if *_change is missing
     "targets":    { "roas": 4.0 },            // optional
     "benchmarks": { "cac": 920 },             // optional
     "ltv_months": 12,                         // optional
     "platforms":  [ { "platform": "Google Ads Search", "roas": 4.2 }, … ],
     "campaigns":  [ { "name": "Ramadan Sale", "channel": "Search Network",
                       "roas": 4.82, "profit": 2400000 }, … ],
     "cohort_periods": [0, 1, 2, 3, 6, 12],    // optional
     "cohorts":    [ { "cohort": "Jan 2024", "size": 1240,
                       "values": [4200, 5100, 6800, 8200, 10100, 12400] }, … ]
   }
   ============================================================ */
import { useEffect, useState } from 'react'
import { getMetrics } from '../api/analyticsApi'

export const useFinancials = (days = 30, granularity = 'monthly') => {
  const [state, setState] = useState({ data: null, loading: true, error: null })

  useEffect(() => {
    let active = true
    setState((s) => ({ ...s, loading: true, error: null }))

    getMetrics(days)
      .then((res) => {
        if (active) setState({ data: res.data, loading: false, error: null })
      })
      .catch((err) => {
        if (active) {
          setState({ data: null, loading: false, error: err.message || 'Could not load financial data' })
        }
      })

    return () => { active = false }
  }, [days, granularity])

  return state
}
