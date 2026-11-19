/* ============================================================
   hooks/usePredictions.js
   Same contract as useDashboard / useFunnel, plus a refresh:
     { data, loading, refreshing, error, refresh }

   ► Requests the configured API at /predictions/. Expected JSON —
     every field is optional, the page hides
     whatever isn't sent:

   {
     "model": {
       "status": "active",                 // active | training | offline
       "title": "Active Intelligence Enabled",
       "message": "Real-time predictive modeling is analysing your Q4 stream.",
       "confidence": 98.4,                 // %
       "accuracy": 94.2,                   // %
       "trained_months": 24
     },
     "weekly": {
       "label": "Next 7 Days Forecast",
       "title": "Expected Revenue",
       "value": 62000,
       "previous": 55150,                  // or send "change": 12.4
       "comparison_label": "LW",
       "confidence_interval": { "lower": 58500, "upper": 65500, "level": 95 },
       "note": "Historical deviation for similar periods: 2.1%."
     },
     "monthly": {
       "label": "Monthly Outlook",
       "title": "Total Expected Volume",
       "value": 245800,
       "volatility": "high"                // high | medium | low  (or "volatility_label")
     },
     "history": [
       { "period": "Oct 23 - Oct 30",       // or period_start / period_end
         "predicted": 58200, "actual": 59105,
         "variance": 1.55,                  // optional – computed when missing
         "status": "highly_accurate" }      // optional – derived when missing
     ],
     "insights": [
       { "title": "Growth Opportunity", "message": "…", "icon": "growth" }
     ]
   }
   ============================================================ */
import { useCallback, useEffect, useState } from 'react'
import { getPredictions } from '../api/predictionsApi'

export const usePredictions = (horizonDays = 7) => {
  const [state, setState] = useState({ data: null, loading: true, refreshing: false, error: null })
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const isRefresh = nonce > 0
    setState((s) => ({ ...s, loading: !isRefresh && !s.data, refreshing: isRefresh, error: null }))

    getPredictions(horizonDays, isRefresh, controller.signal)
      .then((res) => {
        const data = res.data
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
          throw new Error('The predictions API returned an invalid response. Check the API URL and endpoint.')
        }
        setState({ data, loading: false, refreshing: false, error: null })
      })
      .catch((err) => {
        if (err.name !== 'AbortError' && err.code !== 'ERR_CANCELED') {
          setState((s) => ({
            ...s, loading: false, refreshing: false,
            error: err.message || 'Could not load predictions',
          }))
        }
      })

    return () => controller.abort()
  }, [horizonDays, nonce])

  const refresh = useCallback(() => setNonce((n) => n + 1), [])
  return { ...state, refresh }
}