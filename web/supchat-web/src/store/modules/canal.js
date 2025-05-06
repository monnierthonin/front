import api from '@/plugins/axios'

const state = {
  canal: null,
  messages: [],
  canaux: [],
  fichiers: []
}

// État interne

const mutations = {
  SET_MESSAGES(state, messages) {
    state.messages = messages
  },
  AJOUTER_MESSAGE(state, message) {
    // Vérifier si le message existe déjà (optimisé)
    const messageExiste = state.messages.some(m => m._id === message._id)
    if (!messageExiste) {
      // Limiter la taille du tableau des messages pour éviter les problèmes de performance
      if (state.messages.length > 100) {
        // Garder seulement les 100 messages les plus récents
        state.messages = [...state.messages.slice(-99), message];
      } else {
        // Créer un nouveau tableau pour forcer la réactivité
        state.messages = [...state.messages, message];
      }
    }
  },
  UPDATE_MESSAGE(state, updatedMessage) {
    const index = state.messages.findIndex(m => m._id === updatedMessage._id);
    if (index !== -1) {
      // Créer un nouveau tableau pour forcer la réactivité
      const newMessages = [...state.messages];
      newMessages[index] = updatedMessage;
      state.messages = newMessages;
    }
  },
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
  async envoyerMessage({ commit }, { workspaceId, canalId, contenu }) {
    try {
      const response = await api.post(`/workspaces/${workspaceId}/canaux/${canalId}/messages`, { contenu })
      const message = response.data.data.message;
      commit('AJOUTER_MESSAGE', message);
      return message;
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error)
      throw error
    }
  },

  async chargerMessages({ commit }, { workspaceId, canalId }) {
    try {
      // Ajouter un timeout pour éviter que la requête ne bloque indéfiniment
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await api.get(`/workspaces/${workspaceId}/canaux/${canalId}/messages`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Limiter le nombre de messages à stocker pour éviter les problèmes de performance
      const messages = response.data.data.messages || [];
      const limitedMessages = messages.slice(-100); // Garder seulement les 100 derniers messages
      
      commit('SET_MESSAGES', limitedMessages);
      return limitedMessages;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('La requête de chargement des messages a été interrompue après 5 secondes');
        commit('SET_MESSAGES', []); // Réinitialiser les messages pour éviter d'afficher des données obsolètes
        return [];
      }
      console.error('Erreur lors du chargement des messages:', error);
      throw error;
    }
  },
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
      const response = await api.patch(`/workspaces/${workspaceId}/canaux/${canalId}`, canalData)
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
  },

  async addMember({ commit }, { workspaceId, canalId, userId, role = 'membre' }) {
    try {
      // S'assurer que les données envoyées sont dans le format attendu par le backend
      const response = await api.post(`/workspaces/${workspaceId}/canaux/${canalId}/membres`, {
        utilisateur: userId,
        utilisateurId: userId, // Envoyer les deux formats pour s'assurer que l'un fonctionne
        role
      })
      
      commit('SET_CANAL_ACTIF', response.data.data.canal)
      return response.data.data.canal
    } catch (error) {
      console.error('Erreur lors de l\'ajout du membre au canal:', error)
      throw error
    }
  },

  async removeMember({ commit }, { workspaceId, canalId, membreId }) {
    try {
      const response = await api.delete(`/workspaces/${workspaceId}/canaux/${canalId}/membres/${membreId}`)
      commit('SET_CANAL_ACTIF', response.data.data.canal)
      return response.data.data.canal
    } catch (error) {
      console.error('Erreur lors de la suppression du membre du canal:', error)
      throw error
    }
  }
}

const getters = {
  getCanalById: state => id => state.canaux.find(c => c._id === id),
  getMessages: state => state.messages
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
