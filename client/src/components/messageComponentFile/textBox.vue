<template>
  <div class="inputMessage">
    <div class="textInput" :class="{ 'disabled': !canalActif }">
      <button @click="handleFileUpload" :disabled="!canalActif">
        <img src="../../assets/styles/image/importFile.png" alt="importFile" class="importFile">
      </button>
      <textarea 
        ref="inputText" 
        v-model="messageText" 
        class="inputText" 
        placeholder="Entrez votre message" 
        :disabled="!canalActif"
        @keyup.enter="handleEnterKey"
      ></textarea>
      <button @click="envoyerMessage" :disabled="!canalActif || !messageText.trim()">
        <img src="../../assets/styles/image/messageEnvoi.png" alt="messageEnvoi" class="messageEnvoi">
      </button>
    </div>
  </div>
</template>

<script>
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
    }
  },
  data() {
    return {
      messageText: ''
    };
  },
  methods: {
    /**
     * Envoyer le message au canal actif
     */
    envoyerMessage() {
      if (!this.canalActif || !this.messageText.trim()) {
        return;
      }
      
      this.$emit('envoyer-message', {
        contenu: this.messageText.trim(),
        canalId: this.canalActif._id,
        workspaceId: this.workspaceId
      });
      
      // Réinitialiser le champ de texte
      this.messageText = '';
      
      // Réinitialiser la hauteur du textarea
      if (this.$refs.inputText) {
        this.$refs.inputText.style.height = '50px';
      }
    },
    
    /**
     * Gérer l'upload de fichier (à implémenter plus tard)
     */
    handleFileUpload() {
      // Fonctionnalité à implémenter
      console.log('Upload de fichier - fonctionnalité à implémenter');
    },
    
    /**
     * Gérer l'appui sur la touche Entrée (envoyer le message)
     * @param {Event} e - L'événement keyup
     */
    handleEnterKey(e) {
      // N'envoyer que si on n'appuie pas sur Shift+Enter (nouvelle ligne)
      if (!e.shiftKey) {
        e.preventDefault();
        this.envoyerMessage();
      }
    }
  },
  mounted() {
    // Sélectionne l'élément `textarea` après que Vue ait monté le composant
    const inputText = this.$refs.inputText;
    
    if (inputText) {
      inputText.addEventListener('input', function () {
        this.style.height = 'auto';  // Réinitialiser la hauteur
        this.style.height = this.scrollHeight + 'px'; // Ajuster à la hauteur du texte
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

/* Styles pour l'état désactivé */
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
</style>