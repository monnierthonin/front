import { io } from 'socket.io-client';
import store from '../store';

class SocketService {
    constructor() {
        this.socket = null;
    }

    init() {
        if (this.socket) {
            console.log('Socket déjà initialisé');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            console.error('Pas de token disponible');
            return;
        }

        console.log('Initializing WebSocket connection...');
        const apiUrl = process.env.VUE_APP_API_URL || 'http://localhost:3000';
        console.log('Using API URL:', apiUrl);
        
        this.socket = io(apiUrl, {
            auth: { token },
            transports: ['websocket'],
            withCredentials: true,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5
        });

        return new Promise((resolve, reject) => {
            this.socket.on('connect', () => {
                console.log('WebSocket connecté, socket.id:', this.socket.id);
                resolve();
            });

            this.socket.on('connect_error', (error) => {
                console.error('Erreur de connexion WebSocket:', error);
                reject(error);
            });

            this.socket.on('disconnect', (reason) => {
                console.log('WebSocket déconnecté:', reason);
            });

            this.socket.on('reconnect', (attemptNumber) => {
                console.log('WebSocket reconnecté après', attemptNumber, 'tentatives');
            });

            // Écouter les nouveaux messages
            this.socket.on('nouveau-message', (data) => {
                console.log('Nouveau message reçu:', data);
                if (data && data.message) {
                    console.log('Ajout du message au store:', data.message);
                    store.commit('canal/AJOUTER_MESSAGE', data.message);
                } else {
                    console.error('Format de message invalide:', data);
                }
            });
            
            // Écouter les messages modifiés
            this.socket.on('message-modifie', (data) => {
                console.log('Message modifié reçu:', data);
                if (data && data.message) {
                    console.log('Mise à jour du message dans le store:', data.message);
                    // Mettre à jour dans les deux stores pour assurer la cohérence
                    store.commit('canal/UPDATE_MESSAGE', data.message);
                    store.commit('message/UPDATE_MESSAGE', data.message);
                } else {
                    console.error('Format de message modifié invalide:', data);
                }
            });
            
            // Écouter les réactions aux messages
            this.socket.on('reaction-message', (data) => {
                console.log('Réaction à un message reçue:', data);
                if (data && data.messageId && data.message) {
                    // Mettre à jour le message avec les nouvelles réactions
                    const updatedMessage = data.message;
                    
                    // Mettre à jour dans les deux stores pour assurer la cohérence
                    store.commit('canal/UPDATE_MESSAGE', updatedMessage);
                    store.commit('message/UPDATE_MESSAGE', updatedMessage);
                } else {
                    console.error('Format de réaction invalide:', data);
                }
            });
            
            // Écouter les messages supprimés
            this.socket.on('message-supprime', (data) => {
                console.log('Message supprimé reçu:', data);
                if (data && data.messageId) {
                    store.commit('canal/REMOVE_MESSAGE', data.messageId);
                    store.commit('message/REMOVE_MESSAGE', data.messageId);
                } else {
                    console.error('Format de suppression invalide:', data);
                }
            });
            
            // Écouter les réponses aux messages
            this.socket.on('nouvelle-reponse', (data) => {
                console.log('Nouvelle réponse reçue:', data);
                if (data && data.message) {
                    // Ajouter la réponse aux messages du canal
                    store.commit('canal/ADD_MESSAGE', data.message);
                    store.commit('message/ADD_MESSAGE', data.message);
                } else {
                    console.error('Format de réponse invalide:', data);
                }
            });
            
            // Écouter les notifications de mention
            this.socket.on('nouvelle-mention', (data) => {
                console.log('Nouvelle mention reçue:', data);
                if (data && data.message) {
                    // Ajouter la notification au store
                    store.commit('notification/AJOUTER_NOTIFICATION', {
                        type: 'mention',
                        message: `Vous avez été mentionné dans un message`,
                        data: data,
                        lue: false,
                        date: new Date()
                    });
                    
                    // Afficher une notification visuelle
                    if ('Notification' in window && Notification.permission === 'granted') {
                        const auteur = data.message.auteur ? data.message.auteur.username : 'Quelqu\'un';
                        const canalNom = data.canal ? data.canal.nom : 'un canal';
                        
                        new Notification('Nouvelle mention', {
                            body: `${auteur} vous a mentionné dans ${canalNom}`,
                            icon: '/favicon.ico'
                        });
                    }
                }
            });
        });
    }

    joinCanal(canalId) {
        if (this.socket) {
            this.socket.emit('rejoindre-canal', { canalId });
        }
    }

    joinWorkspace(workspaceId) {
        if (this.socket) {
            this.socket.emit('rejoindre-workspace', workspaceId);
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export default new SocketService();
