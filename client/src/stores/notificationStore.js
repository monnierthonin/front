import { defineStore } from 'pinia';
import axios from 'axios';
import socket from '@/services/websocketService';

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notificationsNonLues: [],
    messagesNonLusParWorkspace: {},
    messagesNonLusParCanal: {}, // Ajout du compteur par canal
    totalNonLus: 0,
    isLoading: false,
  }),

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
    hasWorkspaceNotifications: (state) => (workspaceId) => {
      return (state.messagesNonLusParWorkspace[workspaceId] || 0) > 0;
    },
    
    // Vérifier si un canal spécifique a des notifications non lues
    hasChannelNotifications: (state) => (workspaceId, canalId) => {
      const key = `${workspaceId}_${canalId}`;
      return (state.messagesNonLusParCanal[key] || 0) > 0;
    },
    
    // Obtenir le nombre de notifications non lues pour un canal spécifique
    getChannelNotificationsCount: (state) => (workspaceId, canalId) => {
      const key = `${workspaceId}_${canalId}`;
      return state.messagesNonLusParCanal[key] || 0;
    }
  },

  actions: {
    // Initialisation des écouteurs WebSocket pour les notifications en temps réel
    initNotificationListeners() {
      socket.on('notification:nouvelle', (notification) => {
        this.ajouterNotification(notification);
        
        // Mettre à jour le compteur spécifique au workspace si c'est une notification de canal
        if (notification.type === 'canal') {
          this.fetchWorkspaceNotifications(notification.canalId);
        }
      });
      
      socket.on('notification:lue', (data) => {
        this.marquerNotificationLue(data.notificationId);
      });
    },

    // Charger toutes les notifications non lues
    async fetchNotifications() {
      this.isLoading = true;
      try {
        const response = await axios.get('/api/v1/notifications');
        this.notificationsNonLues = response.data.data.notifications;
        this.isLoading = false;
      } catch (error) {
        console.error('Erreur lors du chargement des notifications', error);
        this.isLoading = false;
      }
    },
    
    // Charger le total des notifications non lues
    async fetchTotalNonLus() {
      try {
        const response = await axios.get('/api/v1/notifications/nombre');
        this.totalNonLus = response.data.data.count;
      } catch (error) {
        console.error('Erreur lors du chargement du total des notifications non lues', error);
      }
    },
    
    // Charger les notifications pour un workspace spécifique
    async fetchWorkspaceNotifications(workspaceId) {
      try {
        // Récupérer les canaux avec des messages non lus pour ce workspace
        const response = await axios.get(`/api/v1/notifications/canaux/${workspaceId}`);
        
        // Calculer le nombre total de messages non lus pour ce workspace
        const canaux = response.data.data.canaux || [];
        const totalNonLus = canaux.reduce((total, canal) => {
          return total + (canal.messagesNonLus || 0);
        }, 0);
        
        // Mettre à jour l'état
        this.messagesNonLusParWorkspace[workspaceId] = totalNonLus;
        
        // Mettre à jour aussi le compteur par canal
        canaux.forEach(canal => {
          if (canal._id && canal.messagesNonLus > 0) {
            const key = `${workspaceId}_${canal._id}`;
            this.messagesNonLusParCanal[key] = canal.messagesNonLus;
          }
        });
      } catch (error) {
        console.error(`Erreur lors du chargement des notifications pour le workspace ${workspaceId}`, error);
      }
    },
    
    // Charger les notifications pour un canal spécifique
    async fetchChannelNotifications(workspaceId, canalId) {
      try {
        if (!workspaceId || !canalId) return;
        
        // Récupérer le nombre de messages non lus pour ce canal
        const response = await axios.get(`/api/v1/notifications/canal/${canalId}/nombre`);
        
        if (response.data && response.data.status === 'success') {
          const messagesNonLus = response.data.data.count || 0;
          
          // Mettre à jour le compteur pour ce canal
          const key = `${workspaceId}_${canalId}`;
          this.messagesNonLusParCanal[key] = messagesNonLus;
        }
      } catch (error) {
        console.error(`Erreur lors du chargement des notifications pour le canal ${canalId}`, error);
      }
    },
    
    // Ajouter une nouvelle notification
    ajouterNotification(notification) {
      // Vérifier si la notification existe déjà pour éviter les doublons
      const exists = this.notificationsNonLues.some(n => n._id === notification._id);
      if (!exists) {
        this.notificationsNonLues.push(notification);
        this.totalNonLus++;
        
        // Mettre à jour le compteur pour le workspace correspondant
        if (notification.type === 'canal') {
          // Si on a la référence du canal, on peut déterminer le workspace
          const canal = notification.reference;
          if (canal && canal.workspace) {
            const workspaceId = canal.workspace;
            this.messagesNonLusParWorkspace[workspaceId] = 
              (this.messagesNonLusParWorkspace[workspaceId] || 0) + 1;
          }
        }
      }
    },
    
    // Marquer une notification comme lue
    async marquerNotificationLue(notificationId) {
      try {
        await axios.patch(`/api/v1/notifications/${notificationId}/lue`);
        
        const index = this.notificationsNonLues.findIndex(n => n._id === notificationId);
        if (index !== -1) {
          // Récupérer la notification
          const notification = this.notificationsNonLues[index];
          
          // Supprimer la notification de la liste des non lues
          this.notificationsNonLues.splice(index, 1);
          this.totalNonLus--;
          
          // Décrémenter le compteur pour le workspace et le canal correspondant
          if (notification.type === 'canal') {
            const canal = notification.reference;
            if (canal && canal.workspace && canal._id) {
              const workspaceId = canal.workspace;
              const canalId = canal._id;
              
              // Mettre à jour le compteur du workspace
              if (this.messagesNonLusParWorkspace[workspaceId] > 0) {
                this.messagesNonLusParWorkspace[workspaceId]--;
              }
              
              // Mettre à jour aussi le compteur du canal
              const key = `${workspaceId}_${canalId}`;
              if (this.messagesNonLusParCanal[key] > 0) {
                this.messagesNonLusParCanal[key]--;
              }
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors du marquage de la notification comme lue', error);
      }
    },
    
    // Marquer toutes les notifications d'un canal comme lues
    async markAllAsReadForCanal(workspaceId, canalId) {
      try {
        const response = await axios.patch(`/api/v1/notifications/canal/${canalId}/lues`);
        // Mettre à jour l'état après le succès
        if (response.data.status === 'success') {
          // Récupérer le nombre actuel de notifications pour ce canal
          const key = `${workspaceId}_${canalId}`;
          const nbNotifications = this.messagesNonLusParCanal[key] || 0;
          
          // Mettre à jour les compteurs du canal et du workspace
          if (nbNotifications > 0) {
            this.messagesNonLusParCanal[key] = 0;
            
            // Décrémenter le compteur global du workspace
            if (this.messagesNonLusParWorkspace[workspaceId] >= nbNotifications) {
              this.messagesNonLusParWorkspace[workspaceId] -= nbNotifications;
            } else {
              // En cas d'incohérence, on réinitialise le compteur
              this.messagesNonLusParWorkspace[workspaceId] = 0;
            }
          }
          
          // Actualiser les notifications globales
          this.fetchNotifications();
          this.fetchTotalNonLus();
        }
      } catch (error) {
        console.error('Erreur lors du marquage des notifications comme lues', error);
      }
    }
  }
});
