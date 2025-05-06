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
      >
    </div>

    <button type="submit" class="submit-btn">
      {{ isLogin ? 'Se connecter' : "S'inscrire" }}
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
    }
  },
  data() {
    return {
      form: {
        username: '',
        email: '',
        password: ''
      }
    }
  },
  methods: {
    handleSubmit() {
      this.$emit('submit', this.form)
    }
  },
  watch: {
    isLogin() {
      // Réinitialiser le formulaire lors du changement de mode
      this.form = {
        username: '',
        email: '',
        password: ''
      }
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
</style>
