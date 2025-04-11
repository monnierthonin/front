<template>
  <div class="inputMessage">
    <div class="textInput">
      <button>
        <img src="../../assets/styles/image/importFile.png" alt="importFile" class="importFile">
      </button>
      <textarea ref="inputText" class="inputText" placeholder="Entrez votre message"></textarea>
      <button>
        <img src="../../assets/styles/image/messageEnvoi.png" alt="messageEnvoi" class="messageEnvoi">
      </button>
    </div>
  </div>
</template>

<script>

export default {
name: 'textBox',
  components: {
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
    }
}
</script>

<style scoped>
.inputMessage {
  margin-left: calc(var(--whidth-header) + var(--whidth-chanelWorkspace));
  margin-right: var(--whidth-userChanel);
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
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
</style>