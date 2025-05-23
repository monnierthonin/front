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
            <button class="action-btn">
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
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import messageService from '../../services/messageService.js';
import fichierService from '../../services/fichierService.js';
import ProfilePicture from '../common/ProfilePicture.vue';

export default {
  components: {
    ProfilePicture
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
    }
  },
  data() {
    return {
      userId: null,
      showEditModal: false,
      editingMessage: null,
      editContent: '',
      parentMessages: {}
    };
  },
  created() {
    // Récupérer l'ID de l'utilisateur connecté s'il n'est pas fourni via les props
    if (!this.currentUserId) {
      this.userId = messageService.getUserIdFromToken();
    } else {
      this.userId = this.currentUserId;
    }
  },
  updated() {
    // Faire défiler vers le bas pour voir les derniers messages
    this.scrollToBottom();
  },
  methods: {
    /**
     * Vérifier si le message provient de l'utilisateur connecté
     * @param {String} authorId - ID de l'auteur du message
     * @returns {Boolean} true si c'est l'utilisateur actuel
     */
    isCurrentUser(authorId) {
      return authorId === this.currentUserId;
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
      
      // Utilisons des icônes existantes déjà dans le projet
      if (!mimeType) return importFileIcon;
      
      if (mimeType.startsWith('image/')) {
        return reactIcon; // Icône par défaut pour les images
      } else if (mimeType === 'application/pdf' || mimeType.includes('word') || 
                mimeType.includes('excel') || mimeType.includes('spreadsheet') || 
                mimeType.includes('powerpoint') || mimeType.includes('presentation')) {
        return importFileIcon; // Icône par défaut pour les documents
      } else if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('compressed')) {
        return importFileIcon; // Icône par défaut pour les archives
      } else if (mimeType.includes('text/')) {
        return importFileIcon; // Icône par défaut pour les textes
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
      
      // Si messageRef est un objet complet avec les infos du message parent
      if (typeof messageRef === 'object' && messageRef.auteur) {
        return this.getUserName(messageRef.auteur);
      }
      
      // Si messageRef est un objet mais sans les infos de l'auteur
      if (typeof messageRef === 'object' && messageRef._id) {
        // Ici on pourrait faire une requête pour obtenir les détails du message
        return 'Utilisateur';
      }
      
      // Si messageRef est juste un ID de message
      if (typeof messageRef === 'string') {
        // Ici on pourrait aussi faire une requête pour obtenir les détails
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
      
      // Si messageRef est un objet complet avec le contenu
      if (typeof messageRef === 'object' && messageRef.contenu) {
        // Tronquer le contenu s'il est trop long (max 40 caractères)
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
      
      // Trouver l'élément du message parent dans le DOM
      const parentMessageElement = document.querySelector(`[data-message-id="${messageRef._id}"]`);
      
      // Si l'élément existe, faire défiler jusqu'à lui
      if (parentMessageElement) {
        parentMessageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Ajouter une classe pour mettre en évidence le message parent pendant quelques secondes
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
     * @param {Object} message - Message auquel répondre
     */
    handleReply(message) {
      // Émettre un événement pour informer le composant parent
      this.$emit('reply-to-message', message);
    },
    
    /**
     * Gérer la modification d'un message
     * @param {Object} message - Message à modifier
     */
    handleEdit(message) {
      // Ouvrir le widget d'édition pour ce message
      this.editingMessage = { ...message };
      this.editContent = message.contenu;
      this.showEditModal = true;
    },
    
    /**
     * Gérer la suppression d'un message
     * @param {Object} message - Message à supprimer
     */
    handleDelete(message) {
      // Confirmer avant de supprimer
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
        const workspaceId = this.$route.params.id; // ID du workspace depuis l'URL
        const canalId = message.canal; // ID du canal depuis le message
        
        await messageService.deleteMessage(workspaceId, canalId, message._id);
        
        // Supprimer le message de la liste locale
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
    /**
     * Enregistrer les modifications d'un message
     */
    async saveMessageEdit() {
      if (!this.editingMessage || !this.editContent.trim()) {
        return;
      }
      
      try {
        const workspaceId = this.$route.params.id; // ID du workspace depuis l'URL
        const canalId = this.editingMessage.canal; // ID du canal depuis le message
        
        const updatedMessage = await messageService.updateMessage(
          workspaceId,
          canalId,
          this.editingMessage._id,
          this.editContent.trim()
        );
        
        // Mettre à jour le message dans la liste locale
        const index = this.messages.findIndex(m => m._id === this.editingMessage._id);
        if (index !== -1) {
          // Fusionner les propriétés pour conserver les informations qui n'ont pas été mises à jour
          this.messages[index] = { ...this.messages[index], ...updatedMessage, modifie: true };
        }
        
        // Fermer le modal
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

/* Les styles pour les réactions aux messages ont été supprimés */

/* Les styles pour le sélecteur d'emoji ont été supprimés */

.action-btn {
  position: relative;
}

/* Styles pour le modal d'emojis */
.edit-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.edit-modal {
  background-color: var(--background-primary);
  border-radius: 8px;
  width: 95%;
  max-width: 400px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.edit-modal-header {
  padding: 16px;
  font-weight: 600;
  border-bottom: 1px solid var(--secondary-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.edit-modal-body {
  padding: 16px;
  flex: 1;
  overflow-y: auto;
}

.emoji-modal-body {
  padding: 16px;
  max-height: 350px;
  overflow-y: auto;
}

.edit-modal-footer {
  padding: 12px 16px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid var(--secondary-color);
  gap: 10px;
}

.close-button {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--text-color);
}

.cancel-button, .save-button {
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
}

.cancel-button {
  background-color: transparent;
  border: 1px solid var(--secondary-color);
  color: var(--text-color);
}

.save-button {
  background-color: var(--primary-color);
  border: none;
  color: white;
}

.edit-textarea {
  width: 100%;
  min-height: 100px;
  padding: 12px;
  border-radius: 4px;
  border: 1px solid var(--secondary-color);
  background-color: var(--background-secondary);
  color: var(--text-color);
  font-family: inherit;
  resize: vertical;
}
</style>
