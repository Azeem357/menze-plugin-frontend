import { useMemo, useState } from 'react'
import Loader from '../components/common/Loader'
import ErrorMessage from '../components/common/ErrorMessage'
import { useFinancials } from '../hooks/usefinancials'
import {
  MdCalendarToday, MdNotificationsNone, MdDownload, MdAdd, MdTrendingUp,
  MdPayments, MdGroup, MdInfoOutline, MdShowChart
} from 'react-icons/md'
import { formatPKR } from '../utils/formatters'
import {
  num, pick, fmtNum, compact, getTrend, normaliseItems, normaliseCampaigns, normaliseCohorts
} from '../utils/dashboardAdapters'
import { BRAND, USER, TOP_TABS } from '../config/navigation'
import './Financialpage.css'

const DEFAULT_PERIODS = [0, 1, 2, 3, 6, 12]
const GRANULARITIES = [
  { key: 'monthly', label: 'Monthly', unit: 'Month' },
  { key: 'quarterly', label: 'Quarterly', unit: 'Quarter' },
]

/**
 * Hero cards are described, not hand-written — add / remove / reorder here.
 *  invert  : true when a DROP is good news (e.g. acquisition cost)
 *  footer  : renders the line under the value from the data
 */
const KPI_DEFS = [
  {
    key: 'roas', label: 'ROAS', icon: MdTrendingUp, tone: 'gold',
    valueKey: 'avg_roas', changeKeys: ['roas_change'],
    format: (v) => `${fmtNum(v, 1)}x`,
    footer: (v, d) => {
      const target = num(d?.targets?.roas, 0)
      if (!target) return null
      return { kind: 'progress', pct: Math.min((num(v) / target) * 100, 100), text: `Target: ${fmtNum(target, 1)}x` }
    },
  },
  {
    key: 'cac', label: 'CAC', icon: MdPayments, tone: 'navy', invert: true,
    valueKey: 'avg_cac', changeKeys: ['cac_change'],
    format: (v) => formatPKR(v),
    footer: (v, d) => {
      const b = d?.benchmarks?.cac
      return b == null ? null : { kind: 'info', text: `Benchmark: ${formatPKR(b)}` }
    },
  },
  {
    key: 'ltv', label: 'LTV', icon: MdGroup, tone: 'green',
    valueKey: 'avg_ltv', changeKeys: ['ltv_change'],
    format: (v) => formatPKR(v),
    footer: (v, d) => ({
      kind: 'text',
      text: `Average ${d?.ltv_months ? `${d.ltv_months}-month ` : ''}value per customer across all channels.`,
    }),
  },
]

/* ---------- pieces ---------- */
const Empty = ({ icon: Icon = MdShowChart, children }) => (
  <div className="fm-empty"><Icon size={32} /><p>{children}</p></div>
)

const KPI = ({ def, summary, previous, data }) => {
  const Icon = def.icon
  const raw = summary?.[def.valueKey]
  const trend = getTrend(summary, previous, def.valueKey, def.changeKeys)
  const good = trend ? (def.invert ? trend.direction === 'down' : trend.direction === 'up') : null
  const footer = raw == null ? null : def.footer?.(raw, data)

  return (
    <div className="fm-card fm-kpi">
      <div className="fm-kpi-top">
        <div className={`fm-kpi-icon ${def.tone}`}><Icon size={24} /></div>
        {trend && (
          <span className={`fm-pill ${good ? 'good' : 'bad'}`}>
            {trend.direction === 'up' ? '+' : '-'}{trend.label}
          </span>
        )}
      </div>
      <p className="fm-kpi-label">{def.label}</p>
      <h3 className="fm-kpi-value">{raw == null ? '—' : def.format(raw)}</h3>

      {footer?.kind === 'progress' && (
        <>
          <div className="fm-kpi-track"><div style={{ width: `${footer.pct}%` }} /></div>
          <p className="fm-kpi-foot italic">{footer.text}</p>
        </>
      )}
      {footer?.kind === 'info' && (
        <p className="fm-kpi-foot info"><MdInfoOutline size={14} /> {footer.text}</p>
      )}
      {footer?.kind === 'text' && <p className="fm-kpi-foot">{footer.text}</p>}
    </div>
  )
}

const PlatformBars = ({ platforms, target }) => {
  if (!platforms.length) return <Empty>No platform ROAS data for this period.</Empty>

  const top = Math.max(...platforms.map((p) => p.value))
  const axisMax = Math.max(top, target) * 1.1 || 1
  const targetPct = target ? (target / axisMax) * 100 : null

  const tone = (v) => {
    if (v === top) return 'gold'
    const floor = target ? target * 0.75 : top * 0.5
    return v < floor ? 'muted' : 'navy'
  }

  return (
    <div className="fm-platforms">
      {targetPct != null && <div className="fm-target-line" style={{ left: `${targetPct}%` }} />}
      {platforms.map((p, i) => (
        <div className="fm-platform" key={p.name + i}>
          <div className="fm-platform-head">
            <span>{p.name}</span>
            <b>{fmtNum(p.value, 1)}x</b>
          </div>
          <div className="fm-bar-track">
            <div className={`fm-bar-fill ${tone(p.value)}`} style={{ width: `${(p.value / axisMax) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

const Campaigns = ({ campaigns }) => {
  if (!campaigns.length) return <p className="fm-camp-empty">No campaigns to rank yet.</p>
  return (
    <div className="fm-camps">
      {campaigns.map((c, i) => {
        const profit = c.profit >= 0
        return (
          <div className="fm-camp" key={c.name + i}>
            <div>
              <p className="fm-camp-name">{c.name}</p>
              {c.channel && <p className="fm-camp-sub">{c.channel}</p>}
            </div>
            <div className="fm-camp-right">
              <p className="fm-camp-roas">{fmtNum(c.roas)}x</p>
              <p className={`fm-camp-profit ${profit ? 'good' : 'bad'}`}>
                {profit ? 'Profit' : 'Burn'}: {profit ? '' : '-'}PKR {compact(Math.abs(c.profit)).toUpperCase()}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const CohortTable = ({ rows, periods, unit }) => {
  if (!rows.length) return <Empty>No cohort data for this period.</Empty>

  const maxVal = Math.max(...rows.flatMap((r) => r.cells).filter((v) => v != null), 1)
  const lastIdx = rows.length - 1

  /* navy ramp (gold for the highlighted / newest cohort), text flips to white when dark */
  const cellStyle = (v, gold) => {
    const alpha = (gold ? 0.2 : 0.2) + (v / maxVal) * (gold ? 0.5 : 0.8)
    return {
      background: gold ? `rgba(117, 91, 0, ${alpha.toFixed(2)})` : `rgba(0, 13, 51, ${alpha.toFixed(2)})`,
      color: alpha > 0.45 ? '#fff' : undefined,
      fontWeight: v === maxVal ? 700 : undefined,
    }
  }

  return (
    <div className="fm-table-wrap">
      <table className="fm-table">
        <thead>
          <tr>
            <th>Cohort</th>
            <th>Size</th>
            {periods.map((p) => <th key={p}>{unit} {p}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => {
            const gold = r.highlight != null ? !!r.highlight : ri === lastIdx && rows.length > 1
            let trailing = 0
            for (let k = r.cells.length - 1; k >= 0 && r.cells[k] == null; k--) trailing++
            const collapse = trailing >= 3
            const cutoff = r.cells.length - trailing

            return (
              <tr key={r.label + ri}>
                <td className="fm-cohort-name">{r.label}</td>
                <td className="fm-cohort-size">{r.size != null ? num(r.size).toLocaleString() : '—'}</td>
                {r.cells.map((v, ci) => {
                  if (collapse && ci >= cutoff) {
                    return ci === cutoff
                      ? <td key={ci} colSpan={trailing} className="fm-cell pending center">Data collection in progress</td>
                      : null
                  }
                  return v == null
                    ? <td key={ci} className="fm-cell pending">Pending</td>
                    : <td key={ci} className="fm-cell value" style={cellStyle(v, gold)}>PKR {compact(v)}</td>
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/* ---------- page ---------- */
/**
 * Props (all optional):
 *  brand, user, topTabs, footerLinks  – see config/navigation.js
 *  showTopbar                         – false if your layout already has a top bar
 *  subtitle                           – line under the page title
 *  initialDays                        – default date range sent to the API
 *  campaignLimit                      – how many campaigns to rank (default 3)
 *  onNavigate(item)                   – hook your router here
 *  onExport                           – defaults to window.print()
 *  onForecast                         – "Forecast Model" click
 *  onAudit(campaigns)                 – "View Detailed Audit" click
 */
const FinancialPage = ({
  brand = BRAND, user = USER, topTabs = TOP_TABS, footerLinks = [],
  showTopbar = true,
  subtitle = 'Executive overview of profitability and acquisition efficiency.',
  initialDays = 30, campaignLimit = 3,
  onNavigate, onExport, onForecast, onAudit,
}) => {
  const [days] = useState(initialDays)
  const [granularity, setGranularity] = useState('monthly')
  const { data, loading, error } = useFinancials(days, granularity)

  const unit = GRANULARITIES.find((g) => g.key === granularity).unit

  const view = useMemo(() => {
    const periods = Array.isArray(data?.cohort_periods) && data.cohort_periods.length
      ? data.cohort_periods
      : DEFAULT_PERIODS
    return {
      summary: data?.summary || {},
      previous: data?.previous_summary ?? data?.previous ?? null,
      target: num(data?.targets?.roas, 0),
      platforms: normaliseItems(data?.platforms ?? data?.roas_by_platform, {
        nameKeys: ['platform', 'name', 'channel'], valueKeys: ['roas', 'value'],
      }),
      campaigns: normaliseCampaigns(data?.campaigns)
        .sort((a, b) => b.roas - a.roas)
        .slice(0, campaignLimit),
      periods,
      cohorts: normaliseCohorts(data?.cohorts, periods),
    }
  }, [data, campaignLimit])

  const click = (e, item) => { if (onNavigate) { e.preventDefault(); onNavigate(item) } }

  let body
  if (loading) {
    body = <div className="fm-state"><Loader /></div>
  } else if (error) {
    body = <div className="fm-state"><ErrorMessage message={error} /></div>
  } else {
    body = (
      <>
        <div className="fm-kpis">
          {KPI_DEFS.map((def) => (
            <KPI key={def.key} def={def} summary={view.summary} previous={view.previous} data={data} />
          ))}
        </div>

        <div className="fm-grid">
          <section className="fm-card fm-span-8">
            <div className="fm-card-head">
              <h3 className="fm-card-title">ROAS by Platform</h3>
              <div className="fm-legend">
                <span><i className="dot" /> Actual</span>
                {view.target > 0 && <span><i className="tick" /> Target ({fmtNum(view.target, 1)}x)</span>}
              </div>
            </div>
            <PlatformBars platforms={view.platforms} target={view.target} />
          </section>

          <section className="fm-card fm-dark fm-span-4">
            <div>
              <h3 className="fm-dark-title">Campaign Efficiency</h3>
              <p className="fm-dark-sub">Top {view.campaigns.length || campaignLimit} Performing Campaigns</p>
              <Campaigns campaigns={view.campaigns} />
            </div>
            <button className="fm-btn-gold block" onClick={() => onAudit?.(view.campaigns)}>
              View Detailed Audit
            </button>
          </section>

          <section className="fm-card fm-span-12">
            <div className="fm-card-head">
              <div>
                <h3 className="fm-card-title">LTV Cohort Retention</h3>
                <p className="fm-card-sub">Revenue per customer over time relative to acquisition month.</p>
              </div>
              <div className="fm-toggle">
                {GRANULARITIES.map((g) => (
                  <button key={g.key} className={granularity === g.key ? 'active' : ''} onClick={() => setGranularity(g.key)}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
            <CohortTable rows={view.cohorts} periods={view.periods} unit={unit} />
          </section>
        </div>
      </>
    )
  }

  return (
    <div className="fm-page">
      {showTopbar && (
        <header className="fm-topbar">
          <div className="fm-topbar-left">
            <h1 className="fm-brand">{brand.name}</h1>
            <nav className="fm-nav">
              {topTabs.map((t) => (
                <a key={t.key} href={t.href} onClick={(e) => click(e, t)} className={t.key === 'financials' ? 'active' : ''}>
                  {t.key === 'financials' ? 'Financial Metrics' : t.label}
                </a>
              ))}
            </nav>
          </div>
          <div className="fm-topbar-right">
            <button className="fm-icon-btn" aria-label="Calendar"><MdCalendarToday size={22} /></button>
            <button className="fm-icon-btn" aria-label="Notifications"><MdNotificationsNone size={24} /></button>
            {user.avatar
              ? <img className="fm-avatar" src={user.avatar} alt={user.name} />
              : <div className="fm-avatar" title={user.name} />}
          </div>
        </header>
      )}

      <main className="fm-main">
        <div className="fm-head">
          <div>
            <h2 className="fm-title">Financial Metrics</h2>
            {subtitle && <p className="fm-subtitle">{subtitle}</p>}
          </div>
          <div className="fm-head-actions">
            <button className="fm-btn-outline" onClick={() => (onExport ? onExport(data) : window.print())}>
              <MdDownload size={18} /> Export PDF
            </button>
            <button className="fm-btn-gold" onClick={() => onForecast?.(data)}>
              <MdAdd size={18} /> Forecast Model
            </button>
          </div>
        </div>
        {body}
      </main>

      <footer className="fm-footer">
        <div className="fm-footer-in">
          <p>© {new Date().getFullYear()} {brand.name}. {brand.tagline} Engine.</p>
          <div className="fm-footer-links">
            {footerLinks.map((l) => <a key={l.label} href={l.href}>{l.label}</a>)}
          </div>
        </div>
      </footer>
    </div>
  )
}

export default FinancialPage
