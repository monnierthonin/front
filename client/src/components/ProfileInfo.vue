<template>
  <div class="containerSetting">
    <img src="../assets/styles/image/profilDelault.png" class="profile-image-param" alt="profil">
    <div class="settings">
      <h2 class="username">Username</h2>
      <h2 class="email">email.email@email.email</h2>
      <input type="text" v-model="username" placeholder="Changer votre nom d'utilisateur">
      <input type="email" v-model="email" placeholder="Changer votre email">
      <div class="password-container">
        <input :type="showPassword ? 'text' : 'password'" v-model="password" placeholder="Changer votre mot de passe">
        <img src="../assets/styles/image/cacher.png" class="toggle-password" @click="togglePassword">
      </div>
      <div class="password-container">
        <input :type="showPassword ? 'text' : 'password'" v-model="confirmPassword" placeholder="Confirmer votre nouveau mot de passe">
        <img src="../assets/styles/image/cacher.png" class="toggle-password" @click="togglePassword">
      </div>
      <div class="password-container">
        <input :type="showPassword ? 'text' : 'password'" v-model="oldPassword" placeholder="Entrer votre ancien mot de passe">
        <img src="../assets/styles/image/cacher.png" class="toggle-password" @click="togglePassword">
      </div>
      <button class="save-button" @click="saveSettings">Enregistrer</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProfileInfo',
  data() {
    return {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      oldPassword: '',
      showPassword: false
    }
  },
  methods: {
    togglePassword() {
      this.showPassword = !this.showPassword;
    },
    saveSettings() {
      // TODO: Implémenter la sauvegarde des paramètres
      console.log('Paramètres sauvegardés:', {
        username: this.username,
        email: this.email
      })
    }
  }
}
</script>

<style scoped>
.containerSetting {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  gap: 20%;
}

.profile-image-param {
  width: 200px;
  height: 200px;
}

.settings {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  width: 30%;
}

.settings input[type="text"],
.settings input[type="email"],
.settings input[type="password"] {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--secondary-color-transition);
  border-radius: 4px;
  background: var(--secondary-color-transition);
  color: var(--text-primary);
  margin-top: 0.5rem;
  padding-right: 40px;
}

.password-container {
  position: relative;
  width: 100%;
}

.toggle-password {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  width: 20px;
  height: 20px;
  opacity: 0.7;
  transition: opacity 0.3s;
}

.save-button {
  background: #00C900;
  border: 1px solid #00C900;
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  margin-top: 1rem;
  width: 200px;
}

.save-button:hover {
  background-color: #009600;
  border: 1px solid #009600;
}
</style>
