<template>
  <div class="inputMessage">
    <!-- Barre de réponse (visible uniquement en mode réponse) -->
    <div v-if="replyingToMessage" class="reply-bar">
      <div class="reply-info">
        <span class="reply-prefix">Réponse à</span>
        <span class="reply-author">{{ getAuthorName(replyingToMessage.auteur) }}</span>
        <span class="reply-preview">{{ getMessagePreview(replyingToMessage.contenu) }}</span>
      </div>
      <button class="cancel-reply-btn" @click="cancelReply">
        <span>&times;</span>
      </button>
    </div>
    
    <div class="textInput" :class="{ 'disabled': !canalActif, 'reply-mode': replyingToMessage }">
      <button @click="handleFileUpload" :disabled="!canalActif">
        <img src="../../assets/styles/image/importFile.png" alt="importFile" class="importFile">
      </button>
      <textarea 
        ref="inputText" 
        v-model="messageText" 
        class="inputText" 
        :placeholder="placeholderText" 
        :disabled="!canalActif"
        @keyup.enter="handleEnterKey"
        @keyup.esc="cancelReply"
      ></textarea>
      <button @click="envoyerMessage" :disabled="!canalActif || !messageText.trim()">
        <img src="../../assets/styles/image/messageEnvoi.png" alt="messageEnvoi" class="messageEnvoi">
      </button>
    </div>
  </div>
</template>

<script>
import fichierService from '../../services/fichierService';

export default {
  name: 'textBox',
  props: {
    workspaceId: {
      type: String,
      default: ''
    },
    canalActif: {
      type: Object,
      default: () => null
    },
    replyingToMessage: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      messageText: '',
      selectedFile: null,
      uploadingFile: false
    };
  },
  computed: {
    /**
     * Texte de placeholder personnalisé en fonction du mode (réponse ou non)
     */
    placeholderText() {
      if (this.replyingToMessage) {
        return "Répondre à ce message...";
      }
      return "Entrez votre message";
    }
  },
  methods: {
    /**
     * Envoyer le message au canal actif
     */
    async envoyerMessage() {
      if (!this.canalActif || (!this.messageText.trim() && !this.selectedFile)) {
        return;
      }
      
      if (this.selectedFile) {
        this.uploadingFile = true;
        try {
          if (this.replyingToMessage) {
            alert('La fonctionnalité de réponse avec fichier n\'est pas encore disponible.');
            return;
          } else {
            if (this.canalActif.type === 'conversation' || this.canalActif.type === 'user') {
              await fichierService.uploadFichierConversation(
                this.selectedFile, 
                this.canalActif._id, 
                null,
                this.messageText.trim()
              );
            } else {
              await fichierService.uploadFichierCanal(
                this.selectedFile, 
                this.canalActif._id, 
                null,
                this.messageText.trim()
              );
            }
            this.$emit('refresh-messages');
          }
          
          this.selectedFile = null;
          this.messageText = '';
        } catch (error) {
          console.error('Erreur lors de l\'upload avec message:', error);
          alert('Erreur lors de l\'envoi du fichier. Vérifiez que le type et la taille sont autorisés.');
          return;
        } finally {
          this.uploadingFile = false;
        }
      } else {
        if (this.replyingToMessage) {
          let parentId = null;
          
          if (typeof this.replyingToMessage === 'object') {
            if (this.replyingToMessage._id) {
              parentId = this.replyingToMessage._id;
            } else if (this.replyingToMessage.id) {
              parentId = this.replyingToMessage.id;
            }
          } else if (typeof this.replyingToMessage === 'string') {
            parentId = this.replyingToMessage;
          }
          
          if (!parentId) {
            this.$emit('cancel-reply');
            return;
          }
          
          this.$emit('reply-to-message', {
            parentMessageId: parentId,
            contenu: this.messageText.trim()
          });
        } else {
          this.$emit('envoyer-message', { contenu: this.messageText.trim() });
        }
      }
      
      this.messageText = '';
      this.selectedFile = null;
      
      if (this.replyingToMessage) {
        this.$emit('cancel-reply');
      }
      
      if (this.$refs.inputText) {
        this.$refs.inputText.style.height = 'auto';
      }
    },
    
    /**
     * Gérer l'upload de fichier
     */
    handleFileUpload() {
      if (!this.canalActif) {
        return;
      }
      
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt';
      
      fileInput.addEventListener('change', (event) => {
        if (event.target.files.length > 0) {
          const file = event.target.files[0];
          
          if (file.size > 5 * 1024 * 1024) {
            alert('Le fichier est trop volumineux. Taille maximum: 5MB');
            return;
          }
          
          const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain'
          ];
          
          if (!allowedTypes.includes(file.type)) {
            alert('Type de fichier non autorisé. Types acceptés: images, PDF, DOC, DOCX, XLS, XLSX, TXT');
            return;
          }
          
          this.selectedFile = file;
          
          this.$nextTick(() => {
            this.envoyerMessage();
          });
        }
      });
      
      document.body.appendChild(fileInput);
      fileInput.click();
      
      setTimeout(() => {
        document.body.removeChild(fileInput);
      }, 500);
    },
    
    /**
     * Gérer l'appui sur la touche Entrée (envoyer le message)
     * @param {Event} e - L'événement keyup
     */
    handleEnterKey(e) {
      if (!e.shiftKey) {
        e.preventDefault();
        this.envoyerMessage();
      }
    },
    
    /**
     * Annuler le mode réponse
     */
    cancelReply() {
      this.$emit('cancel-reply');
    },
    
    /**
     * Obtenir le nom de l'auteur du message
     * @param {Object} author - Auteur du message
     * @returns {String} - Nom d'affichage de l'auteur
     */
    getAuthorName(author) {
      if (!author) return 'Utilisateur';
      return author.username || author.firstName || author.email || 'Utilisateur';
    },
    
    /**
     * Obtenir un aperçu court du message
     * @param {String} content - Contenu du message
     * @returns {String} - Aperçu tronqué du message
     */
    getMessagePreview(content) {
      if (!content) return '';
      
      if (content.length > 30) {
        return content.substring(0, 30) + '...';
      }
      return content;
    }
  },
  mounted() {
    const inputText = this.$refs.inputText;
    
    if (inputText) {
      inputText.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
      });
    }
  }
};
</script>

<style scoped>
.inputMessage {
  width: 100%;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 10px;
  background-color: transparent;
  z-index: 10;
  display: flex;
  justify-content: center;
}

button {
  border-color: transparent;
  color: transparent;
  border-radius: 10px;
  background: none;
  display: inline-block;
  cursor: pointer;
}

.inputText {
  width: 50vh;
  height: 50px;
  background-color:#D9D9D9;
  border-color: transparent;
  outline: none;
  resize: none;
  overflow: hidden;
  padding: 20px;
  font-size: 15px;
}

.textInput {
  position: fixed;
  bottom: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  background-color:#D9D9D9;
  border-radius: 10px;
}

.messageEnvoi{
  height: 70%;
  width: 70%;
}

.importFile{
  height: 30px;
  width: 30px;
  margin-left: 10px;
}

.textInput.disabled {
  opacity: 0.7;
  pointer-events: none;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.inputText:disabled {
  cursor: not-allowed;
  background-color: #bebebe;
}

.reply-bar {
  position: fixed;
  bottom: 60px;
  left: 10px;
  right: 10px;
  background-color: var(--color-background-soft, #36393f);
  border: 1px solid var(--color-border, #444);
  padding: 10px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 8px;
  margin: 0 auto;
  animation: slide-up 0.2s ease-out;
  z-index: 20;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  max-width: calc(100% - 20px);
  width: calc(var(--whidth-header) + var(--whidth-chanelWorkspace) + var(--whidth-userChanel) - 20px);
}

@keyframes slide-up {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.reply-info {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.reply-prefix {
  color: var(--color-text-light, #a3a3a3);
  font-size: 0.85rem;
}

.reply-author {
  font-weight: bold;
  font-size: 0.85rem;
  color: var(--primary-color, #007bff);
}

.reply-preview {
  color: var(--color-text-light, #a3a3a3);
  font-size: 0.85rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
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

/* Ajuster le style quand on est en mode réponse */
.textInput.reply-mode {
  margin-top: 10px;
}
</style>