<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <img src="../assets/styles/image/logoSupchat.png" alt="Logo SupChat" class="auth-logo">
        <h2>{{ isLogin ? 'Connexion' : 'Inscription' }}</h2>
      </div>

      <AuthForm 
        :isLogin="isLogin"
        @submit="handleSubmit"
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

export default {
  name: 'Auth',
  components: {
    AuthForm,
    SocialLogin,
    AuthToggle
  },
  data() {
    return {
      isLogin: true
    }
  },
  methods: {
    async handleSubmit(form) {
      try {
        if (this.isLogin) {
          // Logique de connexion
          console.log('Tentative de connexion:', form)
        } else {
          // Logique d'inscription
          console.log('Tentative d\'inscription:', form)
        }
      } catch (error) {
        console.error('Erreur:', error)
      }
    },
    toggleAuthMode() {
      this.isLogin = !this.isLogin
    },
    loginWithGoogle() {
      // Intégrer la connexion Google
      console.log('Connexion avec Google')
    },
    loginWithMicrosoft() {
      // Intégrer la connexion Microsoft
      console.log('Connexion avec Microsoft')
    },
    loginWithFacebook() {
      // Intégrer la connexion Facebook
      console.log('Connexion avec Facebook')
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
</style>
