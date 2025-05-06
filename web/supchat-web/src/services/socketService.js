import { io } from 'socket.io-client';
import store from '../store';

class SocketService {
    constructor() {
        this.socket = null;
    }

    init() {
        if (this.socket) {
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            console.error('Pas de token disponible');
            return;
        }

        const apiUrl = process.env.VUE_APP_API_URL || 'http://localhost:3000';
        
        // Configuration optimisée pour réduire la charge
        this.socket = io(apiUrl, {
            auth: { token },
            transports: ['websocket'],
            withCredentials: true,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5,
            // Optimisations pour réduire la charge réseau
            upgrade: false, // Utiliser uniquement WebSocket sans fallback
            forceNew: false, // Réutiliser la connexion existante si possible
            timeout: 5000 // Timeout plus court pour éviter les attentes trop longues
        });

        return new Promise((resolve, reject) => {
            this.socket.on('connect', () => {
                resolve();
            });

            this.socket.on('connect_error', (error) => {
                console.error('Erreur de connexion WebSocket:', error);
                reject(error);
            });

            this.socket.on('disconnect', () => {
                // Gestion silencieuse de la déconnexion
            });

            this.socket.on('reconnect', () => {
                // Gestion silencieuse de la reconnexion
            });

            // Écouter les nouveaux messages (optimisé)
            this.socket.on('nouveau-message', (data) => {
                if (data && data.message) {
                    // Utiliser setTimeout pour éviter de bloquer le thread principal
                    setTimeout(() => {
                        store.commit('canal/AJOUTER_MESSAGE', data.message);
                    }, 0);
                }
            });
            
            // Écouter les messages modifiés (optimisé)
            this.socket.on('message-modifie', (data) => {
                if (data && data.message) {
                    // Utiliser setTimeout pour éviter de bloquer le thread principal
                    setTimeout(() => {
                        // Mettre à jour dans les deux stores pour assurer la cohérence
                        store.commit('canal/UPDATE_MESSAGE', data.message);
                        store.commit('message/UPDATE_MESSAGE', data.message);
                    }, 0);
                }
            });
            
            // Écouter les réactions aux messages (optimisé)
            this.socket.on('reaction-message', (data) => {
                if (data && data.messageId && data.message) {
                    // Utiliser setTimeout pour éviter de bloquer le thread principal
                    setTimeout(() => {
                        // Mettre à jour dans les deux stores pour assurer la cohérence
                        store.commit('canal/UPDATE_MESSAGE', data.message);
                        store.commit('message/UPDATE_MESSAGE', data.message);
                    }, 0);
                }
            });
            
            // Écouter les messages supprimés (optimisé)
            this.socket.on('message-supprime', (data) => {
                if (data && data.messageId) {
                    // Utiliser setTimeout pour éviter de bloquer le thread principal
                    setTimeout(() => {
                        store.commit('canal/REMOVE_MESSAGE', data.messageId);
                        store.commit('message/REMOVE_MESSAGE', data.messageId);
                    }, 0);
                }
            });
            
            // Écouter les réponses aux messages
            this.socket.on('nouvelle-reponse', (data) => {
                if (data && data.message) {
                    // Ajouter la réponse aux messages du canal
                    setTimeout(() => {
                        store.commit('canal/ADD_MESSAGE', data.message);
                        store.commit('message/ADD_MESSAGE', data.message);
                    }, 0);
                }
            });
            
            // Écouter les notifications de mention
            this.socket.on('nouvelle-mention', (data) => {
                if (data && data.message) {
                    // Ajouter la notification au store
                    setTimeout(() => {
                        store.commit('notification/AJOUTER_NOTIFICATION', {
                            type: 'mention',
                            message: `Vous avez été mentionné dans un message`,
                            data: data,
                            lue: false,
                            date: new Date()
                        });
                    }, 0);
                    
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
            
            // Écouter les nouveaux messages privés
            this.socket.on('nouveau-message-prive', (message) => {
                if (message) {
                    // Ajouter le message privé au store
                    setTimeout(() => {
                        store.commit('messagePrivate/ADD_MESSAGE', message);
                        
                        // Mettre à jour la liste des conversations
                        store.dispatch('messagePrivate/updateConversationList');
                    }, 0);
                    
                    // Afficher une notification visuelle
                    if ('Notification' in window && Notification.permission === 'granted') {
                        const expediteur = message.expediteur ? 
                            (message.expediteur.firstName && message.expediteur.lastName ? 
                                `${message.expediteur.firstName} ${message.expediteur.lastName}` : 
                                message.expediteur.username) : 
                            'Quelqu\'un';
                        
                        new Notification('Nouveau message privé', {
                            body: `${expediteur}: ${message.contenu.substring(0, 50)}${message.contenu.length > 50 ? '...' : ''}`,
                            icon: '/favicon.ico'
                        });
                    }
                }
            });
            
            // Écouter les modifications de messages privés
            this.socket.on('message-prive-modifie', (message) => {
                if (message) {
                    // Mettre à jour le message dans le store
                    setTimeout(() => {
                        store.commit('messagePrivate/UPDATE_MESSAGE', message);
                    }, 0);
                }
            });
            
            // Écouter les suppressions de messages privés
            this.socket.on('message-prive-supprime', ({ messageId }) => {
                if (messageId) {
                    // Supprimer le message du store
                    setTimeout(() => {
                        store.commit('messagePrivate/REMOVE_MESSAGE', messageId);
                    }, 0);
                }
            });
            
            // Écouter les confirmations d'envoi de messages privés
            this.socket.on('message-prive-envoye', (data) => {
                if (data && data.messageId) {
                    // Mettre à jour le statut du message
                    setTimeout(() => {
                        store.commit('messagePrivate/UPDATE_MESSAGE_STATUS', {
                            id: data.messageId,
                            status: { envoye: true }
                        });
                    }, 0);
                }
            });
            
            // Écouter les notifications de lecture de messages privés
            this.socket.on('message-prive-lu', (data) => {
                if (data && data.messageId) {
                    // Mettre à jour le statut du message
                    setTimeout(() => {
                        store.commit('messagePrivate/UPDATE_MESSAGE_STATUS', {
                            id: data.messageId,
                            status: { lu: true }
                        });
                    }, 0);
                }
            });
            
            // Écouter les suppressions de messages privés
            this.socket.on('message-prive-supprime', (data) => {
                if (data && data.messageId) {
                    // Supprimer le message du store
                    setTimeout(() => {
                        store.commit('messagePrivate/REMOVE_MESSAGE', data.messageId);
                        
                        // Mettre à jour la liste des conversations
                        store.dispatch('messagePrivate/updateConversationList');
                    }, 0);
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
