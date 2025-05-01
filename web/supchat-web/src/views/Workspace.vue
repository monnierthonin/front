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
      <v-col cols="12" md="6">

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

      <!-- Liste des membres -->
      <v-col cols="12" md="3">
        <v-card>
          <v-toolbar dense>
            <v-toolbar-title>Membres</v-toolbar-title>
          </v-toolbar>
          <v-list v-if="workspace?.membres && workspace.membres.length > 0">
            <v-list-item
              v-for="membre in workspace.membres"
              :key="membre._id"
              class="py-2"
            >
              <v-list-item-title class="d-flex align-center">
                <span>
                  {{ 
                    membre.utilisateur ? 
                      (membre.utilisateur.firstName || membre.utilisateur.lastName ? 
                        `${membre.utilisateur.firstName || ''} ${membre.utilisateur.lastName || ''}`.trim() : 
                        membre.utilisateur.username
                      ) : 
                      'Utilisateur inconnu' 
                  }}
                </span>
                <v-chip
                  v-if="membre.utilisateur?._id === workspace.proprietaire?._id"
                  color="primary"
                  size="x-small"
                  class="ml-2"
                >
                  Propriétaire
                </v-chip>
                <v-chip
                  v-else-if="membre.role === 'admin'"
                  color="success"
                  size="x-small"
                  class="ml-2"
                >
                  Admin
                </v-chip>
              </v-list-item-title>
            </v-list-item>
          </v-list>
          <v-card-text v-else>
            Aucun membre
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
            variant="text"
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
          variant="text"
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
import { mapState } from 'vuex'

export default {
  name: 'WorkspaceView',

  data() {
    return {
      showCreateCanal: false,
      showInviteUser: false,
      showSettings: false,

      inviteLoading: false,
      loading: false,
      validCanal: false,
      validInvite: false,
      validSettings: false,
      canalForm: null,
      inviteForm: null,
      settingsForm: null,
      inviteEmail: '',
      newCanal: {
        nom: '',
        description: '',
        type: 'texte',
        visibilite: 'public'
      },
      workspaceSettings: {
        nom: '',
        description: '',
        visibilite: 'public'
      },
      snackbar: {
        show: false,
        text: '',
        color: 'success'
      },
      rules: {
        required: v => !!v || 'Ce champ est requis',
        email: v => /.+@.+\..+/.test(v) || 'Email invalide'
      },
      typeOptions: [
        { text: 'Canal textuel', value: 'texte' },
        { text: 'Canal vocal', value: 'vocal' }
      ],
      visibiliteOptions: [
        { text: 'Public', value: 'public' },
        { text: 'Privé', value: 'prive' }
      ]
    }
  },

  computed: {
    ...mapState({
      user: state => state.auth.user,
      workspace: state => {
        const ws = state.workspace.currentWorkspace
        console.log('Workspace data:', ws)
        return ws
      },
      canaux: state => state.canal.canaux
    }),

    workspaceId() {
      return this.$route.params.id
    },

    isOwner() {
      return this.workspace?.proprietaire === this.user?._id
    },


  },


  methods: {
    async createCanal() {
      if (!this.$refs.canalForm.validate()) return

      this.loading = true
      try {
        const canal = {
          ...this.newCanal,
          workspace: this.workspaceId
        }

        await this.$store.dispatch('canal/createCanal', canal)

        this.snackbar = {
          show: true,
          text: 'Canal créé avec succès',
          color: 'success'
        }

        this.closeCreateDialog()
      } catch (error) {
        console.error('Erreur lors de la création du canal:', error)
        this.snackbar = {
          show: true,
          text: 'Erreur lors de la création du canal',
          color: 'error'
        }
      } finally {
        this.loading = false
      }
    },

    async inviteUser() {
      if (!this.$refs.inviteForm.validate()) return

      this.inviteLoading = true
      try {
        await this.$store.dispatch('workspace/inviteUser', {
          workspaceId: this.workspaceId,
          email: this.inviteEmail
        })

        this.snackbar = {
          show: true,
          text: 'Invitation envoyée avec succès',
          color: 'success'
        }

        this.closeInviteDialog()
      } catch (error) {
        console.error('Erreur lors de l\'invitation:', error)
        this.snackbar = {
          show: true,
          text: 'Erreur lors de l\'envoi de l\'invitation',
          color: 'error'
        }
      } finally {
        this.inviteLoading = false
      }
    },

    closeCreateDialog() {
      this.showCreateCanal = false
      this.newCanal = {
        nom: '',
        description: '',
        type: 'texte',
        visibilite: 'public'
      }
      if (this.$refs.canalForm) {
        this.$refs.canalForm.reset()
      }
    },

    closeInviteDialog() {
      this.showInviteUser = false
      this.inviteEmail = ''
      if (this.$refs.inviteForm) {
        this.$refs.inviteForm.reset()
      }
    },

    closeSettingsDialog() {
      this.showSettings = false
      if (this.workspace) {
        this.workspaceSettings = {
          nom: this.workspace.nom,
          description: this.workspace.description,
          visibilite: this.workspace.visibilite
        }
      }
      if (this.$refs.settingsForm) {
        this.$refs.settingsForm.reset()
      }
    },

    async updateWorkspace() {
      if (!this.$refs.settingsForm.validate()) return

      this.loading = true
      try {
        await this.$store.dispatch('workspace/updateWorkspace', {
          id: this.workspaceId,
          ...this.workspaceSettings
        })

        this.snackbar = {
          show: true,
          text: 'Workspace mis à jour avec succès',
          color: 'success'
        }

        this.closeSettingsDialog()
      } catch (error) {
        console.error('Erreur lors de la mise à jour du workspace:', error)
        this.snackbar = {
          show: true,
          text: 'Erreur lors de la mise à jour du workspace',
          color: 'error'
        }
      } finally {
        this.loading = false
      }
    }

  },

  async mounted() {
    if (this.workspaceId) {
      // Initialiser les paramètres du workspace
      if (this.workspace) {
        this.workspaceSettings = {
          nom: this.workspace.nom,
          description: this.workspace.description,
          visibilite: this.workspace.visibilite
        }
      }

      try {
        await this.$store.dispatch('workspace/fetchWorkspace', this.workspaceId)
        await this.$store.dispatch('canal/fetchCanaux', this.workspaceId)
      } catch (error) {
        console.error('Erreur lors du chargement du workspace:', error)
        this.snackbar = {
          show: true,
          text: 'Erreur lors du chargement du workspace',
          color: 'error'
        }
      }
    }
  }
}
</script>
