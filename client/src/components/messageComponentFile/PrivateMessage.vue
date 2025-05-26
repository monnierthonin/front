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

        // On va utiliser directement les données de l'API sans se préoccuper des participants
        let targetConversation = null;
        
        // Si les conversations sont dans un sous-objet data (comme dans la réponse API)
        const conversationsArray = Array.isArray(conversations.data) ? conversations.data : 
                                  Array.isArray(conversations) ? conversations : [];
        
        console.log(`Analyse de ${conversationsArray.length} conversations`);
        
        if (conversationsArray.length > 0) {
          // Afficher les IDs de conversation disponibles
          conversationsArray.forEach((conv, index) => {
            console.log(`Conversation ${index}: ID=${conv._id || conv.id}, participants=${JSON.stringify(conv.participants)}`);
          });
          
          // Rechercher une conversation avec l'utilisateur cible
          // La conversation peut contenir un array participants avec l'ID utilisateur
          targetConversation = conversationsArray.find(conv => {
            // Vérifier si l'un des participants est l'utilisateur cible
            if (!conv.participants || !Array.isArray(conv.participants)) {
              return false;
            }
            
            return conv.participants.some(participant => {
              // Le participant peut être un objet ou un ID
              const participantId = participant._id || participant.id || participant;
              return participantId === this.userId;
            });
          });
        }
        
        if (targetConversation) {
          console.log('Conversation trouvée:', targetConversation);
          // Utiliser l'ID de la conversation trouvée pour le contexte uniquement
          // Ne pas réassigner this.conversationId car c'est une prop
          const foundConversationId = targetConversation._id || targetConversation.id;
          console.log('ID de conversation trouvé:', foundConversationId);

          // Mettre à jour le contexte pour le textBox
          this.privateMessageTarget = {
            _id: foundConversationId,
            nom: this.getAuthorName(this.targetUser),
            type: 'conversation'
          };
          
          // Émettre un événement pour mettre à jour la prop conversationId dans le parent
          this.$emit('update:conversationId', foundConversationId);
          
          console.log('privateMessageTarget mis à jour:', this.privateMessageTarget);
          
          // Charger les messages avec l'ID de conversation trouvé
          this.loadPrivateMessages(foundConversationId);
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
        
        // Utiliser l'ID de conversation spécifique s'il est fourni, sinon utiliser la prop
        const conversationId = specificConversationId || this.conversationId;
        
        // Vérifier si nous avons un ID de conversation valide
        if (!conversationId) {
          console.log('Aucun ID de conversation valide pour charger les messages');
          this.messagesData = [];
          return;
        }
        
        console.log('Chargement des messages pour la conversation:', conversationId);
        console.log('Page courante:', this.currentPage);
        
        // Utiliser TOUJOURS l'endpoint des conversations pour charger les messages
        console.log('Utilisation de l\'endpoint /api/v1/conversations/{id}/messages');
        const messages = await messagePrivateService.getConversationMessages(
          conversationId,
          this.currentPage,
          this.messagesPerPage
        );
        
        console.log(`${messages.length} messages reçus:`, messages);
        
        if (messages && messages.length > 0) {
          // Si nous sommes à la première page, remplacer les messages
          // Sinon, ajouter les nouveaux messages au début
          if (this.currentPage === 1) {
            this.messagesData = messages;
          } else {
            // Ajouter au début pour respecter l'ordre chronologique (plus ancien en haut)
            this.messagesData = [...messages, ...this.messagesData];
          }
          
          // Mettre à jour le flag pour savoir s'il y a plus de messages à charger
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
      // Extraire le contenu du message à partir de l'objet reçu
      const messageText = messageData.contenu;
      if (!messageText || !messageText.trim()) return;
      
      try {
        let targetId = this.conversationId;
        let targetType = 'user';
        
        // Si on n'a pas encore de conversation, on envoie au userId
        if (!targetId) {
          targetId = this.userId;
          targetType = 'user';
        } else {
          // Si on a un ID de conversation, on l'utilise
          targetType = 'conversation';
        }

        console.log(`Envoi d'un message à ${targetType} ${targetId}:`, messageText);
        
        // Envoyer le message avec le bon type de cible
        const response = await messagePrivateService.sendPrivateMessage(targetId, messageText, targetType);
        
        // Si une nouvelle conversation a été créée, mettre à jour l'ID de conversation
        if (response.conversationId && !this.conversationId) {
          // Mettre à jour la prop conversationId dans le parent
          this.$emit('update:conversationId', response.conversationId);
          // Charger les messages avec le nouvel ID de conversation
          this.loadPrivateMessages(response.conversationId);
        } else {
          // Sinon, recharger les messages normalement
          this.loadPrivateMessages();
        }
        
        // Réinitialiser le mode réponse si actif
        this.replyingToMessage = null;
      } catch (error) {
        console.error('Erreur lors de l\'envoi du message privé:', error);
        alert('Erreur lors de l\'envoi du message. Veuillez réessayer.');
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
      if (!this.conversationId) {
        console.error('ID de conversation manquant');
        return;
      }

      // Récupérer le nouveau contenu du message (peut être implémenté avec un modal d'édition)
      const newContent = prompt('Modifier le message :', message.contenu);
      
      if (!newContent || newContent === message.contenu) {
        // Annulé ou pas de changement
        return;
      }

      console.log('Tentative de modification du message:', {
        conversationId: this.conversationId,
        messageId: message._id,
        nouveauContenu: newContent
      });

      // Vérifier si message a une propriété conversation qui contient l'ID de conversation
      const conversationId = message.conversation || this.conversationId;
      
      // Appeler le service pour modifier le message
      const updatedMessage = await messagePrivateService.updatePrivateMessage(
        conversationId,
        message._id,
        newContent
      );

      // Mettre à jour le message dans la liste des messages
      const index = this.messagesData.findIndex(m => m._id === message._id);
      if (index !== -1) {
        this.messagesData[index] = { ...this.messagesData[index], ...updatedMessage, modifie: true };
      }
      
      console.log('Message modifié avec succès', updatedMessage);
    } catch (error) {
      console.error('Erreur lors de la modification du message:', error);
      alert(`Erreur: ${error.message || 'Impossible de modifier le message'}`); 
    }
  },

    /**
     * Gère la suppression d'un message
     * @param {Object} message - Message à supprimer
     */
    async handleDeleteMessage(message) {
      try {
        if (!this.conversationId) {
          console.error('ID de conversation manquant');
          return;
        }

        // Confirmer avant de supprimer
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
          return;
        }

        console.log('Tentative de suppression du message:', {
          conversationId: this.conversationId,
          messageId: message._id,
          message: message
        });

        // Vérifier si message a une propriété conversation qui contient l'ID de conversation
        const conversationId = message.conversation || this.conversationId;

        // Appeler le service pour supprimer le message
        await messagePrivateService.deletePrivateMessage(
          conversationId,
          message._id
        );

        // Supprimer le message de la liste des messages
        const index = this.messagesData.findIndex(m => m._id === message._id);
        if (index !== -1) {
          this.messagesData.splice(index, 1);
        }
        
        console.log('Message supprimé avec succès');
      } catch (error) {
        console.error('Erreur lors de la suppression du message:', error);
        alert(`Erreur: ${error.message || 'Impossible de supprimer le message'}`);
      }
    },

    /**
     * Annule la réponse à un message
     */
    cancelReply() {
      this.replyingToMessage = null;
    },

    /**
     * Obtient le nom d'affichage d'un utilisateur
     * @param {Object} user - Utilisateur
     * @returns {String} - Nom d'affichage
     */
    getAuthorName(user) {
      if (!user) return 'Utilisateur';
      return user.username || user.nom || user.email || 'Utilisateur';
    }
  },
  mounted() {
    // Ajouter un écouteur d'événements pour détecter quand l'utilisateur atteint le haut de la section des messages
    const messagesSection = this.$refs.messagesSection;
    if (messagesSection) {
      messagesSection.addEventListener('scroll', () => {
        // Si l'utilisateur a défilé jusqu'en haut et qu'il y a plus de messages à charger
        if (messagesSection.scrollTop === 0 && this.hasMoreMessages && !this.isLoading) {
          this.loadMoreMessages();
        }
      });
    }
  },
  beforeDestroy() {
    // Supprimer l'écouteur d'événements pour éviter les fuites de mémoire
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
