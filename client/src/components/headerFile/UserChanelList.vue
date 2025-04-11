<template>
    <div class="User-sidebar">
      <div class="User-list">
        <!-- Liste des amis -->
        <div class="user-item" v-for="(user, index) in User" :key="index">
          <div class="user-avatar">
            <img src="../assets/styles/image/profilDelault.png" :alt="user.name">
            <div class="status-indicator" :class="user.status"></div>
          </div>
          <div class="user-name">{{ user.name }}</div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'UserList',
    data() {
      return {
        User: [
          { name: "Alice", status: "online" },
          { name: "Bob", status: "offline" },
          { name: "Charlie", status: "idle" },
          { name: "David", status: "dnd" },
          { name: "Eve", status: "online" },
          { name: "Frank", status: "offline" },
          { name: "Grace", status: "online" },
          { name: "Henry", status: "idle" },
          { name: "Ivy", status: "dnd" },
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
  .User-sidebar {
    position: fixed;
    right: 0px; /* Largeur du header */
    top: 0;
    height: 100vh;
    width: var(--whidth-userChanel);
    background-color: #2B3132;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    border-left: 1px solid var(--border-color);
  }
  
  .User-list {
    height: calc(100% - 20px);
    overflow-y: auto;
    scrollbar-width: none;
    padding: 10px;
    margin-top: 10px;
  }
  
  .User-list::-webkit-scrollbar {
    display: none;
  }
  
  .user-item {
    display: flex;
    align-items: center;
    padding: 10px;
    margin-bottom: 8px;
    border-radius: 8px;
    cursor: pointer;
    background-color:var(--secondary-color);
    transition: background-color 0.2s ease;
  }
  
  .user-item:hover {
    background-color: var(--secondary-color-transition);
  }
  
  .user-avatar {
    position: relative;
    width: 32px;
    height: 32px;
    margin-right: 12px;
  }
  
  .user-avatar img {
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
  
  .user-name {
    color: var(--text-color);
    font-size: 14px;
  }
  
  .add-user {
    padding: 10px;
    display: flex;
    justify-content: left;
    border-top: 1px solid var(--border-color);
  }
  
  .add-user-button {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background: none;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  
  .add-user-button img {
    width: 100%;
    height: 100%;
  }
  
  .add-user-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  </style>
  