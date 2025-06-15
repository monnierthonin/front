<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <img src="../assets/styles/image/logoSupchat.png" alt="Logo SupChat" class="auth-logo">
        <h2>Mot de passe oublié</h2>
      </div>

      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>

      <div v-if="!emailSent">
        <p class="form-instructions">
          Entrez l'adresse email associée à votre compte pour recevoir un lien de réinitialisation
        </p>
        
        <form @submit.prevent="handleSubmit" class="auth-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input 
              type="email" 
              id="email" 
              v-model="email" 
              required
              placeholder="Entrez votre email"
              :disabled="loading"
            >
          </div>
          
          <button type="submit" class="submit-btn" :disabled="loading">
            <span v-if="loading">Chargement...</span>
            <span v-else>Envoyer le lien</span>
          </button>
        </form>
      </div>

      <div v-if="emailSent" class="email-sent-message">
        <p>Un email de récupération a été envoyé.</p>
        <p>Veuillez vérifier votre boîte mail et suivre les instructions pour réinitialiser votre mot de passe.</p>
      </div>

      <div class="auth-footer">
        <router-link to="/auth" class="back-link">Retour à la connexion</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import authService from '../services/authService';

export default {
  name: 'ForgotPassword',
  data() {
    return {
      email: '',
      loading: false,
      emailSent: false,
      errorMessage: '',
      successMessage: ''
    }
  },
  methods: {
    async handleSubmit() {
      this.errorMessage = '';
      this.successMessage = '';
      this.loading = true;
      
      try {
        const response = await fetch('http://localhost:3000/api/v1/auth/mot-de-passe-oublie', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email: this.email }),
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Erreur lors de la demande de réinitialisation');
        }
        
        this.emailSent = true;
        this.successMessage = 'Email de récupération envoyé avec succès!';
      } catch (error) {
        this.errorMessage = error.message || 'Une erreur est survenue. Veuillez réessayer.';
        console.error('Erreur de récupération de mot de passe:', error);
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--background-primary);
  padding: 20px;
}

.auth-card {
  background-color: var(--secondary-color);
  border-radius: 10px;
  padding: 2rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.auth-header {
  text-align: center;
}

.auth-logo {
  width: 120px;
  margin-bottom: 1rem;
}

.form-instructions {
  color: var(--text-secondary);
  text-align: center;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

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

.error-message {
  background-color: rgba(239, 68, 68, 0.1);
  color: rgb(239, 68, 68);
  padding: 0.75rem;
  border-radius: 5px;
  font-size: 0.9rem;
  text-align: center;
}

.success-message {
  background-color: rgba(34, 197, 94, 0.1);
  color: rgb(34, 197, 94);
  padding: 0.75rem;
  border-radius: 5px;
  font-size: 0.9rem;
  text-align: center;
}

.email-sent-message {
  text-align: center;
  color: var(--text-primary);
  padding: 1rem 0;
}

.auth-footer {
  margin-top: 1rem;
  text-align: center;
}

.back-link {
  color: var(--primary-color);
  text-decoration: none;
  font-size: 0.9rem;
}

.back-link:hover {
  text-decoration: underline;
}

h2 {
  color: var(--text-primary);
  font-size: 1.5rem;
  margin: 0;
}
</style>
