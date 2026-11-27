import axiosInstance from './axiosInstance'

export const getCampaigns = () =>
  axiosInstance.get('/api/campaigns/')

export const getCampaignPerformance = (days = 30) =>
  axiosInstance.get('/api/campaigns/performance/', { params: { days } })

export const updateCampaignSpend = (id, data) =>
  axiosInstance.post(`/api/campaigns/${id}/update-spend/`, data)

export const createCampaign = (data) =>
  axiosInstance.post('/api/campaigns/', data)

export const updateCampaign = (id, data) =>
  axiosInstance.put(`/api/campaigns/${id}/`, data)

export const patchCampaign = (id, data) =>
  axiosInstance.patch(`/api/campaigns/${id}/`, data)

export const deleteCampaign = (id) =>
  axiosInstance.delete(`/api/campaigns/${id}/`)
