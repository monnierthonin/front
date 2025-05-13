<template>
    <div class="chanels-sidebar">
      <div class="baniere">
        <img src="../../assets/styles/image/baniere.png" alt="baniere">
      </div>
      <div class="chanel-parametre">
        <router-link to="/paramworkspace">
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
      }
    },
    data() {
      return {
        isLoading: true
      }
    },
    computed: {
      canauxAffichage() {
        // Utiliser les canaux de l'API ou une liste vide si indisponible
        return this.canaux || []
      }
    },
    methods: {
      /**
       * Sélectionner un canal et notifier le composant parent
       * @param {Object} canal - Le canal sélectionné
       */
      selectionnerCanal(canal) {
        this.$emit('canal-selectionne', canal);
      }
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
  