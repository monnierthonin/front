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
      currentUserId: getCurrentUserId() || '', 
      privateMessageTarget: null,
      replyingToMessage: null,
      currentPage: 1,
      messagesPerPage: 50,
      hasMoreMessages: true
    };
  },
  
  async created() {
    try {
      const userId = await getCurrentUserIdAsync();
      if (userId) {
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
        this.messagesData = [];
        this.isLoading = false;
        return;
      }

      this.isLoading = true;
      
      if (this.conversationId) {
        this.privateMessageTarget = {
          _id: this.conversationId,
          nom: this.getAuthorName(this.targetUser),
          type: 'conversation'
        };
        this.loadPrivateMessages();
      } else {
        await this.findOrCreateConversation();
      }
    },

    /**
     * Cherche une conversation existante ou en crée une nouvelle
     */
    async findOrCreateConversation() {
      try {
        
        
        const conversations = await messagePrivateService.getAllPrivateConversations();

        const targetConversation = conversations.find(conv => {
          if (!conv || !conv.participants) return false;
          return conv.participants.some(p => p._id === this.userId);
        });


        if (targetConversation && targetConversation._id) {
          this.privateMessageTarget = {
            _id: targetConversation._id,
            nom: this.getAuthorName(this.targetUser),
            type: 'conversation'
          };
          
          this.loadPrivateMessages(targetConversation._id);
          
          this.$emit('update:conversationId', targetConversation._id);
        } else {
          const newConversation = await messagePrivateService.sendPrivateMessage(
            this.userId,
            "Bonjour, je vous ai ajouté à mes contacts.",
            'user'
          );
          
          
          
          if (newConversation && newConversation.conversation) {
            const conversationId = newConversation.conversation._id || newConversation.conversation;
            
            this.privateMessageTarget = {
              _id: conversationId.toString(),
              nom: this.getAuthorName(this.targetUser),
              type: 'conversation'
            };
            
            this.loadPrivateMessages(conversationId.toString());
            
            this.$emit('update:conversationId', conversationId.toString());
          } else {
            this.isLoading = false;
          }
        }
        
      } catch (error) {
        this.privateMessageTarget = {
          _id: this.userId,
          nom: this.getAuthorName(this.targetUser),
          type: 'user'
        };
        this.$emit('update:conversationId', '');
      }
    },

    /**
     * Charge les messages privés de la conversation
     * @param {String} specificConversationId - ID de conversation spécifique (optionnel)
     */
    async loadPrivateMessages(specificConversationId = null) {
      try {
        this.isLoading = true;

        const conversationId = specificConversationId || this.conversationId;
        if (!conversationId) {
          this.messagesData = [];
          this.hasMoreMessages = false;
          return;
        }
        
        const messages = await messagePrivateService.getConversationMessages(
          conversationId,
          this.currentPage,
          this.messagesPerPage
        );
        
        
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
          this.messagesData = [];
          this.hasMoreMessages = false;
          this.isLoading = false;
          return;
        }

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

        if (this.currentPage === 1) {
          this.messagesData = normalizedMessages;
        } else {
          this.messagesData = [...normalizedMessages, ...this.messagesData];
        }

        this.hasMoreMessages = normalizedMessages.length >= this.messagesPerPage;
        
      } catch (error) {
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

        const response = await messagePrivateService.sendPrivateMessage(
          targetId,
          messageData.contenu,
          targetType
        );

        if (!response) {
          throw new Error('Aucune réponse reçue du serveur');
        }

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

        const newConversationId = sentMessage.conversation || sentMessage.conversationId;
        
        if (newConversationId && (!this.conversationId || this.conversationId !== newConversationId.toString())) {
          
          this.$emit('update:conversationId', newConversationId.toString());
          
          this.privateMessageTarget = {
            ...this.privateMessageTarget,
            _id: newConversationId.toString(),
            type: 'conversation'
          };
        }

        if (this.currentPage === 1) {
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
          this.currentPage = 1;
          this.loadPrivateMessages();
        }
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
        
        if (!messageData || !messageData.parentMessageId) {
          throw new Error('Impossible de répondre: ID du message parent manquant');
        }

        if (!messageData.contenu || messageData.contenu.trim() === '') {
          throw new Error('Le contenu de la réponse ne peut pas être vide');
        }

        const conversationId = this.conversationId || (this.privateMessageTarget ? this.privateMessageTarget._id : null);

        if (!conversationId) {
          throw new Error('ID de conversation manquant');
        }

        const response = await messagePrivateService.sendPrivateReply(
          conversationId, 
          messageData.parentMessageId,
          messageData.contenu
        );

        if (!response) {
          throw new Error('Aucune réponse reçue du serveur');
        }

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

        const newMessageId = newMessage._id || newMessage.id;
        if (!newMessageId) {
          throw new Error('Réponse invalide reçue du serveur');
        }
        const formattedMessage = {
          ...newMessage,
          _id: newMessageId.toString(),
          id: newMessageId.toString(),
          reponseA: messageData.parentMessageId.toString()
        };

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

        this.messagesData.push(formattedMessage);

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
      
      let messageId = null;
      
      if (typeof message === 'object') {
        if (message._id) {
          messageId = message._id;
        } else if (message.id) {
          messageId = message.id;
        } else if (message.messageId) {
          messageId = message.messageId;
        }
      } else if (typeof message === 'string') {
        messageId = message;
      }
      
      if (!messageId) {
        return;
      }
      
      this.replyingToMessage = messageId;
    },

    /**
     * Gère la modification d'un message
     * @param {Object} message - Message à modifier
     */
    async handleEditMessage(message) {
      try {
        if (message.auteur._id !== this.currentUserId) {
          this.$toast.error('Vous ne pouvez pas modifier ce message');
          return;
        }
        
        const newContent = prompt('Modifier le message:', message.contenu);
        
        if (!newContent || newContent.trim() === '') {
          return;
        }
        
        if (!this.conversationId) {
          throw new Error('ID de conversation manquant');
        }
        
        await messagePrivateService.updatePrivateMessage(
          this.conversationId,
          message._id,
          newContent.trim()
        );
        
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

        await messagePrivateService.deletePrivateMessage(
          this.conversationId,
          message._id
        );
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
          
          const targetParticipant = firstConversation.participants.find(
            p => p._id !== this.currentUserId
          );
          
          if (targetParticipant) {
            this.privateMessageTarget = {
              _id: firstConversation._id,
              nom: this.getAuthorName(targetParticipant),
              type: 'conversation'
            };
            
            this.$emit('update:conversationId', firstConversation._id);
            
            this.loadPrivateMessages(firstConversation._id);
          }
        } else {
          this.isLoading = false;
        }
      } catch (error) {
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
      if (index !== -1 && index < this.messagesData.length) {
        const updatedMessages = [...this.messagesData];
        updatedMessages[index] = message;
        this.messagesData = updatedMessages;
      }
    },
    
    /**
     * Gère l'ajout d'une réaction à un message
     * Méthode de compatibilité pour l'ancien système d'événements
     */
    handleReactionAdded({ messageId, emoji, updatedMessage }) {
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
  margin-bottom: 70px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.input-section {
  position: absolute;
  bottom: 0;
  width: 100%;
  background-color: var(--color-background, #313338);
  border-top: 1px solid var(--color-border, #2a2d31);
}

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
  background-color: var(--color-background-soft, --background-message-secondaire);
  border-radius: 8px;
  padding: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

:deep(.current-user .message-content) {
  background-color: var(--accent-color-light, --background-message);
  color: var(--text-color);
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
  min-width: 0;
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
