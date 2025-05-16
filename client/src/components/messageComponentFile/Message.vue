<template>
  <div class="messages-list" ref="messagesList">
    <div v-if="isLoading" class="messages-loading">Chargement des messages...</div>
    <div v-else-if="messages.length === 0" class="messages-empty">Aucun message dans ce canal</div>
    <template v-else>
      <div 
        v-for="message in messages" 
        :key="message._id"
        :class="['message-container', { 'current-user': isCurrentUser(message.auteur._id) }]">
        <div class="message-content">
          <!-- Profile picture -->
          <div class="profile-pic">
            <ProfilePicture 
              :userId="message.auteur._id" 
              :altText="getUserName(message.auteur)" 
            />
          </div>
          
          <!-- Message body -->
          <div class="message-body">
            <!-- Username and timestamp -->
            <div class="message-header">
              <span class="username">{{ getUserName(message.auteur) }}</span>
              <span class="timestamp">{{ formatDate(message.createdAt) }}</span>
            </div>
            
            <!-- Message text -->
            <div class="message-text">
              <p>{{ message.contenu }}</p>
            </div>
          </div>
    
          <!-- Action buttons -->
          <div class="message-actions">
            <button class="action-btn" @click="handleReply(message)">
              <img src="../../assets/styles/image/repondre.png" alt="Reply" />
            </button>
            <button class="action-btn" @click="handleEmoji(message)">
              <img src="../../assets/styles/image/react.png" alt="Emoji" />
            </button>
            <button 
              v-if="isCurrentUser(message.auteur._id)" 
              class="action-btn" 
              @click="handleEdit(message)">
              <img src="../../assets/styles/image/modifier.png" alt="Edit" />
            </button>
            <button 
              v-if="isCurrentUser(message.auteur._id)" 
              class="action-btn" 
              @click="handleDelete(message)">
              <img src="../../assets/styles/image/delet.png" alt="Delete" />
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import messageService from '../../services/messageService.js';
import ProfilePicture from '../common/ProfilePicture.vue';

export default {
  components: {
    ProfilePicture
  },
  name: 'Message',
  props: {
    messages: {
      type: Array,
      default: () => []
    },
    isLoading: {
      type: Boolean,
      default: false
    },
    currentUserId: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      userId: null
    };
  },
  created() {
    // Récupérer l'ID de l'utilisateur connecté s'il n'est pas fourni via les props
    if (!this.currentUserId) {
      this.userId = messageService.getUserIdFromToken();
    } else {
      this.userId = this.currentUserId;
    }
  },
  updated() {
    // Faire défiler vers le bas pour voir les derniers messages
    this.scrollToBottom();
  },
  methods: {
    /**
     * Vérifier si le message provient de l'utilisateur connecté
     * @param {String} authorId - ID de l'auteur du message
     * @returns {Boolean} true si c'est l'utilisateur actuel
     */
    isCurrentUser(authorId) {
      return authorId === this.userId;
    },
    
    /**
     * Formater une date pour l'afficher dans un format lisible
     * @param {String} dateString - Date à formatter
     * @returns {String} Date formatée
     */
    formatDate(dateString) {
      if (!dateString) return '';
      
      try {
        const date = new Date(dateString);
        // Format: HH:MM jour/mois/année
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')} ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
      } catch (error) {
        return dateString;
      }
    },
    
    /**
     * Obtenir le nom d'affichage d'un utilisateur
     * @param {Object} user - Données de l'utilisateur
     * @returns {String} Nom d'affichage
     */
    getUserName(user) {
      if (!user) return 'Utilisateur inconnu';
      return user.username || user.firstName || user.email || 'Sans nom';
    },
    
    // La méthode getProfilePicture a été remplacée par le composant ProfilePicture
    
    /**
     * Faire défiler vers le bas pour voir les derniers messages
     */
    scrollToBottom() {
      this.$nextTick(() => {
        if (this.$refs.messagesList) {
          this.$refs.messagesList.scrollTop = this.$refs.messagesList.scrollHeight;
        }
      });
    },
    
    /**
     * Gérer la réponse à un message
     * @param {Object} message - Message auquel répondre
     */
    handleReply(message) {
      this.$emit('reply', message);
    },
    
    /**
     * Gérer l'ajout d'emoji à un message
     * @param {Object} message - Message sur lequel ajouter un emoji
     */
    handleEmoji(message) {
      this.$emit('emoji', message);
    },
    
    /**
     * Gérer la modification d'un message
     * @param {Object} message - Message à modifier
     */
    handleEdit(message) {
      this.$emit('edit', message);
    },
    
    /**
     * Gérer la suppression d'un message
     * @param {Object} message - Message à supprimer
     */
    handleDelete(message) {
      this.$emit('delete', message);
    }
  }
}
</script>

<style scoped>
.messages-list {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: calc(100vh - 80px);
  overflow-y: auto;
  padding: 1rem;
  scroll-behavior: smooth;
  margin-bottom: 70px; /* Espace pour la zone de texte */
  
  /* Masquer la barre de défilement tout en gardant la fonctionnalité */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* Internet Explorer et Edge */
}

/* Masquer la barre de défilement pour Chrome, Safari et Opera */
.messages-list::-webkit-scrollbar {
  display: none;
}

.messages-loading,
.messages-empty {
  text-align: center;
  padding: 2rem 0;
  color: var(--color-text-light, #888);
  font-style: italic;
}

.message-container {
  width: 100%;
  padding: 0.5rem 0;
  display: flex;
  justify-content: flex-start;
  margin-bottom: 1rem;
}

/* Message de l'utilisateur actuel à droite */
.message-container.current-user {
  justify-content: flex-end;
}

.message-content {
  display: flex;
  position: relative;
  max-width: 70%;
  background-color: var(--color-background-soft, #36393f);
  border-radius: 8px;
  padding: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Style spécifique pour les messages de l'utilisateur actuel */
.current-user .message-content {
  background-color: var(--accent-color-light, #14324F);
  color: #fff;
  flex-direction: row-reverse;
}

.profile-pic {
  width: 40px;
  height: 40px;
  margin-right: 0.75rem;
}

.current-user .profile-pic {
  margin-right: 0;
  margin-left: 0.75rem;
}

.profile-pic img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.message-body {
  flex: 1;
  min-width: 0; /* Pour éviter le débordement du contenu */
}

.message-header {
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
}

.username {
  font-weight: bold;
  margin-right: 0.5rem;
  word-break: break-word;
}

.timestamp {
  color: var(--color-text-light, #a3a3a3);
  font-size: 0.8rem;
}

.current-user .timestamp {
  color: rgba(255, 255, 255, 0.7);
}

.message-text {
  color: inherit;
  line-height: 1.4;
  word-break: break-word;
}

.message-text p {
  margin: 0;
}

.message-actions {
  position: absolute;
  top: -20px;
  right: 8px;
  display: flex;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s;
  background-color: var(--color-background, #2f3136);
  border-radius: 4px;
  padding: 2px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.current-user .message-actions {
  right: auto;
  left: 8px;
}

.message-content:hover .message-actions {
  opacity: 1;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.action-btn:hover {
  background-color: var(--color-background-mute, #4f545c);
}

.action-btn img {
  width: 18px;
  height: 18px;
}
</style>
