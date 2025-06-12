<template>
  <div class="private-message-container">
    <!-- Section des messages -->
    <div class="messages-section" ref="messagesSection">
      <Message 
        :messages="messagesData" 
        :isLoading="isLoading"
        :currentUserId="currentUserId"
        :isPrivate="true"
        :conversationId="privateMessageTarget && privateMessageTarget._id ? privateMessageTarget._id : conversationId"
        @reply-to-message="handleReplyToMessage"
        @edit-message="handleEditMessage"
        @delete-message="handleDeleteMessage"
        @reaction-added="handleReactionAdded"
        @update-message="handleMessageUpdate"
      />
    </div>
    
    <!-- Section de saisie de message -->
    <div class="input-section">
      <textBox 
        :canalActif="privateMessageTarget"
        :replyingToMessage="replyingToMessage"
        @envoyer-message="sendPrivateMessage"
        @reply-to-message="replyToMessage"
        @refresh-messages="loadPrivateMessages"
        @cancel-reply="cancelReply"
      />
    </div>
  </div>
</template>

<script>
import Message from './Message.vue';
import textBox from './textBox.vue';
import messagePrivateService from '../../services/messagePrivateService';
import { getCurrentUserId, getCurrentUserIdAsync } from '../../utils/userUtils';

export default {
  name: 'PrivateMessage',
  components: {
    Message,
    textBox
  },
  props: {
    userId: {
      type: String,
      default: ''
    },
    conversationId: {
      type: String,
      default: ''
    },
    targetUser: {
      type: Object,
      default: () => null
    }
  },
  data() {
    return {
      messagesData: [],
      isLoading: true,
      currentUserId: getCurrentUserId() || '', // Initialisation synchrone avec valeur potentiellement en cache
      privateMessageTarget: null,
      replyingToMessage: null,
      currentPage: 1,
      messagesPerPage: 50,
      hasMoreMessages: true
    };
  },
  
  async created() {
    // Initialisation asynchrone de l'ID utilisateur lors de la création du composant
    try {
      const userId = await getCurrentUserIdAsync();
      if (userId) {
        console.log('ID utilisateur récupéré via API dans PrivateMessage:', userId);
        this.currentUserId = userId;
      } else {
        console.warn('Impossible de récupérer l\'ID utilisateur via l\'API dans PrivateMessage');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'ID utilisateur dans PrivateMessage:', error);
    }
  },
  watch: {
    userId: {
      handler: 'initializeMessages',
      immediate: true
    },
    targetUser: {
      handler: 'initializeMessages',
      immediate: true
    }
  },
  methods: {
    /**
     * Initialise les messages pour l'utilisateur cible
     */
    async initializeMessages() {
      if ((!this.userId && !this.conversationId) || !this.targetUser) {
        console.log('Impossible d\'initialiser les messages : informations manquantes');
        this.messagesData = [];
        this.isLoading = false;
        return;
      }

      this.isLoading = true;
      
      // Si l'ID de conversation est déjà fourni, l'utiliser directement
      if (this.conversationId) {
        console.log('ID de conversation déjà fourni:', this.conversationId);
        // Mettre à jour la propriété interne
        this.privateMessageTarget = {
          _id: this.conversationId,
          nom: this.getAuthorName(this.targetUser),
          type: 'conversation'
        };
        this.loadPrivateMessages();
      } else {
        // Sinon, chercher l'ID de conversation
        console.log('Recherche de l\'ID de conversation pour l\'utilisateur:', this.userId);
        await this.findOrCreateConversation();
      }
    },

    /**
     * Cherche une conversation existante ou en crée une nouvelle
     */
    async findOrCreateConversation() {
      try {
        console.log('==================== DÉBUT RECHERCHE CONVERSATION ====================');
        console.log('Recherche d\'une conversation avec l\'utilisateur:', this.userId);
        
        // Récupérer toutes les conversations de l'utilisateur
        const conversations = await messagePrivateService.getAllPrivateConversations();
        console.log('Conversations récupérées:', conversations);
        console.log('Nombre de conversations:', Array.isArray(conversations) ? conversations.length : 'N/A');

        // Chercher une conversation existante avec l'utilisateur cible
        const targetConversation = conversations.find(conv => {
          if (!conv || !conv.participants) return false;
          return conv.participants.some(p => p._id === this.userId);
        });

        console.log('Recherche de conversation pour userId:', this.userId);
        console.log('Conversation trouvée:', targetConversation);

        if (targetConversation && targetConversation._id) {
          console.log('Conversation existante trouvée:', targetConversation);
          // Mettre à jour la propriété interne
          this.privateMessageTarget = {
            _id: targetConversation._id,
            nom: this.getAuthorName(this.targetUser),
            type: 'conversation'
          };
          
          // Charger les messages de cette conversation
          this.loadPrivateMessages(targetConversation._id);
          
          // Mettre à jour la prop conversationId dans le parent
          this.$emit('update:conversationId', targetConversation._id);
        } else {
          console.log('Aucune conversation trouvée, création d\'une nouvelle conversation');
          // Créer une nouvelle conversation
          const newConversation = await messagePrivateService.sendPrivateMessage(
            this.userId,
            "Bonjour, je vous ai ajouté à mes contacts.",
            'user'
          );
          
          console.log('Nouvelle conversation créée:', newConversation);
          
          if (newConversation && newConversation.conversation) {
            const conversationId = newConversation.conversation._id || newConversation.conversation;
            
            // Mettre à jour la propriété interne
            this.privateMessageTarget = {
              _id: conversationId.toString(),
              nom: this.getAuthorName(this.targetUser),
              type: 'conversation'
            };
            
            // Charger les messages de cette conversation
            this.loadPrivateMessages(conversationId.toString());
            
            // Mettre à jour la prop conversationId dans le parent
            this.$emit('update:conversationId', conversationId.toString());
          } else {
            console.error('Impossible de créer une nouvelle conversation');
            this.isLoading = false;
          }
        }
        
        console.log('==================== FIN RECHERCHE CONVERSATION ====================');
      } catch (error) {
        console.error('Erreur lors de la recherche de la conversation:', error);
        this.privateMessageTarget = {
          _id: this.userId,
          nom: this.getAuthorName(this.targetUser),
          type: 'user'
        };
        // Réinitialiser la prop conversationId dans le parent
        this.$emit('update:conversationId', '');
      }
    },

    /**
     * Charge les messages privés de la conversation
     * @param {String} specificConversationId - ID de conversation spécifique (optionnel)
     */
    async loadPrivateMessages(specificConversationId = null) {
      try {
        console.log('==================== DÉBUT CHARGEMENT MESSAGES ====================');
        this.isLoading = true;

        const conversationId = specificConversationId || this.conversationId;

        // Vérifier si nous avons un ID de conversation valide
        if (!conversationId) {
          console.log('Pas d\'ID de conversation, chargement des messages impossible');
          this.messagesData = [];
          this.hasMoreMessages = false;
          return;
        }

        console.log('Chargement des messages pour la conversation:', conversationId);
        
        // Récupérer les messages de la conversation via le service
        const messages = await messagePrivateService.getConversationMessages(
          conversationId,
          this.currentPage,
          this.messagesPerPage
        );
        
        console.log('Messages reçus:', messages);
        
        // Vérifier si nous avons reçu des messages
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
          console.log('Aucun message trouvé pour cette conversation');
          this.messagesData = [];
          this.hasMoreMessages = false;
          this.isLoading = false;
          return;
        }

        // Normaliser la structure des messages pour la compatibilité avec le composant Message
        const normalizedMessages = messages.map(message => {
          const messageId = message._id || message.id;
          return {
            ...message,
            _id: messageId ? messageId.toString() : undefined,
            id: messageId ? messageId.toString() : undefined,
            expediteur: message.expediteur ? {
              ...message.expediteur,
              _id: (message.expediteur._id || message.expediteur.id || '').toString(),
              id: (message.expediteur._id || message.expediteur.id || '').toString()
            } : undefined,
            conversation: (message.conversation || message.conversationId || '').toString(),
            conversationId: (message.conversation || message.conversationId || '').toString()
          };
        });

        console.log('Messages normalisés:', normalizedMessages);

        // Mettre à jour la liste des messages
        if (this.currentPage === 1) {
          // Première page, remplacer tous les messages
          this.messagesData = normalizedMessages;
        } else {
          // Pages suivantes, ajouter au début
          this.messagesData = [...normalizedMessages, ...this.messagesData];
        }

        // Mettre à jour le statut de pagination
        this.hasMoreMessages = normalizedMessages.length >= this.messagesPerPage;
        
        console.log('==================== FIN CHARGEMENT MESSAGES ====================');
      } catch (error) {
        console.error('Erreur lors du chargement des messages:', error);
        this.messagesData = [];
        this.hasMoreMessages = false;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Envoie un message privé
     * @param {Object} messageData - Données du message (contient la propriété contenu)
     */
    async sendPrivateMessage(messageData) {
      try {
        if (!messageData || !messageData.contenu) {
          throw new Error('Contenu du message manquant');
        }

        const conversationId = this.conversationId || (this.privateMessageTarget ? this.privateMessageTarget._id : null);
        const targetType = this.privateMessageTarget ? this.privateMessageTarget.type : 'conversation';
        const targetId = conversationId || this.userId;

        if (!targetId) {
          throw new Error('ID de cible manquant');
        }

        console.log('Envoi de message privé:', {
          targetId,
          targetType,
          contenu: messageData.contenu
        });

        // Envoyer le message via le service
        const response = await messagePrivateService.sendPrivateMessage(
          targetId,
          messageData.contenu,
          targetType
        );

        console.log('Réponse du serveur:', response);

        if (!response) {
          throw new Error('Aucune réponse reçue du serveur');
        }

        // Extraire le message envoyé de la réponse
        let sentMessage;
        if (response.data && response.data.message) {
          sentMessage = response.data.message;
        } else if (response.message) {
          sentMessage = response.message;
        } else if (response.data) {
          sentMessage = response.data;
        } else {
          sentMessage = response;
        }

        // Vérifier si le message a une conversation associée et la mettre à jour si nécessaire
        const newConversationId = sentMessage.conversation || sentMessage.conversationId;
        
        if (newConversationId && (!this.conversationId || this.conversationId !== newConversationId.toString())) {
          console.log('Mise à jour de l\'ID de conversation:', newConversationId);
          
          // Mettre à jour la prop conversationId dans le parent
          this.$emit('update:conversationId', newConversationId.toString());
          
          // Mettre à jour la propriété interne
          this.privateMessageTarget = {
            ...this.privateMessageTarget,
            _id: newConversationId.toString(),
            type: 'conversation'
          };
        }

        // Ajouter le message à la liste si la page est la première (messages les plus récents)
        if (this.currentPage === 1) {
          // Normaliser la structure du message
          const messageId = sentMessage._id || sentMessage.id;
          const normalizedMessage = {
            ...sentMessage,
            _id: messageId ? messageId.toString() : undefined,
            id: messageId ? messageId.toString() : undefined,
            expediteur: sentMessage.expediteur ? {
              ...sentMessage.expediteur,
              _id: (sentMessage.expediteur._id || sentMessage.expediteur.id || '').toString(),
              id: (sentMessage.expediteur._id || sentMessage.expediteur.id || '').toString()
            } : undefined,
            conversation: (sentMessage.conversation || sentMessage.conversationId || '').toString(),
            conversationId: (sentMessage.conversation || sentMessage.conversationId || '').toString()
          };

          this.messagesData.push(normalizedMessage);
        } else {
          // Recharger tous les messages pour être sûr
          this.currentPage = 1;
          this.loadPrivateMessages();
        }

        // Afficher une notification de succès
        this.$toast.success('Message envoyé avec succès');
      } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        this.$toast.error(error.message || 'Erreur lors de l\'envoi du message');
      }
    },

    /**
     * Répond à un message privé
     * @param {Object} messageData - Données du message (contient parentMessageId et contenu)
     */
    async replyToMessage(messageData) {
      try {
        console.log('replyToMessage appelé avec les données:', messageData);
        
        // Vérifier que les données nécessaires sont présentes
        if (!messageData || !messageData.parentMessageId) {
          console.error('ID du message parent manquant');
          throw new Error('Impossible de répondre: ID du message parent manquant');
        }

        if (!messageData.contenu || messageData.contenu.trim() === '') {
          throw new Error('Le contenu de la réponse ne peut pas être vide');
        }

        // Déterminer l'ID de conversation à utiliser
        const conversationId = this.conversationId || (this.privateMessageTarget ? this.privateMessageTarget._id : null);

        if (!conversationId) {
          throw new Error('ID de conversation manquant');
        }

        console.log('Envoi de réponse au message:', { 
          conversationId: conversationId, 
          messageId: messageData.parentMessageId, 
          contenu: messageData.contenu
        });

        // Envoyer la réponse via le service
        const response = await messagePrivateService.sendPrivateReply(
          conversationId, 
          messageData.parentMessageId,
          messageData.contenu
        );

        console.log('Réponse du serveur pour le message privé:', response);

        if (!response) {
          throw new Error('Aucune réponse reçue du serveur');
        }

        // Extraire le message de la réponse en tenant compte des différentes structures possibles
        let newMessage;
        if (response.data && response.data.message) {
          newMessage = response.data.message;
        } else if (response.message) {
          newMessage = response.message;
        } else if (response.data) {
          newMessage = response.data;
        } else {
          newMessage = response;
        }

        console.log('Message de réponse extrait:', newMessage);

        // Vérifier que le message a un ID
        const newMessageId = newMessage._id || newMessage.id;
        if (!newMessageId) {
          console.error('Réponse reçue sans ID:', newMessage);
          throw new Error('Réponse invalide reçue du serveur');
        }

        // Normaliser la structure du message pour compatibilité
        const formattedMessage = {
          ...newMessage,
          _id: newMessageId.toString(),
          id: newMessageId.toString(),
          reponseA: messageData.parentMessageId.toString()
        };

        // Normaliser l'expéditeur si présent
        if (formattedMessage.expediteur) {
          const expediteurId = formattedMessage.expediteur._id || formattedMessage.expediteur.id;
          if (expediteurId) {
            formattedMessage.expediteur = {
              ...formattedMessage.expediteur,
              _id: expediteurId.toString(),
              id: expediteurId.toString()
            };
          }
        }

        // Ajouter le nouveau message à la liste
        this.messagesData.push(formattedMessage);

        // Réinitialiser l'état de réponse
        this.replyingToMessage = null;

        this.$toast.success('Réponse envoyée avec succès');
      } catch (error) {
        console.error('Erreur lors de la réponse au message:', error);
        this.$toast.error(error.message || 'Erreur lors de la réponse au message');
      }
    },

    /**
     * Charge plus de messages (pagination)
     */
    loadMoreMessages() {
      if (this.hasMoreMessages && !this.isLoading) {
        this.currentPage++;
        this.loadPrivateMessages();
      }
    },

    /**
     * Gère la réponse à un message
     * @param {Object} message - Message auquel répondre
     */
    handleReplyToMessage(message) {
      console.log('PrivateMessage.vue a reçu une demande de réponse au message:', message);
      
      // Récupérer l'ID du message auquel répondre
      let messageId = null;
      
      // Traiter différentes structures de message possibles
      if (typeof message === 'object') {
        if (message._id) {
          messageId = message._id;
        } else if (message.id) {
          messageId = message.id;
        } else if (message.messageId) {
          // Dans certains cas, l'ID peut être dans une propriété messageId
          messageId = message.messageId;
        }
      } else if (typeof message === 'string') {
        // Si on reçoit directement un ID de message
        messageId = message;
      }
      
      if (!messageId) {
        console.error('Impossible de répondre : ID du message parent invalide ou manquant', message);
        return;
      }
      
      // Pour une compatibilité maximale, stocker juste l'ID du message
      this.replyingToMessage = messageId;
      
      console.log('Préparation de la réponse au message privé. ID:', messageId);
    },

    /**
     * Gère la modification d'un message
     * @param {Object} message - Message à modifier
     */
    async handleEditMessage(message) {
      try {
        // Vérifier si l'utilisateur est autorisé à modifier le message
        if (message.auteur._id !== this.currentUserId) {
          this.$toast.error('Vous ne pouvez pas modifier ce message');
          return;
        }
        
        // Obtenir le nouveau contenu du message (à implémenter, peut utiliser un prompt)
        const newContent = prompt('Modifier le message:', message.contenu);
        
        if (!newContent || newContent.trim() === '') {
          return;
        }
        
        // Vérifier si nous avons un ID de conversation
        if (!this.conversationId) {
          throw new Error('ID de conversation manquant');
        }
        
        // Modifier le message via le service
        await messagePrivateService.updatePrivateMessage(
          this.conversationId,
          message._id,
          newContent.trim()
        );
        
        // Mettre à jour le message dans la liste locale
        const index = this.messagesData.findIndex(m => m._id === message._id);
        if (index !== -1) {
          this.messagesData[index] = {
            ...this.messagesData[index],
            contenu: newContent.trim(),
            modifie: true
          };
        }
        
        this.$toast.success('Message modifié avec succès');
      } catch (error) {
        console.error('Erreur lors de la modification du message:', error);
        this.$toast.error(error.message || 'Erreur lors de la modification du message');
      }
    },

    /**
     * Obtient le nom d'affichage d'un utilisateur
     * @param {Object} user - Utilisateur
     * @returns {String} - Nom d'affichage
     */
    getAuthorName(user) {
      if (!user) return 'Utilisateur';
      return user.username || user.nom || user.email || 'Utilisateur';
    },

    /**
     * Gère la suppression d'un message
     * @param {Object} message - Message à supprimer
     */
    async handleDeleteMessage(message) {
      try {
        if (!message || !message._id) {
          console.error('ID du message manquant');
          return;
        }

        if (!this.conversationId) {
          console.error('ID de conversation manquant');
          return;
        }

        if (!confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
          return;
        }

        // Supprimer le message via le service
        await messagePrivateService.deletePrivateMessage(
          this.conversationId,
          message._id
        );

        // Supprimer le message de la liste locale
        this.messagesData = this.messagesData.filter(m => m._id !== message._id);

        this.$toast.success('Message supprimé avec succès');
      } catch (error) {
        console.error('Erreur lors de la suppression du message:', error);
        this.$toast.error(error.message || 'Erreur lors de la suppression du message');
      }
    },
    
    /**
     * Initialise la première conversation disponible
     */
    async initializeFirstConversation() {
      try {
        const conversations = await messagePrivateService.getAllPrivateConversations();
        
        if (conversations && conversations.length > 0) {
          const firstConversation = conversations[0];
          console.log('Première conversation trouvée:', firstConversation);
          
          // Trouver l'utilisateur cible (celui qui n'est pas l'utilisateur courant)
          const targetParticipant = firstConversation.participants.find(
            p => p._id !== this.currentUserId
          );
          
          if (targetParticipant) {
            // Mettre à jour les propriétés nécessaires
            this.privateMessageTarget = {
              _id: firstConversation._id,
              nom: this.getAuthorName(targetParticipant),
              type: 'conversation'
            };
            
            // Émettre l'ID de conversation au parent
            this.$emit('update:conversationId', firstConversation._id);
            
            // Charger les messages de cette conversation
            this.loadPrivateMessages(firstConversation._id);
          }
        } else {
          console.log('Aucune conversation disponible');
          this.isLoading = false;
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la première conversation:', error);
        this.isLoading = false;
      }
    },
    
    /**
     * Gère la mise à jour d'un message, notamment pour les réactions
     * @param {Object} param0 - Paramètres de la mise à jour
     * @param {Number} param0.index - Index du message dans le tableau messagesData
     * @param {Object} param0.message - Message mis à jour
     */
    handleMessageUpdate({ index, message }) {
      console.log('PrivateMessage: handleMessageUpdate appelé avec index:', index, 'et message:', message);
      if (index !== -1 && index < this.messagesData.length) {
        // Créer une nouvelle copie du tableau pour assurer la réactivité dans Vue 3
        const updatedMessages = [...this.messagesData];
        updatedMessages[index] = message;
        this.messagesData = updatedMessages;
        console.log('Message mis à jour dans messagesData à l\'index', index);
      }
    },
    
    /**
     * Gère l'ajout d'une réaction à un message
     * Méthode de compatibilité pour l'ancien système d'événements
     */
    handleReactionAdded({ messageId, emoji, updatedMessage }) {
      console.log('PrivateMessage: handleReactionAdded appelé, messageId:', messageId, 'emoji:', emoji);
      // Cette méthode est maintenue pour la compatibilité
      // La mise à jour réelle est gérée par handleMessageUpdate
    }
  },

  mounted() {
    const messagesSection = this.$refs.messagesSection;
    if (messagesSection) {
      messagesSection.addEventListener('scroll', () => {
        if (messagesSection.scrollTop === 0 && this.hasMoreMessages && !this.isLoading) {
          this.loadMoreMessages();
        }
      });
    }
    
    // Si aucune conversation n'est sélectionnée, charger la première de la liste
    if (!this.userId && !this.conversationId) {
      this.loadFirstConversation();
    }
  },

  beforeDestroy() {
    const messagesSection = this.$refs.messagesSection;
    if (messagesSection) {
      messagesSection.removeEventListener('scroll', this.loadMoreMessages);
    }
  }
};
</script>

<style scoped>
.private-message-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  position: relative;
  overflow: hidden;
}

.messages-section {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  scroll-behavior: smooth;
  margin-bottom: 70px; /* Espace pour la zone de texte */
  
  /* Masquer la barre de défilement tout en gardant la fonctionnalité */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* Internet Explorer et Edge */
}

.input-section {
  position: absolute;
  bottom: 0;
  width: 100%;
  background-color: var(--color-background, #313338);
  border-top: 1px solid var(--color-border, #2a2d31);
}

/* Copie exacte des styles de Message.vue */
:deep(.messages-list) {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  scroll-behavior: smooth;
}

:deep(.messages-loading),
:deep(.messages-empty) {
  text-align: center;
  padding: 2rem 0;
  color: var(--color-text-light, #888);
  font-style: italic;
}

:deep(.message-container) {
  width: 100%;
  padding: 0.5rem 0;
  display: flex;
  justify-content: flex-start;
  margin-bottom: 1rem;
}

:deep(.message-container.current-user) {
  justify-content: flex-end;
}

:deep(.message-content) {
  display: flex;
  position: relative;
  max-width: 70%;
  background-color: var(--color-background-soft, #36393f);
  border-radius: 8px;
  padding: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

:deep(.current-user .message-content) {
  background-color: var(--accent-color-light, #14324F);
  color: #fff;
  flex-direction: row-reverse;
}

:deep(.profile-pic) {
  width: 40px;
  height: 40px;
  margin-right: 0.75rem;
}

:deep(.current-user .profile-pic) {
  margin-right: 0;
  margin-left: 0.75rem;
}

:deep(.message-body) {
  flex: 1;
  min-width: 0; /* Pour éviter le débordement du contenu */
}

:deep(.message-header) {
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
}

:deep(.username) {
  font-weight: bold;
  margin-right: 0.5rem;
  word-break: break-word;
}

:deep(.timestamp) {
  color: var(--color-text-light, #a3a3a3);
  font-size: 0.8rem;
}

:deep(.current-user .timestamp) {
  color: rgba(255, 255, 255, 0.7);
}

:deep(.message-text) {
  color: inherit;
  line-height: 1.4;
  word-break: break-word;
}

:deep(.message-text p) {
  margin: 0;
}

:deep(.message-actions) {
  position: absolute;
  top: -20px;
  right: 8px;
  display: flex;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s;
  background-color: var(--color-background, #2f3136);
  border-radius: 4px;
  padding: 2px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

:deep(.current-user .message-actions) {
  right: auto;
  left: 8px;
}

:deep(.message-content:hover .message-actions) {
  opacity: 1;
}

:deep(.action-btn) {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

:deep(.action-btn:hover) {
  background-color: var(--color-background-mute, #4f545c);
}

:deep(.action-btn img) {
  width: 18px;
  height: 18px;
}

/* Masquer la barre de défilement pour Chrome, Safari et Opera */
.messages-section::-webkit-scrollbar {
  display: none;
}
</style>
