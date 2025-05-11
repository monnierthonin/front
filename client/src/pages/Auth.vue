<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <img src="../assets/styles/image/logoSupchat.png" alt="Logo SupChat" class="auth-logo">
        <h2>{{ isLogin ? 'Connexion' : 'Inscription' }}</h2>
      </div>

      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>

      <AuthForm 
        :isLogin="isLogin"
        @submit="handleSubmit"
        :loading="loading"
      />

      <SocialLogin
        @google-login="loginWithGoogle"
        @microsoft-login="loginWithMicrosoft"
        @facebook-login="loginWithFacebook"
      />

      <AuthToggle
        :isLogin="isLogin"
        @toggle="toggleAuthMode"
      />
    </div>
  </div>
</template>

<script>
import AuthForm from '../components/AuthFile/AuthForm.vue'
import SocialLogin from '../components/AuthFile/SocialLogin.vue'
import AuthToggle from '../components/AuthFile/AuthToggle.vue'
import authService from '../services/authService'
import userService from '../services/userService.js'

export default {
  name: 'Auth',
  components: {
    AuthForm,
    SocialLogin,
    AuthToggle
  },
  data() {
    return {
      isLogin: true,
      loading: false,
      errorMessage: '',
      successMessage: ''
    }
  },
  methods: {
    async handleSubmit(form) {
      this.errorMessage = ''
      this.successMessage = ''
      this.loading = true
      
      try {
        if (this.isLogin) {
          // Logique de connexion
          console.log('Tentative de connexion avec:', form)
          const response = await authService.login({
            email: form.email,
            password: form.password
          })
          
          this.successMessage = 'Connexion réussie!'
          console.log('Connexion réussie:', response)
          
          // Charger et appliquer le thème de l'utilisateur avant la redirection
          await this.loadUserTheme()
          
          // Rediriger vers la page d'accueil après 1 seconde
          setTimeout(() => {
            this.$router.push('/')
          }, 1000)
        } else {
          // Logique d'inscription
          console.log('Tentative d\'inscription avec:', form)
          const response = await authService.register({
            username: form.username,
            email: form.email,
            password: form.password,
            confirmPassword: form.confirmPassword // Ajouter la confirmation du mot de passe
          })
          
          this.successMessage = 'Inscription réussie! Un email de vérification a été envoyé.'
          console.log('Inscription réussie:', response)
          
          // Passer en mode connexion après 2 secondes
          setTimeout(() => {
            this.isLogin = true
          }, 2000)
        }
      } catch (error) {
        this.errorMessage = error.message || 'Une erreur est survenue. Veuillez réessayer.'
        console.error('Erreur d\'authentification:', error)
      } finally {
        this.loading = false
      }
    },
    toggleAuthMode() {
      this.isLogin = !this.isLogin
      this.errorMessage = ''
      this.successMessage = ''
    },
    loginWithGoogle() {
      // Rediriger vers la route d'authentification Google
      window.location.href = 'http://localhost:3000/api/v1/auth/google'
    },
    loginWithMicrosoft() {
      // Rediriger vers la route d'authentification Microsoft
      window.location.href = 'http://localhost:3000/api/v1/auth/microsoft'
    },
    loginWithFacebook() {
      // Rediriger vers la route d'authentification Facebook
      window.location.href = 'http://localhost:3000/api/v1/auth/facebook'
    },
    
    /**
     * Charge et applique le thème de l'utilisateur depuis l'API après connexion
     */
    async loadUserTheme() {
      try {
        // Récupérer le profil de l'utilisateur depuis l'API
        const response = await userService.getProfile();
        
        if (response && response.data) {
          // Convertir le thème du français vers l'anglais
          let theme = 'dark'; // Par défaut sombre
          
          // Si le thème existe dans le profil, le convertir
          if (response.data.theme) {
            theme = response.data.theme === 'sombre' ? 'dark' : 'light';
            console.log('Thème récupéré après connexion:', response.data.theme, '->', theme);
          }
          
          // Sauvegarder dans localStorage pour les futurs chargements
          localStorage.setItem('theme', theme);
          
          // Appliquer le thème directement
          if (theme === 'dark') {
            document.documentElement.classList.remove('light-theme');
            document.documentElement.classList.add('dark-theme');
          } else {
            document.documentElement.classList.remove('dark-theme');
            document.documentElement.classList.add('light-theme');
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement du thème après connexion:', error);
        // En cas d'erreur, appliquer le thème par défaut (sombre)
        localStorage.setItem('theme', 'dark');
        document.documentElement.classList.remove('light-theme');
        document.documentElement.classList.add('dark-theme');
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

h2 {
  color: var(--text-primary);
  font-size: 1.5rem;
  margin: 0;
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
</style>
