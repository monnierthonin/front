<template>
  <div class="auth-callback">
    <div v-if="loading" class="loading">
      <p>Authentification en cours...</p>
    </div>
  </div>
</template>

<script>
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'AuthCallback',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const authStore = useAuthStore()

    const handleCallback = async () => {
      try {
        const token = route.query.token
        const message = route.query.message

        if (message === 'google_auth_success' && token) {
          // Stocker le token
          await authStore.setToken(token)
          
          // Rediriger vers la page principale
          router.push('/')
        } else if (route.query.error) {
          // Gérer l'erreur
          console.error('Erreur d\'authentification:', route.query.error)
          router.push('/login?error=auth_failed')
        }
      } catch (error) {
        console.error('Erreur lors du traitement du callback:', error)
        router.push('/login?error=callback_error')
      }
    }

    // Exécuter dès le montage du composant
    handleCallback()

    return {
      loading: true
    }
  }
}
</script>

<style scoped>
.auth-callback {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.loading {
  text-align: center;
}
</style>
