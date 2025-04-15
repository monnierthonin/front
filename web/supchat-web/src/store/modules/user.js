import api from '@/plugins/axios'

const state = {
  user: null
}

const mutations = {
  SET_USER(state, user) {
    state.user = user
  }
}

const actions = {
  async updateProfile({ commit }, userData) {
    try {
      const response = await api.put('/users/profile', userData)
      if (response.data.success) {
        // Mettre à jour l'utilisateur dans le module auth
        commit('auth/SET_USER', response.data.data, { root: true })
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
      const response = await api.put('/users/profile/password', {
        currentPassword,
        newPassword
      })
      return response.data
    } catch (error) {
      console.error('Erreur de mise à jour du mot de passe:', error)
      throw error
    }
  },

  async updateProfilePicture({ commit, rootState }, formData) {
    try {
      const response = await api.put('/users/profile/picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      if (response.data.success) {
        // Mettre à jour l'utilisateur dans le module auth
        const user = { ...rootState.auth.user, profilePicture: response.data.data.profilePicture }
        commit('auth/SET_USER', user, { root: true })
        return response.data
      }
      throw new Error(response.data.message || 'Erreur lors de la mise à jour de la photo')
    } catch (error) {
      console.error('Erreur de mise à jour de la photo:', error)
      throw error
    }
  },

  async deleteAccount(_, { password }) {
    try {
      const response = await api.delete('/users/profile', { data: { password } })
      if (response.data.success) {
        return true
      }
      throw new Error(response.data.message || 'Erreur lors de la suppression du compte')
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message)
      }
      throw error
    }
  }
}

const getters = {
  currentUser: state => state.user
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
