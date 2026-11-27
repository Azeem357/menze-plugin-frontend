import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import {
  createCampaign,
  deleteCampaign,
  getCampaignPerformance,
  getCampaigns,
  patchCampaign,
  updateCampaignSpend,
} from '../api/campaignsApi'
import './CampaignsPage.css'

const PLATFORMS = ['facebook', 'instagram', 'google', 'tiktok']
const DEFAULT_LANDING_URL = 'https://menze.vercel.app/'

const createEmptyForm = () => ({
  platform: 'facebook',
  campaign_name: '',
  utm_source: 'facebook',
  utm_medium: 'paid_social',
  utm_campaign: '',
  budget: '0',
  is_active: true,
})

const getErrorMessage = (error) => {
  const data = error?.response?.data
  if (typeof data === 'string') return data
  if (data && typeof data === 'object') {
    return Object.entries(data)
      .map(([field, messages]) => {
        const text = Array.isArray(messages) ? messages.join(', ') : String(messages)
        return `${field}: ${text}`
      })
      .join(' ')
  }
  return error?.message || 'The request failed. Please try again.'
}

const buildTrackingLink = (campaign, landingUrl) => {
  const url = new URL(landingUrl)
  url.searchParams.set('utm_source', campaign.utm_source)
  url.searchParams.set('utm_medium', campaign.utm_medium)
  url.searchParams.set('utm_campaign', campaign.utm_campaign)
  return url.toString()
}

const CampaignsPage = () => {
  const [campaigns, setCampaigns] = useState([])
  const [performance, setPerformance] = useState([])
  const [days, setDays] = useState(30)
  const [landingUrl, setLandingUrl] = useState(DEFAULT_LANDING_URL)
  const [form, setForm] = useState(createEmptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingStats, setSavingStats] = useState(false)
  const [statsEditingId, setStatsEditingId] = useState(null)
  const [statsForm, setStatsForm] = useState({
    spend: '0',
    impressions: '0',
    clicks: '0',
  })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadCampaigns = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const campaignResponse = await getCampaigns()
      const campaignData = campaignResponse.data
      setCampaigns(Array.isArray(campaignData) ? campaignData : campaignData.results || [])
      try {
        const performanceResponse = await getCampaignPerformance(days)
        setPerformance(performanceResponse.data.campaigns || [])
      } catch (performanceError) {
        setPerformance([])
        setError(
          `Campaigns loaded, but performance data is unavailable: ${getErrorMessage(performanceError)}`,
        )
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError))
      setCampaigns([])
      setPerformance([])
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    loadCampaigns()
  }, [loadCampaigns])

  const performanceById = useMemo(
    () => new Map(performance.map((item) => [String(item.campaign_id), item])),
    [performance],
  )

  const updateForm = (event) => {
    const { name, value, type, checked } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const resetForm = () => {
    setForm(createEmptyForm())
    setEditingId(null)
  }

  const submitCampaign = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    const payload = {
      ...form,
      campaign_name: form.campaign_name.trim(),
      utm_source: form.utm_source.trim(),
      utm_medium: form.utm_medium.trim(),
      utm_campaign: form.utm_campaign.trim(),
      budget: Number(form.budget) || 0,
    }

    try {
      if (editingId) {
        await patchCampaign(editingId, payload)
        setNotice('Campaign updated.')
      } else {
        await createCampaign(payload)
        setNotice('Campaign created.')
      }
      resetForm()
      await loadCampaigns()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  const editCampaign = (campaign) => {
    setForm({
      platform: campaign.platform,
      campaign_name: campaign.campaign_name,
      utm_source: campaign.utm_source,
      utm_medium: campaign.utm_medium,
      utm_campaign: campaign.utm_campaign,
      budget: String(campaign.budget ?? 0),
      is_active: campaign.is_active,
    })
    setEditingId(campaign.id)
    setNotice('')
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const removeCampaign = async (campaign) => {
    if (!window.confirm(`Delete "${campaign.campaign_name}"?`)) return
    setError('')
    setNotice('')
    try {
      await deleteCampaign(campaign.id)
      setNotice('Campaign deleted.')
      await loadCampaigns()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  const toggleStatsForm = (campaign) => {
    if (statsEditingId === campaign.id) {
      setStatsEditingId(null)
      return
    }
    setStatsEditingId(campaign.id)
    setStatsForm({ spend: '0', impressions: '0', clicks: '0' })
    setError('')
    setNotice('')
  }

  const submitAdStats = async (event, campaignId) => {
    event.preventDefault()
    setSavingStats(true)
    setError('')
    setNotice('')
    try {
      await updateCampaignSpend(campaignId, {
        spend: Number(statsForm.spend),
        impressions: Number(statsForm.impressions),
        clicks: Number(statsForm.clicks),
      })
      setStatsEditingId(null)
      setNotice("Today's ad-platform stats were saved.")
      await loadCampaigns()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSavingStats(false)
    }
  }

  const copyLink = async (campaign) => {
    try {
      const link = buildTrackingLink(campaign, landingUrl)
      await navigator.clipboard.writeText(link)
      setNotice('Tracking link copied.')
      setError('')
    } catch (copyError) {
      setError(copyError instanceof TypeError
        ? 'Enter a valid landing page URL before copying a link.'
        : 'Could not copy the link. Check clipboard permissions.')
    }
  }

  return (
    <main className="campaigns-page">
      <header className="campaigns-header">
        <div>
          <p className="campaigns-eyebrow">MARKETING</p>
          <h1>Campaigns</h1>
          <p>Create tracked links and review attributed campaign results.</p>
        </div>
        <label className="campaigns-range">
          Performance period
          <select value={days} onChange={(event) => setDays(Number(event.target.value))}>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last 365 days</option>
          </select>
        </label>
      </header>

      {error && <div className="campaigns-alert campaigns-alert-error" role="alert">{error}</div>}
      {notice && <div className="campaigns-alert campaigns-alert-success" role="status">{notice}</div>}

      <section className="campaigns-card">
        <div className="campaigns-card-heading">
          <div>
            <h2>{editingId ? 'Edit campaign' : 'Create a campaign'}</h2>
            <p>Use a distinct UTM campaign value for each platform campaign.</p>
          </div>
        </div>

        <form className="campaigns-form" onSubmit={submitCampaign}>
          <label>
            Platform
            <select
              name="platform"
              value={form.platform}
              onChange={(event) => {
                const platform = event.target.value
                setForm((current) => ({
                  ...current,
                  platform,
                  utm_source: platform,
                  utm_medium: platform === 'google' ? 'cpc' : 'paid_social',
                }))
              }}
            >
              {PLATFORMS.map((platform) => (
                <option key={platform} value={platform}>
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Campaign name
            <input
              name="campaign_name"
              value={form.campaign_name}
              onChange={updateForm}
              required
              maxLength={200}
              placeholder="Summer sale - Facebook"
            />
          </label>
          <label>
            UTM source
            <input
              name="utm_source"
              value={form.utm_source}
              onChange={updateForm}
              required
              maxLength={100}
              placeholder="facebook"
            />
          </label>
          <label>
            UTM medium
            <input
              name="utm_medium"
              value={form.utm_medium}
              onChange={updateForm}
              required
              maxLength={100}
              placeholder="paid_social"
            />
          </label>
          <label>
            UTM campaign
            <input
              name="utm_campaign"
              value={form.utm_campaign}
              onChange={updateForm}
              required
              maxLength={100}
              pattern="[A-Za-z0-9._-]+"
              title="Use letters, numbers, dots, underscores, or hyphens."
              placeholder="summer-sale-facebook"
            />
          </label>
          <label>
            Budget (PKR)
            <input
              name="budget"
              type="number"
              min="0"
              step="0.01"
              value={form.budget}
              onChange={updateForm}
            />
          </label>
          <label className="campaigns-active">
            <input
              name="is_active"
              type="checkbox"
              checked={form.is_active}
              onChange={updateForm}
            />
            Active
          </label>
          <div className="campaigns-form-actions">
            <button type="submit" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create campaign'}
            </button>
            {editingId && (
              <button type="button" className="campaigns-button-secondary" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="campaigns-card">
        <div className="campaigns-card-heading campaigns-list-heading">
          <div>
            <h2>Campaign performance</h2>
            <p>Revenue and orders are attributed from tracked store events.</p>
          </div>
          <label>
            Link destination
            <input
              type="url"
              value={landingUrl}
              onChange={(event) => setLandingUrl(event.target.value)}
              placeholder="https://menze.vercel.app/"
            />
          </label>
        </div>

        {loading ? (
          <p className="campaigns-empty">Loading campaigns…</p>
        ) : campaigns.length === 0 ? (
          <p className="campaigns-empty">No campaigns yet. Create one above to generate a tracked link.</p>
        ) : (
          <div className="campaigns-table-wrap">
            <table className="campaigns-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Platform</th>
                  <th>Spend</th>
                  <th>Clicks</th>
                  <th>Orders</th>
                  <th>Revenue</th>
                  <th>ROAS</th>
                  <th>Tracking link</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => {
                  const stats = performanceById.get(String(campaign.id)) || {}
                  let link = ''
                  try {
                    link = buildTrackingLink(campaign, landingUrl)
                  } catch {
                    link = ''
                  }
                  return (
                    <Fragment key={campaign.id}>
                      <tr>
                        <td>
                          <strong>{campaign.campaign_name}</strong>
                          <small>{campaign.utm_campaign}</small>
                        </td>
                        <td>
                          <span className={`campaigns-status ${campaign.is_active ? 'is-active' : ''}`}>
                            {campaign.platform}
                          </span>
                        </td>
                        <td>{Number(stats.spend ?? campaign.spend ?? 0).toLocaleString()}</td>
                        <td>{Number(stats.clicks ?? campaign.clicks ?? 0).toLocaleString()}</td>
                        <td>{Number(stats.orders ?? 0).toLocaleString()}</td>
                        <td>PKR {Number(stats.revenue ?? 0).toLocaleString()}</td>
                        <td>{Number(stats.roas ?? campaign.roas ?? 0).toFixed(2)}x</td>
                        <td>
                          {link ? (
                            <div className="campaigns-link-cell">
                              <a href={link} target="_blank" rel="noreferrer" title={link}>
                                Open link
                              </a>
                              <button type="button" onClick={() => copyLink(campaign)}>Copy</button>
                            </div>
                          ) : <span className="campaigns-muted">Enter a valid URL</span>}
                        </td>
                        <td>
                          <div className="campaigns-row-actions">
                            <button type="button" onClick={() => editCampaign(campaign)}>Edit</button>
                            <button type="button" onClick={() => toggleStatsForm(campaign)}>
                              {statsEditingId === campaign.id ? 'Close stats' : 'Ad stats'}
                            </button>
                            <button
                              type="button"
                              className="campaigns-delete"
                              onClick={() => removeCampaign(campaign)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                      {statsEditingId === campaign.id && (
                        <tr>
                          <td colSpan={9}>
                            <form
                              className="campaigns-stats-form"
                              onSubmit={(event) => submitAdStats(event, campaign.id)}
                            >
                              <div>
                                <strong>Record today's ad-platform totals</strong>
                                <small>Saving replaces this campaign's totals for today.</small>
                              </div>
                              {[
                                ['spend', 'Spend (PKR)', '0.01'],
                                ['impressions', 'Impressions', '1'],
                                ['clicks', 'Clicks', '1'],
                              ].map(([name, label, step]) => (
                                <label key={name}>
                                  {label}
                                  <input
                                    type="number"
                                    min="0"
                                    step={step}
                                    required
                                    value={statsForm[name]}
                                    onChange={(event) => setStatsForm((current) => ({
                                      ...current,
                                      [name]: event.target.value,
                                    }))}
                                  />
                                </label>
                              ))}
                              <button type="submit" disabled={savingStats}>
                                {savingStats ? 'Saving…' : 'Save today'}
                              </button>
                            </form>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}

export default CampaignsPage
