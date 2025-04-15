import axios from 'axios'
import store from '@/store'
import router from '@/router'

// Créer une instance axios avec la configuration de base
const api = axios.create({
  baseURL: (process.env.VUE_APP_API_URL || 'http://localhost:3000') + '/api/v1',
  withCredentials: true
})

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use(config => {
  const token = store.getters['auth/token']
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response && error.response.status === 401) {
      // Si on est déjà sur la page de login, on ne fait rien
      if (router.currentRoute.value.path !== '/login') {
        await store.dispatch('auth/logout')
        router.push('/login')
      }
    }
    return Promise.reject(error)
  }
)

export default api
