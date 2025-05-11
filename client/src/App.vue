<template>
  <div id="app">
    <Header v-if="!isAuthPage" />
    <router-view></router-view>
  </div>
</template>

<script>
import Header from './components/headerFile/Header.vue'

export default {
  name: 'App',
  components: {
    Header
  },
  created() {
    // Initialiser le thème au chargement de l'application
    // D'abord on vérifie si un thème est déjà stocké dans le localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      // Appliquer le thème sauvegarrdé
      if (savedTheme === 'dark') {
        document.documentElement.classList.remove('light-theme');
        document.documentElement.classList.add('dark-theme');
      } else {
        document.documentElement.classList.remove('dark-theme');
        document.documentElement.classList.add('light-theme');
      }
    } else {
      // Par défaut, appliquer le thème sombre (correspond au CSS de base)
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
