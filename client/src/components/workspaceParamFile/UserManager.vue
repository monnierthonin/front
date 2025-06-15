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
          <option value="membre">Membre</option>
        </select>
        <button 
          v-if="isUserAdmin() || isUserOwner()" 
          @click="openInviteModal" 
          class="invite-button"
        >
          Inviter
        </button>
      </div>
      
      <div v-if="loading" class="loading-message">
        Chargement des utilisateurs...
      </div>
      
      <div v-else-if="error" class="error-message">
        {{ error }}
      </div>
      
      <div v-else-if="filteredUsers.length === 0" class="empty-message">
        <p v-if="userSearchQuery || userFilter !== 'all'">
          Aucun utilisateur ne correspond aux critères de recherche.
        </p>
        <p v-else>Aucun utilisateur dans ce workspace.</p>
      </div>
      
      <div v-else class="users-list">
        <div v-for="user in filteredUsers" :key="user.id" class="user-item">
          <img :src="getUserAvatar(user)" :alt="getUserName(user)" class="user-avatar">
          <span class="username">{{ getUserName(user) }}</span>
          <select 
            v-model="user.role" 
            class="role-select" 
            :disabled="isRoleSelectDisabled(user)" 
            @change="updateUserRole(user)"
          >
            <option value="admin">Admin</option>
            <option value="membre">Membre</option>
          </select>
          <div class="action-buttons">
            <button 
              v-if="canBanUser(user)" 
              class="bann-button" 
              @click="banUser(user)" 
              title="Bannir l'utilisateur"
            >
              <img src="../../assets/styles/image/ban.png" alt="bann" class="bann">
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <InviteUserModal
    ref="inviteModal"
    :workspace-id="workspace._id"
    @close="closeInviteModal"
    @user-invited="handleUserInvited"
  />
</template>

<script>
import InviteUserModal from './InviteUserModal.vue';
import { getCurrentUserIdAsync } from '../../utils/userUtils';
export default {
  name: 'UserManager',
  components: {
    InviteUserModal
  },
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
      userId: null,
      defaultAvatar: '../../assets/styles/image/profilDelault.png',
      roleUpdateLoading: {},
      isInviteModalOpen: false
    }
  },
  computed: {
    /**
     * Filtre et trie les utilisateurs selon les critères de recherche
     */
    filteredUsers() {
      let result = [...this.users];
      
      if (this.userSearchQuery) {
        const searchTerm = this.userSearchQuery.toLowerCase();
        result = result.filter(user => {
          const username = this.getUserName(user).toLowerCase();
          return username.includes(searchTerm);
        });
      }
      
      if (this.userFilter !== 'all') {
        result = result.filter(user => user.role === this.userFilter);
      }
      
      return result.sort((a, b) => {
        if (this.isOwner(a)) return -1;
        if (this.isOwner(b)) return 1;
        
        if (a.role === 'admin' && b.role !== 'admin') return -1;
        if (a.role !== 'admin' && b.role === 'admin') return 1;
        
        return this.getUserName(a).localeCompare(this.getUserName(b));
      });
    }
  },
  async created() {
    if (this.workspace && this.workspace.proprietaire) {
      if (typeof this.workspace.proprietaire === 'object') {
        this.ownerId = this.workspace.proprietaire._id || this.workspace.proprietaire.id;
      } else {
        this.ownerId = this.workspace.proprietaire;
      }
    } else {
      console.error('UserManager.vue: Propriétaire du workspace non trouvé:', this.workspace);
    }
    
    try {
      this.userId = await getCurrentUserIdAsync();
      
      if (!this.userId) {
        console.error('UserManager.vue: Impossible de récupérer l\'ID utilisateur');
      }
    } catch (error) {
      console.error('UserManager.vue: Erreur lors de la récupération de l\'ID utilisateur:', error);
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
        if (this.workspace && this.workspace.membres) {
          this.users = this.workspace.membres.map(membre => ({
            id: typeof membre.utilisateur === 'object' 
              ? membre.utilisateur._id || membre.utilisateur.id 
              : membre.utilisateur,
            utilisateur: membre.utilisateur,
            role: membre.role || 'member'
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
    },
    
    /**
     * Vérifie si l'utilisateur a le rôle admin
     */
    isAdmin(user) {
      return user.role === 'admin';
    },
    
    /**
     * Vérifie si l'utilisateur connecté est admin
     */
    isUserAdmin() {
      if (this.userId === this.ownerId) return true;
      const currentUser = this.users.find(user => user.id === this.userId);
      if (!currentUser) return false;
      const userRole = currentUser.role || currentUser.rôle || currentUser.Role || currentUser.Rôle;
      return userRole === 'admin';
    },
    
    /**
     * Vérifie si l'utilisateur connecté est le propriétaire
     */
    isUserOwner() {
      return this.userId === this.ownerId;
    },

    /**
     * Met à jour le rôle d'un utilisateur dans le workspace
     */
    async updateUserRole(user) {
      if (this.roleUpdateLoading[user.id]) {
        return;
      }
      
      this.roleUpdateLoading[user.id] = true;
      const originalRole = user.role;
      
      try {        
        const url = `http://localhost:3000/api/v1/workspaces/${this.workspace._id}/membres/${user.id}/role`;
        
        const response = await fetch(url, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            role: user.role 
          }),
          credentials: 'include'
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Session expirée, veuillez vous reconnecter');
          }
          
          let errorMessage;
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || `Erreur lors de la mise à jour du rôle: ${response.status}`;
          } catch (e) {
            errorMessage = `Erreur lors de la mise à jour du rôle: ${response.status}`;
          }
          
          throw new Error(errorMessage);
        }
        
        try {
          const data = await response.json();
        } catch (e) {
        }
      } catch (err) {
        console.error('Erreur lors de la mise à jour du rôle de l\'utilisateur:', err);
        
        user.role = originalRole;
        
        this.error = err.message || "Impossible de modifier le rôle de l'utilisateur";
      } finally {
        this.roleUpdateLoading[user.id] = false;
      }
    },

    /**
     * Bannir/supprimer un utilisateur du workspace
     */
    async banUser(user) {
      if (!this.canBanUser(user)) {
        alert('Vous n\'avez pas les droits pour bannir cet utilisateur');
        return;
      }
      
      if (!confirm(`Êtes-vous sûr de vouloir bannir ${this.getUserName(user)} du workspace ?`)) {
        return;
      }
      
      try {
        const response = await fetch(`http://localhost:3000/api/v1/workspaces/${this.workspace._id}/membres/${user.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Session expirée, veuillez vous reconnecter');
          }
          throw new Error(`Erreur lors du bannissement: ${response.status}`);
        }
        
        this.users = this.users.filter(u => u.id !== user.id);
      } catch (err) {
        console.error('Erreur lors du bannissement de l\'utilisateur:', err);
        this.error = err.message || "Impossible de bannir l'utilisateur";
      }
    },
    
    // Méthodes pour le modal d'invitation
    /**
 * Ouvre le modal d'invitation
 */
openInviteModal() {
  this.$refs.inviteModal.open();
},

/**
 * Ferme le modal d'invitation
 */
closeInviteModal() {
  this.$refs.inviteModal.close();
},

    /**
     * Gère l'événement d'invitation réussie
     */
    async handleUserInvited(user) {
      this.loading = true;
      setTimeout(() => {
        this.fetchMembers();
      }, 1000);
      alert(`${user.username} a été invité(e) avec succès au workspace.`);
    },
    
    /**
     * Règles d'autorisation:
     * - Le rôle du propriétaire ne peut jamais être changé
     * - Seul le propriétaire peut changer le rôle des admins
     * - Les admins peuvent changer le rôle des membres normaux
     */
    isRoleSelectDisabled(user) {
      if (this.isOwner(user)) {
        return true;
      }
      
      if (this.isUserOwner()) {
        return false; 
      }
      
      if (this.isUserAdmin() && this.isAdmin(user)) {
        return true;
      }
      
      return false;
    },
    
    /**
     * Règles d'autorisation:
     * - On ne peut pas bannir le propriétaire
     * - Le propriétaire peut bannir tout le monde
     * - Les admins peuvent bannir les membres normaux mais pas d'autres admins
     */
    canBanUser(user) {
      if (this.isOwner(user)) {
        return false;
      }
      
      if (this.isUserOwner()) {
        return true;
      }
      
      if (this.isUserAdmin() && this.isAdmin(user)) {
        return false;
      }
      
      return this.isUserAdmin();
    },
  }
}
</script>

<style scoped>
.containerSettingUserChanel {
  border: 5px solid var(--background-list-message);
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
  color: var(--text-color);
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
  background-color: var(--background-recherche-filtre);
  color: var(--text-color);
  width: 60%;
}

.filter-select {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: var(--background-recherche-filtre);
  color: var(--text-color);
  cursor: pointer;
}

.filter-select option {
  background-color: var(--background-recherche-filtre);
  color: var(--text-color);
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
  background: var(--background-list-message);
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
  color: var(--text-color);
  flex: 1;
}

.role-select {
  padding: 4px 8px;
  border-radius: 4px;
  background-color: var(--background-recherche-filtre);
  color: var(--text-color);
  border: none;
  font-size: 14px;
}

.invite-button {
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
}

.invite-button:hover {
  background-color:rgb(50, 151, 53);
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
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
