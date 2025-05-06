<template>
  <v-container fluid fill-height>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4" class="text-center">
        <v-progress-circular
          indeterminate
          color="primary"
          size="64"
        ></v-progress-circular>
        <div class="mt-4">Authentification en cours...</div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { defineComponent, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'

export default defineComponent({
  name: 'AuthCallback',
  setup() {
    const router = useRouter()
    const store = useStore()

    onMounted(async () => {
      try {
        // Récupérer le token JWT du cookie et le stocker dans localStorage
        const response = await fetch(`${process.env.VUE_APP_API_URL || 'http://localhost:3000'}/api/v1/auth/token`, {
          method: 'GET',
          credentials: 'include' // Important pour inclure les cookies
        })
        
        const data = await response.json()
        
        if (data.success && data.token) {
          // Stocker le token dans localStorage
          localStorage.setItem('token', data.token)
          
          // Mettre à jour le store avec le token et l'utilisateur
          if (data.data && data.data.user) {
            store.commit('auth/SET_TOKEN', data.token)
            store.commit('auth/SET_USER', data.data.user)
            localStorage.setItem('user', JSON.stringify(data.data.user))
          }
          
          // Vérifier si l'utilisateur est authentifié
          const isAuthenticated = await store.dispatch('auth/checkAuth')
          
          if (isAuthenticated) {
            router.replace('/')
          } else {
            console.error('Erreur: Authentification échouée malgré le token')
            router.replace('/login')
          }
        } else {
          console.error('Erreur: Pas de token d\'authentification')
          router.replace('/login')
        }
      } catch (error) {
        console.error('Erreur lors de l\'authentification:', error)
        router.replace('/login')
      }
    })

    return {}
  }
})
</script>
