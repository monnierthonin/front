<template>
  <div id="app">
    <Header v-if="!isAuthPage" />
    <router-view></router-view>
  </div>
</template>

<script>
import Header from './components/headerFile/Header.vue'
import userService from './services/userService.js'
import { eventBus, APP_EVENTS } from './utils/eventBus.js'

export default {
  name: 'App',
  components: {
    Header
  },
  async created() {
    // Initialiser le thème, le statut et la photo de profil au chargement de l'application
    await this.loadUserProfile();
  },
  methods: {
    async loadUserProfile() {
      const token = localStorage.getItem('token');
      
      if (token) {
        // Si un utilisateur est connecté, récupérer son profil pour obtenir le thème
        try {
          const response = await userService.getProfile();
          if (response && response.data) {
            // Récupérer et gérer le thème
            let theme = 'dark'; // Par défaut sombre
            
            // Si le thème existe dans le profil, le convertir
            if (response.data.theme) {
              theme = response.data.theme === 'sombre' ? 'dark' : 'light';
            }
            
            // Sauvegarder dans localStorage pour les futurs chargements
            localStorage.setItem('theme', theme);
            
            // Appliquer le thème
            this.applyTheme(theme);
            
            // Récupérer et stocker le statut de l'utilisateur
            if (response.data.status) {
              // Convertir le statut du français vers l'anglais
              let status;
              switch(response.data.status) {
                case 'en ligne':
                  status = 'online';
                  break;
                case 'absent':
                  status = 'away';
                  break;
                case 'ne pas déranger':
                  status = 'offline';
                  break;
                default:
                  status = 'online';
              }
              // Stocker le statut pour une utilisation par d'autres composants
              localStorage.setItem('userStatus', status);
            }
            
            // Récupérer et stocker la photo de profil
            if (response.data.profilePicture) {
              localStorage.setItem('profilePicture', response.data.profilePicture);
            } else {
              // Si aucune photo de profil n'est définie, utiliser l'image par défaut
              localStorage.setItem('profilePicture', 'default.jpg');
            }
            
            // Vérifier si c'est une connexion récente en regardant le localStorage
            const justLoggedIn = localStorage.getItem('justLoggedIn');
            if (justLoggedIn === 'true') {
              // Réinitialiser le flag
              localStorage.removeItem('justLoggedIn');
              
              // Émettre l'événement de connexion réussie - maintenant que nous avons les données de profil
              eventBus.emit(APP_EVENTS.USER_LOGGED_IN);
            }
            
            // Dans tous les cas, informer les composants du changement de photo de profil
            eventBus.emit(APP_EVENTS.PROFILE_PICTURE_UPDATED, response.data.profilePicture || 'default.jpg');
          }
        } catch (error) {
          this.applyDefaultTheme();
        }
      } else {
        // Si personne n'est connecté, appliquer le thème par défaut (sombre)
        this.applyDefaultTheme();
      }
    },
    
    
    applyTheme(theme) {
      if (theme === 'dark') {
        document.documentElement.classList.remove('light-theme');
        document.documentElement.classList.add('dark-theme');
      } else {
        document.documentElement.classList.remove('dark-theme');
        document.documentElement.classList.add('light-theme');
      }
    },
    
    
    applyDefaultTheme() {
      // Thème par défaut : sombre
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.remove('light-theme');
      document.documentElement.classList.add('dark-theme');
    }
  },
  computed: {
    isAuthPage() {
      // Ne pas afficher le Header sur la page d'authentification
      return this.$route.path === '/auth';
    }
  }
}
</script>

<style>
@import './assets/styles/main.css';
</style>
