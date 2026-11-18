import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://menze-plugin.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
})

export default axiosInstance
