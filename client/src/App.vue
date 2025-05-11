<template>
  <div id="app">
    <Header v-if="!isAuthPage" />
    <router-view></router-view>
  </div>
</template>

<script>
import Header from './components/headerFile/Header.vue'
import userService from './services/userService.js'

export default {
  name: 'App',
  components: {
    Header
  },
  async created() {
    // Initialiser le thème au chargement de l'application
    await this.loadUserTheme();
  },
  methods: {
    async loadUserTheme() {
      const token = localStorage.getItem('token');
      
      if (token) {
        // Si un utilisateur est connecté, récupérer son profil pour obtenir le thème
        try {
          const response = await userService.getProfile();
          if (response && response.data) {
            // Convertir le thème du français vers l'anglais
            let theme = 'dark'; // Par défaut sombre
            
            // Si le thème existe dans le profil, le convertir
            if (response.data.theme) {
              theme = response.data.theme === 'sombre' ? 'dark' : 'light';
            }
            
            // Sauvegarder dans localStorage pour les futurs chargements
            localStorage.setItem('theme', theme);
            
            // Appliquer le thème
            this.applyTheme(theme);
          }
        } catch (error) {
          console.error('Erreur lors de la récupération du thème depuis l\'API:', error);
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
