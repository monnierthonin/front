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
    await this.loadUserProfile();
  },
  methods: {
    async loadUserProfile() {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          const response = await userService.getProfile();
          if (response && response.data) {
            let theme = 'dark';
            
            if (response.data.theme) {
              theme = response.data.theme === 'sombre' ? 'dark' : 'light';
            }
            
            localStorage.setItem('theme', theme);
            
            this.applyTheme(theme);
            
            if (response.data.status) {
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
              localStorage.setItem('userStatus', status);
            }
            
            if (response.data.profilePicture) {
              localStorage.setItem('profilePicture', response.data.profilePicture);
            } else {
              localStorage.setItem('profilePicture', 'default.jpg');
            }
            
            const justLoggedIn = localStorage.getItem('justLoggedIn');
            if (justLoggedIn === 'true') {
              localStorage.removeItem('justLoggedIn');
              
              eventBus.emit(APP_EVENTS.USER_LOGGED_IN);
            }
            
            eventBus.emit(APP_EVENTS.PROFILE_PICTURE_UPDATED, response.data.profilePicture || 'default.jpg');
          }
        } catch (error) {
          this.applyDefaultTheme();
        }
      } else {
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
      return this.$route.path === '/auth' ||
             this.$route.path === '/mot-de-passe-oublie' ||
             this.$route.path.startsWith('/reinitialiser-mot-de-passe/');
    }
  }
}
</script>

<style>
@import './assets/styles/main.css';
</style>
