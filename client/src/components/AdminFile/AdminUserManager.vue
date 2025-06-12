<template>
  <div class="containerSettingUserChanel">
    <div class="search-header">
      <h3>Gestionnaire utilisateur</h3>
      <div class="search-controls">
        <input type="text" v-model="userSearchQuery" placeholder="Rechercher un utilisateur..." class="search-input"/>
      </div>
      <div class="users-list">
        <div v-for="user in filteredUsers" :key="user.id" class="user-item">
          <img :src="user.profileImage || '../../assets/styles/image/profilDelault.png'" :alt="user.username" class="user-avatar">
          <span class="username">{{ user.username }}</span>
          <select v-model="user.role" class="role-select" @change="updateUserRole(user)">
            <option value="admin">Admin</option>
            <option value="user">User</option>
            <option value="guest">Invité</option>
          </select>
          <div class="action-buttons">
            <button class="action-button" title="Trouver les workspaces" @click="findUserWorkspaces(user)">
              <img src="../../assets/styles/image/parametre.png" alt="workspaces" class="action-icon">
            </button>
            <button class="action-button" title="Trouver les messages" @click="findUserMessages(user)">
              <img src="../../assets/styles/image/messageEnvoi.png" alt="messages" class="action-icon">
            </button>
            <button class="action-button delete-button" title="Supprimer l'utilisateur" @click="deleteUser(user)">
              <img src="../../assets/styles/image/ban.png" alt="delete" class="action-icon">
            </button>
          </div>
        </div>
        <div v-if="loading" class="loading">Chargement...</div>
        <div v-if="!loading && !users.length" class="no-results">Aucun utilisateur trouvé</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminUserManager',
  data() {
    return {
      userSearchQuery: '',
      loading: false,
      error: null,
      users: []
    };
  },
  computed: {
    filteredUsers() {
      if (!this.userSearchQuery) return this.users;
      
      const query = this.userSearchQuery.toLowerCase();
      return this.users.filter(user => 
        user.username.toLowerCase().includes(query)
      );
    }
  },
  methods: {
    // Cette méthode sera implémentée lorsque l'API sera disponible
    async fetchUsers() {
      // Actuellement, nous utilisons des données statiques définies dans data()
      this.loading = true;
      
      // Simulation d'un appel API (attente de 300ms)
      setTimeout(() => {
        this.loading = false;
      }, 300);
    },
    
    updateUserRole(user) {
      // This would typically make an API call to update the user's role
      console.log(`Updating ${user.username}'s role to ${user.role}`);
    },
    
    findUserWorkspaces(user) {
      // This would open a modal or navigate to show user's workspaces
      console.log(`Finding workspaces for user: ${user.username}`);
    },
    
    findUserMessages(user) {
      // This would open a modal or navigate to show user's messages
      console.log(`Finding messages for user: ${user.username}`);
    },
    
    deleteUser(user) {
      // This would typically make an API call to delete the user
      console.log(`Deleting user: ${user.username}`);
    },
    

  },
  mounted() {
    this.fetchUsers();
  }
}
</script>

<style scoped>
.containerSettingUserChanel {
  border: 5px solid #443E3E;
  border-radius: 10px;
  width: 70%;
  scrollbar-width: thin;
  scrollbar-color: #7D7D7D #D9D9D9;
}

.containerSettingUserChanel::-webkit-scrollbar {
  width: 8px;
}

.containerSettingUserChanel::-webkit-scrollbar-track {
  background: #D9D9D9;
  border-radius: 4px;
}

.containerSettingUserChanel::-webkit-scrollbar-thumb {
  background-color: #7D7D7D;
  border-radius: 4px;
}

.search-header {
  padding: 1rem;
}

.search-header h3 {
  margin-bottom: 1rem;
  color: #fff;
}

.search-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-input {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color:var(--background-recherche-filtre);
  color: #fff;
  width: 60%;
}

.filter-select {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color:var(--background-recherche-filtre);
  color: #fff;
  cursor: pointer;
}

.filter-select option {
  background-color:var(--background-recherche-filtre);
  color: #fff;
}

.users-list {
  max-height: 300px;
  overflow-y: auto;
  margin-top: 1rem;
  padding: 0 1rem;
  display: flex;
  flex-direction: column;
  gap: 10px;
  scrollbar-width: thin;
  scrollbar-color: #7D7D7D #D9D9D9;
}

.users-list::-webkit-scrollbar {
  width: 8px;
}

.users-list::-webkit-scrollbar-track {
  background: #D9D9D9;
  border-radius: 4px;
}

.users-list::-webkit-scrollbar-thumb {
  background-color: #7D7D7D;
  border-radius: 4px;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  background:var(--background-list-message);
  gap: 1rem;
  border-radius: 10px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.username {
  color: #fff;
  flex: 1;
}

.role-select {
  padding: 0.3rem;
  border-radius: 4px;
  background: #333;
  color: #fff;
  border: 1px solid #555;
  margin-right: 10px;
}

.role-button {
  padding: 0.3rem 1rem;
  background: #444;
  color: #fff;
  border: 1px solid #555;
  border-radius: 4px;
  cursor: pointer;
}

.role-button:hover {
  background: #555;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.action-button {
  height: 40px;
  width: 40px;
  background: none;
  border: none;
  align-items: center;
  justify-content: center;
  display: flex;
  cursor: pointer;
  transition: transform 0.2s;
}

.action-button:hover {
  transform: scale(1.1);
}

.action-icon {
  width: 30px;
  height: 30px;
}

.delete-button {
  color: #ff5252;
}

.loading, .no-results {
  color: #fff;
  text-align: center;
  padding: 1rem;
  font-style: italic;
}
</style>
