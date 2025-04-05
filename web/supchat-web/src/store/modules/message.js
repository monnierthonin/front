import api from '@/plugins/axios'

const state = {
  messages: [],
  loading: false,
  error: null
}

const mutations = {
  SET_MESSAGES(state, messages) {
    state.messages = messages
  },
  ADD_MESSAGE(state, message) {
    state.messages.push(message)
  },
  UPDATE_MESSAGE(state, updatedMessage) {
    const index = state.messages.findIndex(m => m._id === updatedMessage._id)
    if (index !== -1) {
      state.messages.splice(index, 1, updatedMessage)
    }
  },
  DELETE_MESSAGE(state, messageId) {
    state.messages = state.messages.filter(m => m._id !== messageId)
  },
  SET_LOADING(state, status) {
    state.loading = status
  },
  SET_ERROR(state, error) {
    state.error = error
  }
}

const actions = {
  async fetchMessages({ commit }, { workspaceId, canalId }) {
    try {
      commit('SET_LOADING', true)
      const response = await api.get(`/api/v1/workspaces/${workspaceId}/canaux/${canalId}/messages`)
      commit('SET_MESSAGES', response.data.data.messages)
      return response.data.data.messages
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error)
      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async sendMessage({ commit }, { workspaceId, canalId, messageData }) {
    try {
      const response = await api.post(`/api/v1/workspaces/${workspaceId}/canaux/${canalId}/messages`, messageData)
      commit('ADD_MESSAGE', response.data.data.message)
      return response.data.data.message
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error)
      commit('SET_ERROR', error.message)
      throw error
    }
  },

  async updateMessage({ commit }, { workspaceId, canalId, messageId, messageData }) {
    try {
      const response = await api.put(`/api/v1/workspaces/${workspaceId}/canaux/${canalId}/messages/${messageId}`, messageData)
      commit('UPDATE_MESSAGE', response.data.data.message)
      return response.data.data.message
    } catch (error) {
      console.error('Erreur lors de la mise à jour du message:', error)
      commit('SET_ERROR', error.message)
      throw error
    }
  },

  async deleteMessage({ commit }, { workspaceId, canalId, messageId }) {
    try {
      await api.delete(`/api/v1/workspaces/${workspaceId}/canaux/${canalId}/messages/${messageId}`)
      commit('DELETE_MESSAGE', messageId)
    } catch (error) {
      console.error('Erreur lors de la suppression du message:', error)
      commit('SET_ERROR', error.message)
      throw error
    }
  }
}

const getters = {
  allMessages: state => state.messages,
  isLoading: state => state.loading,
  hasError: state => state.error !== null,
  getError: state => state.error
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
