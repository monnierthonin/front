import axios from 'axios';

const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:3000';

const state = {
  messages: [],
  conversations: [],
  currentConversation: null,
  loading: false,
  error: null
};

const getters = {
  getMessages: state => state.messages,
  getConversations: state => state.conversations,
  getCurrentConversation: state => state.currentConversation,
  isLoading: state => state.loading,
  getError: state => state.error,
  
  // Obtenir les messages triés par date
  getMessagesSorted: state => {
    return [...state.messages].sort((a, b) => 
      new Date(a.horodatage) - new Date(b.horodatage)
    );
  },
  
  // Obtenir les messages d'une conversation spécifique
  getMessagesByConversation: state => userId => {
    return state.messages.filter(message => 
      (message.expediteur._id === userId && message.destinataire._id === state.currentConversation) ||
      (message.expediteur._id === state.currentConversation && message.destinataire._id === userId)
    ).sort((a, b) => new Date(a.horodatage) - new Date(b.horodatage));
  },
  
  // Obtenir le nombre de messages non lus par conversation
  getUnreadCountByConversation: state => userId => {
    return state.messages.filter(message => 
      message.destinataire._id === userId && 
      !message.lu
    ).length;
  }
};

const mutations = {
  SET_LOADING(state, status) {
    state.loading = status;
  },
  
  SET_ERROR(state, error) {
    state.error = error;
  },
  
  SET_MESSAGES(state, messages) {
    state.messages = messages;
  },
  
  SET_CONVERSATIONS(state, conversations) {
    state.conversations = conversations;
  },
  
  SET_CURRENT_CONVERSATION(state, userId) {
    state.currentConversation = userId;
  },
  
  ADD_MESSAGE(state, message) {
    // Vérifier si le message existe déjà
    const existingIndex = state.messages.findIndex(m => m._id === message._id);
    if (existingIndex === -1) {
      state.messages.push(message);
    }
  },
  
  UPDATE_MESSAGE(state, updatedMessage) {
    const index = state.messages.findIndex(message => message._id === updatedMessage._id);
    if (index !== -1) {
      state.messages.splice(index, 1, updatedMessage);
    }
  },
  
  UPDATE_MESSAGE_STATUS(state, { id, status }) {
    const index = state.messages.findIndex(message => message._id === id);
    if (index !== -1) {
      state.messages[index] = {
        ...state.messages[index],
        ...status
      };
    }
  },
  
  REMOVE_MESSAGE(state, messageId) {
    state.messages = state.messages.filter(message => message._id !== messageId);
  }
};

const actions = {
  // Récupérer toutes les conversations privées
  async fetchConversations({ commit }) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      const response = await axios.get(`${API_URL}/api/v1/messages/private`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      commit('SET_CONVERSATIONS', response.data.data);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des conversations:', error);
      commit('SET_ERROR', error.response?.data?.message || 'Erreur lors de la récupération des conversations');
      return [];
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Récupérer les messages d'une conversation spécifique
  // eslint-disable-next-line no-unused-vars
  async fetchMessages({ commit, state }, userId) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      const response = await axios.get(`${API_URL}/api/v1/messages/private/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      commit('SET_MESSAGES', response.data.data);
      commit('SET_CURRENT_CONVERSATION', userId);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error);
      commit('SET_ERROR', error.response?.data?.message || 'Erreur lors de la récupération des messages');
      return [];
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Envoyer un message privé
  async sendMessage({ commit }, { destinataireId, contenu, reponseA }) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      const response = await axios.post(
        `${API_URL}/api/v1/messages/private/${destinataireId}`,
        { contenu, reponseA },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      commit('ADD_MESSAGE', response.data.data);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      commit('SET_ERROR', error.response?.data?.message || 'Erreur lors de l\'envoi du message');
      return null;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Marquer un message comme lu
  async markMessageAsRead({ commit }, messageId) {
    try {
      const response = await axios.patch(
        `${API_URL}/api/v1/messages/private/${messageId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      commit('UPDATE_MESSAGE_STATUS', {
        id: messageId,
        status: { lu: true }
      });
      
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors du marquage du message comme lu:', error);
      return null;
    }
  },
  
  // Supprimer un message
  async deleteMessage({ commit }, messageId) {
    try {
      await axios.delete(`${API_URL}/api/v1/messages/private/${messageId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      commit('REMOVE_MESSAGE', messageId);
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du message:', error);
      return false;
    }
  },
  
  // Mettre à jour la liste des conversations après réception d'un nouveau message
  async updateConversationList({ dispatch }) {
    await dispatch('fetchConversations');
  }
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
};
