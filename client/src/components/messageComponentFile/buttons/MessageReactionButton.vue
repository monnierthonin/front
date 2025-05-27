<template>
  <div class="reaction-button-container">
    <button class="action-btn" @click="toggleEmojiPicker">
      <img src="../../../assets/styles/image/react.png" alt="React" />
    </button>
    <SimpleEmojiPicker 
      v-if="showEmojiPicker"
      @select="handleReaction"
      @close="closeEmojiPicker"
    />
  </div>
</template>

<script>
import messageService from '../../../services/messageService.js';
import messagePrivateService from '../../../services/messagePrivateService.js';
import SimpleEmojiPicker from '../../common/SimpleEmojiPicker.vue';

export default {
  name: 'MessageReactionButton',
  components: {
    SimpleEmojiPicker
  },
  props: {
    message: {
      type: Object,
      required: true
    },
    isPrivate: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      showEmojiPicker: false
    };
  },
  methods: {
    toggleEmojiPicker() {
      this.showEmojiPicker = !this.showEmojiPicker;
    },
    
    closeEmojiPicker() {
      this.showEmojiPicker = false;
    },
    
    async handleReaction(emoji) {
      try {
        if (!this.isPrivate) {
          await messageService.reactToMessage(
            this.$route.params.id,
            this.message.canal,
            this.message._id,
            emoji
          );
        } else {
          await messagePrivateService.reactToPrivateMessage(
            this.$route.params.conversationId,
            this.message._id,
            emoji
          );
        }
        
        this.$emit('reaction-added', {
          messageId: this.message._id,
          emoji: emoji
        });
        
        this.closeEmojiPicker();
      } catch (error) {
        console.error('Erreur lors de l\'ajout de la réaction:', error);
        alert(`Erreur: ${error.message}`);
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
</style>
