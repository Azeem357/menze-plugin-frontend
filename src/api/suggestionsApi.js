import axiosInstance from './axiosInstance'

export const getSuggestions = (filters = {}) => {
  const params = new URLSearchParams(filters)
  return axiosInstance.get(`/api/suggestions/?${params}`)
}

export const markActedOn = (id) =>
  axiosInstance.post(`/api/suggestions/${id}/mark-done/`)

export const getSuggestionStats = () =>
  axiosInstance.get('/api/suggestions/stats/')
