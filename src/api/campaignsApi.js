import axiosInstance from './axiosInstance'

export const getCampaigns = () =>
  axiosInstance.get('/api/campaigns/')

export const createCampaign = (data) =>
  axiosInstance.post('/api/campaigns/', data)

export const updateCampaign = (id, data) =>
  axiosInstance.put(`/api/campaigns/${id}/`, data)

export const deleteCampaign = (id) =>
  axiosInstance.delete(`/api/campaigns/${id}/`)
