<template>
  <!-- Utiliser MessageBase comme composant central pour afficher les messages -->
  <MessageBase
    :messages="messages"
    :isLoading="isLoading"
    :currentUserId="currentUserId"
    :messageType="'channel'"
    :workspaceId="workspaceId"
    @reply-to-message="handleReplyToMessage"
    @delete-message="handleDeleteMessage"
    @add-reaction="handleAddReaction"
    @update-message="handleUpdateMessage"
  />
</template>

<script>
import MessageBase from '../common/MessageBase.vue';
import messageService from '../../services/messageService.js';

export default {
  components: {
    MessageBase
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
      workspaceId: this.$route.params.id || ''
    };
  },

  methods: {
    
    /**
     * Gérer la réponse à un message
     */
    handleReplyToMessage(message) {
      this.$emit('reply-to-message', message);
    },
    
    /**
     * Gérer la suppression d'un message
     */
    handleDeleteMessage(message) {
      try {
        // Appeler l'API pour supprimer le message
        if (this.workspaceId && message.canal && message.canal._id) {
          messageService.deleteMessage(this.workspaceId, message.canal._id, message._id)
            .then(() => {
              this.$emit('update-messages');
            })
            .catch(error => {
              console.error('Erreur lors de la suppression du message:', error);
              alert(`Erreur: ${error.message}`);
            });
        }
      } catch (error) {
        console.error('Erreur lors de la suppression du message:', error);
        alert(`Erreur: ${error.message}`);
      }
    },
    
    /**
     * Gérer l'ajout d'une réaction
     */
    handleAddReaction({ message, emoji }) {
      try {
        if (this.workspaceId && message.canal && message.canal._id) {
          messageService.reactToMessage(this.workspaceId, message.canal._id, message._id, emoji)
            .then(() => {
              this.$emit('update-messages');
            })
            .catch(error => {
              console.error('Erreur lors de l\'ajout de la réaction:', error);
              alert(`Erreur: ${error.message}`);
            });
        }
      } catch (error) {
        console.error('Erreur lors de l\'ajout de la réaction:', error);
        alert(`Erreur: ${error.message}`);
      }
    },
    
    /**
     * Gérer la mise à jour d'un message
     */
    handleUpdateMessage({ messageId, content }) {
      try {
        const index = this.messages.findIndex(m => m._id === messageId);
        if (index !== -1) {
          const message = this.messages[index];
          if (this.workspaceId && message.canal && message.canal._id) {
            messageService.updateMessage(this.workspaceId, message.canal._id, messageId, content)
              .then(() => {
                this.$emit('update-messages');
              })
              .catch(error => {
                console.error('Erreur lors de la mise à jour du message:', error);
                alert(`Erreur: ${error.message}`);
              });
          }
        }
      } catch (error) {
        console.error('Erreur lors de la mise à jour du message:', error);
        alert(`Erreur: ${error.message}`);
      }
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
  border-radius: 50%;
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
