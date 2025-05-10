<template>
  <div class="private-conversation">
    <v-card class="conversation-card">
      <!-- En-tête de la conversation -->
      <v-card-title class="conversation-header">
        <v-avatar size="40" class="mr-3">
          <v-img :src="getUserAvatar(otherUser)" alt="Avatar"></v-img>
        </v-avatar>
        <div>
          <div class="text-h6">
            {{ otherUser.prenom && otherUser.nom ? 
               `${otherUser.prenom} ${otherUser.nom}` : 
               otherUser.username }}
          </div>
          <div class="text-caption">
            {{ otherUser.status || 'En ligne' }}
          </div>
        </div>
        <v-spacer></v-spacer>
        <v-btn icon @click="showAddUserDialog = true" title="Ajouter des utilisateurs">
          <v-icon>mdi-account-plus</v-icon>
        </v-btn>
      </v-card-title>
      
      <!-- Corps de la conversation (messages) -->
      <v-card-text class="conversation-body" ref="messagesContainer">
        <div v-if="loading" class="text-center pa-4">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>
        
        <div v-else-if="messages.length === 0" class="text-center pa-4">
          <p class="text-body-2">Aucun message</p>
          <p class="text-caption">Commencez la conversation en envoyant un message</p>
        </div>
        
        <template v-else>
          <div
            v-for="(message, index) in messages"
            :key="message._id"
            :class="[
              'message-container',
              isFromCurrentUser(message) ? 'message-from-me' : 'message-from-other'
            ]"
          >
            <!-- Afficher la date si c'est un nouveau jour -->
            <div v-if="shouldShowDate(message, index)" class="date-separator">
              <span>{{ formatDateHeader(message.horodatage) }}</span>
            </div>
            
            <!-- Message -->
            <div class="message-bubble" @contextmenu="(event) => openContextMenu(event, message)">
              <!-- Si c'est une réponse, afficher le message original -->
              <div v-if="message.reponseA" class="reply-preview">
                <div class="reply-author">
                  {{ message.reponseA.expediteur.username }}
                </div>
                <div class="reply-content">
                  {{ message.reponseA.contenu }}
                </div>
              </div>
              
              <!-- Contenu du message -->
              <div class="message-content">
                {{ message.contenu }}
              </div>
              
              <!-- Boutons d'action pour tous les messages -->
              <div class="message-actions">
                <!-- Bouton de réponse pour tous les messages -->
                <v-btn icon x-small @click="showReplyDialog(message)" title="Répondre">
                  <v-icon size="small">mdi-reply</v-icon>
                </v-btn>
                
                <!-- Boutons d'édition et de suppression uniquement pour les messages de l'utilisateur courant -->
                <template v-if="isFromCurrentUser(message)">
                  <v-btn icon x-small @click="showEditDialog(message)" title="Modifier">
                    <v-icon size="small">mdi-pencil</v-icon>
                  </v-btn>
                  <v-btn icon x-small @click="showDeleteDialog(message)" title="Supprimer">
                    <v-icon size="small">mdi-delete</v-icon>
                  </v-btn>
                </template>
              </div>
              
              <!-- Horodatage et statut -->
              <div class="message-footer">
                <span class="message-time">{{ formatTime(message.horodatage) }}</span>
                <span v-if="isFromCurrentUser(message)" class="message-status">
                  <v-icon
                    v-if="message.lu"
                    size="small"
                    color="success"
                  >
                    mdi-eye
                  </v-icon>
                  <v-icon
                    v-else-if="message.envoye"
                    size="small"
                    color="grey"
                  >
                    mdi-check
                  </v-icon>
                </span>
              </div>
            </div>
          </div>
        </template>
      </v-card-text>
      
      <!-- Pied de page (saisie de message) -->
      <v-card-actions class="conversation-footer">
        <div v-if="replyingTo" class="reply-bar">
          <div class="reply-info">
            <v-icon small class="mr-2">mdi-reply</v-icon>
            <span>Réponse à {{ replyingTo.expediteur.username }}</span>
            <div class="reply-preview-text">{{ replyingTo.contenu }}</div>
          </div>
          <v-btn icon small @click="cancelReply">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        
        <v-textarea
          v-model="messageContent"
          rows="1"
          auto-grow
          hide-details
          placeholder="Écrivez votre message... (Utilisez @ pour mentionner)"
          class="message-input"
          @keydown.enter.prevent="sendMessage"
          @input="handleMessageInput"
          ref="messageInputRef"
        ></v-textarea>
        
        <!-- Menu de suggestion pour les mentions d'utilisateurs -->
        <v-menu
          v-model="showUserSuggestions"
          :close-on-content-click="true"
          :close-on-click="true"
          offset-y
          bottom
          left
          max-height="300"
        >
          <v-list dense>
            <v-subheader>Utilisateur</v-subheader>
            <v-list-item
              @click="selectUser(otherUser)"
            >
              <v-list-item-avatar>
                <v-avatar size="32">
                  <v-img v-if="otherUser && otherUser.profilePicture" :src="getUserAvatar(otherUser)"></v-img>
                  <v-icon v-else>mdi-account</v-icon>
                </v-avatar>
              </v-list-item-avatar>
              <v-list-item-content>
                <v-list-item-title v-if="otherUser && otherUser.username">{{ otherUser.username }}</v-list-item-title>
                <v-list-item-title v-else>Utilisateur</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-menu>
        
        <v-btn
          icon
          color="primary"
          @click="sendMessage"
          :disabled="!messageContent.trim()"
        >
          <v-icon>mdi-send</v-icon>
        </v-btn>
      </v-card-actions>
    </v-card>
    
    <!-- Menu contextuel pour les actions sur les messages -->
    <v-menu
      v-model="contextMenu.show"
      :position-x="contextMenu.x"
      :position-y="contextMenu.y"
      absolute
      offset-y
    >
      <v-list>
        <v-list-item @click="replyToMessage">
          <v-list-item-title>
            <v-icon small class="mr-2">mdi-reply</v-icon>
            Répondre
          </v-list-item-title>
        </v-list-item>
        
        <v-list-item
          v-if="isFromCurrentUser(contextMenu.message)"
          @click="editMessage"
        >
          <v-list-item-title>
            <v-icon small class="mr-2">mdi-pencil</v-icon>
            Modifier
          </v-list-item-title>
        </v-list-item>
        
        <v-list-item
          v-if="isFromCurrentUser(contextMenu.message)"
          @click="deleteMessage"
        >
          <v-list-item-title>
            <v-icon small class="mr-2">mdi-delete</v-icon>
            Supprimer
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
    
    <!-- Dialogue pour modifier un message -->
    <v-dialog v-model="editDialog.show" max-width="500px">
      <v-card>
        <v-card-title>Modifier le message</v-card-title>
        <v-card-text>
          <v-textarea
            v-model="editDialog.content"
            rows="3"
            auto-grow
            hide-details
            placeholder="Modifiez votre message..."
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="editDialog.show = false">Annuler</v-btn>
          <v-btn color="primary" @click="saveEditedMessage">Enregistrer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Dialogue de confirmation pour supprimer un message -->
    <v-dialog v-model="deleteDialog.show" max-width="400px">
      <v-card>
        <v-card-title class="headline">Supprimer le message</v-card-title>
        <v-card-text>
          Êtes-vous sûr de vouloir supprimer ce message ? Cette action est irréversible.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="deleteDialog.show = false">Annuler</v-btn>
          <v-btn color="error" @click="confirmDeleteMessage">Supprimer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Dialogue pour ajouter des utilisateurs à la conversation -->
    <v-dialog v-model="showAddUserDialog" max-width="500px">
      <v-card>
        <v-card-title>Ajouter des utilisateurs à la conversation</v-card-title>
        <v-card-text>
          <p v-if="addUserError" class="error--text">{{ addUserError }}</p>
          <div v-if="availableUsers.length === 0 && !loadingUsers" class="text-center pa-4">
            <p class="text-body-2">Aucun utilisateur disponible</p>
          </div>
          <div v-else-if="loadingUsers" class="text-center pa-4">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
            <p class="mt-2">Chargement des utilisateurs...</p>
          </div>
          <div v-else>
            <p class="mb-2">Utilisateurs disponibles ({{ availableUsers.length }}) :</p>
            
            <!-- Liste de sélection plus simple -->
            <v-list dense>
              <v-list-item
                v-for="user in availableUsers"
                :key="user._id"
                @click="toggleUserSelection(user)"
              >
                <v-list-item-avatar>
                  <v-img :src="getUserAvatar(user)"></v-img>
                </v-list-item-avatar>
                
                <v-list-item-content>
                  <v-list-item-title>{{ user.username }}</v-list-item-title>
                  <v-list-item-subtitle v-if="user.firstName && user.lastName">
                    {{ user.firstName }} {{ user.lastName }}
                  </v-list-item-subtitle>
                </v-list-item-content>
                
                <v-list-item-action>
                  <v-checkbox
                    :input-value="isUserSelected(user)"
                    color="primary"
                    @click.stop
                    @change="toggleUserSelection(user)"
                  ></v-checkbox>
                </v-list-item-action>
              </v-list-item>
            </v-list>
            
            <!-- Afficher les utilisateurs sélectionnés -->
            <div v-if="selectedUsers.length > 0" class="selected-users-container mt-4">
              <p class="subtitle-1">Utilisateurs sélectionnés ({{ selectedUsers.length }}) :</p>
              <v-chip-group column>
                <v-chip
                  v-for="user in selectedUsers"
                  :key="user._id"
                  close
                  @click:close="toggleUserSelection(user)"
                >
                  <v-avatar left>
                    <v-img :src="getUserAvatar(user)"></v-img>
                  </v-avatar>
                  {{ user.username }}
                </v-chip>
              </v-chip-group>
            </div>
          </div>
          <div v-if="addUserError" class="error--text mt-2">
            {{ addUserError }}
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showAddUserDialog = false">Annuler</v-btn>
          <v-btn color="primary" @click="addUsersToConversation" :loading="addingUsers">Ajouter</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUpdated, watch, nextTick } from 'vue';
import { useStore } from 'vuex';
// eslint-disable-next-line no-unused-vars
import { useRoute } from 'vue-router';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

export default {
  name: 'PrivateConversation',
  
  props: {
    userId: {
      type: String,
      required: true
    },
    conversationId: {
      type: String,
      default: null
    }
  },
  
  setup(props) {
    const store = useStore();
    // La variable route n'est pas utilisée dans ce composant
    // eslint-disable-next-line no-unused-vars
    const route = useRoute();
    const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:3000';
    
    const messagesContainer = ref(null);
    const messageContent = ref('');
    const loading = ref(false);
    const replyingTo = ref(null);
    const contextMenu = ref({
      show: false,
      x: 0,
      y: 0,
      message: null
    });
    const editDialog = ref({
      show: false,
      content: '',
      messageId: null
    });
    
    const deleteDialog = ref({
      show: false,
      messageId: null
    });
    
    // Variables pour l'ajout d'utilisateurs à la conversation
    const showAddUserDialog = ref(false);
    const selectedUsers = ref([]);
    const availableUsers = ref([]);
    const loadingUsers = ref(false);
    const addingUsers = ref(false);
    const addUserError = ref('');
    
    // Variables pour les mentions d'utilisateurs
    const showUserSuggestions = ref(false);
    const messageInputRef = ref(null);
    const mentionStartIndex = ref(-1);
    
    // Récupérer les messages de la conversation
    const messages = computed(() => {
      return store.getters['messagePrivate/getMessagesSorted'];
    });
    
    // Récupérer l'utilisateur courant
    const currentUser = computed(() => {
      return store.state.auth.user;
    });
    
    // Récupérer l'autre utilisateur de la conversation
    const otherUser = ref({ username: 'Chargement...' });
    
    // Fonction pour charger les détails de l'utilisateur
    const loadUserDetails = async () => {
      try {
        const response = await fetch(`${API_URL}/api/v1/users/profile/${props.userId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          otherUser.value = data.data.user;
        } else {
          // Fallback à la méthode précédente si l'API ne répond pas
          const conversation = store.state.messagePrivate.conversations.find(
            conv => conv.user._id === props.userId
          );
          
          otherUser.value = conversation ? conversation.user : { username: 'Utilisateur inconnu' };
        }
      } catch (error) {
        console.error('Erreur lors du chargement des détails de l\'utilisateur:', error);
        // Fallback à la méthode précédente
        const conversation = store.state.messagePrivate.conversations.find(
          conv => conv.user._id === props.userId
        );
        
        otherUser.value = conversation ? conversation.user : { username: 'Utilisateur inconnu' };
      }
    };
    
    // Charger les messages au montage du composant
    onMounted(async () => {
      loading.value = true;
      // Charger les détails de l'utilisateur
      await loadUserDetails();
      await store.dispatch('messagePrivate/fetchMessages', props.userId);
      loading.value = false;
      scrollToBottom();
      
      // Marquer les messages non lus comme lus
      markUnreadMessagesAsRead();
    });
    
    // Surveiller les changements d'utilisateur pour recharger les messages
    watch(() => props.userId, async (newUserId) => {
      if (newUserId) {
        loading.value = true;
        await store.dispatch('messagePrivate/fetchMessages', newUserId);
        loading.value = false;
        scrollToBottom();
        
        // Marquer les messages non lus comme lus
        markUnreadMessagesAsRead();
      }
    });
    
    // Surveiller les nouveaux messages pour faire défiler vers le bas
    watch(() => messages.value.length, () => {
      scrollToBottom();
    });
    
    // Après chaque mise à jour du DOM, faire défiler vers le bas si nécessaire
    onUpdated(() => {
      scrollToBottom();
    });
    
    // Fonction pour faire défiler vers le bas
    const scrollToBottom = () => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
      }
    };
    
    // Fonction pour marquer les messages non lus comme lus
    const markUnreadMessagesAsRead = async () => {
      const unreadMessages = messages.value.filter(
        msg => !msg.lu && !isFromCurrentUser(msg)
      );
      
      for (const message of unreadMessages) {
        await store.dispatch('messagePrivate/markMessageAsRead', message._id);
      }
    };
    
    // Fonction pour envoyer un message
    const sendMessage = async () => {
      if (!messageContent.value.trim()) return;
      
      try {
        await store.dispatch('messagePrivate/sendMessage', {
          destinataireId: props.userId,
          contenu: messageContent.value,
          reponseA: replyingTo.value ? replyingTo.value._id : null
        });
        
        // Réinitialiser le contenu du message et la réponse
        messageContent.value = '';
        replyingTo.value = null;
        
        // Mettre à jour la liste des conversations
        await store.dispatch('messagePrivate/updateConversationList');
      } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
      }
    };
    
    // Fonction pour vérifier si un message provient de l'utilisateur courant
    const isFromCurrentUser = (message) => {
      if (!message || !message.expediteur || !currentUser.value) return false;
      return message.expediteur._id === currentUser.value._id;
    };
    
    // Fonction pour formater l'heure d'un message
    const formatTime = (dateString) => {
      return format(new Date(dateString), 'HH:mm');
    };
    
    // Fonction pour gérer la détection des mentions d'utilisateurs
    const handleMessageInput = () => {
      try {
        // Vérifier si messageContent est défini
        if (!messageContent.value) {
          showUserSuggestions.value = false;
          mentionStartIndex.value = -1;
          return;
        }
        
        // Détecter les mentions d'utilisateurs avec @
        const lastAtIndex = messageContent.value.lastIndexOf('@');
        
        // Vérifier si nous sommes en train de taper une mention d'utilisateur
        if (lastAtIndex !== -1) {
          // Extraire la requête (texte après @) avec vérification de sécurité
          let query = '';
          try {
            query = messageContent.value.substring(lastAtIndex + 1);
          } catch (e) {
            console.error('Erreur lors de l\'extraction de la requête:', e);
            query = '';
          }
          
          // Si un espace est trouvé après @, on ne considère pas comme une mention
          if (query && !query.includes(' ')) {
            console.log('Détection de mention d\'utilisateur');
            
            // Afficher le menu de suggestions
            showUserSuggestions.value = true;
            mentionStartIndex.value = lastAtIndex;
            
            return;
          }
        }
        
        // Si pas de @ dans le message ou si un espace est trouvé après @, cacher le menu de suggestions
        showUserSuggestions.value = false;
        mentionStartIndex.value = -1;
      } catch (error) {
        console.error('Erreur dans handleMessageInput:', error);
        // Réinitialiser l'état en cas d'erreur
        showUserSuggestions.value = false;
        mentionStartIndex.value = -1;
      }
    };
    
    // Fonction pour sélectionner un utilisateur dans le menu de suggestions
    const selectUser = (user) => {
      try {
        // Vérifications de sécurité pour éviter les erreurs de nullité
        if (!user || mentionStartIndex.value === -1 || !messageContent.value) {
          showUserSuggestions.value = false;
          mentionStartIndex.value = -1;
          return;
        }
        
        // S'assurer que username existe, sinon utiliser une valeur par défaut
        const username = user && user.username ? user.username : 'utilisateur';
        
        // Récupérer le texte avant et après la mention avec vérification de sécurité
        const textBefore = messageContent.value.substring(0, mentionStartIndex.value);
        const textAfter = messageContent.value.substring(mentionStartIndex.value + 1);
        
        // Remplacer le texte de la mention par le nom d'utilisateur complet
        messageContent.value = `${textBefore}@${username} ${textAfter}`;
        
        // Cacher le menu de suggestions
        showUserSuggestions.value = false;
        mentionStartIndex.value = -1;
        
        // Mettre le focus sur le champ de texte si disponible
        nextTick(() => {
          const textarea = document.querySelector('.message-input textarea');
          if (textarea) {
            textarea.focus();
          }
        });
      } catch (error) {
        console.error('Erreur lors de la sélection d\'un utilisateur:', error);
        // Réinitialiser l'état en cas d'erreur
        showUserSuggestions.value = false;
        mentionStartIndex.value = -1;
      }
    };
    
    // Fonction pour formater la date d'un message (en-tête)
    const formatDateHeader = (dateString) => {
      const date = new Date(dateString);
      
      if (isToday(date)) {
        return 'Aujourd\'hui';
      } else if (isYesterday(date)) {
        return 'Hier';
      } else {
        return format(date, 'EEEE d MMMM yyyy', { locale: fr });
      }
    };
    
    // Fonction pour déterminer si on doit afficher la date
    const shouldShowDate = (message, index) => {
      if (index === 0) return true;
      
      const currentDate = new Date(message.horodatage);
      const previousDate = new Date(messages.value[index - 1].horodatage);
      
      return !isSameDay(currentDate, previousDate);
    };
    
    // Fonction pour obtenir l'avatar d'un utilisateur
    const getUserAvatar = (user) => {
      if (!user || !user.profilePicture) return '/img/default-avatar.png';
      
      if (user.profilePicture.startsWith('http')) {
        return user.profilePicture;
      }
      
      return `${API_URL}/uploads/profiles/${user.profilePicture}`;
    };
    
    // Fonction pour ouvrir le menu contextuel
    const openContextMenu = (event, message) => {
      event.preventDefault();
      contextMenu.value.show = true;
      contextMenu.value.x = event.clientX;
      contextMenu.value.y = event.clientY;
      contextMenu.value.message = message;
    };
    
    // Fonction pour répondre à un message via le menu contextuel
    const replyToMessage = () => {
      replyingTo.value = contextMenu.value.message;
      contextMenu.value.show = false;
    };
    
    // Fonction pour répondre à un message via le bouton
    const showReplyDialog = (message) => {
      replyingTo.value = message;
      // Faire défiler jusqu'à la zone de saisie et la mettre en focus
      nextTick(() => {
        const textarea = document.querySelector('.message-input textarea');
        if (textarea) {
          textarea.focus();
        }
      });
    };
    
    // Fonction pour annuler la réponse
    const cancelReply = () => {
      replyingTo.value = null;
    };
    
    // Fonction pour afficher la boîte de dialogue de modification via le bouton
    const showEditDialog = (message) => {
      editDialog.value.content = message.contenu;
      editDialog.value.messageId = message._id;
      editDialog.value.show = true;
    };
    
    // Fonction pour afficher la boîte de dialogue de confirmation de suppression via le bouton
    const showDeleteDialog = (message) => {
      deleteDialog.value.messageId = message._id;
      deleteDialog.value.show = true;
    };
    
    // Fonction pour modifier un message (via le menu contextuel)
    const editMessage = () => {
      if (!contextMenu.value.message) return;
      
      editDialog.value.content = contextMenu.value.message.contenu;
      editDialog.value.messageId = contextMenu.value.message._id;
      editDialog.value.show = true;
      contextMenu.value.show = false;
    };
    
    // Fonction pour enregistrer un message modifié
    const saveEditedMessage = async () => {
      if (!editDialog.value.messageId || !editDialog.value.content.trim()) return;
      
      try {
        await store.dispatch('messagePrivate/updateMessage', {
          messageId: editDialog.value.messageId,
          contenu: editDialog.value.content.trim()
        });
        
        editDialog.value.show = false;
        editDialog.value.content = '';
        editDialog.value.messageId = null;
      } catch (error) {
        console.error('Erreur lors de la modification du message:', error);
      }
    };
    
    // Fonction pour supprimer un message via le menu contextuel
    const deleteMessage = async () => {
      if (!contextMenu.value.message) return;
      
      try {
        await store.dispatch('messagePrivate/deleteMessage', contextMenu.value.message._id);
        contextMenu.value.show = false;
      } catch (error) {
        console.error('Erreur lors de la suppression du message:', error);
      }
    };
    
    // Fonction pour confirmer la suppression d'un message via la boîte de dialogue
    const confirmDeleteMessage = async () => {
      if (!deleteDialog.value.messageId) return;
      
      try {
        await store.dispatch('messagePrivate/deleteMessage', deleteDialog.value.messageId);
        deleteDialog.value.show = false;
        deleteDialog.value.messageId = null;
      } catch (error) {
        console.error('Erreur lors de la suppression du message:', error);
      }
    };
    
    // Fonction pour charger les utilisateurs disponibles
    const loadAvailableUsers = async () => {
      loadingUsers.value = true;
      addUserError.value = '';
      let allUsers = [];
      
      try {
        console.log('Chargement des utilisateurs...');
        
        // Essayer d'abord de récupérer tous les utilisateurs avec le paramètre all=true
        const initialResponse = await fetch(`${API_URL}/api/v1/users/search?all=true`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!initialResponse.ok) {
          console.warn(`Erreur HTTP ${initialResponse.status} pour la recherche avec all=true`);
        } else {
          const initialData = await initialResponse.json();
          console.log('Réponse initiale:', initialData);
          // Vérifier si les données sont dans data.users ou directement dans data
          allUsers = initialData.data?.users || initialData.data || [];
          
          if (allUsers.length > 0) {
            // Si nous avons déjà des utilisateurs, pas besoin de continuer
            console.log('Utilisateurs récupérés avec all=true:', allUsers.length);
          }
        }
        
        // Si nous n'avons pas assez d'utilisateurs, essayer avec des termes de recherche
        if (allUsers.length < 5) {
          console.log('Utilisation de termes de recherche spécifiques...');
          const searchTerms = ['a', 'e', 'i', 'o', 'u'];
          
          // Créer un tableau de promesses pour toutes les requêtes
          const promises = searchTerms.map(term => 
            fetch(`${API_URL}/api/v1/users/search?q=${term}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            })
            .then(response => {
              if (!response.ok) {
                console.warn(`Erreur HTTP ${response.status} pour le terme '${term}'`);
                return { data: { users: [] } };
              }
              return response.json();
            })
            .then(data => {
              console.log(`Résultat pour le terme '${term}':`, data);
              return data.data?.users || data.data || [];
            })
            .catch(error => {
              console.error(`Erreur lors de la recherche avec le terme '${term}':`, error);
              return [];
            })
          );
          
          // Attendre que toutes les requêtes soient terminées
          const results = await Promise.all(promises);
          
          // Fusionner les résultats et éliminer les doublons par ID
          const userMap = new Map();
          
          // D'abord ajouter les utilisateurs déjà récupérés
          allUsers.forEach(user => {
            if (user && user._id) {
              userMap.set(user._id, user);
            }
          });
          
          // Puis ajouter les résultats de la recherche
          results.flat().forEach(user => {
            if (user && user._id) {
              userMap.set(user._id, user);
            }
          });
          
          allUsers = Array.from(userMap.values());
        }
        
        // Vérifier que tous les utilisateurs ont les propriétés nécessaires
        allUsers = allUsers.filter(user => user && user._id && user.username);
        console.log('Utilisateurs valides après vérification:', allUsers.length);
        console.log('Utilisateurs récupérés:', allUsers.length);
        
        // Filtrer les utilisateurs pour exclure l'utilisateur courant et l'autre utilisateur de la conversation
        availableUsers.value = allUsers.filter(user => 
          user._id !== currentUser.value._id && 
          user._id !== props.userId
        );
        
        console.log('Utilisateurs disponibles après filtrage:', availableUsers.value.length);
      } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        addUserError.value = 'Impossible de charger les utilisateurs. Veuillez réessayer.';
      } finally {
        loadingUsers.value = false;
      }
    };
    
    // Fonction pour ajouter des utilisateurs à la conversation
    const addUsersToConversation = async () => {
      if (!selectedUsers.value || selectedUsers.value.length === 0) {
        addUserError.value = 'Veuillez sélectionner au moins un utilisateur';
        return;
      }
      
      addingUsers.value = true;
      addUserError.value = '';
      
      try {
        // Vérifier si nous avons un ID de conversation
        const conversationId = props.conversationId;
        
        if (!conversationId) {
          // Cas où nous n'avons pas encore d'ID de conversation (conversation 1:1 sans ID spécifique)
          // D'abord, vérifier si une conversation existe déjà entre ces utilisateurs
          // Nous allons créer une nouvelle conversation avec tous les participants
          
          // Préparer la liste des participants (utilisateur courant, destinataire, et nouveaux utilisateurs)
          const participants = [
            ...selectedUsers.value.map(user => user._id)
          ];
          
          // Si nous avons un ID d'utilisateur destinataire, l'ajouter à la liste
          if (props.userId) {
            participants.push(props.userId);
          }
          
          // Créer la conversation
          const response = await fetch(`${API_URL}/api/v1/conversations`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              participants,
              nom: `Groupe (${participants.length + 1} participants)` // +1 pour l'utilisateur courant
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error('Erreur API:', errorData);
            throw new Error(errorData.message || 'Erreur lors de la création de la conversation');
          }
          
          const data = await response.json();
          console.log('Conversation créée:', data);
          
          // Fermer la boîte de dialogue
          showAddUserDialog.value = false;
          
          // Afficher un message de succès
          alert('Conversation de groupe créée avec succès. Vous allez être redirigé.');
          
          // Rediriger vers la nouvelle conversation après un court délai
          setTimeout(() => {
            window.location.href = `/messages/conversation/${data.data.conversation._id}`;
          }, 500);
        } else {
          // Cas où nous avons déjà un ID de conversation (conversation existante)
          console.log('Ajout d\'utilisateurs à la conversation existante:', conversationId);
          
          // Ajouter les utilisateurs sélectionnés à la conversation existante
          const results = [];
          
          for (const user of selectedUsers.value) {
            try {
              const response = await fetch(`${API_URL}/api/v1/conversations/${conversationId}/participants`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                  userId: user._id
                })
              });
              
              if (!response.ok) {
                const errorData = await response.json();
                console.error(`Erreur lors de l'ajout de l'utilisateur ${user.username}:`, errorData);
                results.push({ user: user.username, success: false, message: errorData.message });
              } else {
                const data = await response.json();
                results.push({ user: user.username, success: true });
                console.log(`Utilisateur ${user.username} ajouté avec succès:`, data);
              }
            } catch (error) {
              console.error(`Erreur lors de l'ajout de l'utilisateur ${user.username}:`, error);
              results.push({ user: user.username, success: false, message: error.message });
            }
          }
          
          // Fermer la boîte de dialogue
          showAddUserDialog.value = false;
          
          // Afficher un résumé des résultats
          const successCount = results.filter(r => r.success).length;
          if (successCount === selectedUsers.value.length) {
            alert(`Tous les utilisateurs (${successCount}) ont été ajoutés avec succès.`);
          } else {
            alert(`${successCount} utilisateur(s) sur ${selectedUsers.value.length} ont été ajoutés avec succès.`);
          }
          
          // Recharger la page après un court délai
          setTimeout(() => {
            window.location.reload();
          }, 500);
        }
      } catch (error) {
        console.error('Erreur lors de l\'ajout des utilisateurs:', error);
        addUserError.value = 'Impossible d\'ajouter les utilisateurs. Veuillez réessayer.';
      } finally {
        addingUsers.value = false;
      }
    };
    
    // Charger les utilisateurs disponibles lorsque le dialogue est ouvert
    watch(showAddUserDialog, (newValue) => {
      if (newValue) {
        loadAvailableUsers();
        // Réinitialiser la sélection quand on ouvre le dialogue
        selectedUsers.value = [];
      }
    });
    
    // Vérifier si un utilisateur est sélectionné
    const isUserSelected = (user) => {
      return selectedUsers.value.some(selectedUser => selectedUser._id === user._id);
    };
    
    // Ajouter ou retirer un utilisateur de la sélection
    const toggleUserSelection = (user) => {
      if (isUserSelected(user)) {
        // Si l'utilisateur est déjà sélectionné, le retirer
        selectedUsers.value = selectedUsers.value.filter(selectedUser => selectedUser._id !== user._id);
      } else {
        // Sinon, l'ajouter
        selectedUsers.value.push(user);
      }
    };
    
    return {
      messagesContainer,
      messageContent,
      loading,
      messages,
      currentUser,
      otherUser,
      replyingTo,
      contextMenu,
      editDialog,
      deleteDialog,
      sendMessage,
      isFromCurrentUser,
      formatTime,
      formatDateHeader,
      shouldShowDate,
      getUserAvatar,
      openContextMenu,
      replyToMessage,
      showReplyDialog,
      cancelReply,
      editMessage,
      saveEditedMessage,
      deleteMessage,
      showEditDialog,
      showDeleteDialog,
      confirmDeleteMessage,
      
      // Variables et fonctions pour l'ajout d'utilisateurs
      showAddUserDialog,
      selectedUsers,
      availableUsers,
      loadingUsers,
      addingUsers,
      addUserError,
      loadAvailableUsers,
      addUsersToConversation,
      isUserSelected,
      toggleUserSelection,
      
      // Variables et fonctions pour les mentions d'utilisateurs
      showUserSuggestions,
      messageInputRef,
      mentionStartIndex,
      handleMessageInput,
      selectUser
    };
  }
};
</script>

<style scoped>
.private-conversation {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.conversation-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.conversation-header {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.conversation-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.conversation-footer {
  border-top: 1px solid rgba(0, 0, 0, 0.12);
  padding: 8px;
  display: flex;
  align-items: center;
  flex-direction: column;
}

.message-input {
  flex: 1;
  margin: 0 8px;
  padding: 8px;
}

.message-container {
  margin-bottom: 8px;
  max-width: 70%;
  display: flex;
  flex-direction: column;
}

.message-from-me {
  align-self: flex-end;
}

.message-from-other {
  align-self: flex-start;
}

.message-bubble {
  padding: 8px 12px;
  border-radius: 12px;
  position: relative;
}

.message-from-me .message-bubble {
  background-color: #e3f2fd;
  border-bottom-right-radius: 4px;
}

.message-from-other .message-bubble {
  background-color: #f5f5f5;
  border-bottom-left-radius: 4px;
}

.message-content {
  word-break: break-word;
  white-space: pre-wrap;
}

.message-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 4px;
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.6);
}

.message-actions {
  position: absolute;
  top: 5px;
  right: 5px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.message-bubble:hover .message-actions {
  opacity: 1;
}

.message-time {
  margin-right: 4px;
}

.date-separator {
  align-self: center;
  margin: 16px 0;
  padding: 4px 12px;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 16px;
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.6);
}

.reply-bar {
  width: 100%;
  padding: 8px 12px;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.reply-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.reply-preview-text {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.reply-preview {
  padding: 4px 8px;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  margin-bottom: 4px;
  border-left: 2px solid #1976d2;
}

.reply-author {
  font-size: 0.75rem;
  font-weight: bold;
  color: #1976d2;
}

.reply-content {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
