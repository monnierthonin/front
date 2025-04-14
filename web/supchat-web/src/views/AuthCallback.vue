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
        // Vérifier si l'utilisateur est déjà authentifié via le cookie
        const isAuthenticated = await store.dispatch('auth/checkAuth')
        
        if (isAuthenticated) {
          router.replace('/')
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
