import { useState } from 'react'
import Header from '../components/layout/Header'
import Loader from '../components/common/Loader'
import { useSuggestions } from '../hooks/useSuggestions'
import {
  getPriorityColor,
  getPriorityBadge
} from '../utils/formatters'
import { MdCheckCircle, MdLightbulb } from 'react-icons/md'

const SuggestionsPage = () => {
  const [filter, setFilter] = useState({})
  const {
    suggestions, stats, loading, error, refresh, handleMarkDone
  } = useSuggestions(filter)

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
                      {!s.is_acted_on && s.is_active && (
                        <button
                          onClick={() =>
                            handleMarkDone(s.id)
                          }
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
                ))}
              </div>
            )
        }
      </div>
    </>
  )
}

export default SuggestionsPage