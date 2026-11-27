import { useEffect, useState } from 'react'
import Header from '../components/layout/Header'
import Loader from '../components/common/Loader'
import { useSuggestions } from '../hooks/useSuggestions'
import {
  getProductSales,
  syncStoreOrders
} from '../api/suggestionsApi'
import {
  formatPKR,
  getPriorityColor,
  getPriorityBadge,
} from '../utils/formatters'
import { MdCheckCircle, MdLightbulb } from 'react-icons/md'

const SuggestionsPage = () => {
  const [filter, setFilter] = useState({})
  const [salesSuggestionId, setSalesSuggestionId] = useState(null)
  const [salesPeriod, setSalesPeriod] = useState('7d')
  const [salesData, setSalesData] = useState(null)
  const [salesLoading, setSalesLoading] = useState(false)
  const [salesError, setSalesError] = useState('')
  const [salesSyncing, setSalesSyncing] = useState(false)
  const [salesSyncMessage, setSalesSyncMessage] = useState('')
  const {
    suggestions, stats, loading, error, refresh, handleMarkDone
  } = useSuggestions(filter)

  useEffect(() => {
    if (!salesSuggestionId) return undefined

    let cancelled = false
    const fetchSales = async () => {
      try {
        setSalesLoading(true)
        setSalesError('')
        const response = await getProductSales(salesPeriod)
        if (!cancelled) setSalesData(response.data)
      } catch (err) {
        if (!cancelled) {
          setSalesError(
            err.response?.data?.error
            || err.message
            || 'Could not load product sales.'
          )
        }
      } finally {
        if (!cancelled) setSalesLoading(false)
      }
    }

    fetchSales()
    return () => {
      cancelled = true
    }
  }, [salesSuggestionId, salesPeriod])

  const toggleProductSales = (suggestionId) => {
    setSalesSuggestionId((current) => (
      current === suggestionId ? null : suggestionId
    ))
    setSalesPeriod('7d')
    setSalesData(null)
    setSalesError('')
    setSalesSyncMessage('')
  }

  const handleSyncStoreOrders = async () => {
    try {
      setSalesSyncing(true)
      setSalesError('')
      setSalesSyncMessage('')
      await syncStoreOrders()
      const response = await getProductSales(salesPeriod)
      setSalesData(response.data)
      setSalesSyncMessage('Store orders synced; product sales are up to date.')
    } catch (err) {
      setSalesError(
        err.response?.data?.error
        || err.message
        || 'Could not sync store orders.'
      )
    } finally {
      setSalesSyncing(false)
    }
  }

  return (
    <>
      <Header title="Analytics Suggestions" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            Suggestions are generated from recent store and campaign activity using transparent rules.
          </p>
          <button
            onClick={refresh}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-navy text-white disabled:opacity-60"
          >
            {loading ? 'Refreshing…' : 'Refresh suggestions'}
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            Could not refresh suggestions: {error}
          </div>
        )}

        {/* Stats Row */}
        {stats && (
          <div className="grid grid-cols-4 gap-4">
            {[
              {
                label: 'Total Active',
                value: stats.active,
                color: 'text-navy'
              },
              {
                label: 'High Priority',
                value: stats.by_priority?.high || 0,
                color: 'text-red-600'
              },
              {
                label: 'Medium Priority',
                value: stats.by_priority?.medium || 0,
                color: 'text-amber-600'
              },
              {
                label: 'Acted On',
                value: stats.acted_on,
                color: 'text-green-600'
              },
            ].map((stat) => (
              <div key={stat.label} className="
                bg-white rounded-xl shadow-sm p-4
                border border-gray-100 text-center
              ">
                <p className={`
                  text-3xl font-bold ${stat.color}
                `}>
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex gap-3">
          {[
            { label: 'All', value: {} },
            {
              label: '🔴 High',
              value: { priority: 'high' }
            },
            {
              label: '🟡 Medium',
              value: { priority: 'medium' }
            },
            {
              label: 'Internal',
              value: { type: 'internal' }
            },
            {
              label: 'External',
              value: { type: 'external' }
            },
            {
              label: 'Active Only',
              value: { active: 'true' }
            },
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={() => setFilter(btn.value)}
              className={`
                px-4 py-2 rounded-lg text-sm
                font-medium transition-colors
                ${JSON.stringify(filter) ===
                  JSON.stringify(btn.value)
                  ? 'bg-navy text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-navy'
                }
              `}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Suggestions List */}
        {loading
          ? <Loader />
          : suggestions.length === 0
            ? (
              <div className="
                bg-white rounded-xl p-12
                text-center border border-gray-100
              ">
                <MdLightbulb
                  size={48}
                  className="text-gray-300 mx-auto mb-3"
                />
                <p className="text-gray-500">
                  No suggestions found
                </p>
              </div>
            )
            : (
              <div className="space-y-4">
                {suggestions.map((s) => (
                  <div
                    key={s.id}
                    className={`
                      bg-white rounded-xl shadow-sm p-6
                      border-l-4 border border-gray-100
                      ${getPriorityColor(s.priority)}
                      ${s.is_acted_on || !s.is_active ? 'opacity-60' : ''}
                    `}
                  >
                    {/* Header */}
                    <div className="
                      flex items-start
                      justify-between mb-3
                    ">
                      <div className="flex items-center gap-2">
                        <span className={`
                          text-xs font-bold px-2 py-1
                          rounded-full uppercase
                          ${getPriorityBadge(s.priority)}
                        `}>
                          {s.priority} Priority
                        </span>
                        <span className="
                          text-xs text-gray-500
                          bg-gray-100 px-2 py-1
                          rounded-full capitalize
                        ">
                          {s.suggestion_type}
                        </span>
                      </div>
                      {s.is_acted_on && (
                        <span className="
                          flex items-center gap-1
                          text-green-600 text-sm
                        ">
                          <MdCheckCircle size={16} />
                          Done
                        </span>
                      )}
                      {!s.is_active && !s.is_acted_on && (
                        <span className="text-gray-500 text-sm">
                          No longer active
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <h4 className="
                      font-semibold text-navy
                      text-base mb-2
                    ">
                      {s.title}
                    </h4>
                    <p className="
                      text-gray-600 text-sm
                      leading-relaxed mb-4
                    ">
                      {s.body}
                    </p>

                    {/* Footer */}
                    <div className="
                      flex items-center
                      justify-between
                    ">
                      <p className="text-xs text-gray-400">
                        Source: {s.source} |{' '}
                        {new Date(
                          s.created_at
                        ).toLocaleDateString()}
                      </p>
                      <div className="flex items-center gap-2">
                        {s.suggestion_type === 'internal' && (
                          <button
                            type="button"
                            aria-expanded={salesSuggestionId === s.id}
                            onClick={() => toggleProductSales(s.id)}
                            className="
                              px-4 py-2 rounded-lg text-sm font-medium
                              border border-navy text-navy
                              hover:bg-gray-50 transition-colors
                            "
                          >
                            {salesSuggestionId === s.id
                              ? 'Hide product sales'
                              : 'View best-selling products'}
                          </button>
                        )}
                        {!s.is_acted_on && s.is_active && (
                          <button
                            onClick={() => handleMarkDone(s.id)}
                            className="
                              flex items-center gap-2
                              bg-navy text-white
                              px-4 py-2 rounded-lg
                              text-sm hover:bg-navy-light
                              transition-colors
                            "
                          >
                            <MdCheckCircle size={16} />
                            Mark as Done
                          </button>
                        )}
                      </div>
                    </div>
                    {salesSuggestionId === s.id && (
                      <section
                        aria-label="Best-selling products"
                        className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4"
                      >
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h5 className="font-semibold text-navy">
                              Best-selling products
                            </h5>
                            <p className="text-xs text-gray-500">
                              Ranked by units sold; revenue is shown for comparison.
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {[
                              { label: 'Today', value: 'today' },
                              { label: 'Last 7 days', value: '7d' },
                            ].map((period) => (
                              <button
                                key={period.value}
                                type="button"
                                onClick={() => setSalesPeriod(period.value)}
                                aria-pressed={salesPeriod === period.value}
                                className={`rounded-lg px-3 py-2 text-sm ${
                                  salesPeriod === period.value
                                    ? 'bg-navy text-white'
                                    : 'border border-gray-200 bg-white text-gray-600'
                                }`}
                              >
                                {period.label}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={handleSyncStoreOrders}
                              disabled={salesSyncing}
                              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 disabled:opacity-60"
                            >
                              {salesSyncing ? 'Syncing…' : 'Sync store orders'}
                            </button>
                          </div>
                        </div>

                        {salesSyncMessage && (
                          <p role="status" className="mb-3 text-sm text-green-700">
                            {salesSyncMessage}
                          </p>
                        )}
                        {salesError && (
                          <p role="alert" className="mb-3 text-sm text-red-700">
                            Could not load product sales: {salesError}
                          </p>
                        )}
                        {salesLoading
                          ? <p className="py-4 text-sm text-gray-500">Loading sales…</p>
                          : salesData && (
                            <>
                              {salesData.orders_without_items > 0 && (
                                <p className="mb-3 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
                                  {salesData.orders_without_items} recorded order(s)
                                  {' '}have no product details. Deploy the store and
                                  analytics updates, then sync orders again to backfill them.
                                </p>
                              )}
                              {salesData.products.length === 0
                                ? (
                                  <p className="py-4 text-sm text-gray-500">
                                    No product sales with line-item details were recorded
                                    for this period.
                                  </p>
                                )
                                : (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                      <thead className="text-xs uppercase text-gray-500">
                                        <tr>
                                          <th className="py-2 pr-4">Product</th>
                                          <th className="py-2 pr-4">Units sold</th>
                                          <th className="py-2 pr-4">Revenue</th>
                                          <th className="py-2">Orders</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {salesData.products.slice(0, 10).map((product) => (
                                          <tr
                                            key={product.product_id}
                                            className="border-t border-gray-200"
                                          >
                                            <td className="py-2 pr-4 font-medium text-gray-800">
                                              {product.product_name}
                                            </td>
                                            <td className="py-2 pr-4">
                                              {product.units_sold}
                                            </td>
                                            <td className="py-2 pr-4">
                                              {formatPKR(product.revenue)}
                                            </td>
                                            <td className="py-2">{product.orders}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                            </>
                          )}
                      </section>
                    )}
                  </div>
                ))}
              </div>
            )
        }
      </div>
    </>
  )
}

export default SuggestionsPage