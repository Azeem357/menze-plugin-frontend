import { useMemo } from 'react'
import Loader from '../components/common/Loader'
import ErrorMessage from '../components/common/ErrorMessage'
import { usePredictions } from '../hooks/Usepredictions'
import {
  MdCalendarToday, MdNotificationsNone, MdAccountCircle, MdPsychology, MdTrendingUp,
  MdWarningAmber, MdCheckCircleOutline, MdOpenInNew, MdLightbulbOutline, MdAnalytics,
  MdShowChart
} from 'react-icons/md'
import { formatPKR } from '../utils/formatters'
import { num, pick, fmtNum, compact, getTrend } from '../utils/dashboardAdapters'
import { BRAND, USER, TOP_TABS } from '../config/navigation'
import './predictionpage.css'

/* ---------- lookup tables (add a row to support a new status / icon) ---------- */
const STATUS = {
  highly_accurate: { label: 'Highly Accurate', tone: 'good' },
  optimal: { label: 'Optimal', tone: 'info' },
  deviation_alert: { label: 'Deviation Alert', tone: 'warn' },
  off_target: { label: 'Off Target', tone: 'bad' },
  pending: { label: 'Pending', tone: 'neutral' },
}
const MODEL_STATE = {
  active: { title: 'Active Intelligence Enabled', dot: 'green' },
  baseline: { title: 'Recent Sales Baseline', dot: 'amber' },
  training: { title: 'Model Training In Progress', dot: 'amber' },
  offline: { title: 'Model Offline', dot: 'red' },
}
const VOLATILITY = {
  high: { label: 'High Volatility Detected', tone: 'warn', icon: MdWarningAmber },
  medium: { label: 'Moderate Volatility', tone: 'warn', icon: MdWarningAmber },
  low: { label: 'Stable Outlook', tone: 'good', icon: MdCheckCircleOutline },
}
const INSIGHT_ICONS = { growth: MdLightbulbOutline, retention: MdAnalytics, default: MdLightbulbOutline }

/* ---------- helpers ---------- */
const keyOf = (s) => String(s ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_')
const titleCase = (s) => String(s).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

const shortDate = (raw) => {
  const s = String(raw ?? '')
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const d = new Date(s)
    if (!Number.isNaN(d.getTime())) return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
  }
  return s
}

const signed = (v) => `${v > 0 ? '+' : ''}${fmtNum(v)}%`

const deriveStatus = (variance, hasActual) => {
  if (!hasActual) return 'pending'
  const a = Math.abs(variance)
  return a <= 0.5 ? 'optimal' : a <= 3 ? 'highly_accurate' : a <= 10 ? 'deviation_alert' : 'off_target'
}
const varianceTone = (v) => (Math.abs(v) <= 3 ? 'good' : Math.abs(v) <= 10 ? 'warn' : 'bad')

const normaliseHistory = (raw) =>
  (Array.isArray(raw) ? raw : []).map((r, i) => {
    const predicted = pick(r, ['predicted', 'predicted_value', 'forecast'])
    const actualRaw = pick(r, ['actual', 'actual_value'])
    const hasActual = actualRaw != null
    const given = pick(r, ['variance', 'variance_pct'])
    const variance = given != null
      ? num(given)
      : hasActual && num(predicted) ? ((num(actualRaw) - num(predicted)) / num(predicted)) * 100 : null
    const statusKey = keyOf(pick(r, ['status', 'model_status'], deriveStatus(variance ?? 0, hasActual)))
    const known = STATUS[statusKey]
    return {
      period: pick(r, ['period', 'date_period', 'label']) ??
        `${shortDate(pick(r, ['period_start', 'start']))} - ${shortDate(pick(r, ['period_end', 'end']))}`,
      predicted: predicted == null ? null : num(predicted),
      actual: hasActual ? num(actualRaw) : null,
      variance,
      status: known || { label: titleCase(statusKey || 'Unknown'), tone: 'neutral' },
      key: `${i}`,
    }
  })

const normaliseInsights = (raw) =>
  (Array.isArray(raw) ? raw : []).map((r) => ({
    title: String(pick(r, ['title', 'heading'], 'Insight')),
    message: String(pick(r, ['message', 'text', 'description'], '')),
    icon: keyOf(pick(r, ['icon', 'type'], 'default')),
  }))

/* ---------- pieces ---------- */
const Empty = ({ children }) => (
  <div className="pr-empty"><MdShowChart size={32} /><p>{children}</p></div>
)

const Topbar = ({ brand, tabs, user, onNavigate }) => (
  <nav className="pr-topbar">
    <div className="pr-topbar-left">
      <span className="pr-brand">{brand.name}</span>
      <div className="pr-nav">
        {tabs.map((t) => (
          <a
            key={t.key} href={t.href}
            className={t.key === 'ai' ? 'active' : ''}
            onClick={(e) => { if (onNavigate) { e.preventDefault(); onNavigate(t) } }}
          >
            {t.label}
          </a>
        ))}
      </div>
    </div>
    <div className="pr-topbar-right">
      <button className="pr-icon-btn" aria-label="Calendar"><MdCalendarToday size={22} /></button>
      <button className="pr-icon-btn" aria-label="Notifications"><MdNotificationsNone size={24} /></button>
      {user.avatar
        ? <img className="pr-avatar" src={user.avatar} alt={user.name} />
        : <button className="pr-icon-btn primary" aria-label={user.name}><MdAccountCircle size={28} /></button>}
    </div>
  </nav>
)

const WeeklyCard = ({ weekly }) => {
  const value = pick(weekly, ['value', 'expected', 'forecast'])
  const prev = pick(weekly, ['previous'])
  const trend = getTrend(weekly, prev != null ? { value: prev } : null, 'value', ['change', 'change_pct'])

  const ci = weekly?.confidence_interval ?? {}
  const lower = pick(ci, ['lower', 'low']) ?? weekly?.lower
  const upper = pick(ci, ['upper', 'high']) ?? weekly?.upper
  const hasCI = lower != null && upper != null && num(upper) > num(lower)

  /* band occupies the middle 70 % of the track, marker sits at the forecast value */
  let band = null
  if (hasCI) {
    const pad = ((num(upper) - num(lower)) * 15) / 70
    const min = num(lower) - pad
    const span = num(upper) + pad - min
    band = {
      left: ((num(lower) - min) / span) * 100,
      right: 100 - ((num(upper) - min) / span) * 100,
      marker: Math.min(Math.max(((num(value) - min) / span) * 100, 0), 100),
    }
  }

  return (
    <div className="pr-card pr-glass pr-span-8">
      <div className="pr-card-head">
        <div>
          <span className="pr-eyebrow gold">{pick(weekly, ['label'], 'Next 7 Days Forecast')}</span>
          <h3 className="pr-title-lg">{pick(weekly, ['title'], 'Expected Revenue')}</h3>
        </div>
        <MdTrendingUp className="pr-trend-icon" size={24} />
      </div>

      <div className="pr-value-row">
        <span className="pr-gold-text">{value == null ? '—' : formatPKR(value)}</span>
        {trend && (
          <span className={`pr-chip ${trend.direction === 'up' ? 'good' : 'bad'}`}>
            {trend.direction === 'up' ? '+' : '-'}{trend.label} vs {pick(weekly, ['comparison_label'], 'LW')}
          </span>
        )}
      </div>

      {hasCI && (
        <div className="pr-ci">
          <div className="pr-ci-row">
            <span>Confidence Interval ({pick(ci, ['level'], 95)}%)</span>
            <span>{formatPKR(lower)} — {formatPKR(upper)}</span>
          </div>
          <div className="pr-ci-track">
            <div className="pr-ci-band" style={{ left: `${band.left}%`, right: `${band.right}%` }} />
            <div className="pr-ci-marker" style={{ left: `${band.marker}%` }} />
          </div>
        </div>
      )}
      {weekly?.note && <p className="pr-note">{weekly.note}</p>}
    </div>
  )
}

const MonthlyCard = ({ monthly, accuracy }) => {
  const value = pick(monthly, ['value', 'expected', 'forecast'])
  const vKey = keyOf(pick(monthly, ['volatility']))
  const vol = VOLATILITY[vKey]
  const volLabel = pick(monthly, ['volatility_label'], vol?.label)
  const VolIcon = vol?.icon ?? MdWarningAmber

  return (
    <div className="pr-card pr-white pr-span-4">
      <div className="pr-monthly-top">
        <span className="pr-eyebrow">{pick(monthly, ['label'], 'Monthly Outlook')}</span>
        <h3 className="pr-title-md">{pick(monthly, ['title'], 'Total Expected Volume')}</h3>
        <div className="pr-monthly-val">
          <span className="pr-monthly-num">{value == null ? '—' : `PKR ${compact(value).toUpperCase()}`}</span>
          {volLabel && (
            <span className={`pr-vol ${vol?.tone ?? 'warn'}`}><VolIcon size={16} /> {volLabel}</span>
          )}
        </div>
      </div>

      {accuracy != null && (
        <div className="pr-accuracy">
          <div className="pr-accuracy-row">
            <span>Model Accuracy</span><b>{fmtNum(accuracy, 1)}%</b>
          </div>
          <div className="pr-acc-track"><div style={{ width: `${Math.min(Math.max(num(accuracy), 0), 100)}%` }} /></div>
        </div>
      )}
    </div>
  )
}

const HistoryTable = ({ rows, onViewLogs }) => (
  <section className="pr-card pr-glass pr-table-card">
    <div className="pr-table-head">
      <h3 className="pr-title-md">Historical Prediction Accuracy</h3>
      {onViewLogs && (
        <button className="pr-link" onClick={() => onViewLogs(rows)}>
          View Detailed Logs <MdOpenInNew size={16} />
        </button>
      )}
    </div>
    {rows.length ? (
      <div className="pr-table-scroll">
        <table className="pr-table">
          <thead>
            <tr>
              <th>Date Period</th><th>Predicted Value</th><th>Actual Value</th><th>Variance</th><th>Model Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <td className="strong">{r.period}</td>
                <td className="muted">{r.predicted == null ? '—' : formatPKR(r.predicted)}</td>
                <td className="muted">{r.actual == null ? 'Pending' : formatPKR(r.actual)}</td>
                <td className={`variance ${r.variance == null ? '' : varianceTone(r.variance)}`}>
                  {r.variance == null ? '—' : signed(r.variance)}
                </td>
                <td><span className={`pr-badge ${r.status.tone}`}>{r.status.label}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : <Empty>No prediction history yet.</Empty>}
  </section>
)

/* ---------- page ---------- */
/**
 * Props (all optional):
 *  brand, user, topTabs   – see config/navigation.js
 *  showTopbar             – false if your layout already has a top bar
 *  horizonDays            – forecast horizon sent to the API (default 7)
 *  subtitle               – overrides the line under the title
 *  onNavigate(item)       – hook your router here
 *  onExport(data)         – defaults to downloading the response as JSON
 *  onViewLogs(rows)       – shows the "View Detailed Logs" link when provided
 */
const PredictionsPage = ({
  brand = BRAND, user = USER, topTabs = TOP_TABS,
  showTopbar = true, horizonDays = 7, subtitle,
  onNavigate, onExport, onViewLogs,
}) => {
  const { data, loading, refreshing, error, refresh } = usePredictions(horizonDays)

  const view = useMemo(() => {
    const model = data?.model ?? {}
    return {
      model,
      state: MODEL_STATE[keyOf(model.status)] ?? MODEL_STATE.active,
      confidence: pick(model, ['confidence', 'confidence_score']),
      accuracy: pick(model, ['accuracy', 'model_accuracy']),
      months: pick(model, ['trained_months', 'months']),
      weekly: data?.weekly ?? null,
      monthly: data?.monthly ?? null,
      history: normaliseHistory(data?.history),
      insights: normaliseInsights(data?.insights),
    }
  }, [data])

  const exportModel = () => {
    if (onExport) return onExport(data)
    const blob = new Blob([JSON.stringify(data ?? {}, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = Object.assign(document.createElement('a'), { href: url, download: 'ai-predictions.json' })
    a.click()
    URL.revokeObjectURL(url)
  }

  const sub = subtitle ?? (
    view.model.status === 'baseline'
      ? 'A transparent revenue estimate based on actual orders from the last 7 completed days.'
      : view.model.status === 'offline'
        ? 'A forecast will be available after completed purchase events are recorded.'
        : view.months
          ? `Forecasts based on your last ${view.months} months of financial data.`
          : 'Revenue forecasts based on historical store data.'
  )

  let body
  if (loading) {
    body = <div className="pr-state"><Loader /></div>
  } else if (error && !data) {
    body = <div className="pr-state"><ErrorMessage message={error} /></div>
  } else {
    body = (
      <>
        {/* Model status banner */}
        <section className="pr-banner">
          <div className="pr-banner-left">
            <div className="pr-banner-icon"><MdPsychology size={26} /></div>
            <div>
              <h2>{view.model.title ?? view.state.title}</h2>
              {view.model.message && <p>{view.model.message}</p>}
            </div>
          </div>
          {view.confidence != null && (
            <div className="pr-banner-pill">
              <span className={`pr-pulse ${view.state.dot}`} />
              {fmtNum(view.confidence, 1)}% Confidence Score
            </div>
          )}
        </section>

        {/* Forecast cards */}
        {(view.weekly || view.monthly) ? (
          <section className="pr-grid">
            {view.weekly && <WeeklyCard weekly={view.weekly} />}
            {view.monthly && <MonthlyCard monthly={view.monthly} accuracy={view.accuracy} />}
          </section>
        ) : <section className="pr-card pr-white"><Empty>No forecast available yet.</Empty></section>}

        <HistoryTable rows={view.history} onViewLogs={onViewLogs} />

        {/* AI narrative insights */}
        {view.insights.length > 0 && (
          <section className="pr-insights">
            {view.insights.map((ins, i) => {
              const Icon = INSIGHT_ICONS[ins.icon] ?? INSIGHT_ICONS.default
              return (
                <div className="pr-insight" key={ins.title + i}>
                  <div className="pr-insight-icon"><Icon size={22} /></div>
                  <div>
                    <h4>{ins.title}</h4>
                    <p>{ins.message}</p>
                  </div>
                </div>
              )
            })}
          </section>
        )}
      </>
    )
  }

  return (
    <div className="pr-page">
      {showTopbar && <Topbar brand={brand} tabs={topTabs} user={user} onNavigate={onNavigate} />}

      <main className="pr-main">
        <header className="pr-head">
          <div>
            <h1 className="pr-title">Sales Forecast</h1>
            <p className="pr-subtitle">{sub}</p>
          </div>
          <div className="pr-head-actions">
            <button className="pr-btn-outline" onClick={exportModel} disabled={!data}>Export Model</button>
            <button className="pr-btn-gold" onClick={refresh} disabled={loading || refreshing}>
              {refreshing ? 'Refreshing…' : 'Refresh Forecast'}
            </button>
          </div>
        </header>
        {error && data && <p className="pr-inline-error">Couldn't refresh: {error}</p>}
        {body}
      </main>
    </div>
  )
}

export default PredictionsPage
