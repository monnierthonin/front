<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <img src="../assets/styles/image/logoSupchat.png" alt="Logo SupChat" class="auth-logo">
        <h2>Réinitialiser le mot de passe</h2>
      </div>

      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>

      <div v-if="!resetSuccess && tokenValid">
        <p class="form-instructions">
          Veuillez entrer votre nouveau mot de passe
        </p>
        
        <form @submit.prevent="handleSubmit" class="auth-form">
          <div class="form-group">
            <label for="password">Nouveau mot de passe</label>
            <input 
              type="password" 
              id="password" 
              v-model="password" 
              required
              placeholder="Entrez votre nouveau mot de passe"
              :disabled="loading"
            >
          </div>
          
          <div class="form-group">
            <label for="confirmPassword">Confirmer le mot de passe</label>
            <input 
              type="password" 
              id="confirmPassword" 
              v-model="confirmPassword" 
              required
              placeholder="Confirmez votre nouveau mot de passe"
              :disabled="loading"
            >
            <div v-if="passwordMismatch" class="password-error">
              Les mots de passe ne correspondent pas
            </div>
          </div>
          
          <button type="submit" class="submit-btn" :disabled="loading || !passwordsMatch">
            <span v-if="loading">Chargement...</span>
            <span v-else>Réinitialiser le mot de passe</span>
          </button>
        </form>
      </div>

      <div v-if="!tokenValid && !resetSuccess" class="token-invalid">
        <p>Ce lien de réinitialisation est invalide ou a expiré.</p>
        <p>Veuillez demander un nouveau lien de réinitialisation.</p>
      </div>

      <div v-if="resetSuccess" class="reset-success">
        <p>Votre mot de passe a été réinitialisé avec succès!</p>
        <p>Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
      </div>

      <div class="auth-footer">
        <router-link to="/auth" class="back-link">Retour à la connexion</router-link>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ResetPassword',
  data() {
    return {
      password: '',
      confirmPassword: '',
      loading: false,
      resetSuccess: false,
      tokenValid: true,
      errorMessage: '',
      successMessage: '',
      passwordMismatch: false
    }
  },
  computed: {
    passwordsMatch() {
      return this.password && this.confirmPassword && this.password === this.confirmPassword;
    },
    resetToken() {
      return this.$route.params.token;
    }
  },
  methods: {
    async handleSubmit() {
      if (this.password !== this.confirmPassword) {
        this.passwordMismatch = true;
        return;
      }
      
      this.passwordMismatch = false;
      this.errorMessage = '';
      this.successMessage = '';
      this.loading = true;
      
      try {
        const response = await fetch(`http://localhost:3000/api/v1/auth/reinitialiser-mot-de-passe/${this.resetToken}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            password: this.password,
            confirmPassword: this.confirmPassword
          }),
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Erreur lors de la réinitialisation du mot de passe');
        }
        
        this.resetSuccess = true;
        this.successMessage = 'Mot de passe réinitialisé avec succès!';
        
        setTimeout(() => {
          this.$router.push('/auth');
        }, 3000);
      } catch (error) {
        this.errorMessage = error.message || 'Une erreur est survenue. Veuillez réessayer.';
        
        if (error.message.includes('token') && (error.message.includes('invalide') || error.message.includes('expiré'))) {
          this.tokenValid = false;
        }
      } finally {
        this.loading = false;
      }
    }
  },
  mounted() {
    if (!this.resetToken) {
      this.tokenValid = false;
      this.errorMessage = 'Token de réinitialisation manquant';
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

.submit-btn:disabled {
  background-color: var(--border-color);
  cursor: not-allowed;
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

.token-invalid, .reset-success {
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

.password-error {
  color: rgb(239, 68, 68);
  font-size: 0.8rem;
  margin-top: 0.5rem;
}

h2 {
  color: var(--text-primary);
  font-size: 1.5rem;
  margin: 0;
}
</style>
