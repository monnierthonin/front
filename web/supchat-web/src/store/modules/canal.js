import api from '@/plugins/axios'

const state = {
  canaux: [],
  canalActif: null
}

const mutations = {
  SET_CANAUX(state, canaux) {
    state.canaux = canaux
  },
  SET_CANAL_ACTIF(state, canal) {
    state.canalActif = canal
  },
  ADD_CANAL(state, canal) {
    state.canaux.push(canal)
  },
  UPDATE_CANAL(state, canalMisAJour) {
    const index = state.canaux.findIndex(c => c._id === canalMisAJour._id)
    if (index !== -1) {
      state.canaux.splice(index, 1, canalMisAJour)
    }
  },
  DELETE_CANAL(state, canalId) {
    state.canaux = state.canaux.filter(c => c._id !== canalId)
    if (state.canalActif && state.canalActif._id === canalId) {
      state.canalActif = null
    }
  }
}

const actions = {
  async fetchCanaux({ commit }, workspaceId) {
    try {
      const response = await api.get(`/workspaces/${workspaceId}/canaux`)
      commit('SET_CANAUX', response.data.data.canaux)
      return response.data.data.canaux
    } catch (error) {
      console.error('Erreur lors de la récupération des canaux:', error)
      throw error
    }
  },

  async fetchCanal({ commit }, { workspaceId, canalId }) {
    try {
      const response = await api.get(`/workspaces/${workspaceId}/canaux/${canalId}`)
      commit('SET_CANAL_ACTIF', response.data.data.canal)
      return response.data.data.canal
    } catch (error) {
      console.error('Erreur lors de la récupération du canal:', error)
      throw error
    }
  },

  async createCanal({ commit }, { workspaceId, canalData }) {
    try {
      console.log('Données envoyées à l\'API:', canalData)
      const response = await api.post(`/workspaces/${workspaceId}/canaux`, canalData)
      commit('ADD_CANAL', response.data.data.canal)
      return response.data.data.canal
    } catch (error) {
      console.error('Erreur lors de la création du canal:', error)
      throw error
    }
  },

  async updateCanal({ commit }, { workspaceId, canalId, canalData }) {
    try {
      const response = await api.put(`/workspaces/${workspaceId}/canaux/${canalId}`, canalData)
      commit('UPDATE_CANAL', response.data.data.canal)
      return response.data.data.canal
    } catch (error) {
      console.error('Erreur lors de la mise à jour du canal:', error)
      throw error
    }
  },

  async deleteCanal({ commit }, { workspaceId, canalId }) {
    try {
      await api.delete(`/workspaces/${workspaceId}/canaux/${canalId}`)
      commit('DELETE_CANAL', canalId)
    } catch (error) {
      console.error('Erreur lors de la suppression du canal:', error)
      throw error
    }
  }
}

const getters = {
  getCanalById: state => id => state.canaux.find(c => c._id === id)
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
