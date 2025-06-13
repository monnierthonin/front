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
              workspace
            </button>
            <button class="action-button" title="Trouver les messages" @click="findUserMessages(user)">
              messages
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
import adminService from '../../services/adminService';

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
    // Récupère tous les utilisateurs depuis le service
    async fetchUsers() {
      this.loading = true;
      this.error = null;
      
      try {
        this.users = await adminService.getUsers();
      } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },
    
    async updateUserRole(user) {
      try {
        const userId = user._id || user.id;
        await adminService.updateUserRole(userId, user.role);
        console.log(`Rôle de ${user.username} mis à jour avec succès à ${user.role}`);
      } catch (error) {
        console.error('Erreur lors de la mise à jour du rôle:', error);
        // Réinitialiser le rôle précédent en cas d'erreur
      }
    },
    
    async findUserWorkspaces(user) {
      try {
        const userId = user._id || user.id;
        const workspaces = await adminService.getUserWorkspaces(userId);
        console.log(`Workspaces pour ${user.username}:`, workspaces);
        // Ici vous pourriez afficher les workspaces dans un modal ou naviguer vers une autre page
      } catch (error) {
        console.error('Erreur lors de la récupération des workspaces:', error);
      }
    },
    
    async findUserMessages(user) {
      try {
        const userId = user._id || user.id;
        const messages = await adminService.getUserMessages(userId);
        console.log(`Messages pour ${user.username}:`, messages);
        // Ici vous pourriez afficher les messages dans un modal
      } catch (error) {
        console.error('Erreur lors de la récupération des messages:', error);
      }
    },
    
    async deleteUser(user) {
      if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.username}?`)) {
        return;
      }
      
      try {
        const userId = user._id || user.id;
        await adminService.deleteUser(userId);
        
        // Supprimer l'utilisateur de la liste locale
        this.users = this.users.filter(u => u.id !== user.id);
        console.log(`Utilisateur ${user.username} supprimé avec succès`);
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      }
    },
    

  },
  mounted() {
    this.fetchUsers();
  }
}
</script>

<style scoped>
.action-buttons {
  display: flex;
  align-items: center;
}
.action-button {
  padding: 0.3rem 1rem;
  background: var(--background-recherche-filtre);
  color: var(--text-color);
  border: 1px solid #555;
  border-radius: 4px;
  cursor: pointer;
  margin: 0 3px;
  transition: background-color 0.2s;
  justify-content: center;
}
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
  vertical-align: middle;
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

.delete-button {
  background: none;
  border: none;
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
