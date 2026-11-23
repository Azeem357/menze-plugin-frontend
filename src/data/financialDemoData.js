export const financialDemoData = {
  demo: true,
  summary: {
    avg_roas: 3.8,
    avg_cac: 1250,
    avg_ltv: 18200,
    avg_conversion_rate: 4.7,
    roas_change: 12.4,
    cac_change: -7.1,
    ltv_change: 8.6,
  },
  previous_summary: {
    avg_roas: 3.38,
    avg_cac: 1345,
    avg_ltv: 16755,
    avg_conversion_rate: 4.2,
  },
  targets: { roas: 4.5 },
  benchmarks: { cac: 1500 },
  ltv_months: 12,
  platforms: [
    { platform: 'Google Ads', roas: 4.2 },
    { platform: 'Facebook Ads', roas: 3.4 },
    { platform: 'TikTok Ads', roas: 2.6 },
  ],
  campaigns: [
    {
      name: 'Summer Essentials',
      channel: 'Google Ads',
      roas: 4.8,
      profit: 240000,
    },
    {
      name: 'Returning Customers',
      channel: 'Facebook Ads',
      roas: 3.6,
      profit: 98500,
    },
    {
      name: 'New Arrivals',
      channel: 'TikTok Ads',
      roas: 2.7,
      profit: -18500,
    },
  ],
  cohort_periods: [0, 1, 2, 3, 6, 12],
  cohorts: [
    {
      cohort: 'Jun 2026',
      size: 120,
      values: [8200, 9400, 10800, 12100, 13900, 15800],
    },
    {
      cohort: 'Jul 2026',
      size: 135,
      values: [7900, 9100, 10300, 11900, null, null],
    },
    {
      cohort: 'Aug 2026',
      size: 148,
      values: [8600, 9800, 11200, null, null, null],
    },
  ],
}
