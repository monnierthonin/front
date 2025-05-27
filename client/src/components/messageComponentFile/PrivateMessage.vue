<template>
  <div class="private-message-container">
    <!-- Section des messages -->
    <div class="messages-section" ref="messagesSection">
      <Message 
        :messages="messagesData" 
        :isLoading="isLoading"
        :currentUserId="currentUserId"
        @reply-to-message="handleReplyToMessage"
        @edit-message="handleEditMessage"
        @delete-message="handleDeleteMessage"
      />
    </div>
    
    <!-- Section de saisie de message -->
    <div class="input-section">
      <textBox 
        :canalActif="privateMessageTarget"
        :replyingToMessage="replyingToMessage"
        @envoyer-message="sendPrivateMessage"
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
import { getCurrentUserId } from '../../utils/userUtils';

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
          // Mettre à jour la prop conversationId dans le parent
          this.$emit('update:conversationId', targetConversation._id);
          
          console.log('privateMessageTarget mis à jour:', this.privateMessageTarget);
          
          // Charger les messages avec l'ID de conversation trouvé
          this.loadPrivateMessages(targetConversation._id);
        } else {
          console.log('Aucune conversation existante trouvée avec cet utilisateur. Utilisation de l\'ID utilisateur comme cible.');
          this.privateMessageTarget = {
            _id: this.userId,
            nom: this.getAuthorName(this.targetUser),
            type: 'user'
          };
          
          // Réinitialiser la prop conversationId dans le parent
          this.$emit('update:conversationId', '');
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
        
        // Appeler le service pour récupérer les messages
        const response = await messagePrivateService.getConversationMessages(
          conversationId,
          this.currentPage,
          this.messagesPerPage
        );
        
        console.log('Réponse reçue:', response);
        
        // Extraire les messages de la réponse selon la nouvelle structure
        let messages = response?.data?.messages || response?.messages || response;
        
        // Si des messages sont retournés et c'est un tableau
        if (messages && Array.isArray(messages) && messages.length > 0) {
          // S'assurer que chaque message a son ID en string
          messages = messages.map(msg => ({
            ...msg,
            _id: msg._id?.toString() || msg.id?.toString(),
            expediteur: {
              ...msg.expediteur,
              _id: msg.expediteur?._id?.toString() || msg.expediteur?.id?.toString()
            }
          }));
          
          console.log('Messages formatés:', messages);
          
          // Si c'est la première page, remplacer les messages
          if (this.currentPage === 1) {
            this.messagesData = messages;
          } else {
            // Sinon, ajouter les nouveaux messages au début
            this.messagesData = [...messages, ...this.messagesData];
          }
          
          // Vérifier s'il y a plus de messages à charger
          this.hasMoreMessages = messages.length >= this.messagesPerPage;
        } else {
          // Si aucun message n'est retourné et que nous sommes à la première page
          if (this.currentPage === 1) {
            this.messagesData = [];
          }
          this.hasMoreMessages = false;
        }
      } catch (error) {
        console.error('Erreur lors du chargement des messages privés:', error);
        this.messagesData = [];
        this.hasMoreMessages = false;
      } finally {
        this.isLoading = false;
        console.log('==================== FIN CHARGEMENT MESSAGES ====================');
      }
    },

    /**
     * Envoie un message privé
     * @param {Object} messageData - Données du message (contient la propriété contenu)
     */
    async sendPrivateMessage(messageData) {
      try {
        let targetId = this.conversationId;
        if (!targetId) {
          targetId = this.userId;
        }
        
        console.log('Envoi du message:', { targetId, type: this.conversationId ? 'conversation' : 'user', contenu: messageData.contenu });
        
        // Envoyer le message via le service
        const response = await messagePrivateService.sendPrivateMessage(
          targetId,
          messageData.contenu,
          this.conversationId ? 'conversation' : 'user'
        );
        
        console.log('Réponse du serveur:', response);
        
        // Extraire le message de la réponse en tenant compte des différentes structures possibles
        let newMessage;
        if (response && response.data && response.data.message) {
          newMessage = response.data.message;
        } else if (response && response.message) {
          newMessage = response.message;
        } else if (response && response.data) {
          newMessage = response.data;
        } else {
          newMessage = response;
        }
        
        console.log('Message extrait:', newMessage);
        
        // Vérifier que le message a un ID (sous n'importe quelle forme)
        const messageId = newMessage._id || newMessage.id;
        if (!messageId) {
          console.error('Message reçu sans ID:', newMessage);
          throw new Error('Message invalide reçu du serveur');
        }
        
        // Normaliser la structure du message pour garantir la compatibilité
        const formattedMessage = {
          ...newMessage,
          _id: messageId.toString(), // Assurer la présence de _id
          id: messageId.toString()   // Assurer la présence de id également
        };
        
        // Normaliser la structure de l'expéditeur
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
        
        // Mettre à jour l'ID de conversation si nécessaire
        const conversationId = newMessage.conversation || newMessage.conversationId;
        if (conversationId && !this.conversationId) {
          const convId = conversationId.toString();
          console.log('Mise à jour de l\'ID de conversation:', convId);
          this.$emit('update:conversationId', convId);
        }
        
        // Réinitialiser le champ de message si nécessaire
        if (this.messageContent) {
          this.messageContent = '';
        }
        
        // Afficher une notification de succès
        this.$toast.success('Message envoyé avec succès');
      } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        this.$toast.error(error.message || 'Erreur lors de l\'envoi du message');
      }
    },

    /**
     * Répond à un message
     * @param {Object} message - Message auquel répondre
     */
    async replyToMessage(message) {
      try {
        if (!this.conversationId) {
          throw new Error('ID de conversation manquant');
        }

        // Récupérer l'ID du message en tenant compte des différentes structures possibles
        const messageId = message._id || message.id;
        if (!messageId) {
          console.error('Message sans ID pour la réponse:', message);
          throw new Error('Message invalide pour la réponse');
        }

        const replyContent = this.replyingToMessage.content;

        if (!replyContent || replyContent.trim() === '') {
          throw new Error('Le contenu de la réponse ne peut pas être vide');
        }

        console.log('Réponse au message:', { 
          conversationId: this.conversationId, 
          messageId, 
          content: replyContent 
        });

        // Envoyer la réponse via le service
        const response = await messagePrivateService.sendPrivateReply(
          this.conversationId, 
          messageId,
          replyContent
        );

        console.log('Réponse du serveur:', response);

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

        console.log('Message extrait:', newMessage);

        // Vérifier que le message a un ID (sous n'importe quelle forme)
        const newMessageId = newMessage._id || newMessage.id;
        if (!newMessageId) {
          console.error('Réponse reçue sans ID:', newMessage);
          throw new Error('Réponse invalide reçue du serveur');
        }

        // Normaliser la structure du message pour garantir la compatibilité
        const formattedMessage = {
          ...newMessage,
          _id: newMessageId.toString(),   // Assurer la présence de _id
          id: newMessageId.toString()     // Assurer la présence de id également
        };

        // Normaliser la structure de l'expéditeur
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

        // S'assurer que la référence au message parent est correctement formatée
        if (formattedMessage.reponseA) {
          formattedMessage.reponseA = messageId.toString();
        }

        // Ajouter le nouveau message à la liste
        this.messagesData.push(formattedMessage);

        // Réinitialiser l'état de réponse
        this.replyingToMessage = null;

        // Afficher une notification de succès
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
      this.replyingToMessage = message;
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

        // Demander le nouveau contenu
        const nouveauContenu = prompt('Modifier le message:', message.contenu);
        if (!nouveauContenu || nouveauContenu === message.contenu) {
          return; // Annulation ou pas de changement
        }

        // Appeler le service pour modifier le message
        await this.editMessage(message._id, nouveauContenu);
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

        console.log('Tentative de suppression du message:', { messageId: message._id, conversationId: this.conversationId });

        // Appeler le service pour supprimer le message
        await messagePrivateService.deletePrivateMessage(this.conversationId, message._id);

        // Retirer le message de la liste
        const index = this.messagesData.findIndex(m => m._id === message._id);
        if (index !== -1) {
          this.messagesData.splice(index, 1);
        }

        this.$toast.success('Message supprimé avec succès');
      } catch (error) {
        console.error('Erreur lors de la suppression du message:', error);
        this.$toast.error(error.message || 'Erreur lors de la suppression du message');
      }
    },

    /**
     * Annule la réponse à un message
     */
    cancelReply() {
      this.replyingToMessage = null;
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
