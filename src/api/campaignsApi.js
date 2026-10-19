import axiosInstance from './axiosInstance'

export const getCampaigns = () =>
  axiosInstance.get('/campaigns/')

export const createCampaign = (data) =>
  axiosInstance.post('/campaigns/', data)

export const updateCampaign = (id, data) =>
  axiosInstance.put(`/campaigns/${id}/`, data)

export const deleteCampaign = (id) =>
  axiosInstance.delete(`/campaigns/${id}/`)