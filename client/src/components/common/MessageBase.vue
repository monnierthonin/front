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
        :key="message._id"
        :class="['message-container', { 'current-user': isCurrentUser(message.auteur._id) }]"
        :data-message-id="message._id">
        <div class="message-content">
          <!-- Profile picture -->
          <div class="profile-pic">
            <ProfilePicture 
              :profilePicture="message.auteur.profilePicture" 
              :altText="getUserName(message.auteur)" 
            />
          </div>
          
          <!-- Message body -->
          <div class="message-body">
            <!-- Référence à un message parent (si c'est une réponse) -->
            <div v-if="message.reponseA" class="message-reply-reference" @click="scrollToParentMessage(message.reponseA)">
              <span class="reply-to-icon">↩</span>
              <span class="reply-to-text">Réponse à </span>
              <span class="reply-to-author">{{ getMessageAuthorName(message.reponseA) }}:</span>
              <span class="reply-to-content">{{ getMessagePreview(message.reponseA) }}</span>
            </div>
            
            <!-- Username and timestamp -->
            <div class="message-header">
              <span class="username">{{ getUserName(message.auteur) }}</span>
              <span class="timestamp">{{ formatDate(message.createdAt) }}</span>
            </div>
            
            <!-- Message text -->
            <div class="message-text">
              <p>{{ message.contenu }}</p>
              <span v-if="message.modifie" class="message-modified-indicator">  (modifié)</span>
            </div>
            
            <!-- Réactions aux messages -->
            <div v-if="message.reactions && message.reactions.length > 0" class="message-reactions">
              <div 
                v-for="(reaction, index) in message.reactions" 
                :key="index" 
                class="reaction-badge"
                :class="{ 'user-reacted': hasUserReacted(reaction, currentUserId) }"
                @click="handleReaction(message, reaction.emoji)"
              >
                <span class="reaction-emoji">{{ reaction.emoji }}</span>
                <span class="reaction-count">{{ reaction.utilisateurs.length }}</span>
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
            <button class="action-btn" @click="handleReply(message)">
              <img src="../../assets/styles/image/repondre.png" alt="Reply" />
            </button>
            <button class="action-btn" @click="handleEmoji(message)">
              <img src="../../assets/styles/image/react.png" alt="Emoji" />
            </button>
            <button 
              v-if="isCurrentUser(message.auteur._id)" 
              class="action-btn" 
              @click="handleEdit(message)">
              <img src="../../assets/styles/image/modifier.png" alt="Edit" />
            </button>
            <button 
              v-if="isCurrentUser(message.auteur._id)" 
              class="action-btn" 
              @click="handleDelete(message)">
              <img src="../../assets/styles/image/delet.png" alt="Delete" />
            </button>
          </div>
          
          <!-- Emoji Picker -->
          <div class="emoji-picker-container" v-if="activeEmojiPickerMessageId === message._id">
            <SimpleEmojiPicker 
              @select="addReaction(message, $event)" 
              @close="closeEmojiPicker()"
            />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import fichierService from '../../services/fichierService.js';
import ProfilePicture from '../common/ProfilePicture.vue';
import SimpleEmojiPicker from '../common/SimpleEmojiPicker.vue';

export default {
  components: {
    ProfilePicture,
    SimpleEmojiPicker
  },
  name: 'MessageBase',
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
    // Type of messages: 'channel' or 'private'
    messageType: {
      type: String,
      default: 'channel',
      validator: (value) => ['channel', 'private'].includes(value)
    },
    // For delete/edit operations
    workspaceId: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      showEditModal: false,
      editingMessage: null,
      editContent: '',
      parentMessages: {},
      activeEmojiPickerMessageId: null
    };
  },
  updated() {
    // Faire défiler vers le bas pour voir les derniers messages
    this.scrollToBottom();
  },
  methods: {
    /**
     * Vérifier si le message provient de l'utilisateur connecté
     */
    isCurrentUser(authorId) {
      return authorId === this.currentUserId;
    },
    
    /**
     * Vérifier si le fichier est une image
     */
    isImage(mimeType) {
      return mimeType && mimeType.startsWith('image/');
    },
    
    /**
     * Obtenir l'URL complète d'un fichier
     */
    getFileUrl(url) {
      return fichierService.getFullFileUrl(url);
    },
    
    /**
     * Ouvrir le fichier dans un nouvel onglet
     */
    openFileInNewTab(url) {
      const fullUrl = this.getFileUrl(url);
      window.open(fullUrl, '_blank');
    },
    
    /**
     * Obtenir l'icône correspondant au type de fichier
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
     */
    formatDate(date) {
      if (!date) return '';
      return new Date(date).toLocaleString();
    },
    
    /**
     * Obtenir le nom d'affichage d'un utilisateur
     */
    getUserName(user) {
      if (!user) return '';
      return user.username || user.firstName || user.email || 'Utilisateur';
    },
    
    /**
     * Obtenir le nom de l'auteur d'un message référencé (réponse)
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
     * Gérer la réponse à un message
     */
    handleReply(message) {
      this.$emit('reply-to-message', message);
    },
    
    /**
     * Gérer l'ajout d'emoji à un message
     */
    handleEmoji(message) {
      this.toggleEmojiPicker(message);
    },
    
    /**
     * Gérer la modification d'un message
     */
    handleEdit(message) {
      this.editingMessage = { ...message };
      this.editContent = message.contenu;
      this.showEditModal = true;
    },
    
    /**
     * Gérer la suppression d'un message
     */
    handleDelete(message) {
      if (confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
        this.$emit('delete-message', message);
      }
    },
    
    /**
     * Vérifie si l'utilisateur a déjà réagi avec cet emoji
     */
    hasUserReacted(reaction, userId) {
      if (!reaction.utilisateurs || !Array.isArray(reaction.utilisateurs) || !userId) {
        return false;
      }
      return reaction.utilisateurs.some(id => id.toString() === userId.toString());
    },
    
    /**
     * Affiche ou masque le sélecteur d'emoji pour un message
     */
    toggleEmojiPicker(message) {
      if (this.activeEmojiPickerMessageId === message._id) {
        this.activeEmojiPickerMessageId = null;
      } else {
        this.activeEmojiPickerMessageId = message._id;
      }
    },
    
    /**
     * Ferme le sélecteur d'emoji
     */
    closeEmojiPicker() {
      this.activeEmojiPickerMessageId = null;
    },
    
    /**
     * Ajoute ou retire une réaction à un message
     */
    addReaction(message, emoji) {
      this.$emit('add-reaction', { message, emoji });
      this.closeEmojiPicker();
    },
    
    /**
     * Enregistrer les modifications d'un message
     */
    saveMessageEdit() {
      if (!this.editingMessage || !this.editContent.trim()) {
        return;
      }
      
      this.$emit('update-message', {
        messageId: this.editingMessage._id,
        content: this.editContent.trim(),
        messageType: this.messageType
      });
      
      this.closeEditModal();
    },
    
    /**
     * Fermer le modal d'édition
     */
    closeEditModal() {
      this.showEditModal = false;
      this.editingMessage = null;
      this.editContent = '';
    }
  }
};
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
  margin-bottom: 70px; /* Espace pour la zone de texte */
  
  /* Masquer la barre de défilement tout en gardant la fonctionnalité */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* Internet Explorer et Edge */
}

/* Masquer la barre de défilement pour Chrome, Safari et Opera */
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

/* Message de l'utilisateur actuel à droite */
.message-container.current-user {
  justify-content: flex-end;
}

.message-content {
  display: flex;
  position: relative;
  max-width: 70%;
  background-color: var(--color-background-soft, #36393f);
  border-radius: 8px;
  padding: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Style spécifique pour les messages de l'utilisateur actuel */
.current-user .message-content {
  background-color: var(--accent-color-light, #14324F);
  color: #fff;
  flex-direction: row-reverse;
}

.profile-pic {
  width: 40px;
  height: 40px;
  margin-right: 0.75rem;
  border-radius: 50%;
}

.current-user .profile-pic {
  margin-right: 0;
  margin-left: 0.75rem;
}

.message-body {
  flex: 1;
  min-width: 0; /* Pour éviter le débordement du contenu */
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

.close-button:hover {
  color: var(--color-text);
}

.edit-modal-body {
  padding: 15px 20px;
  overflow-y: auto;
  flex: 1;
}

.edit-textarea {
  width: 100%;
  min-height: 100px;
  resize: vertical;
  padding: 10px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background-color: var(--color-background-soft);
  color: var(--color-text);
}

.edit-modal-footer {
  padding: 15px 20px;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.cancel-button,
.save-button {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-button {
  background-color: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text);
}

.save-button {
  background-color: var(--primary-color, #5865f2);
  border: none;
  color: white;
}

.cancel-button:hover {
  background-color: var(--color-background-mute, #4f545c);
}

.save-button:hover {
  background-color: var(--primary-color-hover, #4752c4);
}

/* Styles pour les réactions aux messages */
.message-reactions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}

.reaction-badge {
  display: flex;
  align-items: center;
  background-color: var(--color-background-mute, #4f545c);
  border-radius: 10px;
  padding: 2px 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.reaction-emoji {
  font-size: 14px;
  margin-right: 4px;
}

.reaction-count {
  font-size: 12px;
  color: var(--color-text-light);
}

.user-reacted {
  background-color: rgba(88, 101, 242, 0.3);
}

.user-reacted .reaction-count {
  color: var(--primary-color);
}

/* Style pour l'aperçu des réponses */
.message-reply-reference {
  font-size: 0.8rem;
  color: var(--color-text-light);
  margin-bottom: 4px;
  padding: 2px 6px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.reply-to-icon {
  margin-right: 4px;
}

.reply-to-author {
  font-weight: bold;
  margin: 0 4px;
}

/* Style pour les fichiers attachés */
.message-files {
  margin-top: 8px;
}

.file-attachment {
  margin-top: 4px;
}

.file-image-container {
  max-width: 300px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
}

.file-image {
  max-width: 100%;
  height: auto;
}

.file-other-container {
  display: flex;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  padding: 8px;
  cursor: pointer;
}

.file-icon {
  width: 32px;
  height: 32px;
  margin-right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-info {
  display: flex;
  flex-direction: column;
}

.file-name {
  font-weight: bold;
  margin-bottom: 2px;
}

.file-size {
  font-size: 0.8rem;
  color: var(--color-text-light);
}

/* Style pour les messages avec un highlight */
.highlight-message {
  animation: highlight-pulse 2s ease-in-out;
}

@keyframes highlight-pulse {
  0% { background-color: transparent; }
  20% { background-color: rgba(88, 101, 242, 0.2); }
  100% { background-color: transparent; }
}

/* Style pour l'emoji picker */
.emoji-picker-container {
  position: absolute;
  bottom: 30px;
  right: 0;
  z-index: 100;
}

.current-user .emoji-picker-container {
  right: auto;
  left: 0;
}
</style>
