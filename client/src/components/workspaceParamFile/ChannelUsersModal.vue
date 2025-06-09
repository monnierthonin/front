<template>
  <div v-if="show" class="modal-overlay" @click.self="closeModal">
    <div class="modal-container">
      <div class="modal-header">
        <h3>Gérer les utilisateurs du canal</h3>
        <button class="close-button" @click="closeModal">&times;</button>
      </div>
      
      <div class="modal-content">
        <div v-if="loading" class="modal-loading">
          Chargement des utilisateurs...
        </div>
        
        <div v-else-if="error" class="modal-error">
          {{ error }}
        </div>
        
        <div v-else class="user-list">
          <div 
            v-for="user in workspaceUsers" 
            :key="user.id" 
            class="user-item-checkbox"
          >
            <label class="checkbox-container">
              <input 
                type="checkbox" 
                :checked="isUserSelected(user.id)" 
                @change="toggleUserPermission(user.id, $event)" 
                :disabled="processingUsers[user.id]"
              />
              <div class="user-info">
                <img 
                  :src="getUserAvatar(user)" 
                  :alt="getUserName(user)" 
                  class="small-avatar"
                />
                <span>{{ getUserName(user) }}</span>
                <span v-if="processingUsers[user.id]" class="processing-indicator">
                  ⟳
                </span>
              </div>
            </label>
          </div>
          
          <div v-if="workspaceUsers.length === 0" class="modal-loading">
            Aucun utilisateur disponible dans ce workspace
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="cancel-button" @click="closeModal">
          Fermer
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ChannelUsersModal',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    channel: {
      type: Object,
      default: null
    },
    workspaceId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      loading: false,
      error: null,
      workspaceUsers: [],
      selectedUsers: [],
      saving: false,
      processingUsers: {},  // Pour suivre les utilisateurs en cours de traitement
      defaultAvatar: '../assets/styles/image/profilDelault.png'
    }
  },
  watch: {
    show(newVal) {
      if (newVal && this.channel) {
        this.initModal();
      }
    }
  },
  methods: {
    /**
     * Activer/désactiver un utilisateur dans la sélection et mettre à jour immédiatement
     */
    async toggleUserPermission(userId, event) {
      const isChecked = event.target.checked;
      
      // Marquer cet utilisateur comme étant en cours de traitement
      this.processingUsers[userId] = true;
      // Forcer la réactivité en créant un nouvel objet
      this.processingUsers = { ...this.processingUsers };
      
      try {
        if (isChecked) {
          // Ajouter l'utilisateur aux autorisations
          await this.addUserToChannel(userId);
          // Mettre à jour la liste locale uniquement en cas de succès
          this.selectedUsers.push(userId);
        } else {
          // Retirer l'utilisateur des autorisations
          await this.removeUserFromChannel(userId);
          // Mettre à jour la liste locale uniquement en cas de succès
          this.selectedUsers = this.selectedUsers.filter(id => id !== userId);
        }
      } catch (err) {
        console.error('Erreur lors de la modification des permissions:', err);
        this.error = err.message || `Impossible de ${isChecked ? 'ajouter' : 'retirer'} cet utilisateur`;
        
        // En cas d'erreur, rétablir l'état de la case à cocher
        event.target.checked = !isChecked;
      } finally {
        // Fin du traitement pour cet utilisateur
        this.processingUsers[userId] = false;
        // Forcer la réactivité en créant un nouvel objet
        this.processingUsers = { ...this.processingUsers };
      }
    },
    
    /**
     * Ajoute un utilisateur au canal
     */
    async addUserToChannel(userId) {
      if (!this.channel) return;
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Aucun token d\'authentification trouvé');
      }
      
      const response = await fetch(`http://localhost:3000/api/v1/workspaces/${this.workspaceId}/canaux/${this.channel.id}/utilisateurs/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
        throw new Error(`Erreur lors de l'ajout de l'utilisateur: ${response.status}`);
      }
      
      return response.json();
    },
    
    /**
     * Retire un utilisateur du canal
     */
    async removeUserFromChannel(userId) {
      if (!this.channel) return;
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Aucun token d\'authentification trouvé');
      }
      
      const response = await fetch(`http://localhost:3000/api/v1/workspaces/${this.workspaceId}/canaux/${this.channel.id}/utilisateurs/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
        throw new Error(`Erreur lors du retrait de l'utilisateur: ${response.status}`);
      }
      
      return response.json();
    },
    
    /**
     * Initialise le modal
     */
    async initModal() {
      this.selectedUsers = [];
      this.error = null;
      
      await this.loadWorkspaceUsers();
      await this.loadChannelUsers();
    },
    
    /**
     * Ferme le modal et émet un événement
     */
    closeModal() {
      this.$emit('close');
    },
    
    /**
     * Charge les utilisateurs du workspace
     */
    async loadWorkspaceUsers() {
      this.loadingUsers = true;
      this.error = null;
      
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Aucun token d\'authentification trouvé');
        }
        
        const response = await fetch(`http://localhost:3000/api/v1/workspaces/${this.workspaceId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Session expirée, veuillez vous reconnecter');
          }
          throw new Error(`Erreur lors de la récupération du workspace: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data?.data?.workspace?.membres) {
          this.workspaceUsers = data.data.workspace.membres.map(membre => ({
            id: typeof membre.utilisateur === 'object' 
              ? membre.utilisateur._id || membre.utilisateur.id 
              : membre.utilisateur,
            utilisateur: membre.utilisateur,
            role: membre.role || 'member'
          }));
        } else {
          this.workspaceUsers = [];
        }
      } catch (err) {
        console.error('Erreur lors du chargement des utilisateurs:', err);
        this.error = err.message || 'Impossible de charger la liste des utilisateurs';
      } finally {
        this.loadingUsers = false;
      }
    },
    
    /**
     * Charge les utilisateurs autorisés pour un canal spécifique
     */
    async loadChannelUsers() {
      if (!this.channel) return;
      
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Aucun token d\'authentification trouvé');
        }
        
        // Au lieu de chercher un endpoint spécifique pour les utilisateurs, on récupère les détails du canal
        const response = await fetch(`http://localhost:3000/api/v1/workspaces/${this.workspaceId}/canaux/${this.channel.id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Vérifie si le canal contient une propriété utilisateurs_autorises
          if (data?.data?.canal?.utilisateurs_autorises) {
            // Mettre à jour les utilisateurs sélectionnés
            this.selectedUsers = data.data.canal.utilisateurs_autorises.map(user => 
              typeof user === 'object' ? user._id || user.id : user
            );
          } else {
            this.selectedUsers = [];
          }
        } else if (response.status === 401) {
          throw new Error('Session expirée, veuillez vous reconnecter');
        } else {
          console.warn(`Erreur lors de la récupération du canal: ${response.status}`);
          // On continue avec une liste vide
          this.selectedUsers = [];
        }
      } catch (err) {
        console.error('Erreur lors du chargement des utilisateurs du canal:', err);
        // Ne pas afficher d'erreur pour ne pas bloquer l'interface
      }
    },
    
    // La méthode savePermissions n'est plus nécessaire car les modifications sont appliquées en temps réel,
    
    /**
     * Récupère l'avatar d'un utilisateur
     */
    getUserAvatar(user) {
      if (!user) return this.defaultAvatar;
      
      if (typeof user.utilisateur === 'object' && user.utilisateur.avatar) {
        return user.utilisateur.avatar;
      }
      
      return this.defaultAvatar;
    },
    
    /**
     * Récupère le nom d'un utilisateur
     */
    getUserName(user) {
      if (!user) return 'Utilisateur inconnu';
      
      if (typeof user.utilisateur === 'object') {
        return user.utilisateur.nom || user.utilisateur.email || 'Sans nom';
      }
      
      return 'Utilisateur #' + user.id;
    },
    
    /**
     * Vérifie si un utilisateur est sélectionné
     */
    isUserSelected(userId) {
      return this.selectedUsers.includes(userId);
    }
  }
}
</script>

<style scoped>
/* Styles pour le modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  width: 90%;
  max-width: 500px;
  background-color: #36393f;
  border-radius: 5px;
  overflow: hidden;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 15px 20px;
  background-color: #2f3136;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #222;
}

.modal-header h3 {
  margin: 0;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
}

.close-button {
  background: none;
  border: none;
  color: #999;
  font-size: 20px;
  cursor: pointer;
}

.close-button:hover {
  color: #fff;
}

.modal-content {
  padding: 20px;
  max-height: 400px;
  overflow-y: auto;
}

.modal-loading, .modal-error {
  padding: 10px 0;
  text-align: center;
  color: #aaa;
}

.modal-error {
  color: #ff6b6b;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.user-item-checkbox {
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.user-item-checkbox:hover {
  background-color: #32353a;
}

.checkbox-container {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  gap: 10px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
}

.small-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.modal-footer {
  padding: 15px 20px;
  background-color: #2f3136;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid #222;
}

.cancel-button {
  padding: 8px 16px;
  border-radius: 3px;
  cursor: pointer;
  font-weight: 500;
  background-color: transparent;
  color: #fff;
  border: 1px solid #4f545c;
}

.processing-indicator {
  display: inline-block;
  margin-left: 8px;
  color: #7289da;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-message {
  color: #aaaaaa;
  text-align: center;
  padding: 10px;
}
</style>
