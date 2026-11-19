import axiosInstance from './axiosInstance'

export const getPredictions = (horizonDays = 7, refresh = false, signal) =>
  axiosInstance.get('/predictions/', {
    params: { horizon: horizonDays, ...(refresh ? { refresh: true } : {}) },
    signal,
  })
