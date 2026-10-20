/* ============================================================
   config/navigation.js
   Brand, user and navigation for both pages. Edit here (or pass
   your own `brand`, `user`, `sideNav`, `topTabs` props) — no page
   code needs to change when you add or rename a menu item.
   `href` values are placeholders: point them at your real routes.
   ============================================================ */
import {
  MdDashboard, MdAnalytics, MdPayments, MdPsychology,
  MdAssessment, MdSettings
} from 'react-icons/md'

export const BRAND = { name: 'MENZ Analytics', tagline: 'Executive Insights' }

/* avatar: put an image URL here, or leave null for the gradient circle */
export const USER = { name: 'Exec Admin', avatar: null }

export const SIDE_NAV = [
  { key: 'dashboard', label: 'Dashboard', href: '/', icon: MdDashboard },
  { key: 'analytics', label: 'Analytics', href: '/analytics', icon: MdAnalytics },
  { key: 'financials', label: 'Financial Metrics', href: '/financials', icon: MdPayments },
  { key: 'ai', label: 'AI Predictions', href: '/ai-predictions', icon: MdPsychology },
  { key: 'reports', label: 'Reports', href: '/reports', icon: MdAssessment },
  { key: 'setup', label: 'Setup', href: '/setup', icon: MdSettings },
]

export const TOP_TABS = [
  { key: 'dashboard', label: 'Dashboard', href: '/' },
  { key: 'analytics', label: 'Analytics', href: '/analytics' },
  { key: 'financials', label: 'Financials', href: '/financials' },
  { key: 'ai', label: 'AI Insights', href: '/ai-insights' },
]

/* Date ranges offered by the pages */
export const RANGES = [
  { label: 'Week', days: 7 },
  { label: 'Month', days: 30 },
  { label: 'Year', days: 365 },
]
export const RANGE_OPTIONS = [
  { label: 'Last 7 Days', days: 7 },
  { label: 'Last 30 Days', days: 30 },
  { label: 'Last 90 Days', days: 90 },
  { label: 'Last 365 Days', days: 365 },
]