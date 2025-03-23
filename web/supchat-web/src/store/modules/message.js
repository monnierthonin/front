import axios from 'axios'

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
    state.messages.unshift(message)
  },
  UPDATE_MESSAGE(state, message) {
    const index = state.messages.findIndex(m => m._id === message._id)
    if (index !== -1) {
      state.messages.splice(index, 1, message)
    }
  },
  REMOVE_MESSAGE(state, messageId) {
    state.messages = state.messages.filter(m => m._id !== messageId)
  },
  SET_LOADING(state, loading) {
    state.loading = loading
  },
  SET_ERROR(state, error) {
    state.error = error
  }
}

const actions = {
  async fetchMessages({ commit }, { workspaceId, canalId, page = 1, limit = 50 }) {
    commit('SET_LOADING', true)
    try {
      const { data } = await axios.get(`/workspaces/${workspaceId}/canaux/${canalId}/messages`, {
        params: { page, limit }
      })
      commit('SET_MESSAGES', data.data.messages)
      return data.data.messages
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Erreur lors du chargement des messages')
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async sendMessage({ commit }, { workspaceId, canalId, message }) {
    try {
      const { data } = await axios.post(`/workspaces/${workspaceId}/canaux/${canalId}/messages`, message)
      commit('ADD_MESSAGE', data.data.message)
      return data.data.message
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Erreur lors de l\'envoi du message')
      throw error
    }
  },

  async updateMessage({ commit }, { workspaceId, canalId, messageId, content }) {
    try {
      const { data } = await axios.put(
        `/workspaces/${workspaceId}/canaux/${canalId}/messages/${messageId}`,
        { contenu: content }
      )
      commit('UPDATE_MESSAGE', data.data.message)
      return data.data.message
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Erreur lors de la modification du message')
      throw error
    }
  },

  async deleteMessage({ commit }, { workspaceId, canalId, messageId }) {
    try {
      await axios.delete(`/workspaces/${workspaceId}/canaux/${canalId}/messages/${messageId}`)
      commit('REMOVE_MESSAGE', messageId)
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Erreur lors de la suppression du message')
      throw error
    }
  },

  async reactToMessage({ commit }, { workspaceId, canalId, messageId, emoji }) {
    try {
      const { data } = await axios.post(
        `/workspaces/${workspaceId}/canaux/${canalId}/messages/${messageId}/reactions`,
        { emoji }
      )
      commit('UPDATE_MESSAGE', data.data.message)
      return data.data.message
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Erreur lors de l\'ajout de la réaction')
      throw error
    }
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
