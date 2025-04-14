import api from '@/plugins/axios'

const state = {
  user: null,
  token: null,
  isAuthenticated: false
}

const mutations = {
  SET_USER(state, user) {
    state.user = user
    state.isAuthenticated = !!user
  },
  SET_TOKEN(state, token) {
    state.token = token
  },
  LOGOUT(state) {
    state.user = null
    state.token = null
    state.isAuthenticated = false
  }
}

const actions = {
  async checkAuth({ commit }) {
    try {
      const response = await api.get('/api/v1/auth/me')
      if (response.data.success) {
        commit('SET_USER', response.data.data.user)
        return true
      }
      return false
    } catch (error) {
      console.error('Erreur de vérification d\'authentification:', error)
      return false
    }
  },

  async login({ commit }, credentials) {
    try {
      const response = await api.post('/api/v1/auth/connexion', credentials)
      if (response.data.success) {
        commit('SET_USER', response.data.data.user)
        commit('SET_TOKEN', response.data.data.token)
        localStorage.setItem('token', response.data.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.data.user))
        return response.data
      } else {
        throw new Error(response.data.message || 'Erreur lors de la connexion')
      }
    } catch (error) {
      console.error('Erreur de connexion:', error)
      throw error
    }
  },

  async register(_, userData) {
    try {
      const response = await api.post('/api/v1/auth/inscription', userData)
      if (response.data.success) {
        return response.data
      } else {
        throw new Error(response.data.message || 'Erreur lors de l\'inscription')
      }
    } catch (error) {
      console.error('Erreur d\'inscription:', error)
      throw error
    }
  },

  async verifyEmail(_, token) {
    try {
      const response = await api.get(`/api/v1/auth/verify-email/${token}`)
      return response.data
    } catch (error) {
      console.error('Erreur de vérification email:', error)
      throw error
    }
  },

  async forgotPassword(_, email) {
    try {
      const response = await api.post('/api/v1/auth/forgot-password', { email })
      return response.data
    } catch (error) {
      console.error('Erreur de demande de réinitialisation:', error)
      throw error
    }
  },

  async resetPassword(_, { token, password }) {
    try {
      const response = await api.post(`/api/v1/auth/reset-password/${token}`, { password })
      return response.data
    } catch (error) {
      console.error('Erreur de réinitialisation du mot de passe:', error)
      throw error
    }
  },

  async updateProfile({ commit }, userData) {
    try {
      const response = await api.put('/api/v1/auth/profile', userData)
      if (response.data.success) {
        commit('SET_USER', response.data.data.user)
        localStorage.setItem('user', JSON.stringify(response.data.data.user))
        return response.data
      }
    } catch (error) {
      console.error('Erreur de mise à jour du profil:', error)
      throw error
    }
  },

  async logout({ commit }) {
    try {
      await api.post('/api/v1/auth/deconnexion')
      commit('LOGOUT')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
      // On déconnecte quand même localement en cas d'erreur
      commit('LOGOUT')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  },

  initAuth({ commit }) {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    if (token && user) {
      commit('SET_TOKEN', token)
      commit('SET_USER', JSON.parse(user))
    }
  }
}

const getters = {
  isAuthenticated: state => state.isAuthenticated,
  currentUser: state => state.user,
  token: state => state.token
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
