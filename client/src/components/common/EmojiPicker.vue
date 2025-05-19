<template>
  <div class="emoji-picker" v-if="isVisible" ref="emojiPicker">
    <div class="emoji-container">
      <div class="emoji-group">
        <button 
          v-for="emoji in commonEmojis" 
          :key="emoji" 
          class="emoji-button" 
          @click="selectEmoji(emoji)"
        >
          {{ emoji }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'EmojiPicker',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      commonEmojis: ['👍', '👎', '❤️', '😄', '😮', '😢', '🔥', '👀', '🎉', '💯', '👏', '🙏', '🤔']
    };
  },
  mounted() {
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  },
  methods: {
    selectEmoji(emoji) {
      this.$emit('emoji-selected', emoji);
    },
    handleClickOutside(event) {
      if (this.$refs.emojiPicker && !this.$refs.emojiPicker.contains(event.target)) {
        this.$emit('close');
      }
    }
  }
};
</script>

<style scoped>
.emoji-picker {
  position: absolute;
  bottom: calc(100% + 10px);
  right: 0;
  margin-bottom: 5px;
  width: 220px;
  background-color: var(--color-background, #ffffff);
  border: 1px solid var(--color-border, #dddddd);
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  padding: 10px;
}

.emoji-container {
  max-height: 150px;
  overflow-y: auto;
}

.emoji-group {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 5px;
}

.emoji-button {
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 5px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.emoji-button:hover {
  background-color: var(--color-background-mute, #f0f0f0);
}
</style>
