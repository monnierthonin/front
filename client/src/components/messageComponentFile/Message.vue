<template>
  <div class="listeMessage" :class="{'current-user': isCurrentUser}">
    <!-- Message auquel on répond si existant -->
    <div v-if="replyToMessage" class="reply-container">
      <div class="reply-content">
        <img src="../../assets/styles/image/repondre.png" alt="Reply" class="reply-icon" />
        <span class="reply-author">{{ replyToMessage.username }}</span>
        <span class="reply-text">{{ truncateText(replyToMessage.content, 50) }}</span>
      </div>
    </div>
    
    <div class="message-container" :class="{'current-user': isCurrentUser}">
      <div class="message-content">
        <!-- Photo de profil (à gauche pour les autres utilisateurs) -->
        <div class="profile-pic" v-if="!isCurrentUser">
          <img :src="profilePicture || '../../assets/styles/image/profilDelault.png'" alt="Profile" />
        </div>
        
        <div class="message-body">
          <div class="message-header">
            <span class="username">{{ username }}</span>
            <span class="timestamp">{{ formatTimestamp(timestamp) }}</span>
          </div>
          <div class="message-text">
            <p>{{ messageText }}</p>
          </div>
          
          <!-- Liste des réactions -->
          <div v-if="reactions && reactions.length > 0" class="reactions-container">
            <div v-for="(reaction, index) in reactions" :key="index" class="reaction-item" @click="toggleReaction(reaction.emoji)">
              <span class="reaction-emoji">{{ reaction.emoji }}</span>
              <span class="reaction-count">{{ reaction.utilisateurs.length }}</span>
            </div>
          </div>
        </div>
        
        <div class="message-actions">
          <button class="action-btn" @click="handleReply">
            <img src="../../assets/styles/image/repondre.png" alt="Reply" />
          </button>
          <button class="action-btn" @click="handleEmoji">
            <img src="../../assets/styles/image/react.png" alt="Emoji" />
          </button>
          <button class="action-btn" @click="handleEdit" v-if="isCurrentUser">
            <img src="../../assets/styles/image/modifier.png" alt="Edit" />
          </button>
          <button class="action-btn" @click="handleDelete" v-if="isCurrentUser">
            <img src="../../assets/styles/image/delet.png" alt="Delete" />
          </button>
        </div>
        
        <!-- Photo de profil (à droite pour l'utilisateur courant) -->
        <div class="profile-pic" v-if="isCurrentUser">
          <img :src="profilePicture || '../../assets/styles/image/profilDelault.png'" alt="Profile" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Message',
  props: {
    // Infos de base du message
    messageId: {
      type: String,
      required: true
    },
    username: {
      type: String,
      default: 'Utilisateur'
    },
    messageText: {
      type: String,
      default: 'Contenu du message'
    },
    timestamp: {
      type: [String, Date, Number],
      required: true
    },
    profilePicture: {
      type: String,
      default: null
    },
    isCurrentUser: {
      type: Boolean,
      default: false
    },
    // Support des réactions (emojis)
    reactions: {
      type: Array,
      default: () => []
    },
    // Support pour les messages auxquels on répond
    replyToMessage: {
      type: Object,
      default: null
    },
    // Type de contexte (canal ou privé)
    contextType: {
      type: String,
      default: 'canal', // 'canal' ou 'prive'
      validator: (value) => ['canal', 'prive'].includes(value)
    }
  },
  methods: {
    handleReply() {
      this.$emit('reply', {
        messageId: this.messageId,
        username: this.username,
        content: this.messageText,
        contextType: this.contextType
      });
    },
    handleEmoji() {
      this.$emit('emoji-picker', this.messageId);
    },
    handleEdit() {
      if (!this.isCurrentUser) return;
      this.$emit('edit', {
        messageId: this.messageId,
        content: this.messageText,
        contextType: this.contextType
      });
    },
    handleDelete() {
      if (!this.isCurrentUser) return;
      this.$emit('delete', {
        messageId: this.messageId,
        contextType: this.contextType
      });
    },
    toggleReaction(emoji) {
      this.$emit('toggle-reaction', {
        messageId: this.messageId,
        emoji: emoji,
        contextType: this.contextType
      });
    },
    formatTimestamp(timestamp) {
      // Fonction pour formater la date en fonction du format reçu
      if (!timestamp) return '';
      
      let date;
      if (timestamp instanceof Date) {
        date = timestamp;
      } else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      } else if (typeof timestamp === 'number') {
        date = new Date(timestamp);
      } else {
        return timestamp.toString();
      }
      
      // Si date invalide
      if (isNaN(date.getTime())) return timestamp.toString();
      
      // Format: HH:MM
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      return `${hours}:${minutes}`;
    },
    truncateText(text, maxLength) {
      if (!text) return '';
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }
  }
};
</script>

<style scoped>
.listeMessage {
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
  width: 100%;
  /* Préparation pour l'alignement selon l'expéditeur (valeur par défaut à gauche) */
  align-items: flex-start;
}

/* Pour les messages de l'utilisateur actuel */
.listeMessage.current-user {
  align-items: flex-end;
}

/* Conteneur pour le message auquel on répond */
.reply-container {
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 5px;
  padding: 5px 10px;
  margin-bottom: 5px;
  max-width: 80%;
  border-left: 3px solid var(--primary-color, #2196F3);
}

.reply-content {
  display: flex;
  align-items: center;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.reply-icon {
  width: 14px;
  height: 14px;
  margin-right: 5px;
}

.reply-author {
  font-weight: bold;
  margin-right: 8px;
}

.reply-text {
  opacity: 0.8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.message-container {
  padding: 8px 15px;
  border-radius: 12px;
  transition: background-color 0.2s;
  /* Limiter la largeur comme demandé */
  max-width: 65%;
  min-width: 30%;
  background-color: var(--secondary-color, #f5f5f5);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.message-container:hover {
  background-color: var(--secondary-color-hover, #e8e8e8);
}

/* Pour les messages de l'utilisateur actuel */
.message-container.current-user {
  background-color: var(--primary-color-light, #e3f2fd);
}

.message-content {
  display: flex;
  align-items: flex-start;
}

.profile-pic {
  margin-right: 12px;
  margin-left: 12px;
  flex-shrink: 0;
}

.profile-pic img {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
}

.message-body {
  flex-grow: 1;
  padding-right: 10px;
}

.message-header {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.username {
  font-weight: bold;
  color: var(--text-color);
  margin-right: 10px;
}

.timestamp {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

/* Conteneur des réactions */
.reactions-container {
  display: flex;
  flex-wrap: wrap;
  margin-top: 8px;
  gap: 5px;
}

.message-text {
  color: var(--text-color);
  word-break: break-word;
  line-height: 1.4;
}

.message-actions {
  display: flex;
  opacity: 0;
  transition: opacity 0.2s;
  align-items: center;
}

.message-container:hover .message-actions {
  opacity: 1;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  margin-left: 5px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.action-btn:hover {
  background-color: var(--accent-color, rgba(33, 150, 243, 0.1));
}

.action-btn img {
  width: 18px;
  height: 18px;
}

/* Style pour les éléments de réaction */
.reaction-item {
  display: flex;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  padding: 3px 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.reaction-item:hover {
  background-color: rgba(33, 150, 243, 0.2);
}

.reaction-emoji {
  font-size: 14px;
  margin-right: 4px;
}

.reaction-count {
  font-size: 12px;
  color: var(--text-secondary);
}

/* Adaptations responsive */
@media (max-width: 768px) {
  .message-container {
    max-width: 80%;
  }
  
  .profile-pic img {
    width: 32px;
    height: 32px;
  }
}
</style>
