<template>
  <v-app>
    <v-app-bar app color="primary" dark v-if="isAuthenticated">
      <v-toolbar-title>SupChat</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn text to="/">
        <v-icon left>mdi-home</v-icon>
        Accueil
      </v-btn>
      <v-btn text to="/messages">
        <v-icon left>mdi-message-text</v-icon>
        Messages
      </v-btn>
      <v-btn text to="/profile">
        <v-icon left>mdi-account</v-icon>
        Profil
      </v-btn>
      <v-btn text @click="handleLogout">
        <v-icon left>mdi-logout</v-icon>
        Déconnexion
      </v-btn>
    </v-app-bar>

    <v-main>
      <router-view></router-view>
    </v-main>

    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
    >
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn
          text
          @click="snackbar.show = false"
        >
          Fermer
        </v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script>
import { defineComponent, onMounted, computed, reactive } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

export default defineComponent({
  name: 'App',
  setup() {
    const store = useStore()
    const router = useRouter()

    const isAuthenticated = computed(() => store.getters['auth/isAuthenticated'])

    const handleLogout = async () => {
      try {
        await store.dispatch('auth/logout')
        router.push('/login')
      } catch (error) {
        console.error('Erreur déconnexion:', error)
        snackbar.text = 'Erreur lors de la déconnexion'
        snackbar.color = 'error'
        snackbar.show = true
      }
    }

    const snackbar = reactive({
      show: false,
      text: '',
      color: 'success'
    })

    onMounted(() => {
      // Initialiser l'état d'authentification au démarrage
      store.dispatch('auth/initAuth')
    })

    return {
      isAuthenticated,
      handleLogout,
      snackbar
    }
  }
})
</script>

<style>
.v-application {
  font-family: 'Roboto', sans-serif;
}
</style>
