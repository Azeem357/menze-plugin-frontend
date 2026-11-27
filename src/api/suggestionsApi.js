import axiosInstance from './axiosInstance'

export const getSuggestions = (filters = {}) => {
  const params = new URLSearchParams(filters)
  return axiosInstance.get(`/api/suggestions/?${params}`)
}

export const markActedOn = (id) =>
  axiosInstance.post(`/api/suggestions/${id}/mark-done/`)

export const getSuggestionStats = () =>
  axiosInstance.get('/api/suggestions/stats/')

export const generateSuggestions = () =>
  axiosInstance.post('/api/suggestions/generate/')

export const getProductSales = (period = '7d') =>
  axiosInstance.get('/api/analytics/product-sales/', {
    params: { period }
  })

export const syncStoreOrders = () =>
  axiosInstance.post('/api/sync/orders/')
