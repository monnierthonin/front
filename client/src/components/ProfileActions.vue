<template>
  <div class="containerSetting2">
    <button class="deco-button">Déconnection</button>
    <button class="suppr-button">Supprimer</button>
  </div>
</template>

<script>
export default {
  name: 'ProfileActions',
  methods: {
    disconnect() {
      // TODO: Implémenter la déconnexion
      console.log('Déconnexion...')
    },
    deleteAccount() {
      // TODO: Implémenter la suppression du compte
      console.log('Suppression du compte...')
    }
  }
}
</script>

<style scoped>
.containerSetting2 {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 90%;
}

.deco-button,
.suppr-button {
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  width: 200px;
}

.deco-button {
  background: #C87400;
  border: 1px solid #C87400;
}

.deco-button:hover {
  background-color: #6b3e00;
  border: 1px solid #6b3e00;
}

.suppr-button {
  background: #C80000;
  border: 1px solid #C80000;
}

.suppr-button:hover {
  background-color: #520000;
  border: 1px solid #520000;
}
</style>
