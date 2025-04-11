<template>
  <div class="friends-sidebar">
    <div class="friends-list">
      <!-- Liste des amis -->
      <div class="friend-item" v-for="(friend, index) in friends" :key="index">
        <div class="friend-avatar">
          <img src="../assets/styles/image/profilDelault.png" :alt="friend.name">
          <div class="status-indicator" :class="friend.status"></div>
        </div>
        <div class="friend-name">{{ friend.name }}</div>
      </div>
    </div>
    <div class="add-friend">
      <button class="add-friend-button">
        <img src="../assets/styles/image/logoAjout.png" alt="Ajouter un ami">
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FriendsList',
  data() {
    return {
      friends: [
        { name: "Alice", status: "online" },
        { name: "Bob", status: "offline" },
        { name: "Charlie", status: "idle" },
        { name: "David", status: "dnd" },
        { name: "Eve", status: "online" },
        { name: "Frank", status: "offline" },
        { name: "Grace", status: "online" },
        { name: "Henry", status: "idle" },
        { name: "Alice", status: "online" },
        { name: "Bob", status: "offline" },
        { name: "Charlie", status: "idle" },
        { name: "David", status: "dnd" },
        { name: "Eve", status: "online" },
        { name: "Frank", status: "offline" },
        { name: "Grace", status: "online" },
        { name: "Henry", status: "idle" },
        { name: "Ivy", status: "dnd" },
        { name: "Jack", status: "online" }
      ]
    }
  }
}
</script>

<style scoped>
.friends-sidebar {
  position: fixed;
  left: var(--whidth-header);
  top: 0;
  height: 100vh;
  width: var(--whidth-friendsList);
  background-color: #2B3132;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-left: 1px solid var(--border-color);
}

.friends-list {
  height: calc(100% - 60px);
  overflow-y: auto;
  scrollbar-width: none;
  padding: 20px 10px;
}

.friends-list::-webkit-scrollbar {
  display: none;
}

.friend-item {
  display: flex;
  align-items: center;
  padding: 10px;
  margin-bottom: 8px;
  border-radius: 8px;
  cursor: pointer;
  background-color:var(--secondary-color);
  transition: background-color 0.2s ease;
}

.friend-item:hover {
  background-color: var(--secondary-color-transition);
}

.friend-avatar {
  position: relative;
  width: 32px;
  height: 32px;
  margin-right: 12px;
}

.friend-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.status-indicator {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid var(--secondary-color);
}

.status-indicator.online {
  background-color: #43b581;
}

.status-indicator.offline {
  background-color: #747f8d;
}

.status-indicator.idle {
  background-color: #faa61a;
}

.status-indicator.dnd {
  background-color: #f04747;
}

.friend-name {
  color: var(--text-color);
  font-size: 14px;
}

.add-friend {
  padding: 10px;
  display: flex;
  justify-content: left;
  border-top: 1px solid var(--border-color);
}

.add-friend-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.add-friend-button img {
  width: 100%;
  height: 100%;
}

.add-friend-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
</style>
