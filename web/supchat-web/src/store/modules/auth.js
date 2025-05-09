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
      const response = await api.get('/auth/me')
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
      console.log('Tentative de connexion avec:', credentials);
      const response = await api.post('/auth/connexion', {
        email: credentials.email,
        password: credentials.password,
        rememberMe: credentials.rememberMe || false
      })
      
      if (response.data.success) {
        const { token } = response.data;
        const { user } = response.data.data;
        console.log('Token reçu:', token ? 'Oui' : 'Non');
        
        if (token) {
          commit('SET_TOKEN', token);
          localStorage.setItem('token', token);
        }
        if (user) {
          commit('SET_USER', user);
          localStorage.setItem('user', JSON.stringify(user));
          // Stocker l'ID de l'utilisateur séparément pour un accès facile
          localStorage.setItem('userId', user._id);
        }
        
        return response.data;
      } else {
        throw new Error(response.data.message || 'Erreur lors de la connexion');
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      throw error;
    }
  },

  async register(_, userData) {
    try {
      const response = await api.post('/auth/inscription', userData)
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
      const response = await api.get(`/auth/verify-email/${token}`)
      return response.data
    } catch (error) {
      console.error('Erreur de vérification email:', error)
      throw error
    }
  },

  async forgotPassword(_, email) {
    try {
      const response = await api.post('/auth/forgot-password', { email })
      return response.data
    } catch (error) {
      console.error('Erreur de demande de réinitialisation:', error)
      throw error
    }
  },

  async resetPassword(_, { token, password }) {
    try {
      const response = await api.post(`/auth/reset-password/${token}`, { password })
      return response.data
    } catch (error) {
      console.error('Erreur de réinitialisation du mot de passe:', error)
      throw error
    }
  },

  async updateProfile({ commit }, userData) {
    try {
      const response = await api.put('/users/profile', userData)
      if (response.data.success) {
        commit('SET_USER', response.data.data)
        localStorage.setItem('user', JSON.stringify(response.data.data))
        return response.data
      }
      throw new Error(response.data.message || 'Erreur lors de la mise à jour du profil')
    } catch (error) {
      console.error('Erreur de mise à jour du profil:', error)
      throw error
    }
  },

  async updatePassword(_, { currentPassword, newPassword }) {
    try {
      const response = await api.put('/users/password', {
        currentPassword,
        newPassword
      })
      return response.data
    } catch (error) {
      console.error('Erreur de mise à jour du mot de passe:', error)
      throw error
    }
  },

  async updateProfilePicture({ commit }, formData) {
    try {
      const response = await api.put('/users/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      if (response.data.success) {
        const user = { ...state.user, profilePicture: response.data.data.profilePicture }
        commit('SET_USER', user)
        localStorage.setItem('user', JSON.stringify(user))
        return response.data
      }
      throw new Error(response.data.message || 'Erreur lors de la mise à jour de la photo')
    } catch (error) {
      console.error('Erreur de mise à jour de la photo:', error)
      throw error
    }
  },

  async logout({ commit }) {
    try {
      await api.post('/auth/deconnexion')
      commit('LOGOUT')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('userId')
      return true
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
      commit('LOGOUT')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('userId')
      return false
    }
  },

  initAuth({ commit }) {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    if (token && user) {
      const userData = JSON.parse(user)
      commit('SET_TOKEN', token)
      commit('SET_USER', userData)
      
      // S'assurer que l'ID de l'utilisateur est également stocké séparément
      if (userData._id && !localStorage.getItem('userId')) {
        localStorage.setItem('userId', userData._id)
      }
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
