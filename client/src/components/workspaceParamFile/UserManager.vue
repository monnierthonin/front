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
          <select 
            v-model="user.role" 
            class="role-select" 
            :disabled="isOwner(user) || (!isUserOwner() && isUserAdmin() && isAdmin(user))" 
            @change="updateUserRole(user)"
          >
            <option value="admin">Admin</option>
            <option value="membre">Membre</option>
          </select>
          <div class="action-buttons">
            <button 
              v-if="!isOwner(user) && (isUserOwner() || !(isUserAdmin() && isAdmin(user)))" 
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
  <!-- Modal d'invitation d'utilisateurs -->
  <InviteUserModal
    ref="inviteModal"
    :workspace-id="workspace._id"
    @close="closeInviteModal"
    @user-invited="handleUserInvited"
  />
</template>

<script>
import InviteUserModal from './InviteUserModal.vue';
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
    
    // Récupérer l'ID de l'utilisateur connecté
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Décode le token JWT pour obtenir l'ID utilisateur
        const tokenPayload = token.split('.')[1];
        const decodedPayload = JSON.parse(atob(tokenPayload));
        this.userId = decodedPayload.userId || decodedPayload.id || decodedPayload.sub;
      } catch (error) {
        console.error('Erreur lors du décodage du token:', error);
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
      // Si l'utilisateur connecté est le propriétaire, il a les droits admin
      if (this.userId === this.ownerId) return true;
      
      // Vérifier si l'utilisateur connecté a le rôle admin
      const currentUser = this.users.find(user => user.id === this.userId);
      if (!currentUser) return false;
      
      // Vérifier les différentes possibilités de nommage du champ rôle
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
      // Éviter les requêtes multiples si une mise à jour est déjà en cours pour cet utilisateur
      if (this.roleUpdateLoading[user.id]) {
        return;
      }
      
      this.roleUpdateLoading[user.id] = true;
      const originalRole = user.role; // Sauvegarde du rôle original en cas d'échec
      
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Aucun token d\'authentification trouvé');
        }
        
        // Construction de l'URL selon le format de l'API
        const url = `http://localhost:3000/api/v1/workspaces/${this.workspace._id}/membres/${user.id}/role`;
        
        // Format du corps pour une requête PATCH conforme aux standards REST
        // L'API nécessite que tous les paramètres soient envoyés même s'ils n'ont pas changé
        const response = await fetch(url, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            role: user.role 
          }), // Inclure tous les paramètres requis par l'API
          credentials: 'include'
        });
        
        // Vérification de la réponse
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Session expirée, veuillez vous reconnecter');
          }
          
          // Tentative de récupération du message d'erreur du serveur
          let errorMessage;
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || `Erreur lors de la mise à jour du rôle: ${response.status}`;
          } catch (e) {
            errorMessage = `Erreur lors de la mise à jour du rôle: ${response.status}`;
          }
          
          throw new Error(errorMessage);
        }
        
        // Si tout s'est bien passé, on peut afficher un message de succès
        console.log(`Rôle de l'utilisateur ${user.id} mis à jour avec succès à ${user.role}`);
        
        // Récupérer la réponse du serveur pour confirmer
        try {
          const data = await response.json();
          console.log('Réponse du serveur:', data);
        } catch (e) {
          // Ignorer l'erreur de parsing si la réponse n'est pas du JSON valide
        }
      } catch (err) {
        console.error('Erreur lors de la mise à jour du rôle de l\'utilisateur:', err);
        
        // Restaurer le rôle original dans l'interface
        user.role = originalRole;
        
        // Afficher l'erreur à l'utilisateur
        this.error = err.message || "Impossible de modifier le rôle de l'utilisateur";
      } finally {
        this.roleUpdateLoading[user.id] = false;
      }
    },

    /**
     * Bannir/supprimer un utilisateur du workspace
     */
    async banUser(user) {
      if (this.isOwner(user)) {
        console.error('Impossible de bannir le propriétaire du workspace');
        return;
      }
      
      if (!confirm(`Êtes-vous sûr de vouloir bannir ${this.getUserName(user)} du workspace ?`)) {
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Aucun token d\'authentification trouvé');
        }
        
        const response = await fetch(`http://localhost:3000/api/v1/workspaces/${this.workspace._id}/membres/${user.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Session expirée, veuillez vous reconnecter');
          }
          throw new Error(`Erreur lors du bannissement: ${response.status}`);
        }
        
        // Supprimer l'utilisateur de la liste sans avoir à recharger tous les utilisateurs
        this.users = this.users.filter(u => u.id !== user.id);
        console.log(`Utilisateur ${user.id} banni avec succès`);
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
    handleUserInvited(user) {
      // Recupérer à nouveau la liste des membres pour inclure le nouvel invité
      this.loading = true;
      // Permettre au backend de traiter l'ajout
      setTimeout(() => {
        this.fetchMembers();
      }, 1000);
      
      // Afficher un message de confirmation
      alert(`${user.username} a été invité(e) avec succès au workspace.`);
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
  padding: 4px 8px;
  border-radius: 4px;
  background-color: #40444b;
  color: white;
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
