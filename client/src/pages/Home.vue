<template>
  <FriendsList />
  <div class="home">
    <Message />
    <textBox />
  </div>
</template>

<script>
import FriendsList from '../components/headerFile/FriendsList.vue'
import Message from '../components/messageComponentFile/Message.vue'
import textBox from '../components/messageComponentFile/textBox.vue'

export default {
  name: 'Home',
  components: {
    FriendsList,
    Message,
    textBox
  },
  props: {
    id: {
      type: String,
      required: false
    }
  },
  data() {
    return {
      workspaceId: this.id || null,
      messages: [],
      isLoading: false
    }
  },
  watch: {
    // Surveiller les changements d'ID de workspace dans l'URL
    '$route.params.id': {
      immediate: true,
      handler(newId) {
        if (newId && newId !== this.workspaceId) {
          this.workspaceId = newId;
          this.loadWorkspaceData();
        }
      }
    }
  },
  methods: {
    async loadWorkspaceData() {
      if (!this.workspaceId) return;
      
      this.isLoading = true;
      try {
        // Réinitialiser les données du workspace précédent
        this.messages = [];
        
        // Charger les données du nouveau workspace
        // Vous devrez implémenter cette logique selon vos besoins
        console.log('Chargement du workspace:', this.workspaceId);
        
      } catch (error) {
        console.error('Erreur lors du chargement du workspace:', error);
      } finally {
        this.isLoading = false;
      }
    }
  }
};
</script>

<style scoped>
.home {
  margin-left: calc(var(--whidth-header) + var(--whidth-friendsList));
  height: 100vh;
  display: flex;
  flex-direction: column-reverse;
  justify-content: flex-end;
  padding-bottom: 200px;
}
</style>
