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
            <li><router-link to="/" class="nav-link"><img src="../../assets/styles/image/logoAjout.png" alt="ajoutWorkspace" class="AjoutWorkspace"></router-link></li>
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
                </div>
                <div v-else class="empty-workspace">Aucun workspace</div>
              </div>
            </li>
          </ul>
      </div>
      <div class="botom-header">
        <div class="boutonModeration" v-if="isAdmin"><!-- a afficher quand l'utilisateur est admin -->
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
  </header>
</template>

<script>
import workspaceService from '../../services/workspaceService';
import defaultProfileImg from '../../assets/styles/image/profilDelault.png';
import { eventBus, APP_EVENTS } from '../../utils/eventBus.js';

export default {
  data() {
    return {
      currentProfilePicture: localStorage.getItem('profilePicture') || 'default.jpg',
      isAdmin: false, // A remplacer par la vraie valeur (en fonction de l'utilisateur)
      workspaces: [],
      loading: true,
      errorMessage: '',
      isAuthenticated: false
    }
  },
  computed: {
    profileImageUrl() {
      if (this.currentProfilePicture && this.currentProfilePicture !== 'default.jpg') {
        return `http://localhost:3000/uploads/profiles/${this.currentProfilePicture}`;
      }
      // Utilisation de l'image importée
      return defaultProfileImg;
    }
  },

  created() {
    // S'abonner à l'événement de mise à jour de la photo de profil
    eventBus.on(APP_EVENTS.PROFILE_PICTURE_UPDATED, (newProfilePicture) => {
      console.log('Header a reçu l\'événement de mise à jour de la photo de profil:', newProfilePicture);
      this.currentProfilePicture = newProfilePicture;
    });
    
    // S'abonner à l'événement de connexion
    eventBus.on(APP_EVENTS.USER_LOGGED_IN, () => {
      console.log('Header a reçu l\'événement de connexion');
      // Récupérer la nouvelle photo de profil du localStorage
      this.currentProfilePicture = localStorage.getItem('profilePicture') || 'default.jpg';
    });
    
    // S'abonner à l'événement de déconnexion
    eventBus.on(APP_EVENTS.USER_LOGGED_OUT, () => {
      console.log('Header a reçu l\'événement de déconnexion');
      // Ne pas réinitialiser la photo de profil, laissons la fonction loadUserProfile le faire correctement
      // quand l'utilisateur se connectera à nouveau
    });
  },
  
  async mounted() {
    // Vérifier si l'utilisateur est authentifié
    this.isAuthenticated = localStorage.getItem('token') !== null;
    console.log('Statut d\'authentification:', this.isAuthenticated);
    
    // Chargement des workspaces au montage du composant
    await this.loadWorkspaces();
  },
  methods: {
    async loadWorkspaces() {
      try {
        this.loading = true;
        this.errorMessage = '';
        
        // Si l'utilisateur est authentifié, essayer de récupérer ses workspaces
        if (this.isAuthenticated) {
          // Appel au service pour récupérer les workspaces avec l'endpoint mes-workspaces
          this.workspaces = await workspaceService.getUserWorkspaces();
          console.log('Workspaces chargés depuis l\'API (mes-workspaces):', this.workspaces);
        } else {
          // Si l'utilisateur n'est pas authentifié, afficher un tableau vide
          this.workspaces = [];
        }
      } catch (error) {
        console.error('Erreur lors du chargement des workspaces:', error);
        this.errorMessage = 'Impossible de charger vos workspaces';
        this.workspaces = []; // En cas d'erreur, ne pas afficher de workspaces par défaut
      } finally {
        this.loading = false;
      }
    },
    
    // Générer une couleur en fonction du nom du workspace
    getWorkspaceColor(workspace) {
      // Liste de couleurs prédéfinies
      const colors = [
        '#7289da', '#43b581', '#f04747', '#faa61a', '#b9bbbe',
        '#2c2f33', '#99aab5', '#e91e63', '#9c27b0', '#3f51b5'
      ];
      
      // Utiliser le hash du nom pour choisir une couleur
      const hash = this.hashString(workspace.nom || 'Workspace');
      const colorIndex = Math.abs(hash) % colors.length;
      
      return { backgroundColor: colors[colorIndex] };
    },
    
    // Récupérer les initiales du nom du workspace
    getWorkspaceInitiale(workspace) {
      if (!workspace || !workspace.nom) return '?';
      
      const words = workspace.nom.split(' ');
      if (words.length === 1) {
        // Si un seul mot, prendre les deux premières lettres
        return words[0].substring(0, 2).toUpperCase();
      } else {
        // Sinon prendre la première lettre de chaque mot (max 2)
        return (words[0][0] + (words[1] ? words[1][0] : '')).toUpperCase();
      }
    },
    
    // Fonction simple pour calculer un hash à partir d'une chaîne
    hashString(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0; // Convertir en entier 32 bits
      }
      return hash;
    },
    
    // Naviguer vers un workspace
    goToWorkspace(id) {
      // Naviguer vers la page dédiée au workspace avec l'ID spécifié
      this.$router.push({ name: 'Workspace', params: { id } });
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
