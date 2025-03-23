import axios from 'axios'
import store from '../store'

// Set base URL
axios.defaults.baseURL = 'http://localhost:3000/api/v1'

// Add token to requests
axios.interceptors.request.use(config => {
  const token = store.state.auth.token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // Add CORS headers
  config.withCredentials = true
  return config
}, error => {
  return Promise.reject(error)
})

// Handle response errors
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      store.commit('auth/SET_TOKEN', null)
      store.commit('auth/SET_USER', null)
      // Rediriger vers la page de login si on n'y est pas déjà
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default axios
