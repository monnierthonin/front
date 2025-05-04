<template>
  <v-container fluid>
    <v-row>
      <!-- Liste des messages -->
      <v-col cols="12" md="9">
        <v-card>
          <v-toolbar>
            <v-toolbar-title>
              {{ canal && canal.type === 'prive' ? '🔒' : '#' }} {{ canal && canal.nom }}
            </v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn icon @click="showMembers = true">
              <v-icon>mdi-account-group</v-icon>
            </v-btn>
            <v-btn icon @click="showSettings = true">
              <v-icon>mdi-cog</v-icon>
            </v-btn>
          </v-toolbar>

          <v-card-text class="messages-container" ref="messagesContainer">
            <div v-if="loading" class="text-center">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
            </div>
            <template v-else>
              <div v-if="!messages || messages.length === 0" class="text-center py-4">
                Aucun message dans ce canal
              </div>
              <v-list v-else class="messages-list">
                <v-list-item v-for="message in messagesInOrder" :key="message._id">
                  <v-list-item-content>
                    <v-list-item-subtitle class="text-caption">
                      {{ message.auteur && message.auteur.username ? message.auteur.username : 'Utilisateur inconnu' }} - {{ formatDate(message.createdAt) }}
                      <v-chip x-small v-if="message.modifie" class="ml-2">modifié</v-chip>
                    </v-list-item-subtitle>
                    <v-list-item-title class="text-body-1">
                      {{ message.contenu }}
                    </v-list-item-title>
                    <!-- Fichiers attachés -->
                    <div v-if="message.fichiers && message.fichiers.length > 0" class="mt-2">
                      <v-chip
                        v-for="fichier in message.fichiers"
                        :key="fichier._id"
                        small
                        class="mr-2"
                        :href="fichier.url"
                        target="_blank"
                      >
                        <v-icon left small>mdi-file</v-icon>
                        {{ fichier.nom }}
                      </v-chip>
                    </div>
                    <!-- Réactions -->
                    <div v-if="message.reactions && message.reactions.length > 0" class="mt-2">
                      <v-chip
                        v-for="reaction in message.reactions"
                        :key="reaction.emoji"
                        x-small
                        class="mr-2"
                        @click="handleReaction(message._id, reaction.emoji)"
                      >
                        {{ reaction.emoji }} {{ reaction.utilisateurs.length }}
                      </v-chip>
                    </div>
                  </v-list-item-content>
                  <!-- Actions sur le message -->
                  <v-list-item-action v-if="canEditMessage(message)">
                    <v-menu>
                      <template v-slot:activator="{ on, attrs }">
                        <v-btn
                          icon
                          x-small
                          v-bind="attrs"
                          v-on="on"
                        >
                          <v-icon>mdi-dots-vertical</v-icon>
                        </v-btn>
                      </template>
                      <v-list dense>
                        <v-list-item @click="editMessage(message)">
                          <v-list-item-title>Modifier</v-list-item-title>
                        </v-list-item>
                        <v-list-item @click="deleteMessage(message._id)">
                          <v-list-item-title class="error--text">Supprimer</v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-menu>
                  </v-list-item-action>
                </v-list-item>
              </v-list>
            </template>
          </v-card-text>

          <!-- Zone de saisie de message -->
          <v-card-actions>
            <v-text-field
              v-model="contenuMessage"
              placeholder="Écrivez votre message..."
              append-icon="mdi-send"
              @click:append="envoyerMessage"
              @keyup.enter="envoyerMessage"
              :loading="sending"
              hide-details
              dense
              class="mx-4"
            ></v-text-field>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- Liste des fichiers -->
      <v-col cols="12" md="3">
        <v-card>
          <v-toolbar dense>
            <v-toolbar-title>Fichiers</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn icon @click="showUploadDialog = true">
              <v-icon>mdi-upload</v-icon>
            </v-btn>
          </v-toolbar>
          <v-list dense v-if="fichiers && fichiers.length > 0">
            <v-list-item v-for="fichier in fichiers" :key="fichier._id">
              <v-list-item-content>
                <v-list-item-title>{{ fichier.nom }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ formatFileSize(fichier.taille) }} - 
                  {{ fichier.auteur ? fichier.auteur.username : 'Inconnu' }}
                </v-list-item-subtitle>
              </v-list-item-content>
              <v-list-item-action>
                <v-btn
                  icon
                  small
                  :href="fichier.url"
                  target="_blank"
                >
                  <v-icon>mdi-download</v-icon>
                </v-btn>
              </v-list-item-action>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog membres -->
    <v-dialog v-model="showMembers" max-width="600px">
      <v-card>
        <v-card-title class="d-flex align-center">
          Membres du canal
          <v-spacer></v-spacer>
          <v-btn 
            v-if="isAdmin" 
            icon 
            color="primary" 
            @click="showInviteDialog = true"
            class="ml-2"
          >
            <v-icon>mdi-plus</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-list>
            <v-list-item v-for="(membre, index) in canal && canal.membres ? canal.membres : []" :key="membre._id || membre.id || index">
              <v-list-item-avatar>
                <v-avatar>
                  <v-img v-if="membre.utilisateur && membre.utilisateur.profilePicture" :src="membre.utilisateur.profilePicture"></v-img>
                  <v-icon v-else>mdi-account</v-icon>
                </v-avatar>
              </v-list-item-avatar>
              <v-list-item-content>
                <v-list-item-title>
                  {{ membre.utilisateur && membre.utilisateur.username ? membre.utilisateur.username : 'Utilisateur inconnu' }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  <v-chip :color="membre.role === 'admin' ? 'red' : 'blue'" small>{{ membre.role }}</v-chip>
                </v-list-item-subtitle>
              </v-list-item-content>
              <v-list-item-action v-if="canManageMembers">
                <v-btn icon @click="removeMember(membre._id)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </v-list-item-action>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Dialog invitation membres -->
    <v-dialog v-model="showInviteDialog" max-width="600px">
      <v-card>
        <v-card-title>Inviter des membres</v-card-title>
        <v-card-text>
          <v-alert v-if="inviteError" type="error" dense>{{ inviteError }}</v-alert>
          <v-alert v-if="inviteSuccess" type="success" dense>{{ inviteSuccess }}</v-alert>
          
          <div v-if="loadingWorkspaceMembers" class="text-center">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
          </div>
          
          <div v-else-if="workspaceMembers.length === 0" class="text-center">
            Aucun membre disponible à inviter.
          </div>
          
          <v-list v-else>
            <v-list-item 
              v-for="membre in nonCanalMembers" 
              :key="membre._id || membre.id"
            >
              <v-list-item-avatar>
                <v-avatar>
                  <v-img v-if="membre.utilisateur && membre.utilisateur.profilePicture" :src="membre.utilisateur.profilePicture"></v-img>
                  <v-icon v-else>mdi-account</v-icon>
                </v-avatar>
              </v-list-item-avatar>
              <v-list-item-content>
                <v-list-item-title>
                  {{ membre.utilisateur ? membre.utilisateur.username : 'Utilisateur inconnu' }}
                </v-list-item-title>
              </v-list-item-content>
              <v-list-item-action>
                <v-btn small color="primary" @click="inviteMember(membre.utilisateur._id)">
                  Inviter
                </v-btn>
              </v-list-item-action>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showInviteDialog = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog paramètres -->
    <v-dialog v-model="showSettings" max-width="600px">
      <v-card>
        <v-card-title>Paramètres du canal</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="updateCanal">
            <v-text-field
              v-model="editedCanal.nom"
              label="Nom du canal"
              required
            ></v-text-field>
            <v-textarea
              v-model="editedCanal.description"
              label="Description"
              rows="3"
            ></v-textarea>
            <v-select
              v-model="editedCanal.type"
              :items="typeOptions"
              label="Type de canal"
            ></v-select>
            <v-select
              v-model="editedCanal.visibilite"
              :items="visibiliteOptions"
              label="Visibilité"
            ></v-select>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" text @click="deleteCanal">
            Supprimer le canal
          </v-btn>
          <v-btn color="primary" text @click="updateCanal">
            Enregistrer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog édition de message -->
    <v-dialog v-model="showEditMessage" max-width="600px">
      <v-card>
        <v-card-title>Modifier le message</v-card-title>
        <v-card-text>
          <v-textarea
            v-model="editedMessage.contenu"
            label="Message"
            rows="5"
            autofocus
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey darken-1" text @click="showEditMessage = false">
            Annuler
          </v-btn>
          <v-btn color="primary" text @click="updateMessage" :loading="updating">
            Enregistrer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog upload de fichier -->
    <v-dialog v-model="showUploadDialog" max-width="600px">
      <v-card>
        <v-card-title>Ajouter un fichier</v-card-title>
        <v-card-text>
          <v-file-input
            v-model="fileToUpload"
            label="Sélectionnez un fichier"
            prepend-icon="mdi-paperclip"
            show-size
          ></v-file-input>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey darken-1" text @click="showUploadDialog = false">
            Annuler
          </v-btn>
          <v-btn color="primary" text @click="uploadFile" :loading="uploading">
            Envoyer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { defineComponent, ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import socketService from '@/services/socketService'

export default defineComponent({
  name: 'CanalView',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const store = useStore()
    
    const messagesContainer = ref(null)
    const showMembers = ref(false)
    const showSettings = ref(false)
    const showEditMessage = ref(false)
    const showUploadDialog = ref(false)
    const showInviteDialog = ref(false)
    const inviteError = ref('')
    const inviteSuccess = ref('')
    const workspaceMembers = ref([])
    const loadingWorkspaceMembers = ref(false)
    const loading = ref(true)
    const sending = ref(false)
    const updating = ref(false)
    const uploading = ref(false)
    const contenuMessage = ref('')
    const fileToUpload = ref(null)
    const editedMessage = ref({
      _id: '',
      contenu: ''
    })
    const editedCanal = ref({
      nom: '',
      description: '',
      type: 'texte',
      visibilite: 'public'
    })

    const typeOptions = [
      { text: 'Texte', value: 'texte' },
      { text: 'Privé', value: 'prive' }
    ]

    const visibiliteOptions = [
      { text: 'Public', value: 'public' },
      { text: 'Privé', value: 'prive' }
    ]

    const workspaceId = computed(() => route.params.workspaceId)
    const canalId = computed(() => route.params.canalId)
    const canal = computed(() => store.state.canal.canalActif)
    const messages = computed(() => store.getters['message/allMessages'])
    const user = computed(() => store.state.auth.user)
    const fichiers = computed(() => {
      if (!messages.value) return []
      const allFiles = []
      messages.value.forEach(message => {
        if (message.fichiers && message.fichiers.length) {
          message.fichiers.forEach(file => {
            allFiles.push({
              ...file,
              auteur: message.auteur
            })
          })
        }
      })
      return allFiles
    })

    const canManageMembers = computed(() => {
      if (!canal.value || !canal.value.membres) return false
      const userMembre = canal.value.membres.find(m => m.utilisateur._id === user.value._id)
      return userMembre && ['admin', 'moderateur'].includes(userMembre.role)
    })
    
    const isAdmin = computed(() => {
      if (!canal.value || !canal.value.membres) return false
      const userMembre = canal.value.membres.find(m => m.utilisateur._id === user.value._id)
      return userMembre && userMembre.role === 'admin'
    })
    
    const nonCanalMembers = computed(() => {
      if (!canal.value || !canal.value.membres || !workspaceMembers.value) return []
      
      // Récupérer les IDs des membres déjà dans le canal
      const canalMemberIds = canal.value.membres.map(m => 
        m.utilisateur._id || (typeof m.utilisateur === 'string' ? m.utilisateur : null)
      )
      
      // Filtrer les membres du workspace qui ne sont pas déjà dans le canal
      return workspaceMembers.value.filter(m => {
        const userId = m.utilisateur._id || (typeof m.utilisateur === 'string' ? m.utilisateur : null)
        return userId && !canalMemberIds.includes(userId)
      })
    })

    const canEditMessage = (message) => {
      return message && message.auteur && user.value && message.auteur._id === user.value._id
    }

    const messagesInOrder = computed(() => {
      console.log('Computing messagesInOrder with messages:', messages.value);
      if (!messages.value) return []
      const sortedMessages = [...messages.value].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).reverse();
      console.log('Sorted messages:', sortedMessages);
      return sortedMessages;
    })

    const loadMessages = async () => {
      try {
        await store.dispatch('canal/chargerMessages', {
          workspaceId: workspaceId.value,
          canalId: canalId.value
        });
      } catch (error) {
        console.error('Erreur lors du chargement des messages:', error);
      }
      loading.value = true
      try {
        await store.dispatch('message/fetchMessages', {
          workspaceId: workspaceId.value,
          canalId: canalId.value
        })
      } catch (error) {
        console.error('Erreur chargement messages:', error)
      } finally {
        loading.value = false
      }
    }

    const envoyerMessage = async () => {
      if (!contenuMessage.value.trim()) return
      sending.value = true
      try {
        console.log('Envoi du message...');
        const message = await store.dispatch('canal/envoyerMessage', {
          workspaceId: workspaceId.value,
          canalId: canalId.value,
          contenu: contenuMessage.value
        })
        console.log('Message envoyé:', message);
        contenuMessage.value = ''
        // Plus besoin de recharger les messages car le store est mis à jour automatiquement
      } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error)
      } finally {
        sending.value = false
      }
    }

    const scrollToBottom = () => {
      nextTick(() => {
        if (messagesContainer.value) {
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
        }
      })
    }

    const editMessage = (message) => {
      editedMessage.value = {
        _id: message._id,
        contenu: message.contenu
      }
      showEditMessage.value = true
    }

    const updateMessage = async () => {
      if (!editedMessage.value.contenu.trim()) return
      
      updating.value = true
      try {
        await store.dispatch('message/updateMessage', {
          workspaceId: workspaceId.value,
          canalId: canalId.value,
          messageId: editedMessage.value._id,
          messageData: { contenu: editedMessage.value.contenu }
        })
        showEditMessage.value = false
      } catch (error) {
        console.error('Erreur modification message:', error)
      } finally {
        updating.value = false
      }
    }

    const deleteMessage = async (messageId) => {
      try {
        await store.dispatch('message/deleteMessage', {
          workspaceId: workspaceId.value,
          canalId: canalId.value,
          messageId
        })
      } catch (error) {
        console.error('Erreur suppression message:', error)
      }
    }

    const handleReaction = async (messageId, emoji) => {
      try {
        await store.dispatch('message/reactToMessage', {
          workspaceId: workspaceId.value,
          canalId: canalId.value,
          messageId,
          emoji
        })
      } catch (error) {
        console.error('Erreur réaction:', error)
      }
    }

    const updateCanal = async () => {
      try {
        await store.dispatch('canal/updateCanal', {
          workspaceId: workspaceId.value,
          canalId: canalId.value,
          canalData: editedCanal.value
        })
        showSettings.value = false
      } catch (error) {
        console.error('Erreur lors de la mise à jour du canal:', error)
      }
    }

    const deleteCanal = async () => {
      if (!confirm('Êtes-vous sûr de vouloir supprimer ce canal ? Cette action est irréversible.')) {
        return
      }
      try {
        await store.dispatch('canal/deleteCanal', {
          workspaceId: workspaceId.value,
          canalId: canalId.value
        })
        router.push(`/workspaces/${workspaceId.value}`)
      } catch (error) {
        console.error('Erreur lors de la suppression du canal:', error)
      }
    }

    const uploadFile = async () => {
      if (!fileToUpload.value) return
      
      uploading.value = true
      try {
        const formData = new FormData()
        formData.append('file', fileToUpload.value)
        
        await store.dispatch('fichier/uploadFile', {
          workspaceId: workspaceId.value,
          canalId: canalId.value,
          formData
        })
        
        showUploadDialog.value = false
        fileToUpload.value = null
      } catch (error) {
        console.error('Erreur d\'upload:', error)
      } finally {
        uploading.value = false
      }
    }

    const fetchWorkspaceMembers = async () => {
      loadingWorkspaceMembers.value = true
      try {
        const workspace = await store.dispatch('workspace/fetchWorkspace', workspaceId.value)
        workspaceMembers.value = workspace.membres || []
      } catch (error) {
        console.error('Erreur chargement membres du workspace:', error)
      } finally {
        loadingWorkspaceMembers.value = false
      }
    }
    
    const inviteMember = async (userId) => {
      inviteError.value = ''
      inviteSuccess.value = ''
      try {
        await store.dispatch('canal/addMember', {
          workspaceId: workspaceId.value,
          canalId: canalId.value,
          userId: userId
        })
        inviteSuccess.value = 'Membre ajouté avec succès!'
        setTimeout(() => { inviteSuccess.value = '' }, 3000)
      } catch (error) {
        console.error('Erreur invitation membre:', error)
        inviteError.value = error.response?.data?.message || 'Erreur lors de l\'invitation'
      }
    }
    
    const removeMember = async (membreId) => {
      try {
        await store.dispatch('canal/removeMember', {
          workspaceId: workspaceId.value,
          canalId: canalId.value,
          membreId
        })
      } catch (error) {
        console.error('Erreur retrait membre:', error)
      }
    }

    watch(() => canal.value, (newCanal) => {
      if (newCanal) {
        editedCanal.value = {
          nom: newCanal.nom || '',
          description: newCanal.description || '',
          type: newCanal.type || 'texte',
          visibilite: newCanal.visibilite || 'public'
        }
      }
    }, { immediate: true })
    
    watch(() => showInviteDialog.value, (isOpen) => {
      if (isOpen) {
        fetchWorkspaceMembers()
      }
    })
    
    // Observer les changements dans les messages
    watch(() => messages.value, (newMessages, oldMessages) => {
      console.log('Messages changés:', {
        nouveaux: newMessages?.length,
        anciens: oldMessages?.length,
        diff: newMessages?.length - oldMessages?.length
      });
      if (newMessages?.length !== oldMessages?.length) {
        console.log('Nouveau message détecté, scroll vers le bas');
        scrollToBottom();
      }
    }, { deep: true })

    const formatDate = (date) => {
      return new Date(date).toLocaleString()
    }

    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    onMounted(async () => {
      console.log('Canal component mounted');
      
      try {
        // S'assurer que l'auth est initialisée
        await store.dispatch('auth/initAuth');
        const token = localStorage.getItem('token');
        console.log('Token disponible:', !!token);
        
        if (!token) {
          console.error('Pas de token disponible, redirection vers la page de connexion');
          router.push('/connexion');
          return;
        }
        
        // Initialiser le WebSocket et attendre la connexion
        console.log('Initialisation du WebSocket...');
        await socketService.init();
        console.log('WebSocket initialisé avec succès');
        
        // Rejoindre le canal
        if (canalId.value) {
          console.log('Joining canal:', canalId.value);
          socketService.joinCanal(canalId.value);
        }
        if (workspaceId.value && canalId.value) {
          try {
            console.log('Chargement du canal et des messages...');
            await store.dispatch('canal/fetchCanal', {
              workspaceId: workspaceId.value,
              canalId: canalId.value
            })
            await loadMessages()
            console.log('Messages chargés');
            scrollToBottom()
          } catch (error) {
            console.error('Erreur chargement canal:', error)
          }
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
      }
    })

    onUnmounted(() => {
      console.log('Canal component unmounting, disconnecting socket');
      socketService.disconnect();
    })

    return {
      showMembers,
      showSettings,
      showEditMessage,
      showUploadDialog,
      showInviteDialog,
      inviteError,
      inviteSuccess,
      workspaceMembers,
      loadingWorkspaceMembers,
      loading,
      sending,
      updating,
      uploading,
      contenuMessage,
      editedMessage,
      editedCanal,
      typeOptions,
      visibiliteOptions,
      canal,
      messages,
      messagesInOrder,
      user,
      fichiers,
      canManageMembers,
      isAdmin,
      nonCanalMembers,
      messagesContainer,
      formatDate,
      formatFileSize,
      canEditMessage,
      envoyerMessage,
      editMessage,
      updateMessage,
      deleteMessage,
      handleReaction,
      scrollToBottom,
      updateCanal,
      deleteCanal,
      uploadFile,
      inviteMember,
      removeMember,
      fetchWorkspaceMembers
    }
  }
})
</script>

<style scoped>
.messages-container {
  height: calc(100vh - 300px);
  overflow-y: auto;
}

.messages-list {
  display: flex;
  flex-direction: column;
}
</style>
