<template>
  <div class="listeMessage">
    <div class="message-container">
      <div class="message-content">
        <!-- Profile picture -->
        <div class="profile-pic">
          <img src="../../assets/styles/image/profilDelault.png" alt="Profile" />
        </div>
        
        <!-- Message body -->
        <div class="message-body">
          <!-- Username and timestamp -->
          <div class="message-header">
            <span class="username"><!--{{ username }}-->jon doe</span>
            <span class="timestamp"><!--{{ timestamp }}-->10h20</span>
          </div>
          
          <!-- Message text -->
          <div class="message-text">
            <!-- {{ messageText }} -->
            <p>try. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a</p>
          </div>
        </div>
  
        <!-- Action buttons -->
        <div class="message-actions">
          <button class="action-btn" @click="handleReply">
            <img src="../../assets/styles/image/repondre.png" alt="Reply" />
          </button>
          <button class="action-btn" @click="handleEmoji">
            <img src="../../assets/styles/image/react.png" alt="Emoji" />
          </button>
          <button class="action-btn" @click="handleEdit">
            <img src="../../assets/styles/image/modifier.png" alt="Edit" />
          </button>
          <button class="action-btn" @click="handleDelete">
            <img src="../../assets/styles/image/delet.png" alt="Delete" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Message',
  props: {
    username: {
      type: String,
      required: true
    },
    timestamp: {
      type: String,
      required: true
    },
    messageText: {
      type: String,
      required: true
    }
  },
  methods: {
    handleReply() {
      this.$emit('reply')
    },
    handleEmoji() {
      this.$emit('emoji')
    },
    handleEdit() {
      this.$emit('edit')
    },
    handleDelete() {
      this.$emit('delete')
    }
  }
}
</script>

<style scoped>
.listeMessage {
  display: flex;
  justify-content: flex-end;
}

.message-container {
  width: 500px;
  height: 100px;
  padding: 1rem;
  margin: 0.5rem 0;
  background-color: var(--color-background-soft);
  border-radius: 8px;
  align-items: left;
}

.message-content {
  display: flex;
  position: relative;
}

.profile-pic {
  width: 40px;
  height: 40px;
  margin-right: 1rem;
}

.profile-pic img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.message-body {
  flex: 1;
}

.message-header {
  margin-bottom: 0.5rem;
}

.username {
  font-weight: bold;
  margin-right: 0.5rem;
}

.timestamp {
  color: var(--color-text-light);
  font-size: 0.8rem;
}

.message-text {
  color: var(--color-text);
  line-height: 1.4;
}

.message-actions {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  gap: 0.5rem;
  transition: opacity 0.2s;
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
  background-color: var(--color-background-mute);
}

.action-btn img {
  width: 20px;
  height: 20px;
}
</style>
