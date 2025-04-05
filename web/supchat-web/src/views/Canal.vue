<template>
  <v-container fluid>
    <v-row>
      <!-- Liste des messages -->
      <v-col cols="12" md="9">
        <v-card>
          <v-toolbar>
            <v-toolbar-title>
              {{ canal?.type === 'prive' ? '🔒' : '#' }} {{ canal?.nom }}
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
              <div v-if="messages.length === 0" class="text-center py-4">
                Aucun message dans ce canal
              </div>
              <v-list v-else class="messages-list">
                <v-list-item v-for="message in messagesInOrder" :key="message._id">
                  <v-list-item-content>
                    <v-list-item-subtitle class="text-caption">
                      {{ message.auteur.nom }} - {{ formatDate(message.createdAt) }}
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
              v-model="newMessage"
              placeholder="Écrivez votre message..."
              append-icon="mdi-send"
              @click:append="sendMessage"
              @keyup.enter="sendMessage"
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
            <v-btn icon @click="$refs.fileInput.click()">
              <v-icon>mdi-upload</v-icon>
            </v-btn>
            <input
              ref="fileInput"
              type="file"
              style="display: none"
              @change="handleFileUpload"
              multiple
            >
          </v-toolbar>
          <v-list>
            <v-list-item
              v-for="file in canal?.fichiers"
              :key="file._id"
            >
              <v-list-item-content>
                <v-list-item-title>{{ file.nom }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ formatFileSize(file.taille) }}
                </v-list-item-subtitle>
              </v-list-item-content>
              <v-list-item-action>
                <v-btn
                  icon
                  :href="file.url"
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
        <v-card-title>Membres du canal</v-card-title>
        <v-card-text>
          <v-list>
            <v-list-item v-for="membre in canal?.membres" :key="membre._id">
              <v-list-item-content>
                <v-list-item-title>
                  {{ membre.utilisateur.nom }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ membre.role }}
                </v-list-item-subtitle>
              </v-list-item-content>
              <v-list-item-action v-if="canManageMembers">
                <v-btn icon @click="removeMember(membre)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </v-list-item-action>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Dialog paramètres -->
    <v-dialog v-model="showSettings" max-width="500px">
      <v-card>
        <v-card-title>Paramètres du canal</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="editedCanal.nom"
            label="Nom"
          />
          <v-text-field
            v-model="editedCanal.description"
            label="Description"
          />
          <v-select
            v-model="editedCanal.type"
            :items="typeOptions"
            item-title="text"
            item-value="value"
            label="Type de canal"
          />
          <v-select
            v-model="editedCanal.visibilite"
            :items="visibiliteOptions"
            item-title="text"
            item-value="value"
            label="Visibilité"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="error"
            text
            @click="deleteCanal"
          >
            Supprimer le canal
          </v-btn>
          <v-btn
            color="primary"
            text
            @click="updateCanal"
          >
            Sauvegarder
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog édition message -->
    <v-dialog v-model="showEditMessage" max-width="500px">
      <v-card>
        <v-card-title>Modifier le message</v-card-title>
        <v-card-text>
          <v-textarea
            v-model="editedMessage.contenu"
            label="Message"
            auto-grow
            rows="3"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            text
            @click="showEditMessage = false"
          >
            Annuler
          </v-btn>
          <v-btn
            color="primary"
            text
            @click="updateMessage"
            :loading="updating"
          >
            Sauvegarder
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch, nextTick } from 'vue'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'

export default defineComponent({
  name: 'CanalPage',

  setup() {
    const store = useStore()
    const route = useRoute()
    const messagesContainer = ref(null)

    const showMembers = ref(false)
    const showSettings = ref(false)
    const showEditMessage = ref(false)
    const loading = ref(false)
    const sending = ref(false)
    const updating = ref(false)

    const newMessage = ref('')
    const editedMessage = ref({ _id: null, contenu: '' })

    const typeOptions = [
      { text: 'Canal textuel', value: 'texte' },
      { text: 'Canal vocal', value: 'vocal' }
    ]

    const visibiliteOptions = [
      { text: 'Public', value: 'public' },
      { text: 'Privé', value: 'prive' }
    ]

    const editedCanal = ref({
      nom: '',
      description: '',
      type: 'texte',
      visibilite: 'public'
    })

    const workspaceId = computed(() => route.params.workspaceId)
    const canalId = computed(() => route.params.canalId)
    const canal = computed(() => store.state.canal.currentCanal)
    const messages = computed(() => store.state.message.messages)
    const user = computed(() => store.state.auth.user)

    const canManageMembers = computed(() => {
      if (!canal.value || !user.value) return false
      const membre = canal.value.membres.find(m => 
        m.utilisateur._id === user.value._id
      )
      return membre && membre.role === 'admin'
    })

    const canEditMessage = (message) => {
      return message.auteur._id === user.value._id
    }

    const messagesInOrder = computed(() => {
      return [...messages.value].reverse()
    })

    const loadMessages = async () => {
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

    const sendMessage = async () => {
      if (!newMessage.value.trim()) return

      sending.value = true
      try {
        await store.dispatch('message/sendMessage', {
          workspaceId: workspaceId.value,
          canalId: canalId.value,
          messageData: { contenu: newMessage.value }
        })
        newMessage.value = ''
        await nextTick()
        scrollToBottom()
      } catch (error) {
        console.error('Erreur envoi message:', error)
      } finally {
        sending.value = false
      }
    }

    const scrollToBottom = () => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    }

    watch(() => messages.value, () => {
      nextTick(() => {
        scrollToBottom()
      })
    })

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
          content: editedMessage.value.contenu
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
      if (workspaceId.value && canalId.value) {
        try {
          await store.dispatch('canal/fetchCanal', {
            workspaceId: workspaceId.value,
            canalId: canalId.value
          })
          await loadMessages()
        } catch (error) {
          console.error('Erreur chargement canal:', error)
        }
      }
    })

    return {
      showMembers,
      showSettings,
      showEditMessage,
      loading,
      sending,
      updating,
      newMessage,
      editedMessage,
      editedCanal,
      typeOptions,
      visibiliteOptions,
      canal,
      messages,
      messagesInOrder,
      canManageMembers,
      messagesContainer,
      formatDate,
      formatFileSize,
      canEditMessage,
      sendMessage,
      editMessage,
      updateMessage,
      deleteMessage,
      handleReaction,
      scrollToBottom
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
