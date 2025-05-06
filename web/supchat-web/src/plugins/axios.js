import axios from 'axios'
import store from '@/store'
import router from '@/router'

// Créer une instance axios avec la configuration de base
const api = axios.create({
  baseURL: (process.env.VUE_APP_API_URL || 'http://localhost:3000') + '/api/v1',
  withCredentials: true // Important pour envoyer les cookies avec les requêtes
})

// Créer une instance axios spéciale pour récupérer le token sans intercepteurs
const tokenApi = axios.create({
  baseURL: (process.env.VUE_APP_API_URL || 'http://localhost:3000') + '/api/v1',
  withCredentials: true
})

// Variable pour suivre si une récupération de token est en cours
let isRefreshingToken = false
let tokenPromise = null

// Fonction pour récupérer le token depuis l'API
const fetchToken = async () => {
  if (isRefreshingToken) {
    return tokenPromise
  }

  isRefreshingToken = true
  tokenPromise = tokenApi.get('/auth/token')
    .then(response => {
      if (response.data.success && response.data.token) {
        const token = response.data.token
        const user = response.data.data.user
        
        // Mettre à jour le store et localStorage
        store.commit('auth/SET_TOKEN', token)
        store.commit('auth/SET_USER', user)
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        
        return token
      }
      return null
    })
    .catch(error => {
      console.error('Erreur lors de la récupération du token:', error)
      return null
    })
    .finally(() => {
      isRefreshingToken = false
    })

  return tokenPromise
}

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use(async config => {
  // Éviter de récupérer le token pour la route auth/token elle-même
  if (config.url === '/auth/token') {
    return config
  }
  
  // Essayer d'utiliser le token du store d'abord
  let token = store.getters['auth/token']
  
  // Si pas de token dans le store mais qu'on a un cookie JWT
  if (!token && document.cookie.includes('jwt=')) {
    token = await fetchToken()
  }
  
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
