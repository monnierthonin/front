import axios from 'axios'

const state = {
  user: JSON.parse(localStorage.getItem('user')),
  token: localStorage.getItem('token')
}

const mutations = {
  SET_USER(state, user) {
    state.user = user
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
    } else {
      localStorage.removeItem('user')
    }
  },
  SET_TOKEN(state, token) {
    state.token = token
    if (token) {
      localStorage.setItem('token', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
    }
  }
}

const actions = {
  async login({ commit }, credentials) {
    console.log('Action login appelée avec:', credentials)
    try {
      const response = await axios.post('/auth/connexion', credentials)
      console.log('Réponse du serveur:', response.data)

      if (!response.data.data.user.isVerified) {
        throw new Error('Veuillez vérifier votre email pour activer votre compte.')
      }
      
      // D'abord définir le token pour les futures requêtes
      commit('SET_TOKEN', response.data.token)
      // Ensuite définir l'utilisateur
      commit('SET_USER', response.data.data.user)
      
      return response.data.data
    } catch (error) {
      console.error('Erreur dans l\'action login:', error)
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      throw error
    }
  },

  async register(_, userData) {
    const { data } = await axios.post('/auth/inscription', userData)
    return data.data
  },

  async logout({ commit }) {
    try {
      // Pas besoin d'attendre la réponse du serveur pour la déconnexion locale
      axios.post('/auth/deconnexion').catch(error => {
        console.warn('Erreur lors de la déconnexion côté serveur:', error)
      })
    } finally {
      // Dans tous les cas, on déconnecte l'utilisateur localement
      commit('SET_TOKEN', null)
      commit('SET_USER', null)
    }
  },

  initAuth({ commit }) {
    console.log('Initialisation de l\'authentification...')
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    
    console.log('Token stocké:', token)
    console.log('Utilisateur stocké:', user)
    
    if (token && user) {
      commit('SET_TOKEN', token)
      commit('SET_USER', JSON.parse(user))
      return true
    }
    return false
  }
}

const getters = {
  isAuthenticated: state => {
    console.log('Vérification isAuthenticated:', { 
      token: state.token, 
      user: state.user,
      isAuth: !!state.token && !!state.user 
    })
    return !!state.token && !!state.user
  },
  currentUser: state => state.user
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
