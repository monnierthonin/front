<template>
  <div class="reaction-button-container">
    <!-- Bouton de réaction -->
    <button class="action-btn" @click.stop="toggleEmojiPicker">
      <img src="../../../assets/styles/image/react.png" alt="React" />
    </button>
    
    <!-- Sélecteur d'emoji avec div conteneur -->
    <div v-if="showEmojiPicker" class="emoji-picker-container">
      <div class="simple-emoji-list">
        <button 
          v-for="emoji in emojis" 
          :key="emoji"
          class="emoji-btn"
          @click.stop="selectEmoji(emoji)"
        >
          {{ emoji }}
        </button>
        <button class="close-emoji-btn" @click.stop="closeEmojiPicker">
          &times;
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import messageService from '@/services/messageService.js';
import messagePrivateService from '@/services/messagePrivateService.js';

export default {
  name: 'MessageReactionButton',
  props: {
    message: {
      type: Object,
      required: true
    },
    isPrivate: {
      type: Boolean,
      default: false
    },
    conversationId: {
      type: String,
      required: false,
      default: ''
    },
    workspaceId: {
      type: String,
      required: false,
      default: ''
    }
  },
  data() {
    return {
      showEmojiPicker: false,
      emojis: ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '👏', '🙏', '🤔', '👀', '🔥']
    };
  },
  mounted() {
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  },
  methods: {
    toggleEmojiPicker() {
      this.showEmojiPicker = !this.showEmojiPicker;
    },
    closeEmojiPicker() {
      this.showEmojiPicker = false;
    },
    handleClickOutside(event) {
      const container = this.$el;
      if (container && !container.contains(event.target) && this.showEmojiPicker) {
        this.closeEmojiPicker();
      }
    },
    async selectEmoji(emoji) {
      try {
        let result;
        
        if (this.isPrivate) {
          result = await messagePrivateService.reactToPrivateMessage(
            this.conversationId,
            this.message._id,
            emoji
          );
        } else {
          result = await messageService.reactToMessage(
            this.workspaceId,
            this.message.canal,
            this.message._id,
            emoji
          );
        }
        
        this.closeEmojiPicker();
        
        this.$emit('reaction-added', {
          messageId: this.message._id,
          emoji,
          result
        });
        
      } catch (error) {
        console.error('Erreur lors de l\'ajout de la réaction:', error);
        if (error.message && error.message.includes('déjà réagi')) {
          this.closeEmojiPicker();
        } else {
          console.error(`Erreur de réaction: ${error.message}`);
        }
      }
    }
  }
};
</script>

<style scoped>
.reaction-button-container {
  position: relative;
}

.action-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.action-btn:hover {
  opacity: 1;
}

.action-btn img {
  width: 16px;
  height: 16px;
}

.emoji-picker-container {
  position: absolute;
  z-index: 1000;
  bottom: 30px;
  left: -40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  padding: 5px;
}

/* Liste d'emojis */
.simple-emoji-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 5px;
  padding: 5px;
  max-width: 180px;
}

.emoji-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.emoji-btn:hover {
  background-color: #f0f0f0;
}

.close-emoji-btn {
  grid-column: span 4;
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 5px;
  margin-top: 5px;
  color: #999;
  border-radius: 4px;
}

.close-emoji-btn:hover {
  background-color: #f0f0f0;
  color: #333;
}
</style>
