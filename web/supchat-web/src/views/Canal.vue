<template>
  <div>
    <!-- Notification -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000" bottom right>
      {{ snackbar.text }}
      <template v-slot:action="{ attrs }">
        <v-btn text v-bind="attrs" @click="snackbar.show = false">Fermer</v-btn>
      </template>
    </v-snackbar>
    

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
              <!-- Utilisation d'une liste paginée pour éviter les problèmes de performance -->
              <v-list v-else class="messages-list">
                <!-- Bouton pour charger plus de messages -->
                <div v-if="hasMoreMessages" class="text-center py-2 mb-2">
                  <v-btn text color="primary" @click="loadMoreMessages" :disabled="loadingMore">
                    Afficher plus de messages
                    <v-progress-circular v-if="loadingMore" indeterminate size="16" width="2" class="ml-2"></v-progress-circular>
                  </v-btn>
                </div>
                
                <!-- Affichage des messages par lots -->
                <v-list-item v-for="message in visibleMessages" :key="message._id">
                  <v-list-item-content>
                    <v-list-item-title class="d-flex align-center">
                      <span class="font-weight-bold">{{ message.auteur ? message.auteur.username : 'Utilisateur' }}</span>
                      <v-chip x-small class="ml-2" v-if="message.modifie">modifié</v-chip>
                      <v-spacer></v-spacer>
                      <span class="text-caption">{{ formatDate(message.createdAt) }}</span>
                    </v-list-item-title>
                    
                    <!-- Affichage de la référence au message original si c'est une réponse -->
                    <div v-if="message.reponseA" class="reply-reference mb-1 pa-2">
                      <div class="d-flex align-center">
                        <v-icon small class="mr-1">mdi-reply</v-icon>
                        <span class="text-caption font-weight-medium">Réponse à {{ message.reponseA.auteur ? message.reponseA.auteur.username : 'Utilisateur' }}</span>
                      </div>
                      <div class="text-caption grey--text text--darken-1 text-truncate reply-preview">
                        {{ message.reponseA.contenu }}
                      </div>
                    </div>
                    
                    <v-list-item-subtitle v-html="formatMessageContent(message)"></v-list-item-subtitle>
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
                    <div class="mt-2 d-flex align-center">
                      <div v-if="message.reactions && message.reactions.length > 0" class="mr-2">
                        <v-chip
                          v-for="reaction in message.reactions"
                          :key="reaction.emoji"
                          x-small
                          class="mr-1"
                          @click="handleReaction(message._id, reaction.emoji)"
                        >
                          {{ reaction.emoji }} {{ reaction.utilisateurs.length }}
                        </v-chip>
                      </div>
                      <!-- Bouton pour ajouter une réaction -->
                      <v-btn
                        icon
                        x-small
                        class="ml-1"
                        @click="openEmojiDialog(message._id)"
                      >
                        <v-icon>mdi-emoticon-outline</v-icon>
                      </v-btn>
                    </div>
                  </v-list-item-content>
                  <!-- Actions sur le message -->
                  <v-list-item-action>
                    <div class="d-flex">
                      <!-- Bouton de réponse pour tous les messages -->
                      <v-btn
                        icon
                        x-small
                        class="mr-1"
                        @click="openReplyDialog(message)"
                        title="Répondre"
                      >
                        <v-icon>mdi-reply</v-icon>
                      </v-btn>
                      
                      <!-- Bouton d'actions pour les messages de l'utilisateur -->
                      <v-btn
                        v-if="message.auteur && user && message.auteur._id === user._id"
                        icon
                        x-small
                        @click="openMessageActionsDialog(message)"
                        title="Plus d'actions"
                      >
                        <v-icon>mdi-dots-vertical</v-icon>
                      </v-btn>
                    </div>
                  </v-list-item-action>
                </v-list-item>
              </v-list>
            </template>
          </v-card-text>

          <!-- Zone de saisie de message -->
          <v-card-actions>
            <v-text-field
              v-model="contenuMessage"
              placeholder="Écrivez votre message... (Utilisez @ pour mentionner un utilisateur, # pour mentionner un canal)"
              append-icon="mdi-send"
              @click:append="envoyerMessage"
              @keydown.enter.prevent="envoyerMessage"
              @input="handleMessageInput"
              ref="messageInput"
              outlined
              dense
              hide-details
              class="message-input"
            ></v-text-field>
            
            <!-- Menu de suggestion pour les mentions d'utilisateurs -->
            <v-menu
              v-if="showUserSuggestions"
              v-model="showUserSuggestions"
              :close-on-click-outside="true"
              bottom
              left
              offset-y
              max-height="300"
              :close-on-content-click="false"
            >
              <v-list dense>
                <v-subheader>Utilisateurs</v-subheader>
                <v-list-item
                  v-for="user in filteredUsers"
                  :key="user._id"
                  @click="selectUser(user)"
                >
                    <v-list-item-avatar>
                    <v-avatar size="32">
                      <v-img v-if="user.profilePicture" :src="user.profilePicture"></v-img>
                      <v-icon v-else>mdi-account</v-icon>
                    </v-avatar>
                  </v-list-item-avatar>
                  <v-list-item-content>
                    <v-list-item-title>{{ user.username }}</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
                <v-list-item v-if="filteredUsers.length === 0">
                  <v-list-item-content>
                    <v-list-item-title>Aucun utilisateur trouvé</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </v-menu>
            
            <!-- Menu de suggestion pour les mentions de canaux -->
            <v-menu
              v-if="showCanalSuggestions"
              v-model="showCanalSuggestions"
              :close-on-click-outside="true"
              bottom
              left
              offset-y
              max-height="300"
              :close-on-content-click="false"
            >
              <v-list dense>
                <v-subheader>Canaux</v-subheader>
                <v-list-item
                  v-for="canal in filteredCanaux"
                  :key="canal._id"
                  @click="selectCanal(canal)"
                >
                  <v-list-item-avatar>
                    <v-avatar size="32" color="primary" class="white--text">
                      <v-icon>mdi-pound</v-icon>
                    </v-avatar>
                  </v-list-item-avatar>
                  <v-list-item-content>
                    <v-list-item-title>{{ canal.nom }}</v-list-item-title>
                    <v-list-item-subtitle>{{ canal.workspaceNom }}</v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
                <v-list-item v-if="filteredCanaux.length === 0">
                  <v-list-item-content>
                    <v-list-item-title>Aucun canal trouvé</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </v-menu>
            
          </v-card-actions>
        </v-card>
      </v-col>
      
      <!-- Liste des fichiers -->

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
              <v-list-item-action>
                <v-btn icon small color="primary" @click="showUserProfile(membre.utilisateur._id, membre.utilisateur.username)" title="Voir le profil">
                  <v-icon>mdi-account-details</v-icon>
                </v-btn>
              </v-list-item-action>
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
                <v-btn icon small color="info" @click="showUserProfile(membre.utilisateur._id, membre.utilisateur.username)" title="Voir le profil">
                  <v-icon>mdi-account-details</v-icon>
                </v-btn>
              </v-list-item-action>
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
    
    <!-- Dialog actions sur les messages -->
    <v-dialog v-model="showMessageActionsDialog" max-width="300px">
      <v-card>
        <v-card-title class="headline">Actions</v-card-title>
        <v-card-text>
          <v-list>
            <v-list-item @click="editMessage(selectedMessage); showMessageActionsDialog = false">
              <v-list-item-icon>
                <v-icon>mdi-pencil</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>Modifier</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <v-list-item @click="deleteMessage(selectedMessage._id); showMessageActionsDialog = false">
              <v-list-item-icon>
                <v-icon color="error">mdi-delete</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title class="error--text">Supprimer</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey darken-1" text @click="showMessageActionsDialog = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Dialog sélection d'emoji -->
    <v-dialog v-model="showEmojiDialog" max-width="400px">
      <v-card>
        <v-card-title class="d-flex align-center">
          Réagir au message
          <v-spacer></v-spacer>
          <v-btn icon @click="showEmojiDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <div class="emoji-grid">
            <v-btn
              v-for="emoji in commonEmojis"
              :key="emoji"
              text
              @click="reactToMessage(emoji)"
              class="emoji-btn ma-1"
            >
              {{ emoji }}
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
    
    <!-- Dialog pour répondre à un message -->
    <v-dialog v-model="showReplyDialog" max-width="600px">
      <v-card>
        <v-card-title class="headline">Répondre au message</v-card-title>
        <v-card-text>
          <!-- Aperçu du message original -->
          <v-card outlined class="mb-4 pa-3" v-if="replyToMessage">
            <div class="d-flex align-center mb-2">
              <v-avatar size="24" class="mr-2">
                <v-img v-if="replyToMessage.auteur && replyToMessage.auteur.photo" :src="replyToMessage.auteur.photo"></v-img>
                <v-icon v-else>mdi-account</v-icon>
              </v-avatar>
              <span class="font-weight-bold">{{ replyToMessage.auteur ? replyToMessage.auteur.username : 'Utilisateur' }}</span>
            </div>
            <div class="grey--text text--darken-1 message-preview">{{ replyToMessage.contenu }}</div>
          </v-card>
          
          <!-- Champ de saisie de la réponse -->
          <v-textarea
            v-model="replyContent"
            label="Votre réponse"
            rows="4"
            auto-grow
            outlined
            counter="2000"
            :rules="[v => !!v || 'Veuillez saisir une réponse', v => v.length <= 2000 || 'Maximum 2000 caractères']"
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey darken-1" text @click="showReplyDialog = false">Annuler</v-btn>
          <v-btn color="primary" text @click="sendReply()" :loading="sending" :disabled="!replyContent.trim()">Envoyer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Dialog profil utilisateur -->
    <v-dialog v-model="showUserProfileDialog" max-width="600px">
      <v-card>
        <v-card-title class="d-flex align-center">
          Profil Utilisateur
          <v-spacer></v-spacer>
          <v-btn icon @click="showUserProfileDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <div v-if="loadingUserProfile" class="text-center py-4">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
          </div>
          <div v-else-if="userProfileError" class="text-center py-4 error--text">
            {{ userProfileError }}
          </div>
          <div v-else-if="userProfile" class="user-profile-container">
            <v-row>
              <v-col cols="12" sm="4" class="text-center">
                <v-avatar size="120">
                  <v-img v-if="userProfile.user.profilePicture" :src="userProfile.user.profilePicture"></v-img>
                  <v-icon v-else size="120">mdi-account-circle</v-icon>
                </v-avatar>
              </v-col>
              <v-col cols="12" sm="8">
                <h2 class="text-h4 mb-2">{{ userProfile.user.username }}</h2>
                <p v-if="userProfile.user.bio" class="text-body-1">{{ userProfile.user.bio }}</p>
                <p v-else class="text-body-2 font-italic">Aucune biographie</p>
                
                <v-divider class="my-3"></v-divider>
                
                <div class="d-flex justify-space-between mb-2">
                  <div>
                    <div class="text-h6">{{ userProfile.stats.messageCount }}</div>
                    <div class="text-caption">Messages</div>
                  </div>
                  <div>
                    <div class="text-h6">{{ userProfile.stats.workspaceCount }}</div>
                    <div class="text-caption">Workspaces</div>
                  </div>
                  <div>
                    <div class="text-h6">{{ userProfile.user.createdAt ? new Date(userProfile.user.createdAt).toLocaleDateString() : 'N/A' }}</div>
                    <div class="text-caption">Membre depuis</div>
                  </div>
                </div>
              </v-col>
            </v-row>
            
            <v-divider class="my-4"></v-divider>
            
            <h3 class="text-h6 mb-2">Workspaces</h3>
            <v-list v-if="userProfile.workspaces && userProfile.workspaces.length > 0" dense>
              <v-list-item v-for="workspace in userProfile.workspaces" :key="workspace.id">
                <v-list-item-content>
                  <v-list-item-title>{{ workspace.nom }}</v-list-item-title>
                  <v-list-item-subtitle v-if="workspace.description">{{ workspace.description }}</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>
            <p v-else class="text-body-2 font-italic">Aucun workspace</p>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
  </div>
</template>

<script>
import { defineComponent, ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import socketService from '../services/socketService'
import axios from 'axios'

// URL de l'API
const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:3000';

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

    // Variables pour la fonctionnalité de mention
    const showUserSuggestions = ref(false);
    const mentionPosition = ref({ x: 0, y: 0 });
    const mentionQuery = ref('');
    const mentionStartIndex = ref(-1);
    const messageInput = ref(null);
    const filteredUsers = ref([]);
    const mentionnedUsers = ref([]);
    
    // Variables pour les mentions de canaux
    const showCanalSuggestions = ref(false);
    const filteredCanaux = ref([]);
    const canaux = ref([]);
    const canalMentionStartIndex = ref(-1);
    const canalMentionQuery = ref('');
    const canalMentionPosition = ref({ x: 0, y: 0 });
    const mentionnedCanaux = ref([]);
    
    // Variables pour l'affichage du profil utilisateur
    const showUserProfileDialog = ref(false);
    const loadingUserProfile = ref(false);
    const userProfile = ref(null);
    const userProfileError = ref('');
    
    // Variables pour la sélection d'emoji
    const showEmojiDialog = ref(false);
    const currentMessageId = ref(null);
    
    // Variables pour la boîte de dialogue des actions sur les messages
    const showMessageActionsDialog = ref(false);
    const selectedMessage = ref(null);
    
    // Variables pour la réponse aux messages
    const showReplyDialog = ref(false);
    const replyToMessage = ref(null);
    const replyContent = ref('');
    
    // Variable pour les notifications
    const snackbar = ref({
      show: false,
      text: '',
      color: 'info'
    });

    // Liste des emojis courants pour les réactions
    // eslint-disable-next-line no-unused-vars
    const commonEmojis = ref([
      '👍', '👎', '😀', '😂', '😍', '🎉', '🔥', '👀', '❤️', '🚀',
      '👏', '🙏', '🤔', '😮', '😢', '👌', '🙌', '💯', '🤝', '✅'
    ])

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
    
    // Variables pour la pagination et le rendu par lots
    const messagesPerPage = ref(20) // Nombre de messages à afficher par page
    const currentPage = ref(1) // Page actuelle
    const loadingMore = ref(false) // Indicateur de chargement lors du clic sur "Afficher plus"
    const hasMoreMessages = ref(false) // Indique s'il y a plus de messages à charger

    const messagesInOrder = computed(() => {
      // Vérification de sécurité pour éviter les erreurs
      if (!messages.value || !Array.isArray(messages.value)) return [];
      
      try {
        // Créer un nouveau tableau pour ne pas modifier le tableau original
        const messagesCopy = [...messages.value];
        
        // Utiliser une méthode de tri optimisée avec des timestamps numériques
        return messagesCopy.sort((a, b) => {
          // Convertir les dates en timestamps numériques une seule fois
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA; // Ordre décroissant (plus récent d'abord)
        });
      } catch (error) {
        console.error('Erreur lors du tri des messages:', error);
        return [...messages.value]; // Retourner une copie en cas d'erreur
      }
    })

    // Propriété calculée pour vérifier s'il y a plus de messages à charger
    const hasMoreMessagesComputed = computed(() => {
      if (!messagesInOrder.value) return false;
      return messagesInOrder.value.length > messagesPerPage.value * currentPage.value;
    });
    
    // Mettre à jour hasMoreMessages lorsque hasMoreMessagesComputed change
    watch(hasMoreMessagesComputed, (newValue) => {
      hasMoreMessages.value = newValue;
    }, { immediate: true });
    
    // Propriété calculée pour obtenir uniquement les messages visibles selon la pagination
    const visibleMessages = computed(() => {
      const allMessages = messagesInOrder.value;
      if (!allMessages) return [];
      
      // Retourner les N messages les plus récents en fonction de la page actuelle
      // (limité par messagesPerPage * currentPage)
      return allMessages.slice(0, messagesPerPage.value * currentPage.value);
    })

    const loadMoreMessages = () => {
      loadingMore.value = true;
      
      // Utiliser setTimeout pour éviter le blocage de l'interface
      setTimeout(() => {
        // Incrémenter le nombre de pages pour afficher plus de messages
        currentPage.value += 1;
        loadingMore.value = false;
        
        // Attendre que le DOM soit mis à jour avant de configurer les gestionnaires d'événements
        nextTick(() => {
          setupMentionClickHandlers();
        });
      }, 10); // Délai minimal pour permettre à l'interface de se mettre à jour
    };

    const loadMessages = async () => {
      // Réinitialiser la pagination à chaque nouveau chargement
      currentPage.value = 1;
      
      // Définir un timeout pour éviter que la requête ne bloque indéfiniment
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: Le chargement des messages a pris trop de temps')), 10000);
      });
      
      loading.value = true;
      try {
        // Utiliser Promise.race pour limiter le temps d'attente
        await Promise.race([
          timeoutPromise,
          store.dispatch('message/fetchMessages', {
            workspaceId: workspaceId.value,
            canalId: canalId.value
          })
        ]);
        
        // Configurer les gestionnaires d'événements pour les mentions après le chargement des messages
        // Utiliser setTimeout pour ne pas bloquer le thread principal
        setTimeout(() => {
          setupMentionClickHandlers();
        }, 0);
      } catch (error) {
        // Afficher un message d'erreur à l'utilisateur
        snackbar.value = {
          show: true,
          text: 'Erreur lors du chargement des messages: ' + (error.message || 'Erreur inconnue'),
          color: 'error'
        };
      } finally {
        // S'assurer que l'indicateur de chargement est désactivé
        loading.value = false;
      }
    }

    const envoyerMessage = async () => {
      if (!contenuMessage.value.trim()) return
      sending.value = true
      try {
        await store.dispatch('canal/envoyerMessage', {
          workspaceId: workspaceId.value,
          canalId: canalId.value,
          contenu: contenuMessage.value
        })
        contenuMessage.value = ''
        // Plus besoin de recharger les messages car le store est mis à jour automatiquement
        
        // Configurer les gestionnaires d'événements pour les mentions après l'envoi d'un message
        nextTick(() => {
          setupMentionClickHandlers();
        });
      } catch (error) {
        snackbar.value = {
          show: true,
          text: 'Erreur lors de l\'envoi du message',
          color: 'error'
        };
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
    
    // Ouvre la boîte de dialogue des emojis pour réagir à un message
    // eslint-disable-next-line no-unused-vars
    const openEmojiDialog = (messageId) => {
      currentMessageId.value = messageId;
      showEmojiDialog.value = true;
    }
    
    // Réagit au message avec l'emoji sélectionné et ferme la boîte de dialogue
    // eslint-disable-next-line no-unused-vars
    const reactToMessage = async (emoji) => {
      if (!currentMessageId.value) return;
      
      try {
        await handleReaction(currentMessageId.value, emoji);
        showEmojiDialog.value = false;
      } catch (error) {
        console.error('Erreur lors de la réaction au message:', error);
      }
    }
    
    // Ouvre la boîte de dialogue des actions sur un message
    const openMessageActionsDialog = (message) => {
      selectedMessage.value = message;
      showMessageActionsDialog.value = true;
    }
    
    // Ouvre la boîte de dialogue pour répondre à un message
    const openReplyDialog = (message) => {
      replyToMessage.value = message;
      replyContent.value = '';
      showReplyDialog.value = true;
    }
    
    // Envoie une réponse à un message
    const sendReply = async () => {
      if (!replyContent.value.trim() || !replyToMessage.value) return;
      
      try {
        sending.value = true;
        
        await axios.post(
          `${API_URL}/api/v1/workspaces/${workspaceId.value}/canaux/${canalId.value}/messages/${replyToMessage.value._id}/reponses`,
          { contenu: replyContent.value },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            },
            withCredentials: true
          }
        );
        
        // Réinitialiser les champs
        replyContent.value = '';
        showReplyDialog.value = false;
        
        // Afficher un message de succès
        snackbar.value = {
          show: true,
          text: 'Réponse envoyée avec succès',
          color: 'success'
        };
      } catch (error) {
        console.error('Erreur lors de l\'envoi de la réponse:', error);
        
        // Afficher un message d'erreur
        snackbar.value = {
          show: true,
          text: error.response?.data?.message || 'Erreur lors de l\'envoi de la réponse',
          color: 'error'
        };
      } finally {
        sending.value = false;
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
    
    const handleMessageInput = () => {
      console.log('handleMessageInput appelé');
      console.log('contenuMessage:', contenuMessage.value);
      
      // Détecter les mentions d'utilisateurs avec @
      const lastAtIndex = contenuMessage.value.lastIndexOf('@');
      const lastHashIndex = contenuMessage.value.lastIndexOf('#');
      
      console.log('lastAtIndex:', lastAtIndex);
      console.log('lastHashIndex:', lastHashIndex);
      
      // Vérifier si nous sommes en train de taper une mention d'utilisateur
      if (lastAtIndex !== -1) {
        // Extraire la requête (texte après @)
        const query = contenuMessage.value.substring(lastAtIndex + 1);
        
        // Si un espace est trouvé après @, on ne considère pas comme une mention
        if (!query.includes(' ')) {
          // Récupérer tous les utilisateurs du canal
          const users = canal.value.membres
            .map(membre => membre.utilisateur)
            .filter(user => user && user.username);
          
          // Exclure les utilisateurs déjà mentionnés dans le message actuel
          const alreadyMentionedUsernames = [];
          const regex = /@(\w+)/g;
          let match;
          
          while ((match = regex.exec(contenuMessage.value)) !== null) {
            alreadyMentionedUsernames.push(match[1]);
          }
          
          // Filtrer selon la requête et exclure les utilisateurs déjà mentionnés
          filteredUsers.value = users.filter(user => 
            user.username.toLowerCase().includes(query.toLowerCase()) && 
            !alreadyMentionedUsernames.includes(user.username)
          );
          
          // Afficher le menu de suggestions
          showUserSuggestions.value = true;
          showCanalSuggestions.value = false; // Cacher l'autre menu
          mentionStartIndex.value = lastAtIndex;
          mentionQuery.value = query;
          
          // Calculer la position pour le menu de suggestion
          if (messageInput.value && messageInput.value.$el) {
            const inputRect = messageInput.value.$el.getBoundingClientRect();
            mentionPosition.value = {
              x: inputRect.left + 10,
              y: inputRect.top - 200  // Positionner au-dessus du champ de texte
            };
          } else {
            // Position par défaut si l'élément n'est pas disponible
            mentionPosition.value = {
              x: window.innerWidth / 2,
              y: window.innerHeight / 2
            };
          }
          
          return;
        }
      }
      
      // Vérifier si nous sommes en train de taper une mention de canal
      if (lastHashIndex !== -1) {
        console.log('Détection de # détectée');
        // Extraire la requête (texte après #)
        const query = contenuMessage.value.substring(lastHashIndex + 1);
        console.log('Query après #:', query);
        
        // Si un espace est trouvé après #, on ne considère pas comme une mention
        if (!query.includes(' ')) {
          console.log('Pas d\'espace après #, traitement de la mention de canal');
          // Charger les canaux publics
          console.log('Appel de loadCanaux() avec query:', query);
          loadCanaux(query);
          console.log('Canaux disponibles avant chargement:', canaux.value.length);
          
          // Filtrer les canaux selon la requête
          filteredCanaux.value = canaux.value.filter(canal => 
            canal.nom.toLowerCase().includes(query.toLowerCase()) || 
            canal.workspaceNom.toLowerCase().includes(query.toLowerCase())
          );
          
          // Afficher le menu de suggestions
          console.log('Activation du menu de suggestions de canaux');
          showCanalSuggestions.value = true;
          showUserSuggestions.value = false; // Cacher l'autre menu
          canalMentionStartIndex.value = lastHashIndex;
          canalMentionQuery.value = query;
          console.log('showCanalSuggestions:', showCanalSuggestions.value);
          console.log('filteredCanaux:', filteredCanaux.value);
          
          // Calculer la position pour le menu de suggestion
          if (messageInput.value && messageInput.value.$el) {
            const inputRect = messageInput.value.$el.getBoundingClientRect();
            canalMentionPosition.value = {
              x: inputRect.left + 10,
              y: inputRect.top - 200  // Positionner au-dessus du champ de texte
            };
          } else {
            // Position par défaut si l'élément n'est pas disponible
            canalMentionPosition.value = {
              x: window.innerWidth / 2,
              y: window.innerHeight / 2
            };
          }
          
          return;
        }
      }
      
      // Si on n'est pas en train de taper une mention, cacher les menus
      showUserSuggestions.value = false;
      showCanalSuggestions.value = false;
      mentionStartIndex.value = -1;
      canalMentionStartIndex.value = -1;
    };
    
    const selectUser = (user) => {
      if (mentionStartIndex.value !== -1) {
        const beforeMention = contenuMessage.value.substring(0, mentionStartIndex.value);
        const afterMention = contenuMessage.value.substring(
          mentionStartIndex.value + mentionQuery.value.length + 1
        );
        
        // Remplacer la mention par le nom d'utilisateur
        contenuMessage.value = `${beforeMention}@${user.username} ${afterMention}`;
        
        // Ajouter l'utilisateur à la liste des utilisateurs mentionnés
        mentionnedUsers.value.push(user);
        
        // Fermer le menu de suggestion
        showUserSuggestions.value = false;
        mentionStartIndex.value = -1;
        
        // Mettre le focus sur le champ de texte
        nextTick(() => {
          messageInput.value.$el.querySelector('input').focus();
        });
      }
    };
    
    // Fonction pour sélectionner un canal dans le menu de suggestions
    // eslint-disable-next-line no-unused-vars
    const selectCanal = (canal) => {
      if (canalMentionStartIndex.value !== -1) {
        const beforeMention = contenuMessage.value.substring(0, canalMentionStartIndex.value);
        const afterMention = contenuMessage.value.substring(
          canalMentionStartIndex.value + canalMentionQuery.value.length + 1
        );
        
        // Remplacer la mention par le nom du canal et son identifiant unique
        // Format: #canal:workspaceId:canalId pour permettre la redirection
        contenuMessage.value = `${beforeMention}#${canal.nom}:${canal._id} ${afterMention}`;
        
        // Ajouter le canal à la liste des canaux mentionnés
        mentionnedCanaux.value.push(canal);
        
        // Fermer le menu de suggestion
        showCanalSuggestions.value = false;
        canalMentionStartIndex.value = -1;
        
        // Mettre le focus sur le champ de texte
        nextTick(() => {
          messageInput.value.$el.querySelector('input').focus();
        });
      }
    };
    
    // Fonction pour charger les canaux publics pour les mentions
    const loadCanaux = async (query = '') => {
      console.log('loadCanaux appelé avec query:', query);
      try {
        loading.value = true;
        const authToken = localStorage.getItem('token');
        console.log('URL de recherche de canaux:', `${API_URL}/api/v1/search/canaux?all=true`);
        const response = await axios.get(`${API_URL}/api/v1/search/canaux?all=true`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('Réponse de la recherche de canaux:', response.data);
        
        if (response.data.status === 'success') {
          // Formatter les canaux pour l'affichage
          canaux.value = response.data.data.canaux.map(canal => ({
            _id: canal._id,
            nom: canal.nom,
            description: canal.description,
            workspaceId: canal.workspace ? canal.workspace._id : '',
            workspaceNom: canal.workspace ? canal.workspace.nom : 'Workspace inconnu'
          }));
          
          console.log('Canaux chargés:', canaux.value.length);
          
          // Mettre à jour filteredCanaux avec le filtre actuel
          if (query !== '') {
            filteredCanaux.value = canaux.value.filter(canal => 
              canal.nom.toLowerCase().includes(query.toLowerCase()) || 
              canal.workspaceNom.toLowerCase().includes(query.toLowerCase())
            );
          } else {
            // Si pas de query, afficher tous les canaux
            filteredCanaux.value = [...canaux.value];
          }
          
          console.log('filteredCanaux après chargement:', filteredCanaux.value.length);
          
          // Réactiver le menu de suggestions si nécessaire
          if (canalMentionStartIndex.value !== -1) {
            showCanalSuggestions.value = true;
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des canaux publics:', error);
        // Utiliser snackbar au lieu de notify
        snackbar.value = {
          show: true,
          text: 'Impossible de charger les canaux publics.',
          color: 'error'
        };
      } finally {
        loading.value = false;
      }
    };
    
    const formatMessageContent = (message) => {
      if (!message || !message.contenu) return '';
      
      let formattedContent = message.contenu;
      
      // Si le message a des mentions d'utilisateurs
      if (message.mentions && Array.isArray(message.mentions) && message.mentions.length > 0) {
        // Pour chaque mention, remplacer @username par un span stylisé et cliquable
        message.mentions.forEach(mention => {
          if (mention && mention.username) {
            const regex = new RegExp(`@${mention.username}`, 'g');
            formattedContent = formattedContent.replace(
              regex, 
              `<span class="mention-tag mention-clickable" data-user-id="${mention._id}" data-username="${mention.username}">@${mention.username}</span>`
            );
          }
        });
      } else {
        // Si le message n'a pas de mentions pré-traitées, chercher les mentions dans le texte
        const mentionRegex = /@(\w+)/g;
        let match;
        
        while ((match = mentionRegex.exec(formattedContent)) !== null) {
          const username = match[1];
          const fullMention = match[0]; // @username
          
          // Remplacer par un span cliquable
          formattedContent = formattedContent.replace(
            fullMention,
            `<span class="mention-tag mention-clickable" data-username="${username}">@${username}</span>`
          );
        }
      }
      
      // Traiter les mentions de canaux
      // Format attendu: #nomCanal:canalId
      const canalMentionRegex = /#([\w-]+):(\w+)/g;
      let canalMatch;
      
      while ((canalMatch = canalMentionRegex.exec(formattedContent)) !== null) {
        const canalNom = canalMatch[1];
        const canalId = canalMatch[2];
        const fullCanalMention = canalMatch[0]; // #nomCanal:canalId
        
        // Remplacer par un span cliquable pour le canal
        formattedContent = formattedContent.replace(
          fullCanalMention,
          `<span class="canal-mention-tag canal-mention-clickable" data-canal-id="${canalId}" data-canal-nom="${canalNom}">#${canalNom}</span>`
        );
      }
      
      return formattedContent;
    };
    
    // Fonction pour ajouter un gestionnaire d'événements aux mentions
    const setupMentionClickHandlers = () => {
      nextTick(() => {
        // Gestionnaires pour les mentions d'utilisateurs
        const userMentionElements = document.querySelectorAll('.mention-clickable');
        userMentionElements.forEach(element => {
          // Supprimer les gestionnaires d'événements existants pour éviter les doublons
          element.removeEventListener('click', handleMentionClick);
          // Ajouter le nouveau gestionnaire d'événements
          element.addEventListener('click', handleMentionClick);
        });
        
        // Gestionnaires pour les mentions de canaux
        const canalMentionElements = document.querySelectorAll('.canal-mention-clickable');
        canalMentionElements.forEach(element => {
          // Supprimer les gestionnaires d'événements existants pour éviter les doublons
          element.removeEventListener('click', handleCanalMentionClick);
          // Ajouter le nouveau gestionnaire d'événements
          element.addEventListener('click', handleCanalMentionClick);
        });
      });
    };
    
    // Gestionnaire d'événements pour les clics sur les mentions d'utilisateurs
    const handleMentionClick = (event) => {
      const userId = event.currentTarget.getAttribute('data-user-id');
      const username = event.currentTarget.getAttribute('data-username');
      showUserProfile(userId, username);
    };
    
    // Gestionnaire d'événements pour les clics sur les mentions de canaux
    const handleCanalMentionClick = (event) => {
      const canalId = event.currentTarget.getAttribute('data-canal-id');
      // canalNom est utilisé pour l'affichage dans la console pour le débogage
      const canalNom = event.currentTarget.getAttribute('data-canal-nom');
      
      if (canalId) {
        // Log pour le débogage
        console.log(`Navigation vers le canal: ${canalNom} (${canalId})`);
        // Rediriger vers le canal mentionné
        router.push({ name: 'Canal', params: { id: canalId } });
      }
    };
    
    // Méthode pour afficher le profil d'un utilisateur
    const showUserProfile = async (userId, username) => {
      // Réinitialiser les états
      userProfile.value = null;
      userProfileError.value = '';
      loadingUserProfile.value = true;
      showUserProfileDialog.value = true;
      
      try {
        // Déterminer l'identifiant à utiliser (ID ou nom d'utilisateur)
        const identifier = userId || username;
        
        if (!identifier) {
          throw new Error('Identifiant utilisateur manquant');
        }
        
        // Appeler l'API pour récupérer le profil de l'utilisateur
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/api/v1/users/profile/${identifier}`, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          withCredentials: true
        });
        
        if (response.data && response.data.success) {
          userProfile.value = response.data.data;
        } else {
          throw new Error('Erreur lors de la récupération du profil');
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du profil utilisateur:', error);
        userProfileError.value = error.response?.data?.message || error.message || 'Erreur lors de la récupération du profil';
      } finally {
        loadingUserProfile.value = false;
      }
    };
    
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
      if (newMessages?.length !== oldMessages?.length) {
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
      
      try {
        // S'assurer que l'auth est initialisée
        await store.dispatch('auth/initAuth');
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.error('Pas de token disponible, redirection vers la page de connexion');
          router.push('/connexion');
          return;
        }
        
        // Initialiser le WebSocket et attendre la connexion
        console.log('Initialisation du WebSocket...');
        await socketService.init();
        
        // Rejoindre le canal
        if (canalId.value) {
          socketService.joinCanal(canalId.value);
        }
        if (workspaceId.value && canalId.value) {
          try {
            await store.dispatch('canal/fetchCanal', {
              workspaceId: workspaceId.value,
              canalId: canalId.value
            })
            await loadMessages()
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
      messagesPerPage,
      currentPage,
      loadingMore,
      hasMoreMessages,
      visibleMessages,
      loadMoreMessages,
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
      fetchWorkspaceMembers,
      // Nouvelles fonctions pour les mentions
      showUserSuggestions,
      mentionPosition,
      filteredUsers,
      messageInput,
      handleMessageInput,
      selectUser,
      formatMessageContent,
      showUserProfile,
      showUserProfileDialog,
      userProfile,
      loadingUserProfile,
      userProfileError,
      // Variables et fonctions pour les réactions aux messages
      showEmojiDialog,
      currentMessageId,
      commonEmojis,
      openEmojiDialog,
      reactToMessage,
      // Variables et fonctions pour les actions sur les messages
      showMessageActionsDialog,
      selectedMessage,
      openMessageActionsDialog,
      // Variables et fonctions pour les réponses aux messages
      showReplyDialog,
      replyToMessage,
      replyContent,
      openReplyDialog,
      sendReply,
      // Variable pour les notifications
      snackbar
    }
  }
})
</script>

<style scoped>
.emoji-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.mention-tag {
  background-color: rgba(29, 155, 240, 0.1);
  color: #1d9bf0;
  padding: 2px 4px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
}

.mention-tag:hover {
  background-color: rgba(29, 155, 240, 0.2);
  text-decoration: underline;
}

.canal-mention-tag {
  background-color: rgba(76, 175, 80, 0.1);
  color: #4caf50;
  padding: 2px 4px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
}

.canal-mention-tag:hover {
  background-color: rgba(76, 175, 80, 0.2);
  text-decoration: underline;
}

.message-input {
  width: 100%;
}

.emoji-btn {
  min-width: 48px !important;
  height: 48px !important;
  font-size: 24px !important;
  border-radius: 50% !important;
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.emoji-btn:hover {
  transform: scale(1.1);
  background-color: rgba(0, 0, 0, 0.05) !important;
}
</style>

<style scoped>
.messages-container {
  height: calc(100vh - 300px);
  overflow-y: auto;
}

.messages-list {
  display: flex;
  flex-direction: column;
}

.mention-tag {
  color: #1976d2;
  font-weight: bold;
  background-color: rgba(25, 118, 210, 0.1);
  padding: 2px 4px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.mention-tag:hover {
  background-color: rgba(25, 118, 210, 0.2);
}

.reply-reference {
  background-color: rgba(0, 0, 0, 0.05);
  border-left: 3px solid #1976d2;
  border-radius: 4px;
  margin-left: 4px;
}

.reply-preview {
  max-width: 250px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
