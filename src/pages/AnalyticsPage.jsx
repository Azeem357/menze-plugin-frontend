import { useState } from 'react'
import Loader from '../components/common/Loader'
import { useFunnel } from '../hooks/useFunnel'
import {
  MdMenu, MdCalendarToday, MdCalendarMonth, MdNotificationsNone,
  MdDownload, MdTrendingUp, MdTrendingDown, MdArrowDownward,
  MdArrowUpward, MdMoreVert, MdLaptopMac, MdSmartphone,
  MdTabletMac, MdPsychology
} from 'react-icons/md'
import './AnalyticsPage.css'

/* Set to false if your app layout already renders the top bar */
const SHOW_TOPBAR = true

const NAV = ['Dashboard', 'Analytics', 'Financials', 'AI Insights']

/* Funnel step colours: navy fading out, last step gold */
const STEP_COLORS = ['#000d33', '#232f55', '#4a5272', '#6f7590', '#755b00']
const STEP_TAGS = ['Sessions', 'Views', 'Adds', 'Initiated', 'Orders']

/* ---------- Sample data (used when the API doesn't send a field) ---------- */
const SAMPLE_FUNNEL = [
  { name: 'Homepage', count: 142500 },
  { name: 'Product Page', count: 88200 },
  { name: 'Cart', count: 12400 },
  { name: 'Checkout', count: 6100 },
  { name: 'Purchase', count: 4800 },
]
const SAMPLE_TREND = [250, 230, 240, 180, 160, 190, 140, 130, 110, 125, 90]
const SAMPLE_REF = [260, 265, 250, 220, 230, 210, 190, 185, 170, 175, 160]
const SAMPLE_DEVICES = [
  { name: 'Desktop', rate: 4.8 },
  { name: 'Mobile', rate: 2.9 },
  { name: 'Tablet', rate: 3.1 },
]
const SAMPLE_SOURCES = [
  { name: 'Organic', rate: 5.2 },
  { name: 'Paid Ads', rate: 3.8 },
  { name: 'Email', rate: 2.1 },
  { name: 'Direct', rate: 4.5 },
  { name: 'Social', rate: 1.8 },
]
const DEVICE_ICONS = { desktop: MdLaptopMac, mobile: MdSmartphone, tablet: MdTabletMac }
const DEVICE_COLORS = ['#000d33', '#755b00', '#4a5272']

/* ---------- helpers ---------- */
const compact = (n) => {
  n = Number(n) || 0
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 100_000 ? 1 : 1)}k`
  return String(n)
}

/* Accept whatever shape the API returns for funnel steps */
const normaliseFunnel = (raw) => {
  if (!Array.isArray(raw) || !raw.length) return SAMPLE_FUNNEL
  return raw.map((s, i) => ({
    name: s.name ?? s.stage ?? s.step ?? s.label ?? `Step ${i + 1}`,
    count: Number(s.count ?? s.value ?? s.users ?? s.sessions ?? 0),
  }))
}

/* Turn a list of y-values (0 = bottom of chart) into an SVG path */
const toPath = (ys, close = false) => {
  const step = 1000 / Math.max(ys.length - 1, 1)
  const d = ys.map((y, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${y}`).join(' ')
  return close ? `${d} V300 H0 Z` : d
}

/* Convert a series of real values into SVG y coordinates (300 = bottom) */
const scaleToY = (vals) => {
  const max = Math.max(...vals, 0.0001)
  const min = Math.min(...vals, 0)
  return vals.map((v) => 300 - ((v - min) / (max - min || 1)) * 240 - 20)
}

/* ---------- small pieces ---------- */
const TrendChart = ({ trend }) => {
  const real = Array.isArray(trend) && trend.length > 1
  const main = real
    ? scaleToY(trend.map((t) => Number(t.rate ?? t.value ?? t.conversion_rate ?? 0)))
    : SAMPLE_TREND
  const ref = real && trend[0]?.previous != null
    ? scaleToY(trend.map((t) => Number(t.previous ?? 0)))
    : real ? main.map((y) => y + 30) : SAMPLE_REF

  const labelCount = 6
  const labels = real
    ? Array.from({ length: labelCount }, (_, i) => {
        const idx = Math.round((i * (trend.length - 1)) / (labelCount - 1))
        return String(trend[idx].date ?? trend[idx].label ?? '').slice(-5).toUpperCase()
      })
    : ['OCT 01', 'OCT 07', 'OCT 14', 'OCT 21', 'OCT 28', 'OCT 31']

  return (
    <div className="an-trend-body">
      <svg viewBox="0 0 1000 300" preserveAspectRatio="none">
        <defs>
          <linearGradient id="anGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(0,32,96,0.12)" />
            <stop offset="100%" stopColor="rgba(0,32,96,0)" />
          </linearGradient>
        </defs>
        {[0, 100, 200, 300].map((y) => (
          <line key={y} className="an-grid-line" x1="0" x2="1000" y1={y} y2={y} />
        ))}
        <path d={toPath(main, true)} fill="url(#anGrad)" />
        <path className="an-line-main" d={toPath(main)} />
        <path className="an-line-ref" d={toPath(ref)} />
      </svg>
      <div className="an-x-labels">
        {labels.map((l, i) => <span key={i}>{l}</span>)}
      </div>
    </div>
  )
}

const Funnel = ({ steps }) => (
  <div className="an-funnel">
    {steps.map((s, i) => {
      const last = i === steps.length - 1
      const prev = steps[i - 1]
      const drop = prev && prev.count
        ? Math.round((1 - s.count / prev.count) * 100)
        : null
      const completion = prev && prev.count ? Math.round((s.count / prev.count) * 100) : null

      return (
        <div className="an-funnel-step" key={s.name + i}>
          <div
            className="an-funnel-shape"
            style={{ background: STEP_COLORS[Math.min(i, STEP_COLORS.length - 1)] }}
          >
            <div>
              <p className="an-funnel-tag">{STEP_TAGS[i] ?? 'Step'}</p>
              <p className="an-funnel-val">{compact(s.count)}</p>
            </div>
          </div>
          <p className={`an-funnel-name ${last ? 'gold' : ''}`}>{s.name}</p>
          {last && completion != null && (
            <p className="an-funnel-note good">{completion}% Completion</p>
          )}
          {!last && drop != null && (
            <p className="an-funnel-note">-{drop}% drop</p>
          )}
        </div>
      )
    })}
  </div>
)

const MiniStat = ({ label, value, note, bad, up }) => (
  <div className="an-mini">
    <p className="an-mini-label">{label}</p>
    <p className="an-mini-val">{value}</p>
    <p className={`an-mini-note ${bad ? 'bad' : ''}`}>
      {up ? <MdArrowUpward size={12} /> : <MdArrowDownward size={12} />} {note}
    </p>
  </div>
)

/* ---------- page ---------- */
const AnalyticsPage = () => {
  const [days, setDays] = useState(30)
  const { data, loading } = useFunnel(days)

  const steps = normaliseFunnel(data?.funnel)
  const devices = (data?.devices || SAMPLE_DEVICES).map((d) => ({
    name: d.name ?? d.device,
    rate: Number(d.rate ?? d.conversion_rate ?? 0),
  }))
  const sources = (data?.sources || SAMPLE_SOURCES).map((s) => ({
    name: s.name ?? s.source,
    rate: Number(s.rate ?? s.conversion_rate ?? 0),
  }))
  const devMax = Math.max(...devices.map((d) => d.rate), 1)
  const srcMax = Math.max(...sources.map((s) => s.rate), 1)

  const overall = data?.overall_conversion ?? (
    steps[0]?.count ? ((steps[steps.length - 1].count / steps[0].count) * 100).toFixed(2) : '0'
  )

  return (
    <div className="an-page">
      {SHOW_TOPBAR && (
        <header className="an-topbar">
          <div className="an-topbar-left">
            <button className="an-icon-btn" aria-label="Menu"><MdMenu size={24} /></button>
            <h1 className="an-brand">MENZ Analytics</h1>
          </div>
          <nav className="an-nav">
            {NAV.map((n) => (
              <a key={n} href="#" className={n === 'Analytics' ? 'active' : ''}>{n}</a>
            ))}
          </nav>
          <div className="an-topbar-right">
            <button className="an-icon-btn" aria-label="Calendar"><MdCalendarToday size={20} /></button>
            <button className="an-icon-btn" aria-label="Notifications"><MdNotificationsNone size={22} /></button>
            <div className="an-avatar" />
          </div>
        </header>
      )}

      <main className="an-main">
        {/* Page heading + controls */}
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
                <option value={7}>Last 7 Days</option>
                <option value={30}>Last 30 Days</option>
                <option value={90}>Last 90 Days</option>
                <option value={365}>Last 365 Days</option>
              </select>
            </label>
            <button className="an-btn-gold" onClick={() => window.print()}>
              <MdDownload size={18} /> Export PDF
            </button>
          </div>
        </div>

        {loading ? (
          <div className="an-state"><Loader /></div>
        ) : (
          <>
            {/* Conversion rate trend */}
            <section className="an-card">
              <div className="an-trend-head">
                <div>
                  <h3 className="an-card-title">Conversion Rate Trend</h3>
                  <p className="an-card-sub">Daily aggregate across all platforms</p>
                </div>
                <div className="an-trend-kpi">
                  <strong>{overall}%</strong>
                  <span className="an-delta">
                    <MdTrendingUp size={16} /> +0.12% vs LY
                  </span>
                </div>
              </div>
              <TrendChart trend={data?.trend} />
            </section>

            {/* Funnel */}
            <section className="an-card an-card-pad">
              <h3 className="an-card-title">Purchase Funnel Breakdown</h3>
              <Funnel steps={steps} />
              <div className="an-mini-grid">
                <MiniStat label="Bounce Rate" value="32.4%" note="Improving (4% lower)" />
                <MiniStat label="Add to Cart Rate" value="8.7%" note="Critically Low" bad />
                <MiniStat label="Avg. Session Duration" value="4m 12s" note="High Engagement" up />
              </div>
              <p style={{ textAlign: 'center', margin: '20px 0 0', fontSize: 14, color: '#444650' }}>
                Overall conversion rate: <strong style={{ color: '#000d33' }}>{overall}%</strong>
              </p>
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
                <div className="an-bars">
                  {devices.map((d, i) => {
                    const Icon = DEVICE_ICONS[String(d.name).toLowerCase()] || MdLaptopMac
                    return (
                      <div key={d.name}>
                        <div className="an-bar-row-head">
                          <span><Icon size={20} color="#000d33" /> {d.name}</span>
                          <span>{d.rate}%</span>
                        </div>
                        <div className="an-track">
                          <div
                            className="an-fill"
                            style={{
                              width: `${(d.rate / devMax) * 100}%`,
                              background: DEVICE_COLORS[i % DEVICE_COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>

              <section className="an-card an-card-pad">
                <div className="an-card-head">
                  <div>
                    <h3 className="an-card-title">Top Traffic Sources</h3>
                    <p className="an-card-sub">Attribution by channel origin</p>
                  </div>
                  <MdMoreVert className="an-more" size={22} />
                </div>
                <div className="an-cols">
                  {sources.map((s) => (
                    <div className="an-col" key={s.name}>
                      <div className="an-col-bar-wrap">
                        <div className="an-col-bar" style={{ height: `${(s.rate / srcMax) * 85}%` }}>
                          <span className="an-col-tip">{s.rate}%</span>
                        </div>
                      </div>
                      <span className="an-col-label">{s.name}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* AI anomaly banner */}
            <div className="an-ai">
              <div className="an-ai-icon"><MdPsychology size={32} /></div>
              <div className="an-ai-body">
                <h4>AI-Detected Anomalies</h4>
                <p>
                  We noticed a <b>12% decrease</b> in Mobile Checkout completion rates following
                  the October 21st update. This correlates with increased latency on the payment
                  confirmation step. We recommend reviewing the mobile payment API response times.
                </p>
              </div>
              <button className="an-ai-btn">View Recommendation</button>
            </div>
          </>
        )}
      </main>

      <footer className="an-footer">
        <p>© {new Date().getFullYear()} MENZ Analytics. All rights reserved.</p>
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
