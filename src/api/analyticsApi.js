import axiosInstance from './axiosInstance'

export const getDashboardOverview = (days = 30) =>
  axiosInstance.get(`/dashboard/overview?days=${days}`)

export const getFunnel = (days = 30) =>
  axiosInstance.get(`/dashboard/funnel?days=${days}`)

export const getMetrics = (days = 30) =>
  axiosInstance.get(`/metrics/?days=${days}`)

export const triggerCalculation = () =>
  axiosInstance.post('/dashboard/calculate')

export const captureEvent = (eventData) =>
  axiosInstance.post('/events/capture', eventData)