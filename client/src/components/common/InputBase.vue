<template>
  <div class="textBox-wrapper" :class="{ 'inactive': !targetActive }">
    <!-- Indication de réponse à un message -->
    <div v-if="replyingToMessage" class="reply-indicator">
      <div class="reply-content">
        <div class="reply-header">
          <span class="reply-icon">↩</span>
          <span class="reply-to">Réponse à <strong>{{ getAuthorName(replyingToMessage) }}</strong></span>
        </div>
        <span class="reply-preview">{{ getMessagePreview(replyingToMessage) }}</span>
      </div>
      <button class="cancel-reply-btn" @click="cancelReply">×</button>
    </div>
    
    <!-- Zone de saisie de message -->
    <div class="textInput" :class="{ 'reply-mode': replyingToMessage }">
      <textarea
        ref="messageInput"
        v-model="content"
        :placeholder="getPlaceholder()"
        class="message-textarea"
        :disabled="!targetActive"
        @keydown.ctrl.enter="sendMessage"
        rows="1"
      ></textarea>
      
      <div class="input-actions">
        <!-- Bouton d'envoi -->
        <button 
          class="send-button" 
          :disabled="!canSend" 
          @click="sendMessage"
          title="Envoyer le message (Ctrl+Entrée)"
        >
          <span class="send-icon">➤</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'InputBase',
  props: {
    // L'objet cible (canal ou conversation)
    target: {
      type: Object,
      default: () => null
    },
    // Si la cible est active
    targetActive: {
      type: Boolean,
      default: false
    },
    // Type de message: 'channel' ou 'private'
    messageType: {
      type: String,
      default: 'channel',
      validator: value => ['channel', 'private'].includes(value)
    },
    // ID de l'espace de travail (pour les messages de canal)
    workspaceId: {
      type: String,
      default: ''
    },
    // Message auquel on répond (si mode réponse)
    replyingToMessage: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      content: '',
    };
  },
  computed: {
    canSend() {
      return this.targetActive && this.content.trim().length > 0;
    }
  },
  methods: {
    /**
     * Envoyer un message
     */
    sendMessage() {
      if (!this.canSend) return;
      
      // Préparer les données selon le type de message
      const data = {
        contenu: this.content.trim(),
        workspaceId: this.workspaceId
      };
      
      if (this.messageType === 'channel') {
        data.targetId = this.target?._id;
      } else if (this.messageType === 'private') {
        data.targetId = this.target?._id;
      }
      
      // Si on répond à un message
      if (this.replyingToMessage) {
        data.parentMessageId = this.replyingToMessage._id;
        this.$emit('reply-to-message', data);
      } else {
        // Envoi normal selon le type
        if (this.messageType === 'channel') {
          this.$emit('send-channel-message', data);
        } else if (this.messageType === 'private') {
          this.$emit('send-private-message', data);
        }
      }
      
      // Réinitialiser le contenu
      this.content = '';
      
      // Demander un rafraîchissement des messages
      this.$emit('refresh-messages');
    },
    
    /**
     * Annuler le mode réponse
     */
    cancelReply() {
      this.$emit('cancel-reply');
    },
    
    /**
     * Obtenir le nom de l'auteur d'un message
     */
    getAuthorName(message) {
      if (!message || !message.auteur) return 'Utilisateur';
      
      const author = message.auteur;
      if (author.prenom && author.nom) {
        return `${author.prenom} ${author.nom}`;
      } else if (author.username) {
        return author.username;
      } else {
        return 'Utilisateur';
      }
    },
    
    /**
     * Obtenir un aperçu du contenu d'un message
     */
    getMessagePreview(message) {
      if (!message || !message.contenu) return '';
      
      // Limiter la longueur de l'aperçu
      const maxLength = 50;
      let preview = message.contenu;
      
      if (preview.length > maxLength) {
        preview = preview.substring(0, maxLength) + '...';
      }
      
      return preview;
    },
    
    /**
     * Obtenir le placeholder approprié
     */
    getPlaceholder() {
      if (!this.targetActive) return 'Sélectionnez un canal pour envoyer un message';
      
      if (this.messageType === 'channel') {
        return `Message dans #${this.target?.nom || 'canal'}`;
      } else {
        return `Message à ${this.getAuthorName(this.target)}`;
      }
    }
  }
};
</script>

<style scoped>
.textBox-wrapper {
  padding: 10px;
  border-top: 1px solid var(--color-border, #2a2d31);
  background-color: var(--color-background, #313338);
}

.textBox-wrapper.inactive {
  opacity: 0.6;
  pointer-events: none;
}

/* Styles pour le mode réponse */
.reply-indicator {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 8px 12px;
  margin-bottom: 8px;
  background-color: rgba(88, 101, 242, 0.1);
  border-radius: 4px;
  border-left: 3px solid var(--primary-color, #5865f2);
}

.reply-content {
  display: flex;
  flex-direction: column;
  font-size: 0.85rem;
  flex: 1;
  min-width: 0;
}

.reply-header {
  display: flex;
  align-items: center;
  margin-bottom: 2px;
}

.reply-icon {
  margin-right: 4px;
  color: var(--color-text-light, #a3a6aa);
}

.reply-to {
  color: var(--color-text-light, #a3a6aa);
  font-weight: normal;
}

.reply-to strong {
  font-weight: 600;
  color: var(--interactive-active, #ffffff);
}

.reply-preview {
  color: var(--color-text, #dcddde);
  opacity: 0.8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.cancel-reply-btn {
  background: none;
  border: none;
  color: var(--color-text-light, #a3a3a3);
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  padding: 0;
}

.cancel-reply-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
}

/* Styles pour la zone de texte */
.textInput {
  display: flex;
  align-items: center;
  background-color: var(--channel-textarea-background, #383a40);
  border-radius: 8px;
  border: none;
  overflow: hidden;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.textInput.reply-mode {
  margin-top: 10px;
}

.message-textarea {
  flex: 1;
  min-height: 22px;
  max-height: 50vh;
  padding: 12px 16px;
  background: transparent;
  border: none;
  resize: none;
  color: var(--color-text, #dcddde);
  font-family: inherit;
  font-size: 16px;
  line-height: 1.375rem;
  font-weight: 400;
  overflow-y: auto;
}

.message-textarea:focus {
  outline: none;
}

.input-actions {
  display: flex;
  align-items: center;
  padding: 0 16px 0 0;
}

.send-button {
  background-color: transparent;
  color: var(--interactive-normal, #b9bbbe);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
}

.send-button:disabled {
  color: var(--interactive-muted, #4f545c);
  cursor: not-allowed;
  opacity: 0.5;
}

.send-button:not(:disabled):hover {
  color: var(--interactive-hover, #dcddde);
  background-color: rgba(255, 255, 255, 0.05);
}

.send-icon {
  font-size: 18px;
}
</style>
