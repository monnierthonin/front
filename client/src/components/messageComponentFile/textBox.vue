<template>
  <div class="inputMessage">
    <!-- Section de réponse à un message si on en a sélectionné un -->
    <div v-if="replyToMessage" class="reply-preview">
      <div class="reply-preview-content">
        <span class="reply-to-label">Réponse à <strong>{{ replyToMessage.username }}</strong></span>
        <span class="reply-text">{{ truncateText(replyToMessage.content, 40) }}</span>
      </div>
      <button class="cancel-reply" @click="cancelReply">
        <span>&times;</span>
      </button>
    </div>
    
    <div class="textInput">
      <button @click="handleImportFile" class="action-button import-file">
        <img src="../../assets/styles/image/importFile.png" alt="Importer un fichier" class="importFile">
      </button>
      
      <textarea 
        ref="inputText" 
        class="inputText" 
        :placeholder="placeholder" 
        v-model="messageContent"
        @keydown.enter.prevent="handleSendMessage"
        @input="handleInputResize"
        :style="{ height: textareaHeight }"
      ></textarea>
      
      <button 
        @click="handleSendMessage" 
        class="action-button send-message"
        :disabled="!messageContent.trim()"
      >
        <img src="../../assets/styles/image/messageEnvoi.png" alt="Envoyer" class="messageEnvoi">
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'textBox',
  props: {
    // Type de contexte (canal ou message privé)
    contextType: {
      type: String,
      default: 'canal', // 'canal' ou 'prive'
      validator: (value) => ['canal', 'prive'].includes(value)
    },
    // ID du contexte (ID du canal ou ID de la conversation)
    contextId: {
      type: String,
      required: true
    },
    // Message auquel on répond (optionnel)
    replyToMessage: {
      type: Object,
      default: null
    },
    // Placeholder personnalisé
    placeholder: {
      type: String,
      default: 'Entrez votre message...'
    }
  },
  data() {
    return {
      messageContent: '',
      textareaHeight: '40px' // Hauteur initiale
    }
  },
  methods: {
    handleSendMessage() {
      if (!this.messageContent.trim()) return;
      
      // Émettre un événement avec le contenu du message et les métadonnées
      this.$emit('send-message', {
        content: this.messageContent,
        contextType: this.contextType,
        contextId: this.contextId,
        replyToMessageId: this.replyToMessage ? this.replyToMessage.messageId : null
      });
      
      // Réinitialiser le champ de texte et la réponse
      this.messageContent = '';
      this.resetTextareaHeight();
      
      // Si on répondait à un message, on peut aussi réinitialiser la réponse
      if (this.replyToMessage) {
        this.$emit('reply-canceled');
      }
      
      // Redonner le focus au champ de texte
      this.$nextTick(() => {
        this.$refs.inputText.focus();
      });
    },
    
    handleImportFile() {
      // Émettre un événement pour l'importation de fichier
      this.$emit('import-file', {
        contextType: this.contextType,
        contextId: this.contextId
      });
    },
    
    handleInputResize() {
      // Réinitialiser la hauteur pour obtenir la hauteur de contenu correcte
      this.$refs.inputText.style.height = 'auto';
      
      // Calculer la nouvelle hauteur (avec une limite maximale)
      const newHeight = Math.min(this.$refs.inputText.scrollHeight, 150);
      this.textareaHeight = `${newHeight}px`;
    },
    
    resetTextareaHeight() {
      // Réinitialiser la hauteur du textarea
      this.textareaHeight = '40px';
    },
    
    cancelReply() {
      this.$emit('reply-canceled');
    },
    
    truncateText(text, maxLength) {
      if (!text) return '';
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }
  }
};
</script>

<style scoped>
.inputMessage {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  max-width: 800px;
  min-width: 400px;
  z-index: 100;
  display: flex;
  flex-direction: column;
}

/* Style pour la prévisualisation de réponse */
.reply-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  padding: 8px 15px;
  margin-bottom: 8px;
  border-left: 3px solid var(--primary-color, #2196F3);
}

.reply-preview-content {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.reply-to-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 2px;
}

.reply-text {
  font-size: 0.9rem;
  color: var(--text-color);
  opacity: 0.7;
}

.cancel-reply {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 1.2rem;
  cursor: pointer;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  padding: 0;
  margin: 0;
  transition: all 0.2s ease;
}

.cancel-reply:hover {
  background-color: rgba(0, 0, 0, 0.1);
  color: var(--text-color);
}

.textInput {
  display: flex;
  align-items: center;
  background-color: white;
  border-radius: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
  overflow: hidden;
}

.textInput:focus-within {
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  border-color: var(--primary-color-light, #90caf9);
}

.inputText {
  flex: 1;
  background: none;
  border: none;
  color: var(--text-color, #333);
  padding: 10px 15px;
  min-height: 24px;
  max-height: 150px;
  resize: none;
  font-family: inherit;
  font-size: 14px;
  outline: none;
  line-height: 1.5;
  transition: height 0.2s ease;
}

.inputText::placeholder {
  color: var(--text-secondary, #aaa);
}

.action-button {
  background: none;
  border: none;
  cursor: pointer;
  min-width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
  margin: 0 5px;
  opacity: 0.8;
}

.action-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
  opacity: 1;
}

.action-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.messageEnvoi {
  width: 28px;
  height: 28px;
  transition: all 0.2s ease;
}

.importFile {
  width: 24px;
  height: 24px;
  transition: all 0.2s ease;
}

/* Support des thèmes clair/sombre */
[data-theme="dark"] .textInput {
  background-color: #2a2a2a;
  border-color: #3a3a3a;
}

[data-theme="dark"] .inputText {
  color: #e0e0e0;
}

[data-theme="dark"] .inputText::placeholder {
  color: #888;
}

[data-theme="dark"] .action-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .inputMessage {
    width: 90%;
    min-width: 300px;
    bottom: 10px;
  }
  
  .textInput {
    border-radius: 15px;
  }
  
  .inputText {
    font-size: 13px;
  }
}
</style>
