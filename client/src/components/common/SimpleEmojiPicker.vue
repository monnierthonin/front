<template>
  <div class="emoji-picker" ref="emojiPickerRef">
    <div class="emoji-list">
      <button 
        v-for="emoji in emojis" 
        :key="emoji" 
        class="emoji-btn" 
        @click="selectEmoji(emoji)"
      >
        {{ emoji }}
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SimpleEmojiPicker',
  data() {
    return {
      emojis: ['👍', '👎', '❤️', '😄', '😮', '😢', '🔥', '👀', '🎉']
    };
  },
  methods: {
    selectEmoji(emoji) {
      this.$emit('select', emoji);
    }
  },
  mounted() {
    // Fermer le picker si on clique en dehors
    const handleClickOutside = (event) => {
      if (this.$refs.emojiPickerRef && !this.$refs.emojiPickerRef.contains(event.target)) {
        this.$emit('close');
      }
    };
    document.addEventListener('click', handleClickOutside);
    
    // Nettoyage de l'écouteur d'événement
    this.$once('hook:beforeDestroy', () => {
      document.removeEventListener('click', handleClickOutside);
    });
  }
};
</script>

<style scoped>
.emoji-picker {
  position: absolute;
  top: -70px;
  left: 0;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.emoji-list {
  display: flex;
  flex-wrap: wrap;
  max-width: 160px;
}

.emoji-btn {
  background: none;
  border: none;
  font-size: 18px;
  padding: 5px;
  cursor: pointer;
  border-radius: 3px;
  transition: background-color 0.2s;
}

.emoji-btn:hover {
  background-color: #f0f0f0;
}
</style>
