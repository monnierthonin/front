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
          placeholder="Écrivez votre message..."
          class="message-input"
          @keydown.enter.prevent="sendMessage"
        ></v-textarea>
        
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
    
    // Récupérer les messages de la conversation
    const messages = computed(() => {
      return store.getters['messagePrivate/getMessagesSorted'];
    });
    
    // Récupérer l'utilisateur courant
    const currentUser = computed(() => {
      return store.state.auth.user;
    });
    
    // Récupérer l'autre utilisateur de la conversation
    const otherUser = computed(() => {
      // Trouver la conversation correspondante dans la liste des conversations
      const conversation = store.state.messagePrivate.conversations.find(
        conv => conv.user._id === props.userId
      );
      
      return conversation ? conversation.user : { username: 'Utilisateur' };
    });
    
    // Charger les messages au montage du composant
    onMounted(async () => {
      loading.value = true;
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
      confirmDeleteMessage
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
