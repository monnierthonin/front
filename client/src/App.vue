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
