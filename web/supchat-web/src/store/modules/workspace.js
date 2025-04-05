import api from '@/plugins/axios'

const state = {
  workspaces: [],
  currentWorkspace: null
}

const mutations = {
  SET_WORKSPACES(state, workspaces) {
    state.workspaces = workspaces
  },
  SET_CURRENT_WORKSPACE(state, workspace) {
    state.currentWorkspace = workspace
  }
}

const actions = {
  async fetchWorkspaces({ commit }) {
    try {
      const response = await api.get('/api/v1/workspaces')
      console.log('Réponse workspaces:', response.data)
      commit('SET_WORKSPACES', response.data.data.workspaces)
      return response.data.data.workspaces
    } catch (error) {
      console.error('Erreur lors de la récupération des workspaces:', error)
      throw error
    }
  },

  async fetchWorkspace({ commit }, workspaceId) {
    try {
      const response = await api.get(`/api/v1/workspaces/${workspaceId}`)
      console.log('Réponse workspace:', response.data)
      commit('SET_CURRENT_WORKSPACE', response.data.data.workspace)
      return response.data.data.workspace
    } catch (error) {
      console.error('Erreur lors de la récupération du workspace:', error)
      throw error
    }
  },

  async createWorkspace({ dispatch }, workspaceData) {
    try {
      const response = await api.post('/api/v1/workspaces', workspaceData)
      console.log('Réponse création workspace:', response.data)
      await dispatch('fetchWorkspaces')
      return response.data.data.workspace
    } catch (error) {
      console.error('Erreur lors de la création du workspace:', error)
      throw error
    }
  },

  async inviteUser(_, { workspaceId, email }) {
    try {
      const response = await api.post(`/api/v1/workspaces/${workspaceId}/inviter`, { email })
      return response.data.data
    } catch (error) {
      console.error('Erreur lors de l\'invitation:', error)
      throw error
    }
  }
}

const getters = {
  getWorkspaceById: state => id => state.workspaces.find(w => w._id === id)
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
