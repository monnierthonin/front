import axios from 'axios'

const state = {
  canaux: [],
  currentCanal: null
}

const mutations = {
  SET_CANAUX(state, canaux) {
    state.canaux = canaux
  },
  SET_CURRENT_CANAL(state, canal) {
    state.currentCanal = canal
  },
  ADD_CANAL(state, canal) {
    state.canaux.push(canal)
  },
  UPDATE_CANAL(state, canal) {
    const index = state.canaux.findIndex(c => c._id === canal._id)
    if (index !== -1) {
      state.canaux.splice(index, 1, canal)
    }
  },
  REMOVE_CANAL(state, canalId) {
    state.canaux = state.canaux.filter(c => c._id !== canalId)
  }
}

const actions = {
  async fetchCanaux({ commit }, workspaceId) {
    const { data } = await axios.get(`/workspaces/${workspaceId}/canaux`)
    commit('SET_CANAUX', data.data.canaux)
    return data.data.canaux
  },

  async fetchCanal({ commit }, { workspaceId, canalId }) {
    const { data } = await axios.get(`/workspaces/${workspaceId}/canaux/${canalId}`)
    commit('SET_CURRENT_CANAL', data.data.canal)
    return data.data.canal
  },

  async createCanal({ commit }, { workspaceId, ...canalData }) {
    const { data } = await axios.post(`/workspaces/${workspaceId}/canaux`, canalData)
    commit('ADD_CANAL', data.data.canal)
    return data.data.canal
  },

  async updateCanal({ commit }, { workspaceId, _id, ...canalData }) {
    const { data } = await axios.put(`/workspaces/${workspaceId}/canaux/${_id}`, canalData)
    commit('UPDATE_CANAL', data.data.canal)
    return data.data.canal
  },

  async deleteCanal({ commit }, { workspaceId, _id }) {
    await axios.delete(`/workspaces/${workspaceId}/canaux/${_id}`)
    commit('REMOVE_CANAL', _id)
  },

  async uploadFile(_, { workspaceId, canalId, file }) {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await axios.post(
      `/workspaces/${workspaceId}/canaux/${canalId}/fichiers`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )
    return data.data.file
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
