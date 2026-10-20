import { useMemo, useState } from 'react'
import { useDashboard } from '../hooks/useDashboard'
import Loader from '../components/common/Loader'
import ErrorMessage from '../components/common/ErrorMessage'
import {
  MdInsights, MdHelpOutline, MdLogout, MdCalendarToday, MdNotificationsNone,
  MdPayments, MdShoppingBag, MdAdsClick, MdGroups, MdTrendingUp, MdTrendingDown,
  MdShowChart, MdAutoAwesome, MdArrowForward, MdChat
} from 'react-icons/md'
import { formatPKR, formatPct } from '../utils/formatters'
import {
  num, pick, fmtNum, compact, formatAxisLabel, evenIndices, getTrend,
  normaliseItems, normaliseSeries, normaliseProducts, initials, firstInsight
} from '../utils/dashboardAdapters'
import { BRAND, USER, SIDE_NAV, TOP_TABS, RANGES } from '../config/navigation'
import './DashboardPage.css'

/* Colour cycles for charts — extend freely, they wrap around */
const SHARE_COLORS = ['#000d33', '#755b00', '#e6e8eb', '#4a5272', '#c9a84c', '#9aa3c7']
const BAR_COLORS = ['#000d33', '#755b00', 'rgba(0,13,51,.6)', '#4a5272', '#c9a84c']
const TILE_COLORS = ['#0f2a4a', '#2b2b2b', '#6f8f86', '#755b00', '#4a5272']

/**
 * KPI cards are described, not hand-written. Add / remove / reorder entries
 * and the row follows. `previousKey` + `changeKeys` feed the trend badge.
 */
const KPI_DEFS = [
  {
    key: 'revenue', label: 'Revenue', icon: MdPayments, tone: 'gold',
    valueKey: 'total_revenue', changeKeys: ['revenue_change'],
    format: (v) => formatPKR(v),
    note: (days) => `vs Last ${days} Days`,
  },
  {
    key: 'orders', label: 'Orders', icon: MdShoppingBag, tone: 'navy',
    valueKey: 'total_orders', changeKeys: ['orders_change'],
    format: (v) => num(v).toLocaleString(),
    note: () => 'Successful transactions',
  },
  {
    key: 'conversion', label: 'Conversion', icon: MdAdsClick, tone: 'gold',
    valueKey: 'avg_conversion_rate', changeKeys: ['conversion_change', 'conversion_rate_change'],
    format: (v) => formatPct(v),
    note: () => 'Visits to checkout',
  },
  {
    key: 'visitors', label: 'Visitors', icon: MdGroups, tone: 'navy',
    valueKey: 'total_sessions', changeKeys: ['sessions_change', 'visitors_change'],
    format: (v) => num(v).toLocaleString(),
    note: (days) => `Unique users · last ${days} days`,
  },
]

/* ---------- pieces ---------- */
const handleNav = (onNavigate) => (e, item) => {
  if (onNavigate) { e.preventDefault(); onNavigate(item) }
}

const Sidebar = ({ brand, items, activeKey, onNavigate, onUpgrade, onHelp, onSignOut }) => {
  const click = handleNav(onNavigate)
  return (
    <aside className="db-sidebar">
      <div className="db-side-top">
        <div className="db-brand">
          <div className="db-brand-logo"><MdInsights size={24} /></div>
          <div>
            <h1 className="db-brand-name">{brand.name}</h1>
            <p className="db-brand-sub">{brand.tagline}</p>
          </div>
        </div>
        <nav className="db-side-nav">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <a
                key={item.key}
                href={item.href}
                onClick={(e) => click(e, item)}
                className={`db-side-link ${item.key === activeKey ? 'active' : ''}`}
              >
                {Icon && <Icon size={24} />} <span>{item.label}</span>
              </a>
            )
          })}
        </nav>
      </div>

      <div className="db-side-bottom">
        <div className="db-upgrade">
          <h5>Upgrade Pro</h5>
          <p>Unlock advanced predictive models.</p>
          <button onClick={onUpgrade}>Upgrade Now</button>
        </div>
        <div>
          <a href="#" className="db-side-small" onClick={(e) => { e.preventDefault(); onHelp?.() }}>
            <MdHelpOutline size={20} /> Help Center
          </a>
          <a href="#" className="db-side-small danger" onClick={(e) => { e.preventDefault(); onSignOut?.() }}>
            <MdLogout size={20} /> Sign Out
          </a>
        </div>
      </div>
    </aside>
  )
}

const Topbar = ({ title, tabs, activeKey, user, hasAlerts, onNavigate }) => {
  const click = handleNav(onNavigate)
  return (
    <header className="db-topbar">
      <div className="db-topbar-left">
        <h2 className="db-page-title">{title}</h2>
        <nav className="db-tabs">
          {tabs.map((t) => (
            <a
              key={t.key}
              href={t.href}
              onClick={(e) => click(e, t)}
              className={`db-tab ${t.key === activeKey ? 'active' : ''}`}
            >
              {t.label}
            </a>
          ))}
        </nav>
      </div>
      <div className="db-topbar-right">
        <button className="db-round-btn" aria-label="Calendar"><MdCalendarToday size={22} /></button>
        <button className="db-round-btn" aria-label="Notifications">
          <MdNotificationsNone size={24} />
          {hasAlerts && <span className="db-dot" />}
        </button>
        <div className="db-vline" />
        <button className="db-admin">
          <span>{user.name}</span>
          {user.avatar ? <img src={user.avatar} alt="" /> : <i />}
        </button>
      </div>
    </header>
  )
}

const KPI = ({ def, summary, previous, days }) => {
  const Icon = def.icon
  const trend = getTrend(summary, previous, def.valueKey, def.changeKeys)
  return (
    <div className="db-card db-kpi">
      <div className="db-kpi-top">
        <div className={`db-kpi-icon ${def.tone}`}><Icon size={24} /></div>
        {trend && (
          <span className={`db-badge ${trend.direction}`}>
            {trend.direction === 'up' ? <MdTrendingUp size={14} /> : <MdTrendingDown size={14} />}
            {trend.label}
          </span>
        )}
      </div>
      <p className="db-kpi-label">{def.label}</p>
      <h3 className="db-kpi-value">{def.format(summary?.[def.valueKey])}</h3>
      <p className="db-kpi-note">{def.note(days)}</p>
    </div>
  )
}

const Empty = ({ icon: Icon = MdShowChart, children }) => (
  <div className="db-empty"><Icon size={32} /><p>{children}</p></div>
)

const RevenueBars = ({ series }) => {
  if (!series.length) return <Empty>No revenue recorded for this period.</Empty>
  const max = Math.max(...series.map((p) => p.value), 1)
  const axis = evenIndices(series.length, 5).map((i) => formatAxisLabel(series[i].label))
  return (
    <>
      <div className="db-bars">
        <div className="db-bars-ghost"><MdShowChart size={200} /></div>
        {series.map((p, i) => (
          <div key={i} className="db-bar" style={{ height: `${Math.max((p.value / max) * 95, 1)}%` }}>
            <span className="db-bar-tip">{formatAxisLabel(p.label)} · {formatPKR(p.value)}</span>
          </div>
        ))}
      </div>
      <div className="db-bar-axis">{axis.map((a, i) => <span key={i}>{a}</span>)}</div>
    </>
  )
}

const Donut = ({ items, total, totalLabel }) => {
  const sum = items.reduce((s, x) => s + x.value, 0)
  if (!items.length || !sum) return <Empty icon={MdGroups}>No traffic data yet.</Empty>

  let acc = 0
  const stops = items.map((it, i) => {
    const from = (acc / sum) * 100
    acc += it.value
    return `${SHARE_COLORS[i % SHARE_COLORS.length]} ${from}% ${(acc / sum) * 100}%`
  })
  return (
    <>
      <div className="db-donut-wrap">
        <div className="db-donut" style={{ background: `conic-gradient(${stops.join(', ')})` }}>
          <div className="db-donut-center">
            <strong>{compact(total ?? sum).toUpperCase()}</strong>
            <span>{totalLabel}</span>
          </div>
        </div>
      </div>
      <div className="db-legend">
        {items.map((it, i) => (
          <div className="db-legend-row" key={it.name + i}>
            <span>
              <i className="db-legend-dot" style={{ background: SHARE_COLORS[i % SHARE_COLORS.length] }} />
              {it.name}
            </span>
            <b>{Math.round((it.value / sum) * 100)}%</b>
          </div>
        ))}
      </div>
    </>
  )
}

/* ---------- page ---------- */
/**
 * Props (all optional):
 *  brand, user, sideNav, topTabs   – see config/navigation.js
 *  showChrome                      – false if your layout already has sidebar + top bar
 *  title                           – page heading in the top bar
 *  initialDays                     – default date range
 *  onNavigate(item)                – hook your router here (e.g. navigate(item.href))
 *  onInsightAction(insight)        – "Take Action Now" click
 *  onUpgrade / onHelp / onSignOut / onSupportClick
 */
const DashboardPage = ({
  brand = BRAND, user = USER, sideNav = SIDE_NAV, topTabs = TOP_TABS,
  showChrome = true, title = 'Dashboard', initialDays = 30,
  onNavigate, onInsightAction, onUpgrade, onHelp, onSignOut, onSupportClick,
}) => {
  const [days, setDays] = useState(initialDays)
  const { data, loading, error } = useDashboard(days)

  const view = useMemo(() => {
    const summary = data?.summary || {}
    const previous = data?.previous_summary ?? data?.previous ?? data?.comparison?.summary ?? null

    const traffic = normaliseItems(data?.traffic_sources, {
      valueKeys: ['sessions', 'value', 'count', 'visitors', 'percentage'],
    })
    const roas = normaliseItems(data?.roas_by_channel ?? data?.roas, {
      valueKeys: ['roas', 'value'],
    })
    return {
      summary,
      previous,
      series: normaliseSeries(data?.chart, { valueKeys: ['revenue', 'total_revenue', 'value'] }),
      traffic,
      trafficTotal: pick(summary, ['total_sessions', 'total_visitors']),
      roas,
      roasMax: Math.max(...roas.map((r) => r.value), 1) * 1.1,
      products: normaliseProducts(data?.top_products),
      insight: firstInsight(data, ['insights', 'insight', 'alerts', 'alert']),
    }
  }, [data])

  const insight = view.insight

  let body
  if (loading) {
    body = <div className="db-state"><Loader /></div>
  } else if (error) {
    body = <div className="db-state error"><ErrorMessage message={error} /></div>
  } else {
    body = (
      <>
        {/* KPI row — driven by KPI_DEFS */}
        <div className="db-kpis">
          {KPI_DEFS.map((def) => (
            <KPI key={def.key} def={def} summary={view.summary} previous={view.previous} days={days} />
          ))}
        </div>

        {/* Revenue + traffic */}
        <div className="db-row-3">
          <div className="db-card db-span-2">
            <div className="db-chart-head">
              <div>
                <h4 className="db-card-title">Revenue Over Time</h4>
                <p className="db-card-sub">Daily performance tracking</p>
              </div>
              <div className="db-seg">
                {RANGES.map((r) => (
                  <button key={r.label} className={days === r.days ? 'active' : ''} onClick={() => setDays(r.days)}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <RevenueBars series={view.series} />
          </div>

          <div className="db-card">
            <h4 className="db-card-title">Traffic Sources</h4>
            <Donut items={view.traffic} total={view.trafficTotal} totalLabel="TOTAL VISITORS" />
          </div>
        </div>

        {/* ROAS / products / AI */}
        <div className="db-row-3">
          <div className="db-card">
            <h4 className="db-card-title">ROAS Performance</h4>
            {view.roas.length ? (
              <div className="db-roas">
                {view.roas.map((r, i) => (
                  <div key={r.name + i}>
                    <div className="db-roas-head"><span>{r.name}</span><b>{fmtNum(r.value, 1)}x</b></div>
                    <div className="db-track">
                      <div className="db-fill" style={{
                        width: `${Math.min((r.value / view.roasMax) * 100, 100)}%`,
                        background: BAR_COLORS[i % BAR_COLORS.length],
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : <Empty icon={MdAdsClick}>No ad channels reporting ROAS.</Empty>}
          </div>

          <div className="db-card">
            <h4 className="db-card-title">Top Products</h4>
            {view.products.length ? (
              <div className="db-products">
                {view.products.map((p, i) => (
                  <div className="db-product" key={p.name + i}>
                    {p.image
                      ? <img className="db-product-img" src={p.image} alt={p.name} />
                      : (
                        <div className="db-product-img" style={{ background: TILE_COLORS[i % TILE_COLORS.length] }}>
                          {initials(p.name)}
                        </div>
                      )}
                    <div className="db-product-info">
                      <p className="db-product-name">{p.name}</p>
                      <p className="db-product-units">{p.units.toLocaleString()} units sold</p>
                    </div>
                    <span className="db-product-price">PKR {compact(p.revenue)}</span>
                  </div>
                ))}
              </div>
            ) : <Empty icon={MdShoppingBag}>No product sales in this period.</Empty>}
          </div>

          <div className="db-card db-ai">
            <div className="db-ai-inner">
              <div className="db-ai-head">
                <div className="db-ai-icon"><MdAutoAwesome size={22} /></div>
                <h4>AI Insights</h4>
              </div>
              {insight ? (
                <>
                  <p className="db-ai-text">
                    {insight.title && <strong>{insight.title}: </strong>}
                    {insight.message}
                  </p>
                  {(insight.actionLabel || onInsightAction || insight.actionHref) && (
                    <button
                      className="db-ai-btn"
                      onClick={() => {
                        if (onInsightAction) onInsightAction(insight)
                        else if (insight.actionHref) window.location.assign(insight.actionHref)
                      }}
                    >
                      {insight.actionLabel || 'Take Action Now'} <MdArrowForward size={16} />
                    </button>
                  )}
                </>
              ) : (
                <p className="db-ai-text">No alerts right now — nothing needs your attention.</p>
              )}
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="db-page">
      {showChrome && (
        <Sidebar
          brand={brand} items={sideNav} activeKey="dashboard" onNavigate={onNavigate}
          onUpgrade={onUpgrade} onHelp={onHelp} onSignOut={onSignOut}
        />
      )}

      <main className={`db-main ${showChrome ? '' : 'no-side'}`}>
        {showChrome && (
          <Topbar
            title={title} tabs={topTabs} activeKey="dashboard" user={user}
            hasAlerts={!!insight} onNavigate={onNavigate}
          />
        )}
        <div className="db-content">{body}</div>
      </main>

      <div className="db-fab-wrap">
        <button className="db-fab" aria-label="Ask AI Support" onClick={onSupportClick}>
          <MdChat size={30} />
          <span className="db-fab-tip">Ask AI Support</span>
        </button>
      </div>
    </div>
  )
}

export default DashboardPage
