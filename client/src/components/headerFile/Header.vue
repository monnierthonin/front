<template>
  <header class="header">
    <nav class="nav-container">
      <div class="nav-logo-workspace">
        <div class="logo">
          <router-link to="/">
            <img src="../../assets/styles/image/logoSupchat.png" alt="LogoSupChat" class="logo">
          </router-link>
        </div>
        <ul class="nav-links">
          <li><div class="nav-link" @click="openWorkspaceModal"><img src="../../assets/styles/image/logoAjout.png" alt="ajoutWorkspace" class="AjoutWorkspace"></div></li>
          <li class="workspace-container">
            <div class="workspace-list">
              <div v-if="loading" class="loading-workspace">Chargement...</div>
              <div v-else-if="errorMessage" class="error-workspace">{{ errorMessage }}</div>
              <div 
                v-else-if="workspaces.length > 0" 
                v-for="workspace in workspaces" 
                :key="workspace._id"
                class="workspace-item" 
                :style="getWorkspaceColor(workspace)" 
                :title="workspace.nom"
                @click="goToWorkspace(workspace._id)"
              >
                <div class="workspace-initiale">{{ getWorkspaceInitiale(workspace) }}</div>
                <!-- Pastille de notification -->
                <NotificationBadge v-if="hasWorkspaceNotifications(workspace._id)" />
              </div>
              <div v-else class="empty-workspace">Aucun workspace</div>
            </div>
          </li>
        </ul>
      </div>
      <div class="botom-header">
        <div class="boutonModeration" v-if="isAdmin">
          <router-link to="/admin">
            <button class="moderationButton"><img src="../../assets/styles/image/moderation.png" alt="moderation" class="moderation"></button>
          </router-link>
        </div>
        <div class="boutonProfil">
          <router-link to="/profile">
            <button class="profilButton"><img :src="profileImageUrl" alt="profil" class="profilDefault"></button>
          </router-link>
        </div>
      </div>
    </nav>
    <WorkspaceModal 
      :is-open="isWorkspaceModalOpen" 
      @close="closeWorkspaceModal"
      @workspace-created="handleWorkspaceCreated"
      @workspace-joined="handleWorkspaceJoined"
    />
  </header>
</template>

<script>
import workspaceService from '../../services/workspaceService';
import authService from '../../services/authService';
import defaultProfileImg from '../../assets/styles/image/profilDelault.png';
import { eventBus, APP_EVENTS } from '../../utils/eventBus.js';
import { ref, onMounted } from 'vue'
import WorkspaceModal from '@/components/workspace/WorkspaceModal.vue'
import NotificationBadge from '@/components/common/NotificationBadge.vue'
import { useNotificationStore } from '@/stores/notificationStore'

export default {
  components: {
    WorkspaceModal,
    NotificationBadge
  },
  data() {
    return {
      currentProfilePicture: localStorage.getItem('profilePicture') || 'default.jpg',
      isAdmin: false,
      workspaces: [],
      loading: true,
      errorMessage: '',
      isAuthenticated: false,
      isWorkspaceModalOpen: false,
      currentUserId: null
    }
  },
  computed: {
    profileImageUrl() {
      if (this.currentProfilePicture) {
        if (this.currentProfilePicture.startsWith('http://') || this.currentProfilePicture.startsWith('https://')) {
          return this.currentProfilePicture;
        }
        else if (this.currentProfilePicture !== 'default.jpg') {
          return `http://localhost:3000/uploads/profiles/${this.currentProfilePicture}`;
        }
      }
      return defaultProfileImg;
    }
  },

  created() {
    eventBus.on(APP_EVENTS.PROFILE_PICTURE_UPDATED, (newProfilePicture) => {
      this.currentProfilePicture = newProfilePicture;
    });
    
    eventBus.on(APP_EVENTS.USER_LOGGED_IN, () => {
      this.currentProfilePicture = localStorage.getItem('profilePicture') || 'default.jpg';
      this.isAuthenticated = true;
      this.loadUserProfile();
      this.checkSuperAdminRole();
      this.loadWorkspaces();
    });
    
    eventBus.on(APP_EVENTS.USER_LOGGED_OUT, () => {
      this.isAuthenticated = false;
      this.isAdmin = false;
      this.currentUserId = null;
      this.workspaces = [];
    });
    
    this.$root.$on('workspace-deleted', (workspaceId) => {
      this.workspaces = this.workspaces.filter(w => w._id !== workspaceId);
    });
  },
  
  async mounted() {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      this.isAuthenticated = isAuthenticated;
      
      if (isAuthenticated) {
        await this.loadUserProfile();
        await this.loadWorkspaces();
        this.setupNotifications();
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'authentification:', error);
      this.isAuthenticated = false;
    }
  },
  methods: {
    /**
     * Charge le profil de l'utilisateur connecté
     */
    async loadUserProfile() {
      try {
        const response = await fetch('http://localhost:3000/api/v1/auth/me', {
          method: 'GET',
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`Erreur lors de la récupération du profil: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.status === 'success' && data.data && data.data.user) {
          const user = data.data.user;
          
          this.currentUserId = user.id || user._id;
          
          if (user.role === 'admin') {
            this.isAdmin = true;
          } else {
            this.isAdmin = false;
          }
          
          if (user.profilePicture) {
            this.currentProfilePicture = user.profilePicture;
            localStorage.setItem('profilePicture', user.profilePicture);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement du profil utilisateur:', error);
        this.isAdmin = false;
      }
    },
    
    /**
     * Vérifie si l'utilisateur a le rôle superadmin (admin)
     */
    async checkSuperAdminRole() {
      try {
        const response = await fetch('http://localhost:3000/api/v1/users/profile', {
          method: 'GET',
          credentials: 'include'
        });
        
        if (!response.ok) {
          console.error('Erreur lors de la vérification du rôle admin: ', response.status);
          return;
        }
        
        const data = await response.json();
        
        let userData = null;
        
        if (data.success && data.data) {
          userData = data.data;
        } else if (data.data && data.data.user) {
          userData = data.data.user;
        }
        
        if (userData) {
          const hasAdminRole = userData.role === 'admin';
          this.isAdmin = hasAdminRole;
          
          this.$forceUpdate();
        } else {
          this.isAdmin = false;
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du rôle admin:', error);
        this.isAdmin = false;
      }
    },
    openWorkspaceModal() {
      this.isWorkspaceModalOpen = true;
    },
    closeWorkspaceModal() {
      this.isWorkspaceModalOpen = false;
    },
    handleWorkspaceCreated(workspace) {
      this.loadWorkspaces();
    },
    handleWorkspaceJoined(workspace) {
      this.loadWorkspaces();
    },
    
    async loadWorkspaces() {
      try {
        this.loading = true;
        this.errorMessage = '';
        
        if (this.isAuthenticated) {
          this.workspaces = await workspaceService.getUserWorkspaces();
        } else {
          this.workspaces = [];
        }
      } catch (error) {
        console.error('Erreur lors du chargement des workspaces:', error);
        this.errorMessage = 'Impossible de charger vos workspaces';
        this.workspaces = []; 
      } finally {
        this.loading = false;
      }
    },
    
    getWorkspaceColor(workspace) {
      const colors = [
        '#7289da', '#43b581', '#f04747', '#faa61a', '#b9bbbe',
        '#2c2f33', '#99aab5', '#e91e63', '#9c27b0', '#3f51b5'
      ];
      
      const hash = this.hashString(workspace.nom || 'Workspace');
      const colorIndex = Math.abs(hash) % colors.length;
      
      return { backgroundColor: colors[colorIndex] };
    },
    
    getWorkspaceInitiale(workspace) {
      if (!workspace || !workspace.nom) return '?';
      
      const words = workspace.nom.split(' ');
      if (words.length === 1) {
        return words[0].substring(0, 2).toUpperCase();
      } else {
        return (words[0][0] + (words[1] ? words[1][0] : '')).toUpperCase();
      }
    },
    
    hashString(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
      }
      return hash;
    },
    
    goToWorkspace(id) {
      this.$router.push({ name: 'Workspace', params: { id } });
    },

    setupNotifications() {
      const notificationStore = useNotificationStore();
      
      notificationStore.initNotificationListeners();
      
      notificationStore.fetchTotalNonLus();
      
      if (this.workspaces && this.workspaces.length > 0) {
        this.workspaces.forEach(workspace => {
          notificationStore.fetchWorkspaceNotifications(workspace._id);
        });
      }
    },
    
    hasWorkspaceNotifications(workspaceId) {
      const notificationStore = useNotificationStore();
      return notificationStore.hasWorkspaceNotifications(workspaceId);
    }
  }
}

</script>

<style scoped>
.header {
  background-color: var(--secondary-color);
  position: fixed;
  height: 100vh;
  width: var(--whidth-header);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.nav-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  justify-content: space-between;
  height: 100%;
}

.nav-logo-workspace {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.logo {
  width: 60px;
  margin-bottom: 10px;
  margin-top: -4px;
}

.nav-links {
  display: flex;
  flex-direction: column;
  align-items: center;
  list-style: none;
  gap: 0.8rem;
  width: 100%;
}

.nav-link {
  color: var(--text-color);
  text-decoration: none;
  font-size: 0.9rem;
}

.profilButton {
  border-radius: 50%;
  border: none;
}

.moderationButton {
  border-radius: 50%;
  border: none;
}

.moderationButton img{
  width: 40px;
  height: 40px;
}

.nav-link.router-link-active {
  color: var(--primary-color);
}

.boutonProfil {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 10px 0px 0px 0px;
}

.boutonModeration {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 10px 0px 0px 0px;
}

.content {
  margin-left: 120px;
  padding: 20px;
}

.profilDefault {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.AjoutWorkspace {
  width: 50px;
  height: 50px;
}

.workspace-container {
  height: 58vh;
  overflow: hidden;
  padding: 4px;
}

.workspace-list {
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  /* Masquer la scrollbar sur Firefox */
  scrollbar-width: none;
}

/* Masquer la scrollbar sur Chrome/Safari */
.workspace-list::-webkit-scrollbar {
  display: none;
}

.workspace-item {
  width: 50px;
  height: 50px;
  flex-shrink: 0; /* Empêche les éléments de se rétrécir */
  border-radius: 50%;
  cursor: pointer;
  transition: border-radius 0.2s ease;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative; /* Pour positionner la pastille de notification */
}

.workspace-initiale {
  color: white;
  font-weight: bold;
  font-size: 18px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  user-select: none;
}

.botom-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-top: auto; /* Pousse .botom-header en bas */
  padding-bottom: 20px; /* Ajoute un peu d'espace en bas */
}

.workspace-item:hover {
  border-radius: 30%;
}
  .loading-workspace, .error-workspace, .empty-workspace {
    text-align: center;
    padding: 8px;
    font-size: 12px;
    color: var(--text-secondary);
    width: 100%;
  }
  
  .error-workspace {
    color: rgb(239, 68, 68);
  }
</style>
