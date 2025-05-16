<template>
  <FriendsList :workspaceId="workspaceId" />
  <div class="home">
    <Message :workspaceId="workspaceId" :messages="messages" :isLoading="isLoading" />
    <textBox :workspaceId="workspaceId" />
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
        const workspaceService = await import('../services/workspaceService.js');
        const response = await workspaceService.default.getWorkspaceById(this.workspaceId);
        
        if (response && response.data) {
          // Mettre à jour les données du workspace
          
          // Si le workspace a des canaux par défaut, charger leurs messages
          if (response.data.canaux && response.data.canaux.length > 0) {
            const messageService = await import('../services/messageService.js');
            const defaultChannel = response.data.canaux[0];
            const messagesResponse = await messageService.default.getCanalMessages(this.workspaceId, defaultChannel._id);
            this.messages = messagesResponse || [];
          }
        }
      } catch (error) {
        // Gestion silencieuse des erreurs
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
