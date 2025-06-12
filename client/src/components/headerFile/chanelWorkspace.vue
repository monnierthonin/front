<template>
    <div class="chanels-sidebar">
      <div class="baniere">
        <img src="../../assets/styles/image/baniere.png" alt="baniere">
      </div>
      <div class="chanel-parametre">
        <router-link to="/paramworkspace" @click.native="saveWorkspaceId">
          <button class="parametre-button">
            <img src="../../assets/styles/image/parametre.png" alt="parametre">
          </button>
        </router-link>
      </div>
      <div class="chanels-list">
        <div v-if="isLoading" class="loading-message">Chargement des canaux...</div>
        <div v-else-if="canauxAffichage.length === 0" class="empty-message">Aucun canal disponible</div>
        <div v-else>
          <div 
            v-for="canal in canauxAffichage" 
            :key="canal._id" 
            class="chanel-item" 
            :class="{ 'active': canalActifId === canal._id }" 
            @click="selectionnerCanal(canal)">
            <div class="chanel-icon">
              <span v-if="canal.type === 'texte'" class="icon-text">#</span>
              <span v-else class="icon-voice">🔊</span>
            </div>
            <div class="chanel-name">{{ canal.nom }}</div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'chanelWorkspace',
    props: {
      canaux: {
        type: Array,
        default: () => []
      },
      canalActifId: {
        type: String,
        default: ''
      },
      workspaceId: {
        type: String,
        required: true
      }
    },
    data() {
      return {
        isLoading: true,
        userId: null,
        userRole: null,
        workspace: null
      }
    },
    computed: {
      canauxAffichage() {
        // Si aucun canal n'est disponible, retourner une liste vide
        if (!this.canaux || this.canaux.length === 0) return [];
        
        // Filtrer les canaux selon les règles d'accès
        return this.canaux.filter(canal => {
          // Si le canal n'est pas privé, tout le monde peut y accéder
          if (!canal.estPrive) return true;
          
          // Si l'utilisateur est propriétaire, admin ou modérateur, il a accès à tous les canaux privés
          if (this.hasAdminAccess()) return true;
          
          // Vérifier si l'utilisateur est dans la liste des membres du canal privé
          return this.isUserInChannelMembers(canal);
        });
      }
    },
    methods: {
      /**
       * Sélectionner un canal et notifier le composant parent
       * @param {Object} canal - Le canal sélectionné
       */
      selectionnerCanal(canal) {
        this.$emit('canal-selectionne', canal);
      },
      
      /**
       * Enregistre l'ID du workspace actuel dans le localStorage
       * pour que ParamWorkspace puisse l'utiliser
       */
      saveWorkspaceId() {
        if (this.workspaceId) {
          localStorage.setItem('currentWorkspaceId', this.workspaceId);
          console.log('ID du workspace sauvegardé dans localStorage:', this.workspaceId);
        }
      },
      
      /**
       * Vérifie si l'utilisateur courant est dans la liste des membres d'un canal privé
       * @param {Object} canal - Le canal à vérifier
       * @returns {Boolean} - True si l'utilisateur est membre du canal, false sinon
       */
      isUserInChannelMembers(canal) {
        if (!canal.membres || !Array.isArray(canal.membres) || !this.userId) return false;
        
        return canal.membres.some(membre => {
          // Gérer le cas où membre est un objet ou directement l'ID
          const membreId = (typeof membre === 'object') ? (membre._id || membre.id) : membre;
          return membreId === this.userId;
        });
      },
      
      /**
       * Vérifie si l'utilisateur actuel a des droits d'administration (propriétaire, admin ou modérateur)
       * @returns {Boolean} - True si l'utilisateur est propriétaire, admin ou modérateur
       */
      hasAdminAccess() {
        // Si on n'a pas l'utilisateur ou le workspace, impossible de vérifier
        if (!this.userId || !this.workspace) return false;
        
        // Si l'utilisateur est le propriétaire du workspace
        if (this.isUserWorkspaceOwner()) return true;
        
        // Si userRole est déjà défini, l'utiliser
        if (this.userRole) {
          return ['admin', 'moderateur'].includes(this.userRole);
        }
        
        // Sinon, vérifier si l'utilisateur est admin ou modérateur dans la liste des membres
        const membres = this.workspace.membres || this.workspace.users || [];
        const currentUser = membres.find(membre => {
          const membreId = typeof membre === 'object' ? (membre._id || membre.id || membre.userId) : membre;
          return membreId === this.userId;
        });
        
        if (!currentUser) return false;
        
        // Récupérer le rôle en tenant compte des différentes possibilités de nommage
        const userRole = currentUser.role || currentUser.rôle || currentUser.Role || currentUser.Rôle;
        this.userRole = userRole;
        
        // Vérifier si le rôle est admin ou modérateur
        return userRole && ['admin', 'moderateur'].includes(userRole);
      },
      
      /**
       * Vérifie si l'utilisateur actuel est le propriétaire du workspace
       * @returns {Boolean} - True si l'utilisateur est le propriétaire
       */
      isUserWorkspaceOwner() {
        if (!this.userId || !this.workspace || !this.workspace.proprietaire) return false;
        
        // Si propriétaire est un objet
        if (typeof this.workspace.proprietaire === 'object') {
          const ownerId = this.workspace.proprietaire._id || this.workspace.proprietaire.id;
          return this.userId === ownerId;
        }
        
        // Si propriétaire est directement l'ID
        return this.userId === this.workspace.proprietaire;
      },
      
      /**
       * Décode le token JWT pour récupérer l'ID utilisateur
       */
      getUserIdFromToken() {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        try {
          const tokenPayload = token.split('.')[1];
          const decodedPayload = JSON.parse(atob(tokenPayload));
          this.userId = decodedPayload.userId || decodedPayload.id || decodedPayload.sub;
        } catch (error) {
          console.error('Erreur lors du décodage du token:', error);
        }
      },
      
      /**
       * Récupère les informations du workspace actuel
       */
      fetchWorkspaceInfo() {
        if (!this.workspaceId) return;
        
        const token = localStorage.getItem('token');
        if (!token) return;
        
        fetch(`http://localhost:3000/api/v1/workspaces/${this.workspaceId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        .then(response => {
          if (!response.ok) throw new Error('Erreur lors de la récupération du workspace');
          return response.json();
        })
        .then(data => {
          this.workspace = data;
        })
        .catch(error => {
          console.error('Erreur:', error);
        });
      }
    },
    created() {
      // Récupérer l'ID de l'utilisateur du token
      this.getUserIdFromToken();
      
      // Récupérer les informations du workspace
      this.fetchWorkspaceInfo();
    },
    watch: {
      canaux: {
        handler(newVal) {
          if (newVal) {
            this.isLoading = false
            
            // Si un canal a été chargé et qu'aucun canal n'est actif,
            // sélectionner le premier canal par défaut
            if (newVal.length > 0 && !this.canalActifId) {
              this.$nextTick(() => {
                this.selectionnerCanal(newVal[0]);
              });
            }
          }
        },
        immediate: true
      }
    }
  }
  </script>
  
  <style scoped>
  .chanels-sidebar {
    position: fixed;
    left: var(--whidth-header);
    top: 0;
    height: 100vh;
    width: var(--whidth-chanelWorkspace);
    background-color: #2B3132;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    border-left: 1px solid var(--border-color);
  }
  
  .chanels-list {
    height: calc(100% - 250px);
    overflow-y: auto;
    scrollbar-width: none;
    padding: 10px;
    margin-top: 10px;
    margin-bottom: 10px;
  }
  
  .chanels-list::-webkit-scrollbar {
    display: none;
  }
  
  .chanel-item {
    display: flex;
    align-items: center;
    padding: 10px;
    margin-bottom: 8px;
    border-radius: 8px;
    cursor: pointer;
    background-color:var(--secondary-color);
    transition: background-color 0.2s ease;
  }
  
  .chanel-item:hover {
    background-color: var(--secondary-color-transition);
  }
  
  .chanel-item.active {
    background-color: var(--secondary-color-transition);
    border-left: 3px solid var(--accent-color, #7289da);
  }
  
  .chanel-icon {
    width: 16px;
    height: 16px;
    margin-right: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .chanel-icon .icon-text,
  .chanel-icon .icon-voice {
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }
  
  .chanel-icon .icon-text {
    font-weight: bold;
    color: #8e9297;
  }
  
  .chanel-icon .icon-voice {
    color: #8e9297;
  }
  
  .chanel-name {
    color: var(--text-color);
    font-size: 14px;
  }
  
  .loading-message, .empty-message {
    color: var(--text-secondary-color, #a3a3a3);
    font-size: 14px;
    text-align: center;
    padding: 20px 0;
  }
  
  .chanel-parametre {
    padding: 10px;
    display: flex;
    justify-content: left;
    border-top: 1px solid var(--border-color);
  }
  
  .parametre-button {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background: none;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  
  .parametre-button img {
    width: 100%;
    height: 100%;
  }

  .baniere img{
    width: 200px;
    height: 200px
  }
  
  .parametre-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  </style>
  