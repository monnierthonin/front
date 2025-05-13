<template>
    <div class="User-sidebar">
      <div class="User-list">
        <div v-if="isLoading" class="loading-message">Chargement des membres...</div>
        <div v-else-if="membresAffichage.length === 0" class="empty-message">Aucun membre dans ce workspace</div>
        <div v-else>
          <!-- Liste des membres du workspace -->
          <div class="user-item" v-for="membre in membresAffichage" :key="membre._id || membre.utilisateur._id">
            <div class="user-avatar">
              <ProfilePicture 
                :userId="membre.utilisateur._id" 
                :altText="getUserName(membre.utilisateur)" 
              />
              <div class="status-indicator" :class="membre.statut || 'online'"></div>
            </div>
            <div class="user-info">
              <div class="user-name">{{ getUserName(membre.utilisateur) }}</div>
              <div class="user-role">{{ membre.role || 'membre' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import ProfilePicture from '../common/ProfilePicture.vue';
  
  export default {
    components: {
      ProfilePicture
    },
    name: 'UserList',
    props: {
      membres: {
        type: Array,
        default: () => []
      }
    },
    data() {
      return {
        isLoading: true
      }
    },
    computed: {
      membresAffichage() {
        return this.membres || []
      }
    },
    methods: {
      getUserName(user) {
        if (!user) return 'Utilisateur inconnu'
        return user.username || user.firstName || user.email || 'Utilisateur sans nom'
      }
    },
    watch: {
      membres: {
        handler(newVal) {
          if (newVal) {
            this.isLoading = false
          }
        },
        immediate: true
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
  
  .user-role {
    color: var(--text-secondary-color, #a3a3a3);
    font-size: 12px;
  }
  
  .user-info {
    display: flex;
    flex-direction: column;
  }
  
  .loading-message, .empty-message {
    color: var(--text-secondary-color, #a3a3a3);
    font-size: 14px;
    text-align: center;
    padding: 20px 0;
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
  