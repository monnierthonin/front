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
              </div>
              <div v-else class="empty-workspace">Aucun workspace</div>
            </div>
          </li>
        </ul>
      </div>
      <div class="botom-header">
        <!-- Log pour déboguer -->
        <div style="display:none;">{{ console.log('Rendu du composant Header, isAdmin =', isAdmin) }}</div>
        <div class="boutonModeration" v-if="isAdmin"><!-- Section administration (uniquement pour les admins) -->
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
    <!-- Modal pour l'ajout et la recherche de workspaces -->
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

export default {
  components: {
    WorkspaceModal
  },
  data() {
    return {
      currentProfilePicture: localStorage.getItem('profilePicture') || 'default.jpg',
      isAdmin: false, // A remplacer par la vraie valeur (en fonction de l'utilisateur)
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
        // Si c'est déjà une URL complète, l'utiliser directement
        if (this.currentProfilePicture.startsWith('http://') || this.currentProfilePicture.startsWith('https://')) {
          return this.currentProfilePicture;
        }
        // Sinon, construire l'URL (ancien format)
        else if (this.currentProfilePicture !== 'default.jpg') {
          return `http://localhost:3000/uploads/profiles/${this.currentProfilePicture}`;
        }
      }
      // Utilisation de l'image importée par défaut
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
      console.log('---- EVENT: Utilisateur connecté, rechargement du profil et des workspaces ----');
      console.log('Header a reçu l\'événement de connexion');
      // Récupérer la nouvelle photo de profil du localStorage
      this.currentProfilePicture = localStorage.getItem('profilePicture') || 'default.jpg';
      this.isAuthenticated = true;
      console.log('État isAdmin avant loadUserProfile:', this.isAdmin);
      this.loadUserProfile();
      console.log('État isAdmin avant checkSuperAdminRole:', this.isAdmin);
      this.checkSuperAdminRole(); // Vérifier à nouveau le rôle admin après connexion
      this.loadWorkspaces();
    });
    
    // S'abonner à l'événement de déconnexion
    eventBus.on(APP_EVENTS.USER_LOGGED_OUT, () => {
      console.log('Header a reçu l\'événement de déconnexion');
      this.isAuthenticated = false;
      this.isAdmin = false;
      this.currentUserId = null;
      this.workspaces = [];
    });
    
    // Écouter l'événement global de suppression d'un workspace
    this.$root.$on('workspace-deleted', (workspaceId) => {
      console.log('Header a reçu l\'événement de suppression du workspace:', workspaceId);
      // Mettre à jour la liste des workspaces
      this.workspaces = this.workspaces.filter(w => w._id !== workspaceId);
    });
  },
  
  async mounted() {
    console.log('---- MOUNTED: Header component ----');
    // Vérifier si l'utilisateur est connecté via l'API
    try {
      const isAuthenticated = await authService.isAuthenticated();
      this.isAuthenticated = isAuthenticated;
      
      if (isAuthenticated) {
        // Charger le profil utilisateur
        await this.loadUserProfile();
        console.log('État isAdmin après loadUserProfile:', this.isAdmin);
        // Charger les workspaces
        await this.loadWorkspaces();
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
      console.log('---- DÉBUT: Chargement du profil utilisateur ----');
      try {
        // Appeler l'API pour récupérer les informations de l'utilisateur connecté
        console.log('Envoi de la requête pour charger le profil...');
        const response = await fetch('http://localhost:3000/api/v1/auth/me', {
          method: 'GET',
          credentials: 'include'
        });
        
        console.log('Réponse reçue, status:', response.status);
        if (!response.ok) {
          throw new Error(`Erreur lors de la récupération du profil: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Données profil utilisateur reçues:', JSON.stringify(data, null, 2));
        
        if (data && data.status === 'success' && data.data && data.data.user) {
          const user = data.data.user;
          
          // Stocker l'ID utilisateur
          this.currentUserId = user.id || user._id;
          
          // Vérifier si l'utilisateur a le rôle admin
          if (user.role === 'admin') {
            console.log('✅ Utilisateur avec rôle admin détecté, isAdmin mis à TRUE');
            this.isAdmin = true;
          } else {
            console.log('❌ Utilisateur sans rôle admin');
            this.isAdmin = false;
          }
          
          // Mettre à jour la photo de profil si disponible
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
      console.log('---- DÉBUT: Vérification du rôle admin ----');
      try {
        // Faire une requête au serveur pour récupérer les informations de l'utilisateur courant
        console.log('Envoi de la requête pour vérifier le rôle admin...');
        const response = await fetch('http://localhost:3000/api/v1/users/profile', {
          method: 'GET',
          credentials: 'include'
        });
        
        console.log('Réponse reçue, status:', response.status);
        if (!response.ok) {
          console.error('Erreur lors de la vérification du rôle admin: ', response.status);
          return;
        }
        
        const data = await response.json();
        console.log('Données utilisateur reçues:', JSON.stringify(data, null, 2));
        
        // Extraire les données du profil selon la structure correcte
        let userData = null;
        
        // Structure attendue: {success: true, data: {...}} ou {data: {user: {...}}}
        if (data.success && data.data) {
          userData = data.data;
        } else if (data.data && data.data.user) {
          userData = data.data.user;
        }
        
        if (userData) {
          // Vérifier si le champ role existe et s'il est égal à 'admin'
          const hasAdminRole = userData.role === 'admin';
          console.log('Rôle détecté:', userData.role, 'Est admin?', hasAdminRole);
          this.isAdmin = hasAdminRole;
          console.log('isAdmin mis à jour:', this.isAdmin);
          
          // Force la mise à jour du DOM
          this.$forceUpdate();
        } else {
          console.warn('Profil utilisateur introuvable dans la réponse:', data);
          this.isAdmin = false;
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du rôle admin:', error);
        console.error('Erreur lors de la vérification du rôle superadmin:', error);
        this.isAdmin = false;
      }
    },
    // Ouvrir le modal de gestion des workspaces
    openWorkspaceModal() {
      this.isWorkspaceModalOpen = true;
    },

    // Fermer le modal
    closeWorkspaceModal() {
      this.isWorkspaceModalOpen = false;
    },

    // Gérer la création d'un nouveau workspace
    handleWorkspaceCreated(workspace) {
      this.loadWorkspaces();
    },

    // Gérer l'ajout à un workspace existant
    handleWorkspaceJoined(workspace) {
      this.loadWorkspaces();
    },
    
    async loadWorkspaces() {
      try {
        this.loading = true;
        this.errorMessage = '';
        
        // Si l'utilisateur est authentifié, essayer de récupérer ses workspaces
        if (this.isAuthenticated) {
          // Appel au service pour récupérer les workspaces
          this.workspaces = await workspaceService.getUserWorkspaces();
          console.log('Workspaces chargés depuis l\'API:', this.workspaces);
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
