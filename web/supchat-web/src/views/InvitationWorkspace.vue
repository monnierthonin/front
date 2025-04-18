<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import axios from 'axios'
import api from '@/plugins/axios'
import { API_URL } from '@/config'

// Créer une instance axios sans intercepteur pour la vérification de l'invitation
const axiosPublic = axios.create({
  withCredentials: true
})

const route = useRoute()
const router = useRouter()
const store = useStore()

const workspaceId = ref('')
const workspaceNom = ref('')
const email = ref('')
const token = ref('')
const estInscrit = ref(false)
const error = ref(null)
const loading = ref(true)
const acceptLoading = ref(false)
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
})

const estConnecte = computed(() => store.getters['auth/isAuthenticated'])

onMounted(async () => {
  try {
    const { workspaceId: id, token: inviteToken } = route.params
    
    // Si on est sur la route d'acceptation et qu'on n'est pas connecté, rediriger vers la connexion
    if (route.name === 'AccepterInvitation' && !estConnecte.value) {
      router.push({
        name: 'Login',
        query: {
          redirect: `/workspaces/invitation/${id}/${inviteToken}/accepter`
        }
      })
      return
    }
    
    console.log('Vérification de l\'invitation avec:', { id, inviteToken })
    const response = await axiosPublic.get(
      `${API_URL}/api/v1/workspaces/invitation/${id}/${inviteToken}/verifier`
    )
    console.log('Réponse du serveur:', response.data)

    // Vérifier que la réponse a la bonne structure
    if (!response.data || typeof response.data.status !== 'string') {
      console.error('Réponse invalide du serveur:', response.data)
      throw new Error('Format de réponse invalide du serveur')
    }

    if (response.data.status === 'error') {
      throw new Error(response.data.message || 'Une erreur est survenue')
    }

    if (response.data.status === 'success' && response.data.data) {
      const { workspaceId: wsId, workspaceNom: wsNom, email: wsEmail, token: wsToken, estInscrit: wsEstInscrit } = response.data.data
      
      // Vérifier que toutes les données requises sont présentes
      if (!wsId || !wsNom || !wsEmail || !wsToken) {
        console.error('Données manquantes dans la réponse:', response.data.data)
        throw new Error('Données manquantes dans la réponse du serveur')
      }

      workspaceId.value = wsId
      workspaceNom.value = wsNom
      email.value = wsEmail
      token.value = wsToken
      estInscrit.value = wsEstInscrit

      // Redirection automatique seulement si nécessaire
      if (route.name === 'InvitationWorkspace') {
        if (!response.data.data.estInscrit) {
          // Si l'utilisateur n'est pas inscrit, rediriger vers la page d'inscription
          router.push({
            name: 'Register',
            query: {
              email: response.data.data.email,
              redirect: `/workspaces/invitation/${id}/${inviteToken}/accepter`
            }
          })
        } else if (!estConnecte.value) {
          // Si l'utilisateur est inscrit mais non connecté, rediriger vers la page de connexion
          router.push({
            name: 'Login',
            query: {
              redirect: `/workspaces/invitation/${id}/${inviteToken}/accepter`
            }
          })
        }
      }
    } else {
      throw new Error(response.data.message || 'Une erreur est survenue')
    }
  } catch (err) {
    console.error('Détails de l\'erreur:', {
      response: err.response?.data,
      message: err.message,
      stack: err.stack
    })
    error.value = err.response?.data?.message || err.message || 'Une erreur est survenue lors de la vérification de l\'invitation'
    // Ne pas rediriger automatiquement en cas d'erreur
    console.error('Erreur lors de la vérification de l\'invitation:', err)
  } finally {
    loading.value = false
  }
})

const accepterInvitation = async () => {
  acceptLoading.value = true
  try {
    const response = await api.get(`${API_URL}/api/v1/workspaces/invitation/${workspaceId.value}/${token.value}/accepter`)
    if (response.data.success) {
      await store.dispatch('auth/checkAuth')
      router.push(`/workspace/${workspaceId.value}`)
    } else {
      throw new Error(response.data.message || 'Une erreur est survenue')
    }
  } catch (err) {
    snackbar.value = {
      show: true,
      text: err.response?.data?.message || err.message || 'Une erreur est survenue lors de l\'acceptation de l\'invitation',
      color: 'error'
    }
  } finally {
    acceptLoading.value = false
  }
}
</script>

<template>
  <v-container fluid class="fill-height">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="elevation-12">
          <v-card-title class="text-center pa-4">
            <h2>Invitation au workspace</h2>
          </v-card-title>

          <v-card-text class="text-center">
            <div v-if="loading" class="text-center">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
              <p class="mt-4">Vérification de l'invitation...</p>
            </div>

            <div v-else-if="error" class="text-center red--text">
              <v-icon large color="error">mdi-alert-circle</v-icon>
              <p class="mt-2">{{ error }}</p>
            </div>

            <div v-else>
              <h3 class="mb-4">{{ workspaceNom }}</h3>
              <p class="mb-4">Vous avez été invité(e) à rejoindre ce workspace avec l'adresse email : <strong>{{ email }}</strong></p>

              <template v-if="!estInscrit">
                <p class="mb-4">Pour rejoindre ce workspace, vous devez d'abord créer un compte avec cette adresse email.</p>
                <v-btn
                  color="primary"
                  :to="{ name: 'Register', query: { email, redirect: `/workspaces/invitation/${workspaceId}/${token}/accepter` }}"
                  block
                >
                  Créer un compte
                </v-btn>
              </template>

              <template v-else-if="!estConnecte">
                <p class="mb-4">Pour rejoindre ce workspace, veuillez vous connecter avec votre compte.</p>
                <v-btn
                  color="primary"
                  :to="{ name: 'Login', query: { redirect: `/workspaces/invitation/${workspaceId}/${token}/accepter` }}"
                  block
                >
                  Se connecter
                </v-btn>
              </template>

              <template v-else>
                <p class="mb-4">Vous pouvez maintenant rejoindre ce workspace.</p>
                <v-btn
                  color="success"
                  :loading="acceptLoading"
                  :disabled="acceptLoading"
                  @click="accepterInvitation"
                  block
                >
                  Rejoindre le workspace
                </v-btn>
              </template>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      timeout="5000"
    >
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>
