<template>
  <div class="containerSettingUserChanel">
    <div class="search-header">
      <h3>Gestionnaire utilisateurs</h3>
      <div class="search-controls">
        <input 
          type="text" 
          v-model="userSearchQuery" 
          placeholder="Rechercher un utilisateur..." 
          class="search-input"
        />
        <select v-model="userFilter" class="filter-select">
          <option value="all">Tous les rôles</option>
          <option value="admin">Admin</option>
          <option value="member">Member</option>
        </select>
      </div>
      
      <!-- Loading state -->
      <div v-if="loading" class="loading-message">
        Chargement des utilisateurs...
      </div>
      
      <!-- Error state -->
      <div v-else-if="error" class="error-message">
        {{ error }}
      </div>
      
      <!-- Empty state -->
      <div v-else-if="filteredUsers.length === 0" class="empty-message">
        <p v-if="userSearchQuery || userFilter !== 'all'">
          Aucun utilisateur ne correspond aux critères de recherche.
        </p>
        <p v-else>Aucun utilisateur dans ce workspace.</p>
      </div>
      
      <!-- Users list -->
      <div v-else class="users-list">
        <div v-for="user in filteredUsers" :key="user.id" class="user-item">
          <img :src="getUserAvatar(user)" :alt="getUserName(user)" class="user-avatar">
          <span class="username">{{ getUserName(user) }}</span>
          <select v-model="user.role" class="role-select" :disabled="isOwner(user)">
            <option value="admin">Admin</option>
            <option value="member">Member</option>
          </select>
          <button class="role-button">Rôle canal</button>
          <div class="action-buttons">
            <button class="exit-button" :disabled="isOwner(user)" title="Exclure du workspace">
              <img src="../../assets/styles/image/exclution.png" alt="exit" class="exit">
            </button>
            <button class="bann-button" :disabled="isOwner(user)" title="Bannir l'utilisateur">
              <img src="../../assets/styles/image/ban.png" alt="bann" class="bann">
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'UserManager',
  props: {
    workspace: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      userSearchQuery: '',
      userFilter: 'all',
      users: [],
      loading: true,
      error: null,
      ownerId: null,
      defaultAvatar: '../../assets/styles/image/profilDelault.png'
    }
  },
  computed: {
    /**
     * Filtre et trie les utilisateurs selon les critères de recherche
     */
    filteredUsers() {
      let result = [...this.users];
      
      // Filtrer par terme de recherche
      if (this.userSearchQuery) {
        const searchTerm = this.userSearchQuery.toLowerCase();
        result = result.filter(user => {
          const username = this.getUserName(user).toLowerCase();
          return username.includes(searchTerm);
        });
      }
      
      // Filtrer par rôle
      if (this.userFilter !== 'all') {
        result = result.filter(user => user.role === this.userFilter);
      }
      
      // Trier par rôle (admins first) puis par nom
      return result.sort((a, b) => {
        // Le propriétaire toujours en premier
        if (this.isOwner(a)) return -1;
        if (this.isOwner(b)) return 1;
        
        // Ensuite par rôle
        if (a.role === 'admin' && b.role !== 'admin') return -1;
        if (a.role !== 'admin' && b.role === 'admin') return 1;
        
        // Enfin par nom
        return this.getUserName(a).localeCompare(this.getUserName(b));
      });
    }
  },
  created() {
    // Récupérer l'ID du propriétaire
    if (this.workspace && this.workspace.proprietaire) {
      if (typeof this.workspace.proprietaire === 'object') {
        this.ownerId = this.workspace.proprietaire._id || this.workspace.proprietaire.id;
      } else {
        this.ownerId = this.workspace.proprietaire;
      }
    }
    
    this.loadUsers();
  },
  methods: {
    /**
     * Charge les utilisateurs du workspace
     */
    loadUsers() {
      this.loading = true;
      this.error = null;
      
      try {
        // Vérifier si les membres sont disponibles dans le workspace
        if (this.workspace && this.workspace.membres) {
          this.users = this.workspace.membres.map(membre => ({
            id: typeof membre.utilisateur === 'object' 
              ? membre.utilisateur._id || membre.utilisateur.id 
              : membre.utilisateur,
            utilisateur: membre.utilisateur, // garde l'objet utilisateur complet si disponible
            role: membre.role || 'member' // défaut à 'member' si le rôle n'est pas spécifié
          }));
        } else {
          this.users = [];
        }
      } catch (err) {
        console.error('Erreur lors du chargement des utilisateurs:', err);
        this.error = "Impossible de charger la liste des utilisateurs";
      } finally {
        this.loading = false;
      }
    },
    
    /**
     * Récupère l'avatar d'un utilisateur
     */
    getUserAvatar(user) {
      if (user.utilisateur && typeof user.utilisateur === 'object') {
        return user.utilisateur.profilpicture || this.defaultAvatar;
      }
      return this.defaultAvatar;
    },
    
    /**
     * Récupère le nom d'un utilisateur
     */
    getUserName(user) {
      if (user.utilisateur && typeof user.utilisateur === 'object') {
        return user.utilisateur.username || user.utilisateur.nom || 'Utilisateur';
      }
      return `Utilisateur ${user.id.substring(0, 6)}`;
    },
    
    /**
     * Vérifie si l'utilisateur est le propriétaire du workspace
     */
    isOwner(user) {
      return user.id === this.ownerId;
    }
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
  background-color: #2f3136;
  color: #fff;
  width: 60%;
}

.filter-select {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #2f3136;
  color: #fff;
  cursor: pointer;
}

.filter-select option {
  background-color: #2f3136;
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

.loading-message, .error-message, .empty-message {
  padding: 1rem;
  margin-top: 1rem;
  text-align: center;
  color: #ffffff;
  background-color: #36393f;
  border-radius: 5px;
}

.error-message {
  color: #ff6b6b;
}

.empty-message {
  color: #aaaaaa;
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
  background: #443E3E;
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

.exit-button img {
  width: 40px;
}

.exit-button {
  height: 40px;
  width: 40px;
  background: none;
  border: none;
  align-items: center;
  justify-content: center;
  display: flex;
}

.bann-button img {
  width: 40px;
}

.bann-button {
  height: 40px;
  width: 40px;
  background: none;
  border: none;
  align-items: center;
  justify-content: center;
  display: flex;
}
</style>
