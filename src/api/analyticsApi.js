import axiosInstance from './axiosInstance'

export const getDashboardOverview = (days = 30) =>
  axiosInstance.get(`/api/dashboard/overview/?days=${days}`)

export const getFunnel = (days = 30) =>
  axiosInstance.get(`/api/dashboard/funnel?days=${days}`)

export const getMetrics = (days = 30) =>
  axiosInstance.get(`/api/metrics/?days=${days}`)

export const triggerCalculation = () =>
  axiosInstance.post('/api/dashboard/calculate/')

export const captureEvent = (eventData) =>
  axiosInstance.post('/api/events/capture/', eventData)
