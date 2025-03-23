<template>
  <v-container fluid>
    <v-row>
      <!-- Liste des workspaces -->
      <v-col cols="12" md="3">
        <v-card>
          <v-toolbar dense>
            <v-toolbar-title>Workspaces</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn icon="mdi-plus" @click="showCreateWorkspace = true"></v-btn>
          </v-toolbar>
          <v-list v-if="workspaces && workspaces.length > 0">
            <v-list-item
              v-for="workspace in workspaces"
              :key="workspace._id"
              :to="'/workspace/' + workspace._id"
              link
            >
              <v-list-item-title>{{ workspace.nom }}</v-list-item-title>
            </v-list-item>
          </v-list>
          <v-card-text v-else>
            Aucun workspace disponible
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Zone de bienvenue -->
      <v-col cols="12" md="9">
        <v-card>
          <v-card-title>
            Bienvenue sur SUPCHAT
          </v-card-title>
          <v-card-text>
            <p>Sélectionnez un workspace pour commencer à discuter ou créez-en un nouveau.</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog création workspace -->
    <v-dialog v-model="showCreateWorkspace" max-width="500px">
      <v-card>
        <v-card-title>
          Créer un nouveau workspace
        </v-card-title>
        <v-card-text>
          <v-form ref="form" v-model="valid">
            <v-text-field
              v-model="newWorkspace.nom"
              label="Nom"
              :rules="[rules.required]"
              required
            />
            <v-text-field
              v-model="newWorkspace.description"
              label="Description"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            @click="createWorkspace"
            :loading="loading"
            :disabled="!valid"
          >
            Créer
          </v-btn>
          <v-btn
            text
            @click="closeDialog"
          >
            Annuler
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
  </v-container>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'

export default defineComponent({
  name: 'HomePage',
  setup() {
    const store = useStore()
    const showCreateWorkspace = ref(false)
    const loading = ref(false)
    const valid = ref(false)
    const form = ref(null)

    const newWorkspace = ref({
      nom: '',
      description: ''
    })

    const snackbar = ref({
      show: false,
      text: '',
      color: 'success'
    })

    const rules = {
      required: v => !!v || 'Ce champ est requis'
    }

    const workspaces = computed(() => store.state.workspace.workspaces)

    const createWorkspace = async () => {
      if (!form.value.validate()) return

      loading.value = true
      try {
        await store.dispatch('workspace/createWorkspace', newWorkspace.value)
        closeDialog()
        snackbar.value.text = 'Workspace créé avec succès'
        snackbar.value.color = 'success'
        snackbar.value.show = true
      } catch (error) {
        console.error('Erreur création workspace:', error)
        snackbar.value.text = error.message || 'Erreur lors de la création du workspace'
        snackbar.value.color = 'error'
        snackbar.value.show = true
      } finally {
        loading.value = false
      }
    }

    const closeDialog = () => {
      showCreateWorkspace.value = false
      newWorkspace.value = { nom: '', description: '' }
      if (form.value) {
        form.value.reset()
      }
    }

    onMounted(async () => {
      try {
        await store.dispatch('workspace/fetchWorkspaces')
      } catch (error) {
        console.error('Erreur chargement workspaces:', error)
        snackbar.value.text = 'Erreur lors du chargement des workspaces'
        snackbar.value.color = 'error'
        snackbar.value.show = true
      }
    })

    return {
      showCreateWorkspace,
      newWorkspace,
      loading,
      valid,
      form,
      rules,
      workspaces,
      snackbar,
      createWorkspace,
      closeDialog
    }
  }
})
</script>
