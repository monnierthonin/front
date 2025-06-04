<template>
  <div class="auth-callback">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Authentification en cours...</p>
    </div>
    <div v-if="error" class="error">
      <p>{{ errorMessage }}</p>
      <button @click="redirectToLogin" class="retry-btn">Retour à la connexion</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import authService from '@/services/authService'

export default {
  name: 'AuthCallback',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const loading = ref(true)
    const error = ref(false)
    const errorMessage = ref('')

    const redirectToLogin = () => {
      router.push('/auth')
    }

    const getCookieValue = (name) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
      return match ? match[2] : null
    }

    const extractTokenFromCookies = () => {
      // Essayer d'extraire le token JWT du cookie
      return getCookieValue('jwt')
    }

    const handleCallback = async () => {
      try {
        // 1. Essayer d'extraire le token du cookie (le backend l'a placé là)
        const token = extractTokenFromCookies()
        
        if (token) {
          // Stocker le token
          localStorage.setItem('token', token)
          console.log('Token OAuth extrait et stocké avec succès')
          
          // Redirection vers la page d'accueil qui récupèrera le premier workspace
          setTimeout(() => {
            // La route '/' redirige automatiquement vers le premier workspace disponible
            router.push('/')
          }, 100)
        } else {
          // Essayons maintenant d'obtenir le token via l'API
          try {
            const response = await fetch('http://localhost:3000/api/v1/auth/token', {
              method: 'GET',
              credentials: 'include'
            })
            
            const data = await response.json()
            
            if (data.success && data.token) {
              localStorage.setItem('token', data.token)
              console.log('Token récupéré via API après OAuth')
              
              setTimeout(() => {
                // La route '/' redirige automatiquement vers le premier workspace disponible
                router.push('/')
              }, 100)
            } else {
              throw new Error('Pas de token dans la réponse')
            }
          } catch (tokenError) {
            console.error('Erreur lors de la récupération du token:', tokenError)
            throw new Error('Échec de récupération du token après OAuth')
          }
        }
      } catch (err) {
        console.error('Erreur lors du traitement du callback OAuth:', err)
        loading.value = false
        error.value = true
        errorMessage.value = 'Échec de l\'authentification. Veuillez réessayer.'
        console.log('Détails de l\'erreur:', err.message || 'Erreur inconnue')
      }
    }

    onMounted(() => {
      handleCallback()
    })

    return {
      loading,
      error,
      errorMessage,
      redirectToLogin
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
  background-color: var(--bg-color);
  color: var(--text-color);
}

.loading, .error {
  text-align: center;
  padding: 2rem;
  border-radius: 8px;
  max-width: 400px;
  background-color: var(--bg-secondary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.error {
  color: var(--error-color);
}

.retry-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.retry-btn:hover {
  background-color: var(--primary-color-dark);
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 1rem auto;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top-color: var(--primary-color);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
