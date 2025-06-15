<template>
  <div v-if="isOpen" class="modal" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Inviter un utilisateur</h3>
        <button @click="close" class="close-button">&times;</button>
      </div>
      <div class="modal-body">
        <div class="search-container">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Rechercher des utilisateurs..." 
            @input="debouncedSearch" 
            class="search-input"
          >
        </div>
        
        <div v-if="loading" class="loading-message">
          Recherche en cours...
        </div>
        
        <div v-else-if="error" class="error-message">
          {{ error }}
        </div>
        
        <div v-else-if="users.length > 0" class="users-search-list">
          <div 
            v-for="user in users" 
            :key="user._id || user.id"
            @click="selectUser(user)"
            class="user-search-item"
            :class="{ 'selected': selectedUser && (selectedUser._id === (user._id || user.id) || selectedUser.id === (user._id || user.id)) }"
          >
            <img :src="getUserAvatar(user)" :alt="getUserName(user)" class="user-search-avatar">
            <div class="user-search-info">
              <span class="user-search-name">{{ getUserName(user) }}</span>
              <span v-if="user.email" class="user-search-email">{{ user.email }}</span>
            </div>
          </div>
        </div>
        
        <div v-else-if="searchPerformed" class="empty-message">
          Aucun utilisateur trouvé pour cette recherche.
        </div>
        
        <div v-else class="instructions-message">
          Recherchez un utilisateur pour l'inviter au workspace.
        </div>
      </div>
      
      <div class="modal-footer">
        <button 
          @click="inviteUser" 
          class="invite-button" 
          :disabled="inviting || !selectedUser"
        >
          <span v-if="inviting">Invitation en cours...</span>
          <span v-else>Inviter</span>
        </button>
        <button @click="close" class="cancel-button">Annuler</button>
      </div>
    </div>
  </div>
</template>

<script>
import searchService from '../../services/searchService';

export default {
  name: 'InviteUserModal',
  props: {
    isOpen: {
      type: Boolean,
      required: true
    },
    workspaceId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      isOpen: false,
      searchQuery: '',
      users: [],
      selectedUser: null,
      loading: false,
      inviting: false,
      error: null,
      searchPerformed: false,
      searchTimeout: null
    };
  },
  methods: {
    /**
     * Ferme le modal
     */
    open() {
      this.isOpen = true;
      this.searchQuery = '';
      this.users = [];
      this.selectedUser = null;
      this.error = null;
      this.searchPerformed = false;
    },
    
    /**
     * Ferme le modal
     */
    close() {
      this.isOpen = false;
      this.$emit('close');
    },
    
    /**
     * Débounce la recherche pour éviter trop d'appels API
     */
    debouncedSearch() {
      clearTimeout(this.searchTimeout);
      if (this.searchQuery.trim().length >= 2) {
        this.searchTimeout = setTimeout(() => {
          this.searchUsers();
        }, 300);
      } else {
        this.users = [];
        this.searchPerformed = false;
      }
    },
    
    /**
     * Recherche des utilisateurs via le service dédié
     */
    async searchUsers() {
      if (this.searchQuery.trim().length < 2) return;
      
      this.loading = true;
      this.error = null;
      this.searchPerformed = true;
      
      try {
        
        const results = await searchService.searchUsers(this.searchQuery);
        
        if (results && results.length > 0) {
          results.forEach((user, index) => {
            console.log(`  - ID properties: _id=${user._id}, id=${user.id}`);
            console.log(`  - Name properties: username=${user.username}, name=${user.name}, nom=${user.nom}`);
          });
        }
        
        this.users = results || [];
      } catch (err) {
        console.error('Erreur lors de la recherche d\'utilisateurs:', err);
        this.error = err.message || 'Erreur lors de la recherche d\'utilisateurs';
        this.users = [];
      } finally {
        this.loading = false;
      }
    },
    
    /**
     * Sélectionne un utilisateur dans la liste
     */
    selectUser(user) {
      this.selectedUser = user;
    },
    
    /**
     * Récupère l'avatar de l'utilisateur
     */
    getUserAvatar(user) {
      if (!user) return require('../../assets/styles/image/profilDelault.png');
      
      if (user.profilePicture) {
        if (user.profilePicture.startsWith('http')) {
          return user.profilePicture;
        }
        return `http://localhost:3000/uploads/profiles/${user.profilePicture}`;
      } else if (user.photo) {
        if (user.photo.startsWith('http')) {
          return user.photo;
        }
        return `http://localhost:3000/uploads/profiles/${user.photo}`;
      } else if (user.avatar) {
        if (user.avatar.startsWith('http')) {
          return user.avatar;
        }
        return `http://localhost:3000/uploads/profiles/${user.avatar}`;
      }
      return require('../../assets/styles/image/profilDelault.png');
    },
    
    /**
     * Récupère le nom d'utilisateur
     */
    getUserName(user) {
      if (!user) return 'Utilisateur inconnu';
      
      return user.username || user.nom || user.name || user.displayName || 'Utilisateur sans nom';
    },
    
    /**
     * Invite l'utilisateur sélectionné au workspace par email
     */
    async inviteUser() {
      if (!this.selectedUser) return;
      
      this.inviting = true;
      this.error = null;
      
      try {
        const email = this.selectedUser.email;
        
        if (!email) {
          throw new Error('L\'email de l\'utilisateur est manquant');
        }
        
        if (!this.workspaceId) {
          throw new Error('ID de workspace manquant');
        }
        
        const url = `http://localhost:3000/api/v1/workspaces/${this.workspaceId}/inviter`;
        
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
              email: email
            })
          });
          
          if (!response.ok) {
            let errorMessage = `Erreur ${response.status}: `;
            
            try {
              const errorData = await response.json();
              errorMessage += (errorData.message || errorData.error || 'Erreur lors de l\'envoi de l\'invitation');
              console.error('Détails de l\'erreur:', errorData);
            } catch (e) {
              const textError = await response.text();
              errorMessage += textError || 'Erreur inconnue';
              console.error('Texte de l\'erreur brut:', textError);
            }
            
            throw new Error(errorMessage);
          }
          
          try {
            const responseData = await response.json();
          } catch (e) {
            console.log('Invitation envoyée avec succès, pas de données JSON en réponse');
          }
        } catch (fetchError) {
          console.error('Erreur de réseau lors de l\'envoi de l\'invitation:', fetchError);
          throw fetchError;
        }
        
        this.$emit('user-invited', this.selectedUser);
        setTimeout(() => {
          this.close();
        }, 1000);
      } catch (err) {
        console.error('Erreur lors de l\'invitation:', err);
        this.error = err.message || 'Erreur lors de l\'invitation';
      } finally {
        this.inviting = false;
      }
    }
  }
}
</script>

<style scoped>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.modal-content {
  background: #2f3136;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #202225;
  border-bottom: 1px solid #40444b;
}

.modal-header h3 {
  color: white;
  margin: 0;
  font-size: 18px;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  color: #dcddde;
  cursor: pointer;
}

.close-button:hover {
  color: white;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.search-container {
  margin-bottom: 15px;
}

.search-input {
  width: 100%;
  padding: 10px 12px;
  border-radius: 4px;
  background: #40444b;
  border: none;
  color: white;
  font-size: 14px;
}

.users-search-list {
  margin-top: 15px;
  max-height: 300px;
  overflow-y: auto;
}

.user-search-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 8px;
  cursor: pointer;
  background: #40444b;
}

.user-search-item:hover, .user-search-item.selected {
  background: #4f545c;
}

.user-search-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
  object-fit: cover;
}

.user-search-info {
  display: flex;
  flex-direction: column;
}

.user-search-name {
  color: white;
  font-weight: 500;
}

.user-search-email {
  color: #b9bbbe;
  font-size: 12px;
  margin-top: 2px;
}

.loading-message, .empty-message, .error-message, .instructions-message {
  color: #b9bbbe;
  text-align: center;
  padding: 15px 0;
}

.error-message {
  color: #f04747;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 15px 20px;
  background: #2a2c31;
  border-top: 1px solid #40444b;
}

.invite-button, .cancel-button {
  padding: 8px 16px;
  border-radius: 3px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  margin-left: 10px;
  border: none;
}

.invite-button {
  background-color: #4caf50;
  color: white;
}

.invite-button:hover {
  background-color:rgb(50, 151, 53);
}

.invite-button:disabled {
  background-color: #c1c1c1;
  cursor: not-allowed;
}

.cancel-button {
  background-color: #4f545c;
  color: white;
}

.cancel-button:hover {
  background-color: #40444b;
}
</style>
