<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <v-toolbar-title>SupChat</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon to="/profile" title="Profil">
        <v-icon>mdi-account</v-icon>
      </v-btn>
      <v-btn icon @click="handleLogout" title="Déconnexion">
        <v-icon>mdi-logout</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <v-container fluid>
        <v-row>
          <!-- Liste des workspaces -->
          <v-col cols="12" sm="3">
            <v-card>
              <v-toolbar color="primary" dark>
                <v-toolbar-title>Workspaces</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-btn icon @click="showCreateWorkspaceDialog = true">
                  <v-icon>mdi-plus</v-icon>
                </v-btn>
              </v-toolbar>
              <v-list>
                <v-list-item
                  v-for="workspace in workspaces"
                  :key="workspace._id"
                  :to="'/workspace/' + workspace._id"
                  :class="{ 'primary--text': workspace._id === currentWorkspaceId }"
                >
                  <v-list-item-title>{{ workspace.name }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card>
          </v-col>

          <!-- Zone principale -->
          <v-col cols="12" sm="9">
            <v-card v-if="!currentWorkspaceId" class="text-center pa-6">
              <v-icon size="64" color="primary">mdi-chat</v-icon>
              <h2 class="text-h5 mt-4">Bienvenue sur SupChat</h2>
              <p class="text-body-1 mt-2">
                Sélectionnez un workspace pour commencer à discuter ou créez-en un nouveau.
              </p>
            </v-card>
            <router-view v-else></router-view>
          </v-col>
        </v-row>
      </v-container>

      <!-- Dialog de création de workspace -->
      <v-dialog v-model="showCreateWorkspaceDialog" max-width="500px">
        <v-card>
          <v-card-title>
            <span class="text-h5">Créer un nouveau workspace</span>
          </v-card-title>

          <v-card-text>
            <v-form ref="form" v-model="isValid">
              <v-text-field
                v-model="newWorkspace.name"
                :rules="nameRules"
                label="Nom du workspace"
                required
              ></v-text-field>

              <v-text-field
                v-model="newWorkspace.description"
                label="Description"
              ></v-text-field>
            </v-form>
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              color="blue darken-1"
              text
              @click="showCreateWorkspaceDialog = false"
            >
              Annuler
            </v-btn>
            <v-btn
              color="blue darken-1"
              text
              @click="createWorkspace"
              :disabled="!isValid"
            >
              Créer
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Snackbar pour les messages -->
      <v-snackbar v-model="snackbar.show" :color="snackbar.color">
        {{ snackbar.text }}
      </v-snackbar>
    </v-main>
  </v-app>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'

export default defineComponent({
  name: 'HomePage',

  setup() {
    const store = useStore()
    const router = useRouter()
    const route = useRoute()
    const form = ref(null)

    // État local
    const showCreateWorkspaceDialog = ref(false)
    const isValid = ref(false)
    const newWorkspace = ref({
      name: '',
      description: ''
    })
    const snackbar = ref({
      show: false,
      text: '',
      color: 'success'
    })

    // Règles de validation
    const nameRules = [
      v => !!v || 'Le nom est requis',
      v => (v && v.length >= 3) || 'Le nom doit contenir au moins 3 caractères'
    ]

    // Computed properties
    const workspaces = computed(() => store.state.workspace.workspaces)
    const currentWorkspaceId = computed(() => {
      const workspaceId = route.params.id
      return workspaceId !== 'undefined' ? workspaceId : null
    })

    // Méthodes
    const createWorkspace = async () => {
      if (!form.value.validate()) return

      try {
        await store.dispatch('workspace/createWorkspace', newWorkspace.value)
        showCreateWorkspaceDialog.value = false
        snackbar.value = {
          show: true,
          text: 'Workspace créé avec succès',
          color: 'success'
        }
        form.value.reset()
      } catch (error) {
        snackbar.value = {
          show: true,
          text: error.message || 'Erreur lors de la création du workspace',
          color: 'error'
        }
      }
    }

    const handleLogout = async () => {
      try {
        await store.dispatch('auth/logout')
        router.push('/login')
      } catch (error) {
        console.error('Erreur lors de la déconnexion:', error)
      }
    }

    // Chargement initial
    onMounted(async () => {
      try {
        await store.dispatch('workspace/fetchWorkspaces')
      } catch (error) {
        console.error('Erreur lors du chargement des workspaces:', error)
        snackbar.value = {
          show: true,
          text: 'Erreur lors du chargement des workspaces',
          color: 'error'
        }
      }
    })

    return {
      showCreateWorkspaceDialog,
      isValid,
      newWorkspace,
      snackbar,
      nameRules,
      workspaces,
      currentWorkspaceId,
      form,
      createWorkspace,
      handleLogout
    }
  }
})
</script>
