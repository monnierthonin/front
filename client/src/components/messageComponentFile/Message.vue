<template>
  <div class="messages-list" ref="messagesList">
    <div v-if="isLoading" class="messages-loading">Chargement des messages...</div>
    <div v-else-if="messages.length === 0" class="messages-empty">Aucun message dans ce canal</div>
    
    <!-- Modal d'édition de message -->
    <div v-if="showEditModal" class="edit-modal-overlay">
      <div class="edit-modal">
        <div class="edit-modal-header">
          Modifier le message
          <button class="close-button" @click="closeEditModal">×</button>
        </div>
        <div class="edit-modal-body">
          <textarea 
            v-model="editContent" 
            class="edit-textarea" 
            @keydown.esc="closeEditModal"
            @keydown.ctrl.enter="saveMessageEdit"
          ></textarea>
        </div>
        <div class="edit-modal-footer">
          <button class="cancel-button" @click="closeEditModal">Annuler</button>
          <button class="save-button" @click="saveMessageEdit">Enregistrer</button>
        </div>
      </div>
    </div>
    
    <template v-else>
      <div 
        v-for="message in messages" 
        :key="getMessageId(message)"
        :class="['message-container', { 'current-user': isCurrentUser(getAuthorId(message)) }]"
        :data-message-id="getMessageId(message)">
        <div class="message-content">
          <!-- Profile picture -->
          <div class="profile-pic">
            <ProfilePicture 
              :profilePicture="getAuthorProfilePicture(message)" 
              :altText="getAuthorName(message)" 
            />
          </div>
          
          <!-- Message body -->
          <div class="message-body">
            <!-- Référence à un message parent (si c'est une réponse) -->
            <div v-if="message.reponseA" class="message-reply-reference" @click="scrollToParentMessage(message.reponseA)">
              <span class="reply-to-icon">↩</span>
              <span class="reply-to-text">Réponse à </span>
              <span class="reply-to-author">{{ getParentMessageAuthorName(message) }}:</span>
              <span class="reply-to-content">{{ getParentMessagePreview(message) }}</span>
            </div>
            
            <!-- Username and timestamp -->
            <div class="message-header">
              <span class="username">{{ getAuthorName(message) }}</span>
              <span class="timestamp">{{ formatDate(message.horodatage || message.createdAt) }}</span>
            </div>
            
            <!-- Message text --><!-- ___________________________________________ecpace devant modifier-->
            <div class="message-text">
              <p>{{ message.contenu }}</p>
              <span v-if="message.modifie" class="message-modified-indicator">  (modifié)</span>
            </div>
            
            <!-- Réactions aux messages -->
            <div v-if="getMessageReactions(message)" class="message-reactions">
              <div 
                v-for="(reaction, index) in getMessageReactions(message)" 
                :key="index" 
                class="reaction-badge"
                :class="{ 'user-reacted': hasUserReacted(reaction, currentUserId) }"
                @click="handleReaction(message, reaction.emoji)"
              >
                <span class="reaction-emoji">{{ reaction.emoji }}</span>
                <span class="reaction-count">{{ reaction.utilisateurs ? reaction.utilisateurs.length : 0 }}</span>
              </div>
            </div>
            
            <!-- Affichage des fichiers joints -->
            <div v-if="message.fichiers && message.fichiers.length > 0" class="message-files">
              <div v-for="(fichier, index) in message.fichiers" :key="index" class="file-attachment">
                <!-- Afficher différemment selon le type de fichier -->
                <div v-if="isImage(fichier.type)" class="file-image-container">
                  <img 
                    :src="getFileUrl(fichier.url)" 
                    :alt="fichier.nom" 
                    class="file-image"
                    @click="openFileInNewTab(fichier.url)"
                  />
                </div>
                
                <!-- Pour les autres types de fichiers -->
                <div v-else class="file-other-container" @click="openFileInNewTab(fichier.url)">
                  <div class="file-icon">
                    <img 
                      :src="getFileTypeIcon(fichier.type)" 
                      :alt="getFileTypeLabel(fichier.type)" 
                      class="file-type-icon"
                    />
                  </div>
                  <div class="file-info">
                    <div class="file-name">{{ fichier.nom }}</div>
                    <div class="file-size">{{ formatFileSize(fichier.taille) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
    
          <!-- Action buttons -->
          <div class="message-actions">
            <MessageReplyButton
              :message="message"
              :is-private="isPrivate"
              :conversation-id="conversationId"
              @reply-started="handleReplyStarted"
              @reply-sent="handleReplySent"
            />
            <MessageReactionButton
              :message="message"
              :is-private="isPrivate"
              :conversation-id="conversationId"
              :workspace-id="$route.params.id"
              @reaction-added="handleReactionAdded"
            />
            <MessageEditButton
              v-if="isCurrentUser(getAuthorId(message))"
              :message="message"
              :is-private="isPrivate"
              :conversation-id="conversationId"
              @edit-started="handleEditStarted"
              @message-updated="handleMessageUpdated"
            />
            <MessageDeleteButton
              v-if="isCurrentUser(getAuthorId(message))"
              :message="message"
              :is-private="isPrivate"
              :conversation-id="conversationId"
              @message-deleted="handleMessageDeleted"
            />
          </div>
          
          <!-- Le selecteur d'emoji est maintenant géré dans le composant MessageReactionButton -->

        </div>
      </div>
    </template>
  </div>
</template>

<script>
import fichierService from '../../services/fichierService.js';
import ProfilePicture from '../common/ProfilePicture.vue';
import { getCurrentUserId, isCurrentUser, getCurrentUserIdAsync, isCurrentUserAsync } from '../../utils/userUtils';
import messageService from '../../services/messageService';
import messagePrivateService from '../../services/messagePrivateService';
import MessageReplyButton from './buttons/MessageReplyButton.vue';
import MessageEditButton from './buttons/MessageEditButton.vue';
import MessageDeleteButton from './buttons/MessageDeleteButton.vue';
import MessageReactionButton from './buttons/MessageReactionButton.vue';

export default {
  components: {
    ProfilePicture,
    MessageReplyButton,
    MessageEditButton,
    MessageDeleteButton,
    MessageReactionButton
  },
  name: 'Message',
  props: {
    messages: {
      type: Array,
      default: () => []
    },
    isLoading: {
      type: Boolean,
      default: false
    },
    currentUserId: {
      type: String,
      default: ''
    },
    isPrivate: {
      type: Boolean,
      default: false
    },
    conversationId: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      loading: false,
      showEditModal: false,
      editContent: '',
      editingMessageId: null,
      userId: '',
      localCurrentUserId: this.currentUserId || getCurrentUserId() || '',
      localMessages: [],
      userAuthenticated: false
    };
  },
  async created() {
    if (!this.currentUserId) {
      try {
        const userId = await getCurrentUserIdAsync();
        if (userId) {
          this.userId = userId;
        } else {
          this.userId = '';
        }
      } catch (error) {
        console.error('Message.vue: Erreur lors de la récupération de l\'ID utilisateur:', error);
        this.userId = '';
      }
    } else {
      this.userId = this.currentUserId;
    }
  },
  updated() {
    this.scrollToBottom();
  },
  methods: {
    /**
     * Vérifie si l'utilisateur donné est l'utilisateur actuellement connecté
     * @param {String} userId - ID de l'utilisateur à vérifier
     * @returns {Boolean} True si c'est l'utilisateur actuel, false sinon
     */
    isCurrentUser(userId) {
      return userId === this.userId || userId === this.localCurrentUserId;
    },
    
    /**
     * Obtenir l'ID de l'auteur du message (compatible avec les deux structures)
     * @param {Object} message - Le message
     * @returns {String} ID de l'auteur
     */
    getAuthorId(message) {
      if (this.isPrivateMessage) {
        return message.auteur._id || message.auteur;
      }
      if (message.expediteur && message.expediteur._id) {
        return message.expediteur._id;
      } else if (message.auteur && message.auteur._id) {
        return message.auteur._id;
      } else if (message.utilisateur && message.utilisateur._id) {
        return message.utilisateur._id;
      }
      return null;
    },
    
    /**
     * Obtenir le nom de l'auteur du message (compatible avec les deux structures)
     * @param {Object} message - Le message
     * @returns {String} Nom de l'auteur
     */
    getAuthorName(message) {
      if (message.expediteur) {
        const author = message.expediteur;
        return author.username || author.nom || author.prenom || 'Utilisateur';
      } else if (message.auteur) {
        const author = message.auteur;
        return author.username || author.nom || author.prenom || 'Utilisateur';
      }
      return 'Utilisateur';
    },
    
    /**
     * Obtenir le nom de l'auteur d'un message parent
     * @param {Object} message - Message qui répond à un autre
     * @returns {String} Nom de l'auteur du message parent
     */
    getParentMessageAuthorName(message) {
      if (!message || !message.reponseA) return 'Utilisateur';
      
      if (message.reponseA.expediteur) {
        const author = message.reponseA.expediteur;
        return author.username || author.nom || author.prenom || 'Utilisateur';
      } else if (message.reponseA.auteur) {
        const author = message.reponseA.auteur;
        return author.username || author.nom || author.prenom || 'Utilisateur';
      }
      
      return 'Utilisateur';
    },
    
    /**
     * Obtenir un aperçu du contenu d'un message parent
     * @param {Object} message - Message qui répond à un autre
     * @returns {String} Aperçu du contenu du message parent
     */
    getParentMessagePreview(message) {
      if (!message || !message.reponseA) return '';
      
      if (message.reponseA.contenu) {
        const maxLength = 50;
        const content = message.reponseA.contenu;
        return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
      }
      
      return 'Message';
    },
    
    /**
     * Obtenir l'image de profil de l'auteur (compatible avec les deux structures)
     * @param {Object} message - Le message
     * @returns {String} URL de l'image de profil
     */
    getAuthorProfilePicture(message) {
      if (this.isPrivateMessage) {
        return message.auteur.profilePicture || null;
      }
      if (message.expediteur && message.expediteur.profilePicture) {
        return message.expediteur.profilePicture;
      } else if (message.auteur && message.auteur.profilePicture) {
        return message.auteur.profilePicture;
      }
      return null;
    },
    
    /**
     * Vérifier si le message provient de l'utilisateur connecté
     * @param {String} authorId - ID de l'auteur du message
     * @returns {Boolean} true si c'est l'utilisateur actuel
     */
    isCurrentUser(authorId) {
      const currentUserId = this.currentUserId || this.localCurrentUserId || getCurrentUserId();
      return authorId === currentUserId;
    },
    
    /**
     * Vérifier si le fichier est une image
     * @param {String} mimeType - Type MIME du fichier
     * @returns {Boolean} true si c'est une image
     */
    isImage(mimeType) {
      return mimeType && mimeType.startsWith('image/');
    },
    
    /**
     * Obtenir l'URL complète d'un fichier
     * @param {String} url - URL relative du fichier
     * @returns {String} URL complète du fichier
     */
    getFileUrl(url) {
      return fichierService.getFullFileUrl(url);
    },
    
    /**
     * Ouvrir le fichier dans un nouvel onglet
     * @param {String} url - URL du fichier
     */
    openFileInNewTab(url) {
      const fullUrl = this.getFileUrl(url);
      window.open(fullUrl, '_blank');
    },
    
    /**
     * Obtenir l'icône correspondant au type de fichier
     * @param {String} mimeType - Type MIME du fichier
     * @returns {String} URL de l'icône
     */
    getFileTypeIcon(mimeType) {
      const importFileIcon = new URL('../../assets/styles/image/importFile.png', import.meta.url).href;
      const reactIcon = new URL('../../assets/styles/image/react.png', import.meta.url).href;
      
      if (!mimeType) return importFileIcon;
      
      if (mimeType.startsWith('image/')) {
        return reactIcon;
      } else if (mimeType === 'application/pdf' || mimeType.includes('word') || 
                mimeType.includes('excel') || mimeType.includes('spreadsheet') || 
                mimeType.includes('powerpoint') || mimeType.includes('presentation')) {
        return importFileIcon;
      } else if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('compressed')) {
        return importFileIcon;
      } else if (mimeType.includes('text/')) {
        return importFileIcon;
      }
      
      return importFileIcon;
    },
    
    /**
     * Obtenir un libellé pour le type de fichier
     * @param {String} mimeType - Type MIME du fichier
     * @returns {String} Libellé du type
     */
    getFileTypeLabel(mimeType) {
      if (!mimeType) return 'Fichier';
      
      if (mimeType.startsWith('image/')) {
        return 'Image';
      } else if (mimeType === 'application/pdf') {
        return 'PDF';
      } else if (mimeType.includes('word')) {
        return 'Document Word';
      } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
        return 'Feuille de calcul';
      } else if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) {
        return 'Présentation';
      } else if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('compressed')) {
        return 'Archive';
      } else if (mimeType.includes('text/')) {
        return 'Texte';
      }
      
      return 'Fichier';
    },
    
    /**
     * Formater la taille du fichier en unités lisibles
     * @param {Number} bytes - Taille en octets
     * @returns {String} Taille formatée (Ko, Mo, etc.)
     */
    formatFileSize(bytes) {
      if (!bytes || bytes === 0) return '0 octet';
      
      const k = 1024;
      const sizes = ['octets', 'Ko', 'Mo', 'Go', 'To'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    /**
     * Formatter la date du message
     * @param {String} date - Date à formatter
     * @returns {String} - Date formattée
     */
    formatDate(date) {
      if (!date) return '';
      return new Date(date).toLocaleString();
    },
    
    /**
     * Obtenir le nom d'affichage d'un utilisateur
     * @param {Object} user - Données de l'utilisateur
     * @returns {String} Nom d'affichage
     */
    getUserName(user) {
      if (!user) return '';
      return user.username || user.firstName || user.email || 'Utilisateur';
    },
    
    /**
     * Obtenir le nom de l'auteur d'un message référencé (réponse)
     * @param {Object|String} messageRef - Référence au message parent ou ID
     * @returns {String} - Nom de l'auteur du message parent
     */
    getMessageAuthorName(messageRef) {
      if (!messageRef) return 'Message supprimé';
      
      if (typeof messageRef === 'object' && messageRef.auteur) {
        return this.getUserName(messageRef.auteur);
      }
      
      if (typeof messageRef === 'object' && messageRef._id) {
        return 'Utilisateur';
      }
      
      if (typeof messageRef === 'string') {
        return 'Utilisateur';
      }
      
      return 'Message inconnu';
    },
    
    /**
     * Obtenir un aperçu du contenu d'un message référencé
     * @param {Object|String} messageRef - Référence au message parent
     * @returns {String} - Aperçu du contenu du message
     */
    getMessagePreview(messageRef) {
      if (!messageRef) return 'Message supprimé';
      
      if (typeof messageRef === 'object' && messageRef.contenu) {
        const maxLength = 40;
        if (messageRef.contenu.length > maxLength) {
          return messageRef.contenu.substring(0, maxLength) + '...';
        }
        return messageRef.contenu;
      }
      
      return 'Contenu indisponible';
    },
    
    /**
     * Faire défiler jusqu'au message parent lorsqu'on clique sur la référence
     * @param {Object|String} messageRef - Référence au message parent
     */
    scrollToParentMessage(messageRef) {
      if (!messageRef || typeof messageRef !== 'object' || !messageRef._id) {
        return;
      }
      
      const parentMessageElement = document.querySelector(`[data-message-id="${messageRef._id}"]`);
      
      if (parentMessageElement) {
        parentMessageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        parentMessageElement.classList.add('highlight-message');
        setTimeout(() => {
          parentMessageElement.classList.remove('highlight-message');
        }, 2000);
      }
    },
    
    /**
     * Faire défiler vers le bas pour voir les derniers messages
     */
    scrollToBottom() {
      this.$nextTick(() => {
        if (this.$refs.messagesList) {
          this.$refs.messagesList.scrollTop = this.$refs.messagesList.scrollHeight;
        }
      });
    },
    
    /**
     * Gérer le début d'une réponse à un message (déclenché par le bouton de réponse)
     * @param {Object} message - Message normalisé auquel répondre
     */
    handleReplyStarted(message) {
      const messageId = message._id || message.id;
      if (!messageId) {
        console.error('handleReplyStarted: Message sans ID valide', message);
        return;
      }
      
      this.$emit('reply-to-message', message);
    },
    
    /**
     * Gérer la réponse à un message (méthode de compatibilité)
     * @param {Object} message - Message auquel répondre
     */
    handleReply(message) {
      this.handleReplyStarted(message);
    },
    
    /**
     * Gérer l'ajout d'emoji à un message
     * @param {Object} message - Message sur lequel ajouter un emoji
     */
    handleEmoji(message) {
      this.toggleEmojiPicker(message);
    },
    
    /**
     * Gérer la modification d'un message
     * @param {Object} message - Message à modifier
     */
    handleEdit(message) {
      this.editingMessage = { ...message };
      this.editContent = message.contenu;
      this.showEditModal = true;
    },
    
    /**
     * Gérer la suppression d'un message
     * @param {Object} message - Message à supprimer
     */
    handleDelete(message) {
      if (confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
        this.deleteMessage(message);
      }
    },
    
    /**
     * Envoyer la requête de suppression du message
     * @param {Object} message - Message à supprimer
     */
    async deleteMessage(message) {
      try {
        const workspaceId = this.$route.params.id;
        const canalId = message.canal;
        
        await messageService.deleteMessage(workspaceId, canalId, message._id);
        
        const index = this.messages.findIndex(m => m._id === message._id);
        if (index !== -1) {
          this.messages.splice(index, 1);
        }
      } catch (error) {
        console.error('Erreur lors de la suppression du message:', error);
        alert(`Erreur: ${error.message}`);
      }
    },
    
    /**
     * Vérifie si l'utilisateur a déjà réagi avec cet emoji
     * @param {Object} reaction - L'objet réaction 
     * @param {String} userId - ID de l'utilisateur connecté
     * @returns {Boolean} true si l'utilisateur a déjà réagi
     */
    hasUserReacted(reaction, userId) {
      if (!reaction.utilisateurs || !Array.isArray(reaction.utilisateurs) || !userId) {
        return false;
      }
      return reaction.utilisateurs.some(id => {
        if (!id) return false;
        return id.toString() === userId.toString() || id === userId;
      });
    },
    
    async testEmojiReaction(message, emoji) {
      try {
        let result;
        
        if (this.isPrivate) {
          result = await messagePrivateService.reactToPrivateMessage(
            this.conversationId,
            message._id,
            emoji
          );
        } else {
          result = await messageService.reactToMessage(
            this.$route.params.id,
            message.canal,
            message._id,
            emoji
          );
        }
        
        if (result && result.reactions) {
          const index = this.messages.findIndex(m => m._id === message._id);
          if (index !== -1) {
            const updatedMessages = [...this.messages];
            updatedMessages[index] = { ...this.messages[index], reactions: result.reactions };
            this.messages = updatedMessages;
          }
        }
        
        this.$emit('reaction-added', { messageId: message._id, emoji });
      } catch (error) {
        console.error('Erreur lors de l\'ajout de la réaction:', error);
        
        if (error.message && error.message.includes('déjà réagi')) {
        } else {
          alert(`Erreur: ${error.message}`);
        }
      }
    },
    
    /**
     * Enregistrer les modifications d'un message
     */
    async saveMessageEdit() {
      if (!this.editingMessage || !this.editContent.trim()) {
        return;
      }
      
      try {
        let updatedMessage;
        
        if (this.isPrivate) {
          if (!this.conversationId) {
            throw new Error('ID de conversation manquant pour la modification du message privé');
          }
          
          updatedMessage = await messagePrivateService.updatePrivateMessage(
            this.conversationId,
            this.editingMessage._id || this.editingMessage.id,
            this.editContent.trim()
          );
        } else {
          const workspaceId = this.$route.params.id;
          const canalId = this.editingMessage.canal; 
          
          updatedMessage = await messageService.updateMessage(
            workspaceId,
            canalId,
            this.editingMessage._id,
            this.editContent.trim()
          );
        }
        
        const index = this.messages.findIndex(m => m._id === this.editingMessage._id);
        if (index !== -1) {
          this.messages[index] = { ...this.messages[index], ...updatedMessage, modifie: true };
        }
        
        this.closeEditModal();
      } catch (error) {
        console.error('Erreur lors de la modification du message:', error);
        alert(`Erreur: ${error.message}`);
      }
    },
    
    /**
     * Fermer le modal d'édition
     */
    closeEditModal() {
      this.showEditModal = false;
      this.editingMessage = null;
      this.editContent = '';
    },
    
    /**
     * Obtenir l'ID du message quelle que soit sa structure
     * @param {Object} message - Le message
     * @returns {String} ID du message
     */
    getMessageId(message) {
      return message._id || message.id || '';
    },
    
    /**
     * Obtenir l'ID de l'auteur du message quelle que soit sa structure
     * @param {Object} message - Le message
     * @returns {String} ID de l'auteur
     */
    getAuthorId(message) {
      if (message.expediteur && message.expediteur._id) {
        return message.expediteur._id;
      } else if (message.auteur && message.auteur._id) {
        return message.auteur._id;
      } else if (typeof message.auteur === 'string') {
        return message.auteur;
      } else if (typeof message.expediteur === 'string') {
        return message.expediteur;
      }
      return '';
    },
    
    /**
     * Obtenir le nom de l'auteur du message quelle que soit sa structure
     * @param {Object} message - Le message
     * @returns {String} Nom de l'auteur
     */
    getAuthorName(message) {
      if (message.expediteur) {
        const author = message.expediteur;
        return author.username || author.nom || author.prenom || 'Utilisateur';
      } else if (message.auteur) {
        const author = message.auteur;
        return author.username || author.nom || author.prenom || 'Utilisateur';
      }
      return 'Utilisateur inconnu';
    },
    
    /**
     * Obtenir la photo de profil de l'auteur du message quelle que soit sa structure
     * @param {Object} message - Le message
     * @returns {String} URL de la photo de profil
     */
    getAuthorProfilePicture(message) {
      if (message.expediteur) {
        return message.expediteur.profilePicture || message.expediteur.photoProfil || null;
      } else if (message.auteur) {
        return message.auteur.profilePicture || message.auteur.photoProfil || null;
      }
      return null;
    },

    formatDate(date) {
      if (!date) return '';
      return new Date(date).toLocaleString();
    },

    handleReplyStarted(message) {
      if (!message || !message._id) {
        console.error('Message invalide pour la réponse:', message);
        return;
      }
      this.replyingTo = message;
      this.$emit('reply-to-message', {
        messageId: message._id,
        channelId: message.canal,
        content: ''
      });
    },

    handleReplySent(response) {
      this.replyingTo = null;
      if (response) {
        this.$emit('message-added', response);
      }
    },

    handleEditStarted(message) {
      this.editingMessage = message;
      this.editContent = message.contenu;
      this.showEditModal = true;
    },

    handleMessageUpdated({ messageId, newContent }) {
      const index = this.messages.findIndex(m => m._id === messageId);
      if (index !== -1) {
        this.messages[index].contenu = newContent;
        this.messages[index].modifie = true;
      }
      this.closeEditModal();
    },

    handleMessageDeleted(messageId) {
      const index = this.messages.findIndex(m => m._id === messageId);
      if (index !== -1) {
        this.messages.splice(index, 1);
      }
    },

    /**
     * Récupère les réactions d'un message quelle que soit sa structure
     * @param {Object} message - Le message
     * @returns {Array} Liste des réactions ou null si pas de réactions
     */
    getMessageReactions(message) {
      
      if (!message.reactions) {
        return null;
      }
      
      if (Array.isArray(message.reactions) && message.reactions.length > 0) {
        return message.reactions;
      }
      
      if (typeof message.reactions === 'object') {
        const reactionsArray = [];
        for (const emoji in message.reactions) {
          if (Object.prototype.hasOwnProperty.call(message.reactions, emoji)) {
            const reaction = message.reactions[emoji];
            
            reactionsArray.push({
              emoji: emoji,
              utilisateurs: Array.isArray(reaction) ? reaction : 
                           (reaction.utilisateurs && Array.isArray(reaction.utilisateurs)) ? reaction.utilisateurs : 
                           []
            });
          }
        }
        return reactionsArray.length > 0 ? reactionsArray : null;
      }
      
      return null;
    },

    /**
     * Gère le clic sur une réaction existante
     * @param {Object} message - Le message contenant la réaction
     * @param {String} emoji - L'emoji sur lequel on a cliqué
     */
    async handleReaction(message, emoji) {
      try {
        let result;
        
        if (this.isPrivate) {
          result = await messagePrivateService.reactToPrivateMessage(
            this.conversationId,
            message._id,
            emoji
          );
        } else {
          result = await messageService.reactToMessage(
            this.$route.params.id,
            message.canal,
            message._id,
            emoji
          );
        }
        
        this.handleReactionAdded({
          messageId: message._id,
          emoji,
          result
        });
        
      } catch (error) {
        console.error('Erreur lors du clic sur une réaction:', error);
        if (error.message && error.message.includes('déjà réagi')) {
        }
      }
    },
    
    /**
     * Gère l'ajout d'une réaction à un message
     * @param {Object} params - Paramètres de la réaction
     * @param {String} params.messageId - ID du message
     * @param {String} params.emoji - Emoji utilisé
     * @param {Object} params.result - Résultat de l'API contenant les réactions mises à jour
     */
    async handleReactionAdded({ messageId, emoji, result }) {
      try {
        let updatedMessage = null;
        let index = -1;
        
        index = this.messages.findIndex(m => this.getMessageId(m) === messageId);
        
        if (index === -1) {
          console.warn(`Message avec ID ${messageId} non trouvé dans le tableau`);
          return;
        }
        
        const originalMessage = this.messages[index];
        
        updatedMessage = JSON.parse(JSON.stringify(originalMessage));
        
        if (result && result.reactions) {
          updatedMessage.reactions = result.reactions;
        } else {
          const currentUserId = this.currentUserId || this.getAuthorId();
          
          if (!currentUserId) {
            console.warn('ID utilisateur non disponible pour la mise à jour manuelle des réactions');
            return;
          }
          
          if (this.isPrivate) {
            if (!updatedMessage.reactions) updatedMessage.reactions = {};
            
            if (Array.isArray(updatedMessage.reactions)) {
              const reactionsObj = {};
              updatedMessage.reactions.forEach(r => {
                if (r.emoji) {
                  reactionsObj[r.emoji] = { 
                    utilisateurs: Array.isArray(r.utilisateurs) ? r.utilisateurs : []
                  };
                }
              });
              updatedMessage.reactions = reactionsObj;
            }
            
            if (!updatedMessage.reactions[emoji]) {
              updatedMessage.reactions[emoji] = { utilisateurs: [] };
            }
        
        if (!Array.isArray(updatedMessage.reactions[emoji].utilisateurs)) {
          updatedMessage.reactions[emoji].utilisateurs = [];
        }
        
        const users = updatedMessage.reactions[emoji].utilisateurs;
        if (!users.includes(currentUserId)) {
          updatedMessage.reactions[emoji].utilisateurs = [...users, currentUserId];
        }
      } else {
        if (!updatedMessage.reactions) updatedMessage.reactions = [];
        
        if (!Array.isArray(updatedMessage.reactions)) {
          const reactionsArray = [];
          for (const key in updatedMessage.reactions) {
            if (Object.prototype.hasOwnProperty.call(updatedMessage.reactions, key)) {
              const users = updatedMessage.reactions[key].utilisateurs || [];
              reactionsArray.push({
                emoji: key,
                utilisateurs: users
              });
            }
          }
          updatedMessage.reactions = reactionsArray;
        }
        
        const existingReaction = updatedMessage.reactions.find(r => r.emoji === emoji);
        
        if (existingReaction) {
          if (!Array.isArray(existingReaction.utilisateurs)) {
            existingReaction.utilisateurs = [];
          }
          
          if (!existingReaction.utilisateurs.includes(currentUserId)) {
            existingReaction.utilisateurs = [...existingReaction.utilisateurs, currentUserId];
          }
        } else {
          
          updatedMessage.reactions.push({
            emoji,
            utilisateurs: [currentUserId]
          });
        }
      }
    }
    
    this.$emit('update-message', { index, message: updatedMessage });
    
    this.$emit('reaction-added', { messageId, emoji, updatedMessage });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des réactions:', error);
  }
},

closeEditModal() {
  this.showEditModal = false;
  this.editingMessage = null;
  this.editContent = '';
}
  }
}
</script>

<style scoped>
.messages-list {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: calc(100vh - 80px);
  overflow-y: auto;
  padding: 1rem;
  scroll-behavior: smooth;
  margin-bottom: 70px; 
  scrollbar-width: none; 
  -ms-overflow-style: none; 
}
.messages-list::-webkit-scrollbar {
  display: none;
}

.messages-loading,
.messages-empty {
  text-align: center;
  padding: 2rem 0;
  color: var(--color-text-light, #888);
  font-style: italic;
}

.message-container {
  width: 100%;
  padding: 0.5rem 0;
  display: flex;
  justify-content: flex-start;
  margin-bottom: 1rem;
}

.message-container.current-user {
  justify-content: flex-end;
}

.message-content {
  display: flex;
  position: relative;
  max-width: 70%;
  background-color: var(--color-background-soft, --background-message-secondaire);
  border-radius: 8px;
  padding: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.current-user .message-content {
  background-color: var(--accent-color-light, --background-message);
  color: var(--text-color);
  flex-direction: row-reverse;
}

.profile-pic {
  width: 40px;
  height: 40px;
  margin-right: 0.75rem;
}

.current-user .profile-pic {
  margin-right: 0;
  margin-left: 0.75rem;
}

.profile-pic img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.message-body {
  flex: 1;
  min-width: 0; 
}

.message-header {
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
}

.username {
  font-weight: bold;
  margin-right: 0.5rem;
  word-break: break-word;
}

.timestamp {
  color: var(--color-text-light, #a3a3a3);
  font-size: 0.8rem;
}

.current-user .timestamp {
  color: rgba(255, 255, 255, 0.7);
}

.message-text {
  color: inherit;
  line-height: 1.4;
  word-break: break-word;
}

.message-text p {
  margin: 0;
}

.message-actions {
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

.current-user .message-actions {
  right: auto;
  left: 8px;
}

.message-content:hover .message-actions {
  opacity: 1;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.action-btn:hover {
  background-color: var(--color-background-mute, #4f545c);
}

.action-btn img {
  width: 18px;
  height: 18px;
}

/* Styles pour le modal d'édition de message */
.edit-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.edit-modal {
  background-color: var(--color-background);
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  animation: modal-appear 0.2s ease-out;
}

@keyframes modal-appear {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.edit-modal-header {
  padding: 15px 20px;
  border-bottom: 1px solid var(--color-border);
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--color-text-light);
}

.edit-modal-body {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
}

.edit-textarea {
  width: 100%;
  min-height: 120px;
  padding: 12px;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  background-color: var(--color-background-soft);
  color: var(--color-text);
  resize: vertical;
  font-family: inherit;
  font-size: 1rem;
}

.edit-modal-footer {
  padding: 15px 20px;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.cancel-button, .save-button {
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}

.cancel-button {
  background-color: var(--color-background-mute);
  border: 1px solid var(--color-border);
  color: var(--color-text);
}

.save-button {
  background-color: var(--primary-color);
  border: 1px solid var(--primary-color);
  color: white;
}

.cancel-button:hover {
  background-color: var(--color-background-soft);
}

.save-button:hover {
  background-color: var(--primary-color-dark, #2a65a3);
}

/* Indicateur de message modifié */
.message-text {
  position: relative;
}

.message-text p {
  margin-right: 40px;
}

.message-modified-indicator {
  font-size: 0.7rem;
  color: var(--color-text-light);
  font-style: italic;
  position: absolute;
  right: 0;
  bottom: 0;
}

/* Styles pour l'indicateur de réponse */
.message-reply-reference {
  display: flex;
  align-items: center;
  font-size: 0.85rem;
  margin-bottom: 10px;
  padding: 5px 8px;
  color: var(--color-text-light, #a3a3a3);
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  border-left: 3px solid var(--primary-color, #007bff);
  max-width: 90%;
}

.reply-to-icon {
  margin-right: 6px;
  transform: rotate(180deg);
  font-size: 1rem;
}

.reply-to-text {
  margin-right: 6px;
  opacity: 0.8;
}

.reply-to-author {
  font-weight: 500;
  color: var(--primary-color, #007bff);
  margin-right: 6px;
}

.current-user .reply-to-author {
  color: #fff;
}

.reply-to-content {
  color: var(--color-text-light, #a3a3a3);
  font-style: italic;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-reply-reference {
  cursor: pointer;
  transition: all 0.2s ease;
}

.message-reply-reference:hover {
  text-decoration: underline;
  opacity: 0.9;
}

/* Animation pour mettre en évidence le message parent */
@keyframes highlight-pulse {
  0% { background-color: rgba(62, 130, 247, 0.1); }
  50% { background-color: rgba(62, 130, 247, 0.3); }
  100% { background-color: rgba(62, 130, 247, 0.1); }
}

.highlight-message {
  animation: highlight-pulse 2s ease;
}
/* Styles pour les fichiers joints */
.message-files {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 100%;
}

.file-attachment {
  cursor: pointer;
  border-radius: 6px;
  overflow: hidden;
  max-width: 400px;
  transition: transform 0.2s ease;
}

.file-attachment:hover {
  transform: translateY(-2px);
}

.file-image-container {
  max-width: 100%;
  overflow: hidden;
  border-radius: 6px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.file-image {
  max-width: 100%;
  height: auto;
  object-fit: contain;
  display: block;
}

.file-other-container {
  display: flex;
  align-items: center;
  background-color: var(--color-background-mute, rgba(0, 0, 0, 0.05));
  padding: 10px;
  border-radius: 6px;
  border: 1px solid var(--color-border, rgba(0, 0, 0, 0.1));
  max-width: 100%;
}

.file-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.file-type-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.file-info {
  flex: 1;
  overflow: hidden;
}

.file-name {
  font-weight: 500;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--color-text, #36393f);
}

.file-size {
  font-size: 0.8rem;
  color: var(--color-text-light, #72767d);
}

/* Styles pour les réactions aux messages */
.message-reactions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.reaction-badge {
  display: flex;
  align-items: center;
  background-color: var(--color-background-mute, rgba(0, 0, 0, 0.05));
  border: 1px solid var(--color-border, rgba(0, 0, 0, 0.1));
  border-radius: 12px;
  padding: 0 8px;
  height: 24px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reaction-badge:hover {
  background-color: var(--color-background-soft, rgba(0, 0, 0, 0.1));
}

.reaction-emoji {
  font-size: 14px;
  margin-right: 4px;
}

.reaction-count {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text, #36393f);
}

.user-reacted {
  background-color: rgba(88, 101, 242, 0.15);
  border-color: rgba(88, 101, 242, 0.3);
}

.current-user .user-reacted {
  background-color: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

/* Styles pour le sélecteur d'emoji */
.emoji-picker-container {
  position: relative;
  z-index: 1000;
}

.action-btn {
  position: relative;
}
</style>
