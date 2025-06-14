<template>
  <form @submit.prevent="handleSubmit" class="auth-form">
    <div class="form-group" v-if="!isLogin">
      <label for="username">Nom d'utilisateur</label>
      <input 
        type="text" 
        id="username" 
        v-model="form.username" 
        required
        placeholder="Entrez votre nom d'utilisateur"
        :disabled="loading"
      >
    </div>

    <div class="form-group">
      <label for="email">Email</label>
      <input 
        type="email" 
        id="email" 
        v-model="form.email" 
        required
        placeholder="Entrez votre email"
        :disabled="loading"
      >
    </div>

    <div class="form-group">
      <label for="password">Mot de passe</label>
      <input 
        type="password" 
        id="password" 
        v-model="form.password" 
        required
        placeholder="Entrez votre mot de passe"
        :disabled="loading"
      >
      <div v-if="isLogin" class="forgot-password">
        <router-link to="/mot-de-passe-oublie">Mot de passe oublié</router-link>
      </div>
    </div>

    <div class="form-group" v-if="!isLogin">
      <label for="confirmPassword">Confirmer le mot de passe</label>
      <input 
        type="password" 
        id="confirmPassword" 
        v-model="form.confirmPassword" 
        required
        placeholder="Confirmez votre mot de passe"
        :disabled="loading"
      >
      <div v-if="passwordMismatch" class="password-error">
        Les mots de passe ne correspondent pas
      </div>
    </div>

    <button type="submit" class="submit-btn" :disabled="loading">
      <span v-if="loading">Chargement...</span>
      <span v-else>{{ isLogin ? 'Se connecter' : "S'inscrire" }}</span>
    </button>
  </form>
</template>

<script>
export default {
  name: 'AuthForm',
  props: {
    isLogin: {
      type: Boolean,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      form: {
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      },
      passwordMismatch: false
    }
  },
  methods: {
    handleSubmit() {
      // Vérification de la correspondance des mots de passe lors de l'inscription
      if (!this.isLogin && this.form.password !== this.form.confirmPassword) {
        this.passwordMismatch = true;
        return;
      }
      
      this.passwordMismatch = false;
      this.$emit('submit', this.form);
    }
  },
  watch: {
    isLogin() {
      // Réinitialiser le formulaire lors du changement de mode
      this.form = {
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      };
      this.passwordMismatch = false;
    }
  }
}
</script>

<style scoped>
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  color: var(--text-primary);
  font-size: 0.9rem;
}

input {
  padding: 0.75rem;
  border-radius: 5px;
  border: 1px solid var(--border-color);
  background-color: var(--input-background);
  color: var(--text-primary);
  font-size: 1rem;
}

input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.submit-btn {
  background-color: var(--primary-color);
  color: white;
  padding: 0.75rem;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-btn:hover {
  background-color: var(--primary-color-dark);
}
.password-error {
  color: rgb(239, 68, 68);
  font-size: 0.8rem;
  margin-top: 0.5rem;
}

.forgot-password {
  text-align: right;
  margin-top: 0.5rem;
  font-size: 0.8rem;
}

.forgot-password a {
  color: var(--primary-color);
  text-decoration: none;
}

.forgot-password a:hover {
  text-decoration: underline;
}
</style>
