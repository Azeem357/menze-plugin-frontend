import axiosInstance from './axiosInstance'

export const getSuggestions = (filters = {}) => {
  const params = new URLSearchParams(filters)
  return axiosInstance.get(`/suggestions/?${params}`)
}

export const markActedOn = (id) =>
  axiosInstance.post(`/suggestions/${id}/mark-done/`)

export const getSuggestionStats = () =>
  axiosInstance.get('/suggestions/stats/')