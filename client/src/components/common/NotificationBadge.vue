<template>
  <div v-if="count > 0" class="notification-badge" :class="{ 'large': count > 9 }">
    {{ displayCount }}
  </div>
</template>

<script>
export default {
  name: 'NotificationBadge',
  props: {
    count: {
      type: Number,
      default: 0
    },
    displayNumber: {
      type: Boolean, 
      default: false
    }
  },
  computed: {
    displayCount() {
      if (!this.displayNumber) return '';
      return this.count > 9 ? '9+' : this.count;
    }
  }
}
</script>

<style scoped>
.notification-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 10px;
  height: 10px;
  background-color: #ff3a30; /* Rouge vif pour attirer l'attention */
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 10px;
  font-weight: bold;
  color: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  border: 1px solid #fff; /* Bordure blanche pour une meilleure visibilité */
  z-index: 10;
}

.notification-badge.large {
  width: 16px;
  height: 16px;
  font-size: 10px;
}
</style>
