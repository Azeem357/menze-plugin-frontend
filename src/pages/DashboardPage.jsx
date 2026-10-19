import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useDashboard } from '../hooks/useDashboard'
import Loader from '../components/common/Loader'
import ErrorMessage from '../components/common/ErrorMessage'
import {
  MdInsights, MdDashboard, MdAnalytics, MdPayments, MdPsychology,
  MdAssessment, MdSettings, MdHelpOutline, MdLogout,
  MdCalendarToday, MdNotificationsNone, MdShoppingBag, MdAdsClick,
  MdGroups, MdTrendingUp, MdTrendingDown, MdShowChart,
  MdAutoAwesome, MdArrowForward, MdChat, MdWatch, MdSpa
} from 'react-icons/md'
import { formatPKR, formatPct } from '../utils/formatters'
import './DashboardPage.css'

/* Set to false if your app layout already renders sidebar + top bar */
const SHOW_CHROME = true

const SIDE_NAV = [
  { label: 'Dashboard', icon: MdDashboard, path: '/' },
  { label: 'Analytics', icon: MdAnalytics, path: '/analytics' },
  { label: 'Financial Metrics', icon: MdPayments, path: '/financial' },
  { label: 'AI Predictions', icon: MdPsychology, path: '/predictions' },
  { label: 'Reports', icon: MdAssessment, path: '/reports' },
  { label: 'Setup', icon: MdSettings, path: '/setup' },
]
const TOP_TABS = [
  { label: 'Dashboard', path: '/' },
  { label: 'Analytics', path: '/analytics' },
  { label: 'Financials', path: '/financial' },
  { label: 'AI Insights', path: '/predictions' },
]

/* Chart / legend colours straight from the design tokens */
const C = { navy: '#000d33', gold: '#755b00', grey: '#e6e8eb', navySoft: 'rgba(0,13,51,.6)' }

/* ---------- sample data (used when the API doesn't send a field) ---------- */
const SAMPLE_BARS = [40, 55, 45, 70, 60, 85, 95, 80, 75, 90]
const SAMPLE_AXIS = ['MAY 01', 'MAY 08', 'MAY 15', 'MAY 22', 'MAY 30']
const SAMPLE_TRAFFIC = [
  { name: 'Direct Search', value: 45 },
  { name: 'Social Media', value: 32 },
  { name: 'Referral', value: 23 },
]
const SAMPLE_ROAS = [
  { name: 'Facebook Ads', value: 4.2, width: 84 },
  { name: 'Google Shopping', value: 5.8, width: 95 },
  { name: 'Instagram Influencers', value: 2.9, width: 58 },
]
const SAMPLE_PRODUCTS = [
  { name: 'Premium Leather Wallet', units: 124, revenue: 8400, bg: '#0f2a4a', icon: MdShoppingBag },
  { name: 'Executive Chrono-V1', units: 89, revenue: 12200, bg: '#2b2b2b', icon: MdWatch },
  { name: 'Aesthetic Skincare Kit', units: 64, revenue: 5100, bg: '#6f8f86', icon: MdSpa },
]
const ROAS_COLORS = [C.navy, C.gold, C.navySoft]
const TRAFFIC_COLORS = [C.navy, C.gold, C.grey]

const pkrShort = (n) => `PKR ${(Number(n) / 1000).toFixed(1).replace(/\.0$/, '')}k`

/* ---------- pieces ---------- */
const Sidebar = () => (
  <aside className="db-sidebar">
    <div className="db-side-top">
      <div className="db-brand">
        <div className="db-brand-logo"><MdInsights size={24} /></div>
        <div>
          <h1 className="db-brand-name">MENZ Analytics</h1>
          <p className="db-brand-sub">Executive Insights</p>
        </div>
      </div>
      <nav className="db-side-nav">
        {SIDE_NAV.map(({ label, icon: Icon, path }) => (
          <NavLink
            key={label}
            to={path}
            end={path === '/'}
            className={({ isActive }) => `db-side-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={24} /> <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>

    <div className="db-side-bottom">
      <div className="db-upgrade">
        <h5>Upgrade Pro</h5>
        <p>Unlock advanced predictive models.</p>
        <button>Upgrade Now</button>
      </div>
      <div>
        <a href="#" className="db-side-small"><MdHelpOutline size={20} /> Help Center</a>
        <a href="#" className="db-side-small danger"><MdLogout size={20} /> Sign Out</a>
      </div>
    </div>
  </aside>
)

const Topbar = () => (
  <header className="db-topbar">
    <div className="db-topbar-left">
      <h2 className="db-page-title">Dashboard</h2>
      <nav className="db-tabs">
        {TOP_TABS.map(({ label, path }) => (
          <NavLink
            key={label}
            to={path}
            end={path === '/'}
            className={({ isActive }) => `db-tab ${isActive ? 'active' : ''}`}
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
    <div className="db-topbar-right">
      <button className="db-round-btn" aria-label="Calendar"><MdCalendarToday size={22} /></button>
      <button className="db-round-btn" aria-label="Notifications">
        <MdNotificationsNone size={24} /><span className="db-dot" />
      </button>
      <div className="db-vline" />
      <button className="db-admin"><span>Exec Admin</span><i /></button>
    </div>
  </header>
)

const KPI = ({ icon, tone, label, value, note, trend, trendValue }) => (
  <div className="db-card db-kpi">
    <div className="db-kpi-top">
      <div className={`db-kpi-icon ${tone}`}>{icon}</div>
      <span className={`db-badge ${trend}`}>
        {trend === 'up' ? <MdTrendingUp size={14} /> : <MdTrendingDown size={14} />} {trendValue}
      </span>
    </div>
    <p className="db-kpi-label">{label}</p>
    <h3 className="db-kpi-value">{value}</h3>
    <p className="db-kpi-note">{note}</p>
  </div>
)

const RevenueBars = ({ chart }) => {
  const real = chart.length > 0
  const vals = real
    ? chart.map((d) => Number(d.revenue ?? d.value ?? d.total_revenue ?? 0))
    : SAMPLE_BARS
  const max = Math.max(...vals, 1)
  const labels = real
    ? chart.map((d) => String(d.date ?? d.label ?? d.day ?? ''))
    : []

  /* five axis labels, evenly picked */
  const axis = real
    ? Array.from({ length: 5 }, (_, i) =>
        (labels[Math.round((i * (labels.length - 1)) / 4)] || '').slice(-5).toUpperCase())
    : SAMPLE_AXIS

  return (
    <>
      <div className="db-bars">
        <div className="db-bars-ghost"><MdShowChart size={200} /></div>
        {vals.map((v, i) => (
          <div
            key={i}
            className="db-bar"
            style={{ height: `${real ? (v / max) * 95 : v}%`, ...(vals.length > 20 && { width: 8 }) }}
          >
            <span className="db-bar-tip">{formatPKR(v)}</span>
          </div>
        ))}
      </div>
      <div className="db-bar-axis">{axis.map((a, i) => <span key={i}>{a}</span>)}</div>
    </>
  )
}

const Donut = ({ items }) => {
  const total = items.reduce((s, x) => s + x.value, 0) || 1
  let acc = 0
  const stops = items.map((it, i) => {
    const from = (acc / total) * 100
    acc += it.value
    return `${TRAFFIC_COLORS[i % TRAFFIC_COLORS.length]} ${from}% ${(acc / total) * 100}%`
  })
  return (
    <>
      <div className="db-donut-wrap">
        <div className="db-donut" style={{ background: `conic-gradient(${stops.join(', ')})` }}>
          <div className="db-donut-center">
            <strong>{total >= 1000 ? `${(total / 1000).toFixed(1)}K` : total}</strong>
            <span>TOTAL VISITORS</span>
          </div>
        </div>
      </div>
      <div className="db-legend">
        {items.map((it, i) => (
          <div className="db-legend-row" key={it.name}>
            <span>
              <i className="db-legend-dot" style={{ background: TRAFFIC_COLORS[i % TRAFFIC_COLORS.length] }} />
              {it.name}
            </span>
            <b>{Math.round((it.value / total) * 100)}%</b>
          </div>
        ))}
      </div>
    </>
  )
}

/* ---------- page ---------- */
const DashboardPage = () => {
  const [days, setDays] = useState(30)
  const [range, setRange] = useState('Month')
  const { data, loading, error } = useDashboard(days)

  const summary = data?.summary || {}
  const chart = data?.chart || []

  const apiTraffic = (data?.traffic_sources || []).map((t) => ({
    name: t.source ?? t.name ?? t.channel ?? 'Other',
    value: Number(t.sessions ?? t.value ?? t.count ?? t.percentage ?? 0),
  }))
  const traffic = apiTraffic.length ? apiTraffic : SAMPLE_TRAFFIC

  const roasMax = 6
  const roas = (data?.roas_by_channel || SAMPLE_ROAS).map((r) => ({
    name: r.name ?? r.channel,
    value: Number(r.value ?? r.roas ?? 0),
  }))
  const products = data?.top_products || SAMPLE_PRODUCTS

  let body
  if (loading) {
    body = <div className="db-state"><Loader /></div>
  } else if (error) {
    body = <div className="db-state error"><ErrorMessage message={error} /></div>
  } else {
    body = (
      <>
        {/* KPI row */}
        <div className="db-kpis">
          <KPI tone="gold" icon={<MdPayments size={24} />} label="Revenue"
            value={formatPKR(summary.total_revenue)} note={`vs Last ${days} Days`}
            trend="up" trendValue="12.5%" />
          <KPI tone="navy" icon={<MdShoppingBag size={24} />} label="Orders"
            value={summary.total_orders || 0} note="Successful transactions"
            trend="up" trendValue="8.2%" />
          <KPI tone="gold" icon={<MdAdsClick size={24} />} label="Conversion"
            value={formatPct(summary.avg_conversion_rate)} note="Visits to checkout"
            trend="down" trendValue="0.4%" />
          <KPI tone="navy" icon={<MdGroups size={24} />} label="Visitors"
            value={(summary.total_sessions || 0).toLocaleString()} note="Unique users today"
            trend="up" trendValue="14.1%" />
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
                {['Week', 'Month', 'Year'].map((r) => (
                  <button
                    key={r}
                    className={range === r ? 'active' : ''}
                    onClick={() => {
                      setRange(r)
                      setDays(r === 'Week' ? 7 : r === 'Month' ? 30 : 365)
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <RevenueBars chart={chart} />
          </div>

          <div className="db-card">
            <h4 className="db-card-title">Traffic Sources</h4>
            <Donut items={traffic} />
          </div>
        </div>

        {/* ROAS / products / AI */}
        <div className="db-row-3">
          <div className="db-card">
            <h4 className="db-card-title">ROAS Performance</h4>
            <div className="db-roas">
              {roas.map((r, i) => (
                <div key={r.name}>
                  <div className="db-roas-head"><span>{r.name}</span><b>{r.value}x</b></div>
                  <div className="db-track">
                    <div className="db-fill" style={{
                      width: `${Math.min((r.value / roasMax) * 100, 100)}%`,
                      background: ROAS_COLORS[i % ROAS_COLORS.length],
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="db-card">
            <h4 className="db-card-title">Top Products</h4>
            <div className="db-products">
              {products.map((p) => {
                const Icon = p.icon || MdShoppingBag
                const revenue = p.revenue ?? p.total_revenue ?? 0
                return (
                  <div className="db-product" key={p.name}>
                    {p.image
                      ? <img className="db-product-img" src={p.image} alt={p.name} />
                      : <div className="db-product-img" style={{ background: p.bg || C.navy }}><Icon size={22} /></div>}
                    <div className="db-product-info">
                      <p className="db-product-name">{p.name}</p>
                      <p className="db-product-units">{p.units ?? p.units_sold ?? 0} units sold</p>
                    </div>
                    <span className="db-product-price">{pkrShort(revenue)}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="db-card db-ai">
            <div className="db-ai-inner">
              <div className="db-ai-head">
                <div className="db-ai-icon"><MdAutoAwesome size={22} /></div>
                <h4>AI Insights</h4>
              </div>
              <p className="db-ai-text">
                <strong>Inventory Alert:</strong> Predictive models suggest a stockout for{' '}
                <u>Leather Wallet</u> within 4 days. Restock advised immediately to avoid
                PKR 42,000 in missed revenue.
              </p>
              <button className="db-ai-btn">
                Take Action Now <MdArrowForward size={16} />
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="db-page">
      {SHOW_CHROME && <Sidebar />}

      <main className={`db-main ${SHOW_CHROME ? '' : 'no-side'}`}>
        {SHOW_CHROME && <Topbar />}
        <div className="db-content">{body}</div>
      </main>

      <div className="db-fab-wrap">
        <button className="db-fab" aria-label="Ask AI Support">
          <MdChat size={30} />
          <span className="db-fab-tip">Ask AI Support</span>
        </button>
      </div>
    </div>
  )
}

export default DashboardPage
