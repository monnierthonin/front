<template>
  <v-container fluid>
    <v-row>
      <!-- Liste des canaux -->
      <v-col cols="12" md="3">
        <v-card>
          <v-toolbar dense>
            <v-toolbar-title>{{ workspace?.nom || 'Workspace' }}</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn v-if="isOwner" icon @click="showSettings = true">
              <v-icon>mdi-cog</v-icon>
            </v-btn>
            <v-btn icon @click="showCreateCanal = true">
              <v-icon>mdi-plus</v-icon>
            </v-btn>
            <v-btn icon @click="showInviteUser = true">
              <v-icon>mdi-account-plus</v-icon>
            </v-btn>
          </v-toolbar>
          <v-list v-if="canaux && canaux.length > 0">
            <v-list-item
              v-for="canal in canaux"
              :key="canal._id"
              :to="'/workspace/' + workspaceId + '/canal/' + canal._id"
              link
            >
              <v-list-item-title>
                <v-icon small>
                  {{ canal.type === 'vocal' ? 'mdi-microphone' : 'mdi-message-text' }}
                </v-icon>
                {{ canal.visibilite === 'prive' ? '🔒' : '#' }} {{ canal.nom }}
              </v-list-item-title>
            </v-list-item>
          </v-list>
          <v-card-text v-else>
            Aucun canal disponible
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Zone de bienvenue du workspace -->
      <v-col cols="12" md="9">
        <v-card>
          <v-card-title>
            Bienvenue dans {{ workspace?.nom || 'le workspace' }}
          </v-card-title>
          <v-card-text>
            <p v-if="workspace?.description">{{ workspace.description }}</p>
            <p>Sélectionnez un canal pour commencer à discuter ou créez-en un nouveau.</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog création canal -->
    <v-dialog v-model="showCreateCanal" max-width="500px">
      <v-card>
        <v-card-title>
          Créer un nouveau canal
        </v-card-title>
        <v-card-text>
          <v-form ref="canalForm" v-model="validCanal">
            <v-text-field
              v-model="newCanal.nom"
              label="Nom"
              :rules="[rules.required]"
              required
            />
            <v-text-field
              v-model="newCanal.description"
              label="Description"
            />
            <v-select
              v-model="newCanal.type"
              :items="typeOptions"
              item-title="text"
              item-value="value"
              label="Type de canal"
              :rules="[rules.required]"
              required
            />
            <v-select
              v-model="newCanal.visibilite"
              :items="visibiliteOptions"
              item-title="text"
              item-value="value"
              label="Visibilité"
              :rules="[rules.required]"
              required
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            @click="createCanal"
            :loading="loading"
            :disabled="!validCanal"
          >
            Créer
          </v-btn>
          <v-btn
            text
            @click="closeCreateDialog"
          >
            Annuler
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog invitation utilisateur -->
    <v-dialog v-model="showInviteUser" max-width="500px">
      <v-card>
        <v-card-title>
          Inviter un utilisateur
        </v-card-title>
        <v-card-text>
          <v-form ref="inviteForm" v-model="validInvite">
            <v-text-field
              v-model="inviteEmail"
              label="Email"
              :rules="[rules.required, rules.email]"
              required
              :loading="inviteLoading"
              :disabled="inviteLoading"
              placeholder="exemple@email.com"
              hint="Un email d'invitation sera envoyé à cette adresse"
              persistent-hint
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            @click="inviteUser"
            :loading="inviteLoading"
            :disabled="!validInvite || inviteLoading"
          >
            Inviter
          </v-btn>
          <v-btn
            text
            @click="closeInviteDialog"
            :disabled="inviteLoading"
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

    <!-- Dialog paramètres workspace -->
    <v-dialog v-model="showSettings" max-width="500px">
      <v-card>
        <v-card-title>
          Paramètres du workspace
        </v-card-title>
        <v-card-text>
          <v-form ref="settingsForm" v-model="validSettings">
            <v-text-field
              v-model="workspaceSettings.nom"
              label="Nom du workspace"
              :rules="[rules.required]"
              required
            />
            <v-textarea
              v-model="workspaceSettings.description"
              label="Description"
              rows="3"
            />
            <v-select
              v-model="workspaceSettings.visibilite"
              :items="visibiliteOptions"
              item-title="text"
              item-value="value"
              label="Visibilité"
              :rules="[rules.required]"
              required
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            @click="updateWorkspace"
            :loading="loading"
            :disabled="!validSettings"
          >
            Enregistrer
          </v-btn>
          <v-btn
            text
            @click="closeSettingsDialog"
          >
            Annuler
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'

export default defineComponent({
  name: 'WorkspacePage',
  setup() {
    const store = useStore()
    const route = useRoute()

    const showCreateCanal = ref(false)
    const showInviteUser = ref(false)
    const showSettings = ref(false)
    const loading = ref(false)
    const validCanal = ref(false)
    const validInvite = ref(false)
    const validSettings = ref(false)
    const canalForm = ref(null)
    const inviteForm = ref(null)
    const settingsForm = ref(null)

    const typeOptions = [
      { text: 'Canal textuel', value: 'texte' },
      { text: 'Canal vocal', value: 'vocal' }
    ]

    const visibiliteOptions = [
      { text: 'Public', value: 'public' },
      { text: 'Privé', value: 'prive' }
    ]

    const newCanal = ref({
      nom: '',
      description: '',
      type: 'texte',
      visibilite: 'public'
    })

    const inviteEmail = ref('')
    const inviteLoading = ref(false)

    const workspaceSettings = ref({
      nom: '',
      description: '',
      visibilite: 'prive'
    })

    const snackbar = ref({
      show: false,
      text: '',
      color: 'success'
    })

    const rules = {
      required: v => !!v || 'Ce champ est requis',
      email: v => /.+@.+\..+/.test(v) || 'Email invalide'
    }

    const workspaceId = computed(() => route.params.id)
    const workspace = computed(() => store.state.workspace.currentWorkspace)
    const isOwner = computed(() => {
      const currentWorkspace = workspace.value
      const currentUser = store.state.auth.user
      
      if (!currentWorkspace || !currentUser) return false
      return currentWorkspace.proprietaire?._id === currentUser._id
    })
    const canaux = computed(() => store.state.canal.canaux)

    const createCanal = async () => {
      if (!canalForm.value.validate()) return

      loading.value = true
      try {
        console.log('Données du canal à créer:', newCanal.value)
        await store.dispatch('canal/createCanal', {
          workspaceId: workspaceId.value,
          canalData: newCanal.value
        })
        closeCreateDialog()
        snackbar.value = {
          show: true,
          text: 'Canal créé avec succès',
          color: 'success'
        }
      } catch (error) {
        console.error('Erreur création canal:', error)
        snackbar.value = {
          show: true,
          text: error.response?.data?.message || 'Erreur lors de la création du canal',
          color: 'error'
        }
      } finally {
        loading.value = false
      }
    }

    const inviteUser = async () => {
      if (!inviteForm.value.validate()) return

      inviteLoading.value = true
      try {
        await store.dispatch('workspace/inviteUser', {
          workspaceId: workspaceId.value,
          email: inviteEmail.value
        })
        closeInviteDialog()
        snackbar.value = {
          show: true,
          text: 'Invitation envoyée avec succès',
          color: 'success'
        }
      } catch (error) {
        console.error('Erreur invitation:', error)
        snackbar.value = {
          show: true,
          text: error.response?.data?.message || 'Erreur lors de l\'invitation',
          color: 'error'
        }
      } finally {
        inviteLoading.value = false
      }
    }

    const closeCreateDialog = () => {
      showCreateCanal.value = false
      newCanal.value = {
        nom: '',
        description: '',
        type: 'texte',
        visibilite: 'public'
      }
      if (canalForm.value) {
        canalForm.value.reset()
      }
    }

    const closeInviteDialog = () => {
      showInviteUser.value = false
      inviteEmail.value = ''
      if (inviteForm.value) {
        inviteForm.value.reset()
      }
    }

    const closeSettingsDialog = () => {
      showSettings.value = false
      if (workspace.value) {
        workspaceSettings.value = {
          nom: workspace.value.nom,
          description: workspace.value.description || '',
          visibilite: workspace.value.visibilite
        }
      }
      if (settingsForm.value) {
        settingsForm.value.reset()
      }
    }

    const updateWorkspace = async () => {
      if (!settingsForm.value.validate()) return

      loading.value = true
      try {
        await store.dispatch('workspace/updateWorkspace', {
          workspaceId: workspaceId.value,
          workspaceData: workspaceSettings.value
        })
        closeSettingsDialog()
        snackbar.value = {
          show: true,
          text: 'Workspace mis à jour avec succès',
          color: 'success'
        }
      } catch (error) {
        console.error('Erreur mise à jour workspace:', error)
        snackbar.value = {
          show: true,
          text: error.response?.data?.message || 'Erreur lors de la mise à jour du workspace',
          color: 'error'
        }
      } finally {
        loading.value = false
      }
    }

    onMounted(async () => {
      if (workspaceId.value) {
        // Initialiser les paramètres du workspace
        if (workspace.value) {
          workspaceSettings.value = {
            nom: workspace.value.nom,
            description: workspace.value.description || '',
            visibilite: workspace.value.visibilite
          }
        }
        try {
          await store.dispatch('workspace/fetchWorkspace', workspaceId.value)
          await store.dispatch('canal/fetchCanaux', workspaceId.value)
        } catch (error) {
          console.error('Erreur chargement workspace/canaux:', error)
          snackbar.value = {
            show: true,
            text: 'Erreur lors du chargement du workspace',
            color: 'error'
          }
        }
      }
    })

    return {
      workspaceId,
      workspace,
      canaux,
      showCreateCanal,
      showInviteUser,
      loading,
      validCanal,
      validInvite,
      validSettings,
      canalForm,
      inviteForm,
      settingsForm,
      newCanal,
      inviteEmail,
      snackbar,
      rules,
      typeOptions,
      visibiliteOptions,
      createCanal,
      inviteUser,
      closeCreateDialog,
      closeInviteDialog,
      showSettings,
      workspaceSettings,
      isOwner,
      updateWorkspace,
      closeSettingsDialog
    }
  }
})
</script>
