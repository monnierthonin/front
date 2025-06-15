import axios from 'axios';
import { API_URL } from '@/config';
import socket from '@/services/socketService';

export default {
  namespaced: true,

  state: {
    notificationsNonLues: [],
    messagesNonLusParWorkspace: {},
    totalNonLus: 0,
    isLoading: false,
  },

  mutations: {
    SET_LOADING(state, status) {
      state.isLoading = status;
    },
    
    SET_NOTIFICATIONS(state, notifications) {
      state.notificationsNonLues = notifications;
    },
    
    SET_TOTAL_NON_LUS(state, total) {
      state.totalNonLus = total;
    },
    
    SET_MESSAGES_NON_LUS_PAR_WORKSPACE(state, { workspaceId, count }) {
      state.messagesNonLusParWorkspace = {
        ...state.messagesNonLusParWorkspace,
        [workspaceId]: count
      };
    },
    
    AJOUTER_NOTIFICATION(state, notification) {
      // Vérifier si la notification existe déjà pour éviter les doublons
      const exists = state.notificationsNonLues.some(n => n._id === notification._id);
      if (!exists) {
        state.notificationsNonLues.push(notification);
        state.totalNonLus++;
        
        // Mettre à jour le compteur pour le workspace correspondant
        if (notification.type === 'canal') {
          // Si on a la référence du canal, on peut déterminer le workspace
          const canal = notification.reference;
          if (canal && canal.workspace) {
            const workspaceId = canal.workspace;
            state.messagesNonLusParWorkspace[workspaceId] = 
              (state.messagesNonLusParWorkspace[workspaceId] || 0) + 1;
          }
        }
      }
    },
    
    MARQUER_NOTIFICATION_LUE(state, notificationId) {
      const index = state.notificationsNonLues.findIndex(n => n._id === notificationId);
      if (index !== -1) {
        // Récupérer la notification
        const notification = state.notificationsNonLues[index];
        
        // Supprimer la notification de la liste des non lues
        state.notificationsNonLues.splice(index, 1);
        state.totalNonLus--;
        
        // Décrémenter le compteur pour le workspace correspondant
        if (notification.type === 'canal') {
          const canal = notification.reference;
          if (canal && canal.workspace) {
            const workspaceId = canal.workspace;
            if (state.messagesNonLusParWorkspace[workspaceId] > 0) {
              state.messagesNonLusParWorkspace[workspaceId]--;
            }
          }
        }
      }
    }
  },

  actions: {
    // Initialisation des écouteurs WebSocket pour les notifications
    initNotificationListeners({ commit, dispatch }) {
      socket.on('notification:nouvelle', (notification) => {
        commit('AJOUTER_NOTIFICATION', notification);
        // Mettre à jour le compteur spécifique au workspace si c'est une notification de canal
        if (notification.type === 'canal') {
          dispatch('fetchWorkspaceNotifications', notification.canalId);
        }
      });
      
      socket.on('notification:lue', (data) => {
        commit('MARQUER_NOTIFICATION_LUE', data.notificationId);
      });
    },

    // Charger toutes les notifications non lues
    async fetchNotifications({ commit }) {
      commit('SET_LOADING', true);
      try {
        const response = await axios.get(`${API_URL}/notifications`);
        commit('SET_NOTIFICATIONS', response.data.data.notifications);
        commit('SET_LOADING', false);
      } catch (error) {
        console.error('Erreur lors du chargement des notifications', error);
        commit('SET_LOADING', false);
      }
    },
    
    // Charger le total des notifications non lues
    async fetchTotalNonLus({ commit }) {
      try {
        const response = await axios.get(`${API_URL}/notifications/nombre`);
        commit('SET_TOTAL_NON_LUS', response.data.data.count);
      } catch (error) {
        console.error('Erreur lors du chargement du total des notifications non lues', error);
      }
    },
    
    // Charger les notifications pour un workspace spécifique
    async fetchWorkspaceNotifications({ commit }, workspaceId) {
      try {
        // Récupérer les canaux avec des messages non lus pour ce workspace
        const response = await axios.get(`${API_URL}/notifications/canaux/${workspaceId}`);
        
        // Calculer le nombre total de messages non lus pour ce workspace
        const canaux = response.data.data.canaux || [];
        const totalNonLus = canaux.reduce((total, canal) => {
          return total + (canal.messagesNonLus || 0);
        }, 0);
        
        commit('SET_MESSAGES_NON_LUS_PAR_WORKSPACE', { 
          workspaceId, 
          count: totalNonLus 
        });
      } catch (error) {
        console.error(`Erreur lors du chargement des notifications pour le workspace ${workspaceId}`, error);
      }
    },
    
    // Marquer une notification comme lue
    async markAsRead({ commit }, notificationId) {
      try {
        await axios.patch(`${API_URL}/notifications/${notificationId}/lue`);
        commit('MARQUER_NOTIFICATION_LUE', notificationId);
      } catch (error) {
        console.error('Erreur lors du marquage de la notification comme lue', error);
      }
    },
    
    // Marquer toutes les notifications d'un canal comme lues
    async markAllAsReadForCanal({ commit }, canalId) {
      try {
        const response = await axios.patch(`${API_URL}/notifications/canal/${canalId}/lues`);
        // Mettre à jour l'état après le succès
        if (response.data.status === 'success') {
          // On devrait idéalement récupérer à nouveau toutes les notifications
          dispatch('fetchNotifications');
          dispatch('fetchTotalNonLus');
        }
      } catch (error) {
        console.error('Erreur lors du marquage des notifications comme lues', error);
      }
    }
  },

  getters: {
    // Obtenir le nombre de notifications non lues pour un workspace
    getNotificationsCountForWorkspace: (state) => (workspaceId) => {
      return state.messagesNonLusParWorkspace[workspaceId] || 0;
    },
    
    // Obtenir le total des notifications non lues
    getTotalNotificationsCount: (state) => {
      return state.totalNonLus;
    },
    
    // Vérifier si un workspace a des notifications non lues
    hasUnreadNotifications: (state) => (workspaceId) => {
      return (state.messagesNonLusParWorkspace[workspaceId] || 0) > 0;
    }
  }
};
