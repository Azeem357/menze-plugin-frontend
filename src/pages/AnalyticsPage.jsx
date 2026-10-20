import { useMemo, useState } from 'react'
import Loader from '../components/common/Loader'
import ErrorMessage from '../components/common/ErrorMessage'
import { useFunnel } from '../hooks/useFunnel'
import {
  MdMenu, MdCalendarToday, MdCalendarMonth, MdNotificationsNone, MdDownload,
  MdTrendingUp, MdTrendingDown, MdArrowDownward, MdArrowUpward, MdMoreVert,
  MdLaptopMac, MdSmartphone, MdTabletMac, MdDevicesOther, MdPsychology, MdShowChart
} from 'react-icons/md'
import {
  num, pick, fmtNum, compact, formatDuration, formatAxisLabel, evenIndices,
  normaliseFunnel, normaliseItems, normaliseSeries, firstInsight
} from '../utils/dashboardAdapters'
import { BRAND, USER, TOP_TABS, RANGE_OPTIONS } from '../config/navigation'
import './AnalyticsPage.css'

const DEVICE_COLORS = ['#000d33', '#755b00', '#4a5272', '#c9a84c', '#9aa3c7']

/**
 * The three tiles under the funnel are described, not hand-written.
 * Add an entry and a tile appears — it is hidden automatically when the API
 * doesn't send that metric.
 *
 *  value   -> data.metrics[key]  (or data[key])
 *  change  -> `${key}_change`    (% vs previous period, optional)
 *  note    -> `${key}_note`      (custom caption, optional)
 *  status  -> `${key}_status`    ('good' | 'bad', optional)
 */
const MINI_DEFS = [
  { key: 'bounce_rate', label: 'Bounce Rate', format: (v) => `${fmtNum(v, 1)}%`, lowerIsBetter: true },
  { key: 'add_to_cart_rate', label: 'Add to Cart Rate', format: (v) => `${fmtNum(v, 1)}%` },
  { key: 'avg_session_duration', label: 'Avg. Session Duration', format: formatDuration },
]

const DEVICE_ICONS = [
  ['desktop', MdLaptopMac], ['laptop', MdLaptopMac],
  ['mobile', MdSmartphone], ['phone', MdSmartphone],
  ['tablet', MdTabletMac],
]
const deviceIcon = (name) =>
  (DEVICE_ICONS.find(([k]) => String(name).toLowerCase().includes(k)) || [])[1] || MdDevicesOther

/* ---------- pieces ---------- */
const Empty = ({ icon: Icon = MdShowChart, children }) => (
  <div className="an-empty"><Icon size={32} /><p>{children}</p></div>
)

const TrendChart = ({ series }) => {
  if (series.length < 2) return <div className="an-trend-body"><Empty>Not enough data to draw a trend yet.</Empty></div>

  const hasRef = series.some((p) => p.previous != null)
  const all = series.flatMap((p) => [p.value, p.previous]).filter((v) => v != null)
  const min = Math.min(...all)
  const range = Math.max(...all) - min || 1
  const y = (v) => 300 - ((v - min) / range) * 240 - 30
  const x = (i) => (i * 1000) / (series.length - 1)

  const line = (get) =>
    series
      .map((p, i) => (get(p) == null ? null : `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(get(p)).toFixed(1)}`))
      .filter(Boolean)
      .join(' ')
  const mainPath = line((p) => p.value)

  const labels = evenIndices(series.length, 6).map((i) => formatAxisLabel(series[i].label))

  return (
    <div className="an-trend-body">
      <svg viewBox="0 0 1000 300" preserveAspectRatio="none">
        <defs>
          <linearGradient id="anGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(0,32,96,0.12)" />
            <stop offset="100%" stopColor="rgba(0,32,96,0)" />
          </linearGradient>
        </defs>
        {[0, 100, 200, 300].map((g) => (
          <line key={g} className="an-grid-line" x1="0" x2="1000" y1={g} y2={g} />
        ))}
        <path d={`${mainPath} V300 H0 Z`} fill="url(#anGrad)" />
        <path className="an-line-main" d={mainPath} />
        {hasRef && <path className="an-line-ref" d={line((p) => p.previous)} />}
      </svg>

      {/* invisible hover columns -> native tooltip per data point */}
      <div className="an-hover-cols">
        {series.map((p, i) => (
          <div
            key={i}
            title={`${formatAxisLabel(p.label)}: ${fmtNum(p.value)}%${p.previous != null ? ` (prev ${fmtNum(p.previous)}%)` : ''}`}
          />
        ))}
      </div>

      <div className="an-x-labels">{labels.map((l, i) => <span key={i}>{l}</span>)}</div>
    </div>
  )
}

const Funnel = ({ steps }) => {
  if (!steps.length) return <Empty>No funnel data for this period.</Empty>
  const n = steps.length
  const first = steps[0].count || 1

  return (
    <div className="an-funnel">
      {steps.map((s, i) => {
        const last = i === n - 1
        const prev = steps[i - 1]
        const ratio = prev?.count ? s.count / prev.count : null
        const drop = ratio == null ? null : Math.round((1 - ratio) * 100)
        const alpha = n <= 2 ? 1 : 1 - (i / (n - 1)) * 0.5
        const background = last && n > 1 ? '#755b00' : `rgba(0, 13, 51, ${alpha.toFixed(2)})`
        const tag = s.tag ?? (i === 0 ? 'Total' : `${Math.round((s.count / first) * 100)}% of total`)

        return (
          <div className="an-funnel-step" key={s.name + i}>
            <div className="an-funnel-shape" style={{ background }}>
              <div>
                <p className="an-funnel-tag">{tag}</p>
                <p className="an-funnel-val">{compact(s.count)}</p>
              </div>
            </div>
            <p className={`an-funnel-name ${last && n > 1 ? 'gold' : ''}`}>{s.name}</p>
            {ratio != null && last && (
              <p className="an-funnel-note good">{Math.round(ratio * 100)}% Completion</p>
            )}
            {ratio != null && !last && (
              <p className={`an-funnel-note ${drop < 0 ? 'good' : ''}`}>
                {drop < 0 ? `+${-drop}%` : `-${drop}%`} {drop < 0 ? 'gain' : 'drop'}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

const MiniStat = ({ def, metrics }) => {
  const raw = pick(metrics, [def.key])
  if (raw == null) return null

  const change = pick(metrics, [`${def.key}_change`])
  const c = change == null ? null : num(change)
  const customNote = pick(metrics, [`${def.key}_note`])
  const note = customNote ?? (c == null ? null : `${fmtNum(Math.abs(c), 1)}% ${c < 0 ? 'lower' : 'higher'}`)

  const statusKey = pick(metrics, [`${def.key}_status`])
  const good = statusKey
    ? statusKey === 'good'
    : c == null ? true : def.lowerIsBetter ? c <= 0 : c >= 0

  return (
    <div className="an-mini">
      <p className="an-mini-label">{def.label}</p>
      <p className="an-mini-val">{def.format(raw)}</p>
      {note && (
        <p className={`an-mini-note ${good ? '' : 'bad'}`}>
          {c != null && (c < 0 ? <MdArrowDownward size={12} /> : <MdArrowUpward size={12} />)} {note}
        </p>
      )}
    </div>
  )
}

/* ---------- page ---------- */
/**
 * Props (all optional):
 *  brand, user, topTabs     – see config/navigation.js
 *  showTopbar               – false if your layout already has a top bar
 *  initialDays              – default date range
 *  onNavigate(item)         – hook your router here (e.g. navigate(item.href))
 *  onMenuClick              – hamburger button
 *  onExport                 – defaults to window.print() (save as PDF)
 *  onAnomalyAction(anomaly) – "View Recommendation" click
 */
const AnalyticsPage = ({
  brand = BRAND, user = USER, topTabs = TOP_TABS,
  showTopbar = true, initialDays = 30,
  onNavigate, onMenuClick, onExport, onAnomalyAction,
}) => {
  const [days, setDays] = useState(initialDays)
  const { data, loading, error } = useFunnel(days)

  const view = useMemo(() => {
    const steps = normaliseFunnel(data?.funnel)
    const computed = steps.length > 1 && steps[0].count
      ? (steps[steps.length - 1].count / steps[0].count) * 100
      : null
    const overallRaw = pick(data, ['overall_conversion'])
    const overall = overallRaw != null ? num(overallRaw) : computed

    const prevOverall = pick(data, ['previous_overall_conversion'])
    const delta = pick(data, ['overall_conversion_change'])
      ?? (prevOverall != null && overall != null ? overall - num(prevOverall) : null)

    return {
      steps,
      overall,
      delta: delta == null ? null : num(delta),
      deltaLabel: pick(data, ['comparison_label'], 'vs previous period'),
      series: normaliseSeries(data?.trend, {
        valueKeys: ['rate', 'conversion_rate', 'value'],
      }),
      devices: normaliseItems(data?.devices, { nameKeys: ['name', 'device'], valueKeys: ['rate', 'conversion_rate', 'value'] }),
      sources: normaliseItems(data?.sources, { nameKeys: ['name', 'source', 'channel'], valueKeys: ['rate', 'conversion_rate', 'value'] }),
      metrics: data?.metrics ?? data ?? {},
      anomaly: firstInsight(data, ['anomalies', 'anomaly', 'insights', 'insight']),
    }
  }, [data])

  const devMax = Math.max(...view.devices.map((d) => d.value), 1)
  const srcMax = Math.max(...view.sources.map((s) => s.value), 1)
  const miniStats = MINI_DEFS.filter((d) => pick(view.metrics, [d.key]) != null)

  const click = (e, item) => { if (onNavigate) { e.preventDefault(); onNavigate(item) } }

  return (
    <div className="an-page">
      {showTopbar && (
        <header className="an-topbar">
          <div className="an-topbar-left">
            <button className="an-icon-btn" aria-label="Menu" onClick={onMenuClick}><MdMenu size={24} /></button>
            <h1 className="an-brand">{brand.name}</h1>
          </div>
          <nav className="an-nav">
            {topTabs.map((t) => (
              <a key={t.key} href={t.href} onClick={(e) => click(e, t)} className={t.key === 'analytics' ? 'active' : ''}>
                {t.label}
              </a>
            ))}
          </nav>
          <div className="an-topbar-right">
            <button className="an-icon-btn" aria-label="Calendar"><MdCalendarToday size={20} /></button>
            <button className="an-icon-btn" aria-label="Notifications"><MdNotificationsNone size={22} /></button>
            {user.avatar
              ? <img className="an-avatar" src={user.avatar} alt={user.name} />
              : <div className="an-avatar" title={user.name} />}
          </div>
        </header>
      )}

      <main className="an-main">
        {/* Heading + controls */}
        <div className="an-head">
          <div>
            <div className="an-crumbs">
              <span>Performance</span><span className="sep">/</span>
              <span className="cur">Conversion Funnel</span>
            </div>
            <h2 className="an-title">Conversion Analysis</h2>
          </div>
          <div className="an-head-actions">
            <label className="an-range">
              <MdCalendarMonth size={20} />
              <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
                {RANGE_OPTIONS.map((o) => <option key={o.days} value={o.days}>{o.label}</option>)}
              </select>
            </label>
            <button className="an-btn-gold" onClick={() => (onExport ? onExport(data) : window.print())}>
              <MdDownload size={18} /> Export PDF
            </button>
          </div>
        </div>

        {loading ? (
          <div className="an-state"><Loader /></div>
        ) : error ? (
          <div className="an-state"><ErrorMessage message={error} /></div>
        ) : (
          <>
            {/* Conversion rate trend */}
            <section className="an-card">
              <div className="an-trend-head">
                <div>
                  <h3 className="an-card-title">Conversion Rate Trend</h3>
                  <p className="an-card-sub">Daily aggregate across all platforms</p>
                </div>
                {view.overall != null && (
                  <div className="an-trend-kpi">
                    <strong>{fmtNum(view.overall)}%</strong>
                    {view.delta != null && (
                      <span className={`an-delta ${view.delta < 0 ? 'down' : ''}`}>
                        {view.delta < 0 ? <MdTrendingDown size={16} /> : <MdTrendingUp size={16} />}
                        {view.delta >= 0 ? '+' : '-'}{fmtNum(Math.abs(view.delta))}% {view.deltaLabel}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <TrendChart series={view.series} />
            </section>

            {/* Funnel */}
            <section className="an-card an-card-pad">
              <h3 className="an-card-title">Purchase Funnel Breakdown</h3>
              <Funnel steps={view.steps} />
              {miniStats.length > 0 && (
                <div className="an-mini-grid">
                  {miniStats.map((d) => <MiniStat key={d.key} def={d} metrics={view.metrics} />)}
                </div>
              )}
              {view.overall != null && (
                <p className="an-overall">
                  Overall conversion rate: <strong>{fmtNum(view.overall)}%</strong>
                </p>
              )}
            </section>

            {/* Device + traffic */}
            <div className="an-two">
              <section className="an-card an-card-pad">
                <div className="an-card-head">
                  <div>
                    <h3 className="an-card-title">Conversion by Device</h3>
                    <p className="an-card-sub">Performance by platform type</p>
                  </div>
                  <MdMoreVert className="an-more" size={22} />
                </div>
                {view.devices.length ? (
                  <div className="an-bars">
                    {view.devices.map((d, i) => {
                      const Icon = deviceIcon(d.name)
                      return (
                        <div key={d.name + i}>
                          <div className="an-bar-row-head">
                            <span><Icon size={20} color="#000d33" /> {d.name}</span>
                            <span>{fmtNum(d.value)}%</span>
                          </div>
                          <div className="an-track">
                            <div className="an-fill" style={{
                              width: `${(d.value / devMax) * 100}%`,
                              background: DEVICE_COLORS[i % DEVICE_COLORS.length],
                            }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : <Empty icon={MdLaptopMac}>No device breakdown available.</Empty>}
              </section>

              <section className="an-card an-card-pad">
                <div className="an-card-head">
                  <div>
                    <h3 className="an-card-title">Top Traffic Sources</h3>
                    <p className="an-card-sub">Attribution by channel origin</p>
                  </div>
                  <MdMoreVert className="an-more" size={22} />
                </div>
                {view.sources.length ? (
                  <div className="an-cols">
                    {view.sources.map((s, i) => (
                      <div className="an-col" key={s.name + i}>
                        <div className="an-col-bar-wrap">
                          <div className="an-col-bar" style={{ height: `${Math.max((s.value / srcMax) * 85, 2)}%` }}>
                            <span className="an-col-tip">{fmtNum(s.value)}%</span>
                          </div>
                        </div>
                        <span className="an-col-label">{s.name}</span>
                      </div>
                    ))}
                  </div>
                ) : <Empty icon={MdShowChart}>No traffic source data available.</Empty>}
              </section>
            </div>

            {/* AI anomaly banner — only when the API reports one */}
            {view.anomaly && (
              <div className="an-ai">
                <div className="an-ai-icon"><MdPsychology size={32} /></div>
                <div className="an-ai-body">
                  <h4>{view.anomaly.title || 'AI-Detected Anomalies'}</h4>
                  <p>{view.anomaly.message}</p>
                </div>
                {(view.anomaly.actionLabel || onAnomalyAction || view.anomaly.actionHref) && (
                  <button
                    className="an-ai-btn"
                    onClick={() => {
                      if (onAnomalyAction) onAnomalyAction(view.anomaly)
                      else if (view.anomaly.actionHref) window.location.assign(view.anomaly.actionHref)
                    }}
                  >
                    {view.anomaly.actionLabel || 'View Recommendation'}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </main>

      <footer className="an-footer">
        <p>© {new Date().getFullYear()} {brand.name}. All rights reserved.</p>
        <div className="an-footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Documentation</a>
          <a href="#">Support</a>
        </div>
      </footer>
    </div>
  )
}

export default AnalyticsPage
