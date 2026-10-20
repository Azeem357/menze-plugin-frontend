/* ============================================================
   utils/dashboardAdapters.js
   Shared helpers that turn whatever your API returns into the
   shapes the Dashboard and Analytics pages render.

   Nothing in here is page-specific. If your backend renames a
   field, add the new name to the matching *Keys list below
   (or pass your own keys) — the pages themselves won't change.
   ============================================================ */

/* ---------- primitives ---------- */
export const num = (v, fallback = 0) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

/** First defined value among obj[keys[0]], obj[keys[1]], … */
export const pick = (obj, keys, fallback = undefined) => {
  for (const k of keys) if (obj?.[k] != null) return obj[k]
  return fallback
}

/** 1234.5 -> "1.2k" · 142500 -> "142.5k" · 2_400_000 -> "2.4m" */
export const compact = (n) =>
  new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })
    .format(num(n))
    .toLowerCase()

/** 3.4200 -> "3.42" · 3 -> "3" · 4.80 -> "4.8" */
export const fmtNum = (n, digits = 2) =>
  num(n).toFixed(digits).replace(/\.?0+$/, '')

/** seconds -> "4m 12s" / "1h 05m" */
export const formatDuration = (seconds) => {
  const s = Math.max(0, Math.round(num(seconds)))
  if (s >= 3600) return `${Math.floor(s / 3600)}h ${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}m`
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`
}

/** "2026-05-08" -> "MAY 08"; anything else is just upper-cased */
export const formatAxisLabel = (raw) => {
  const s = String(raw ?? '')
  const isoLike = /^\d{4}-\d{2}-\d{2}/.test(s) || /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(s)
  if (isoLike) {
    const d = new Date(s)
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase()
    }
  }
  return s.toUpperCase()
}

/** n evenly spaced, unique indices from a list of `len` items */
export const evenIndices = (len, n) => {
  if (len <= 0) return []
  if (len <= n) return Array.from({ length: len }, (_, i) => i)
  const out = new Set()
  for (let i = 0; i < n; i++) out.add(Math.round((i * (len - 1)) / (n - 1)))
  return [...out]
}

/* ---------- change / trend badges ---------- */
export const pctChange = (current, previous) =>
  previous ? ((current - previous) / Math.abs(previous)) * 100 : null

/**
 * Build a trend badge for one metric. Returns null when there is nothing to
 * compare against (the page then simply hides the badge).
 *
 *  1) summary[changeKeys…]            -> API already sent the % change
 *  2) previous[valueKey] vs summary   -> we compute it
 */
export const getTrend = (summary, previous, valueKey, changeKeys = []) => {
  const direct = pick(summary, [...changeKeys, `${valueKey}_change`, `${valueKey}_growth`])
  let pct = direct != null ? num(direct) : null
  if (pct == null && previous?.[valueKey] != null) {
    pct = pctChange(num(summary?.[valueKey]), num(previous[valueKey]))
  }
  if (pct == null) return null
  return { direction: pct >= 0 ? 'up' : 'down', label: `${fmtNum(Math.abs(pct), 1)}%` }
}

/* ---------- list normalisers ---------- */
const NAME_KEYS = ['name', 'label', 'source', 'channel', 'device', 'stage', 'step', 'title']
const VALUE_KEYS = ['value', 'count', 'sessions', 'visitors', 'users', 'rate', 'conversion_rate', 'percentage']

/** [{ name, value, raw }]  — works for traffic sources, devices, ROAS rows … */
export const normaliseItems = (raw, { nameKeys = NAME_KEYS, valueKeys = VALUE_KEYS } = {}) =>
  (Array.isArray(raw) ? raw : []).map((r, i) => ({
    name: String(pick(r, nameKeys, `Item ${i + 1}`)),
    value: num(pick(r, valueKeys, 0)),
    raw: r,
  }))

/** [{ label, value, previous }]  — time series */
export const normaliseSeries = (
  raw,
  {
    labelKeys = ['date', 'label', 'day', 'period', 'x'],
    valueKeys = ['value', 'revenue', 'total_revenue', 'rate', 'conversion_rate'],
    previousKeys = ['previous', 'previous_value', 'previous_rate', 'prev', 'comparison'],
  } = {}
) =>
  (Array.isArray(raw) ? raw : []).map((r, i) => {
    const prev = pick(r, previousKeys)
    return {
      label: String(pick(r, labelKeys, i + 1)),
      value: num(pick(r, valueKeys, 0)),
      previous: prev == null ? null : num(prev),
    }
  })

/** funnel steps: [{ name, count }] */
export const normaliseFunnel = (raw) =>
  (Array.isArray(raw) ? raw : []).map((s, i) => ({
    name: String(pick(s, ['name', 'stage', 'step', 'label'], `Step ${i + 1}`)),
    count: num(pick(s, ['count', 'value', 'users', 'sessions'], 0)),
    tag: pick(s, ['tag', 'caption']),
  }))

/** top products: [{ name, units, revenue, image }] */
export const normaliseProducts = (raw) =>
  (Array.isArray(raw) ? raw : []).map((p, i) => ({
    name: String(pick(p, ['name', 'title', 'product'], `Product ${i + 1}`)),
    units: num(pick(p, ['units', 'units_sold', 'quantity', 'orders'], 0)),
    revenue: num(pick(p, ['revenue', 'total_revenue', 'sales'], 0)),
    image: pick(p, ['image', 'image_url', 'thumbnail']),
  }))

/** "Premium Leather Wallet" -> "PL" (used when a product has no image) */
export const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()

/**
 * First insight / alert / anomaly the API sent, in a uniform shape:
 *   { title, message, actionLabel, actionHref, severity }
 * `keys` decides which fields are looked at, in order.
 */
export const firstInsight = (data, keys = ['insights', 'insight', 'alerts', 'alert', 'anomalies', 'anomaly']) => {
  for (const k of keys) {
    const v = data?.[k]
    const item = Array.isArray(v) ? v[0] : v
    if (!item) continue
    if (typeof item === 'string') return { message: item }
    return {
      title: pick(item, ['title', 'heading', 'type', 'label']),
      message: pick(item, ['message', 'text', 'description', 'summary']),
      actionLabel: pick(item, ['action_label', 'actionLabel', 'cta']),
      actionHref: pick(item, ['action_url', 'actionUrl', 'href', 'link']),
      severity: pick(item, ['severity', 'level']),
    }
  }
  return null
}