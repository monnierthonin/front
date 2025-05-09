<template>
  <div class="conversation-group">
    <v-card class="conversation-card">
      <!-- En-tête de la conversation -->
      <v-card-title class="conversation-header">
        <div class="d-flex align-center">
          <v-avatar-group max="3">
            <v-avatar v-for="participant in participants" :key="participant._id" size="40">
              <v-img :src="getUserAvatar(participant)" alt="Avatar"></v-img>
            </v-avatar>
          </v-avatar-group>
          <div class="ml-3">
            <div class="text-h6">
              {{ conversation && conversation.nom ? conversation.nom : generateGroupName() }}
            </div>
            <div class="text-caption">
              {{ participants && participants.length ? participants.length : 0 }} participants
            </div>
          </div>
        </div>
        <v-spacer></v-spacer>
        <v-btn icon @click="showParticipantsDialog = true" title="Voir les participants">
          <v-icon>mdi-account-group</v-icon>
        </v-btn>
        <v-btn icon @click="showAddUserDialog = true" title="Ajouter des utilisateurs">
          <v-icon>mdi-account-plus</v-icon>
        </v-btn>
        <v-btn icon @click="confirmLeaveConversation" title="Quitter la conversation" color="error">
          <v-icon>mdi-exit-to-app</v-icon>
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
          <div v-for="(message, index) in messages" :key="message._id" class="message-wrapper">
            <!-- Afficher la date si c'est le premier message ou si la date a changé -->
            <div v-if="shouldShowDate(message, index)" class="date-header">
              {{ formatDateHeader(message.horodatage) }}
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
                <v-icon v-if="message.lu" size="x-small" color="success">mdi-check-all</v-icon>
                <v-icon v-else-if="message.envoye" size="x-small">mdi-check</v-icon>
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
          placeholder="Écrivez votre message..."
          class="message-input"
          @keydown.enter.prevent="sendMessage"
        ></v-textarea>
        
        <v-btn icon @click="sendMessage" :disabled="!messageContent.trim()" :loading="sending">
          <v-icon>mdi-send</v-icon>
        </v-btn>
      </v-card-actions>
    </v-card>
    
    <!-- Menu contextuel -->
    <v-menu
      v-model="contextMenu.show"
      :position-x="contextMenu.x"
      :position-y="contextMenu.y"
      absolute
      offset-y
    >
      <v-list>
        <v-list-item
          @click="replyToMessage"
        >
          <v-list-item-title>
            <v-icon small class="mr-2">mdi-reply</v-icon>
            Répondre
          </v-list-item-title>
        </v-list-item>
        
        <v-list-item
          v-if="contextMenu.message && isFromCurrentUser(contextMenu.message)"
          @click="editMessage"
        >
          <v-list-item-title>
            <v-icon small class="mr-2">mdi-pencil</v-icon>
            Modifier
          </v-list-item-title>
        </v-list-item>
        
        <v-list-item
          v-if="contextMenu.message && isFromCurrentUser(contextMenu.message)"
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
          <v-autocomplete
            v-model="selectedUsers"
            :items="availableUsers"
            item-text="username"
            item-value="_id"
            chips
            label="Sélectionner des utilisateurs"
            multiple
            return-object
            :loading="loadingUsers"
          >
            <template v-slot:selection="{ item }">
              <v-chip>
                <v-avatar left>
                  <v-img :src="getUserAvatar(item)"></v-img>
                </v-avatar>
                {{ item.username }}
              </v-chip>
            </template>
            <template v-slot:item="{ item }">
              <v-list-item-avatar>
                <v-img :src="getUserAvatar(item)"></v-img>
              </v-list-item-avatar>
              <v-list-item-content>
                <v-list-item-title>{{ item.username }}</v-list-item-title>
                <v-list-item-subtitle>{{ item.email }}</v-list-item-subtitle>
              </v-list-item-content>
            </template>
          </v-autocomplete>
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
    
    <!-- Dialogue pour afficher les participants -->
    <v-dialog v-model="showParticipantsDialog" max-width="500px">
      <v-card>
        <v-card-title class="d-flex align-center">
          <span>Participants de la conversation</span>
          <v-chip class="ml-2" small>{{ participants && participants.length ? participants.length : 0 }}</v-chip>
        </v-card-title>
        
        <v-card-text>
          <div v-if="loading" class="text-center pa-4">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
            <p class="mt-2">Chargement des participants...</p>
          </div>
          
          <v-list v-else-if="participants && participants.length">
            <!-- Utilisateur courant (vous) -->
            <v-subheader>Vous</v-subheader>
            <v-list-item>
              <v-list-item-avatar>
                <v-img :src="getUserAvatar(currentUser.value || {})" alt="Votre avatar"></v-img>
              </v-list-item-avatar>
              <v-list-item-content>
                <v-list-item-title>{{ currentUser.value && currentUser.value.username ? currentUser.value.username : 'Vous' }} (Vous)</v-list-item-title>
                <v-list-item-subtitle v-if="currentUser.value && currentUser.value.firstName && currentUser.value.lastName">
                  {{ currentUser.value.firstName }} {{ currentUser.value.lastName }}
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
            
            <!-- Autres participants -->
            <v-divider class="my-2"></v-divider>
            <v-subheader>Autres participants</v-subheader>
            
            <v-list-item v-for="participant in otherParticipants" :key="participant._id">
              <v-list-item-avatar>
                <v-img :src="getUserAvatar(participant)" alt="Avatar"></v-img>
              </v-list-item-avatar>
              <v-list-item-content>
                <v-list-item-title>{{ participant.username }}</v-list-item-title>
                <v-list-item-subtitle v-if="participant.firstName && participant.lastName">
                  {{ participant.firstName }} {{ participant.lastName }}
                </v-list-item-subtitle>
                <v-list-item-subtitle v-else>
                  {{ participant.email || 'Utilisateur' }}
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list>
          
          <div v-else class="text-center pa-4">
            <v-icon large color="grey lighten-1">mdi-account-group</v-icon>
            <p class="text-body-2 mt-2">Aucun autre participant dans cette conversation</p>
          </div>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showParticipantsDialog = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Dialogue de confirmation pour quitter la conversation -->
    <v-dialog v-model="showLeaveDialog" max-width="400px">
      <v-card>
        <v-card-title>Quitter la conversation</v-card-title>
        <v-card-text>
          Êtes-vous sûr de vouloir quitter cette conversation ? Vous ne pourrez plus accéder aux messages à moins d'être réinvité.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showLeaveDialog = false">Annuler</v-btn>
          <v-btn color="error" @click="leaveConversation" :loading="leavingConversation">Quitter</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useStore } from 'vuex';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import axios from 'axios';

export default {
  name: 'ConversationGroup',
  
  props: {
    conversationId: {
      type: String,
      required: true
    }
  },
  
  setup(props) {
    const store = useStore();
    const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:3000';
    
    // Variables d'état
    const messagesContainer = ref(null);
    const messageContent = ref('');
    const loading = ref(true);
    const sending = ref(false);
    const conversation = ref(null);
    const messages = ref([]);
    const participants = ref([]);
    const replyingTo = ref(null);
    
    // Variables pour le menu contextuel
    const contextMenu = ref({
      show: false,
      x: 0,
      y: 0,
      message: null
    });
    
    // Variables pour les dialogues
    const editDialog = ref({
      show: false,
      content: '',
      messageId: null
    });
    
    const deleteDialog = ref({
      show: false,
      messageId: null
    });
    
    // Variables pour l'ajout d'utilisateurs
    const showAddUserDialog = ref(false);
    const selectedUsers = ref([]);
    const availableUsers = ref([]);
    const loadingUsers = ref(false);
    const addingUsers = ref(false);
    const addUserError = ref('');
    
    // Variables pour l'affichage des participants
    const showParticipantsDialog = ref(false);
    
    // Variables pour quitter la conversation
    const showLeaveDialog = ref(false);
    const leavingConversation = ref(false);
    
    // Utilisateur courant
    const currentUser = computed(() => store.state.auth.user);
    
    // Filtrer les participants pour exclure l'utilisateur courant
    const otherParticipants = computed(() => {
      if (!participants.value || participants.value.length === 0) {
        return [];
      }
      return participants.value.filter(p => p._id !== currentUser.value._id);
    });
    
    // Charger la conversation et les messages
    const loadConversation = async () => {
      loading.value = true;
      
      try {
        // Vérifier que nous avons bien un token et un ID d'utilisateur
        const token = localStorage.getItem('token');
        
        // Récupérer l'ID utilisateur depuis plusieurs sources possibles
        let userId = localStorage.getItem('userId');
        
        // Si l'ID n'est pas dans localStorage, essayer de le récupérer depuis le store
        if (!userId && currentUser.value && currentUser.value._id) {
          userId = currentUser.value._id;
          // Sauvegarder l'ID pour les prochaines utilisations
          localStorage.setItem('userId', userId);
        }
        
        // Si toujours pas d'ID, essayer de le récupérer depuis l'objet user stocké
        if (!userId) {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            try {
              const userObj = JSON.parse(userStr);
              if (userObj && userObj._id) {
                userId = userObj._id;
                localStorage.setItem('userId', userId);
              }
            } catch (e) {
              console.error('Erreur lors de la récupération de l\'ID utilisateur:', e);
            }
          }
        }
        
        if (!token) {
          console.error('Aucun token d\'authentification trouvé');
          return;
        }
        
        if (!userId) {
          console.error('Impossible de déterminer l\'ID de l\'utilisateur connecté');
          return;
        }
        
        console.log(`Chargement de la conversation ${props.conversationId} pour l'utilisateur ${userId}`);
        
        const response = await axios.get(`${API_URL}/api/v1/conversations/${props.conversationId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Réponse de l\'API:', response.data);
        
        conversation.value = response.data.data.conversation;
        
        // Vérifier que les participants sont correctement chargés
        if (conversation.value && conversation.value.participants) {
          participants.value = conversation.value.participants.map(p => p.utilisateur);
          console.log(`${participants.value.length} participants chargés:`, participants.value);
        } else {
          console.error('Aucun participant trouvé dans la conversation');
          participants.value = [];
        }
        
        // Charger les messages de la conversation
        await loadMessages();
      } catch (error) {
        console.error('Erreur lors du chargement de la conversation:', error);
        if (error.response) {
          console.error('Détails de l\'erreur:', error.response.data);
        }
      } finally {
        loading.value = false;
      }
    };
    
    // Charger les messages de la conversation
    const loadMessages = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/v1/conversations/${props.conversationId}/messages`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        messages.value = response.data.data.messages;
        
        // Faire défiler jusqu'au dernier message
        nextTick(() => {
          scrollToBottom();
        });
      } catch (error) {
        console.error('Erreur lors du chargement des messages:', error);
      }
    };
    
    // Envoyer un message
    const sendMessage = async () => {
      if (!messageContent.value.trim()) return;
      
      sending.value = true;
      
      try {
        const payload = {
          contenu: messageContent.value.trim(),
          conversation: props.conversationId
        };
        
        // Si c'est une réponse à un autre message
        if (replyingTo.value) {
          payload.reponseA = replyingTo.value._id;
        }
        
        await axios.post(`${API_URL}/api/v1/conversations/${props.conversationId}/messages`, payload, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        // Réinitialiser le champ de saisie et la réponse
        messageContent.value = '';
        replyingTo.value = null;
        
        // Recharger les messages
        await loadMessages();
      } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
      } finally {
        sending.value = false;
      }
    };
    
    // Fonction pour faire défiler jusqu'au dernier message
    const scrollToBottom = () => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
      }
    };
    
    // Fonctions pour le formatage des dates
    const formatTime = (date) => {
      return format(new Date(date), 'HH:mm');
    };
    
    const formatDateHeader = (date) => {
      const messageDate = new Date(date);
      
      if (isToday(messageDate)) {
        return 'Aujourd\'hui';
      } else if (isYesterday(messageDate)) {
        return 'Hier';
      } else {
        return format(messageDate, 'EEEE d MMMM yyyy', { locale: fr });
      }
    };
    
    // Fonction pour déterminer si on doit afficher la date
    const shouldShowDate = (message, index) => {
      if (index === 0) return true;
      
      const currentDate = new Date(message.horodatage);
      const previousDate = new Date(messages.value[index - 1].horodatage);
      
      return !isSameDay(currentDate, previousDate);
    };
    
    // Fonction pour vérifier si un message est de l'utilisateur courant
    const isFromCurrentUser = (message) => {
      return message.expediteur._id === currentUser.value._id;
    };
    
    // Fonction pour obtenir l'avatar d'un utilisateur
    const getUserAvatar = (user) => {
      // Vérifier si l'utilisateur est défini et valide
      if (!user || typeof user !== 'object') {
        return '/img/default-avatar.png';
      }
      
      // Vérifier si la propriété profilePicture existe et est valide
      if (user.profilePicture && typeof user.profilePicture === 'string' && user.profilePicture.trim() !== '') {
        return `${API_URL}/${user.profilePicture}`;
      }
      
      return '/img/default-avatar.png';
    };
    
    // Fonction pour générer un nom de groupe
    const generateGroupName = () => {
      if (!participants.value || participants.value.length === 0) {
        return 'Nouvelle conversation';
      }
      
      // Utiliser les noms des 3 premiers participants
      const names = participants.value.slice(0, 3).map(p => p.username);
      
      if (participants.value.length > 3) {
        return `${names.join(', ')} et ${participants.value.length - 3} autres`;
      }
      
      return names.join(', ');
    };
    
    // Fonctions pour le menu contextuel
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
        await axios.put(`${API_URL}/api/v1/conversations/${props.conversationId}/messages/${editDialog.value.messageId}`, {
          contenu: editDialog.value.content.trim()
        }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        editDialog.value.show = false;
        editDialog.value.content = '';
        editDialog.value.messageId = null;
        
        // Recharger les messages
        await loadMessages();
      } catch (error) {
        console.error('Erreur lors de la modification du message:', error);
      }
    };
    
    // Fonction pour supprimer un message via le menu contextuel
    const deleteMessage = async () => {
      if (!contextMenu.value.message) return;
      
      try {
        await axios.delete(`${API_URL}/api/v1/conversations/${props.conversationId}/messages/${contextMenu.value.message._id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        contextMenu.value.show = false;
        
        // Recharger les messages
        await loadMessages();
      } catch (error) {
        console.error('Erreur lors de la suppression du message:', error);
      }
    };
    
    // Fonction pour confirmer la suppression d'un message via la boîte de dialogue
    const confirmDeleteMessage = async () => {
      if (!deleteDialog.value.messageId) return;
      
      try {
        await axios.delete(`${API_URL}/api/v1/conversations/${props.conversationId}/messages/${deleteDialog.value.messageId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        deleteDialog.value.show = false;
        deleteDialog.value.messageId = null;
        
        // Recharger les messages
        await loadMessages();
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
          allUsers = initialData.data?.users || [];
          
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
            .then(data => data.data?.users || [])
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
        
        console.log('Total des utilisateurs récupérés:', allUsers.length);
        
        // Filtrer les utilisateurs pour exclure les participants actuels
        if (!participants.value || participants.value.length === 0) {
          console.warn('Aucun participant trouvé, impossible de filtrer les utilisateurs disponibles');
          availableUsers.value = allUsers.filter(user => 
            user._id !== currentUser.value?._id
          );
        } else {
          // Filtrer les utilisateurs déjà participants
          const participantIds = participants.value.map(p => p._id);
          console.log('IDs des participants actuels:', participantIds);
          
          availableUsers.value = allUsers.filter(user => 
            !participantIds.includes(user._id) && user._id !== currentUser.value?._id
          );
        }
        
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
        // Ajouter les utilisateurs sélectionnés à la conversation
        const promises = selectedUsers.value.map(user => {
          return axios.post(`${API_URL}/api/v1/conversations/${props.conversationId}/participants`, {
            userId: user._id
          }, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
        });
        
        await Promise.all(promises);
        
        // Fermer le dialogue et recharger la conversation
        showAddUserDialog.value = false;
        selectedUsers.value = [];
        await loadConversation();
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
      }
    });
    
    // Fonction pour confirmer le départ de la conversation
    const confirmLeaveConversation = () => {
      showLeaveDialog.value = true;
    };
    
    // Fonction pour quitter la conversation
    const leaveConversation = async () => {
      leavingConversation.value = true;
      
      try {
        // Appel à l'API pour quitter la conversation
        const response = await fetch(`${API_URL}/api/v1/conversations/${props.conversationId}/participants/${currentUser.value._id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erreur lors du départ de la conversation');
        }
        
        // Fermer la boîte de dialogue
        showLeaveDialog.value = false;
        
        // Afficher un message de succès
        alert('Vous avez quitté la conversation avec succès. Vous allez être redirigé vers la liste des conversations.');
        
        // Rediriger vers la liste des conversations
        setTimeout(() => {
          window.location.href = '/messages';
        }, 500);
      } catch (error) {
        console.error('Erreur lors du départ de la conversation:', error);
        alert(`Erreur: ${error.message || 'Impossible de quitter la conversation. Veuillez réessayer.'}`);
        showLeaveDialog.value = false;
      } finally {
        leavingConversation.value = false;
      }
    };
    
    // Charger la conversation au montage du composant
    onMounted(() => {
      loadConversation();
    });
    
    return {
      messagesContainer,
      messageContent,
      loading,
      sending,
      conversation,
      messages,
      participants,
      otherParticipants,
      currentUser,
      replyingTo,
      contextMenu,
      editDialog,
      deleteDialog,
      showAddUserDialog,
      selectedUsers,
      availableUsers,
      loadingUsers,
      addingUsers,
      addUserError,
      showParticipantsDialog,
      showLeaveDialog,
      leavingConversation,
      
      sendMessage,
      loadMessages,
      scrollToBottom,
      formatTime,
      formatDateHeader,
      shouldShowDate,
      isFromCurrentUser,
      getUserAvatar,
      generateGroupName,
      openContextMenu,
      replyToMessage,
      showReplyDialog,
      cancelReply,
      editMessage,
      showEditDialog,
      saveEditedMessage,
      deleteMessage,
      showDeleteDialog,
      confirmDeleteMessage,
      loadAvailableUsers,
      addUsersToConversation,
      confirmLeaveConversation,
      leaveConversation
    };
  }
};
</script>

<style scoped>
.conversation-group {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.conversation-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: 0;
}

.conversation-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  padding: 8px 16px;
}

.conversation-body {
  flex-grow: 1;
  overflow-y: auto;
  padding: 16px;
  background-color: #f5f5f5;
}

.conversation-footer {
  border-top: 1px solid rgba(0, 0, 0, 0.12);
  padding: 8px 16px;
  display: flex;
  align-items: center;
}

.message-wrapper {
  margin-bottom: 16px;
}

.date-header {
  text-align: center;
  margin: 16px 0;
  font-size: 0.85rem;
  color: rgba(0, 0, 0, 0.6);
  position: relative;
}

.date-header::before,
.date-header::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 30%;
  height: 1px;
  background-color: rgba(0, 0, 0, 0.12);
}

.date-header::before {
  left: 0;
}

.date-header::after {
  right: 0;
}

.message-bubble {
  position: relative;
  max-width: 80%;
  padding: 8px 12px;
  border-radius: 8px;
  background-color: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  margin-bottom: 4px;
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

.reply-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  margin-bottom: 8px;
  width: 100%;
}

.reply-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.reply-preview-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: rgba(0, 0, 0, 0.6);
  font-size: 0.85rem;
}

.reply-preview {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 8px;
  border-left: 3px solid #1976d2;
}

.reply-author {
  font-weight: 500;
  margin-bottom: 4px;
}

.reply-content {
  color: rgba(0, 0, 0, 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.message-input {
  flex-grow: 1;
  margin: 0 8px;
}
</style>
