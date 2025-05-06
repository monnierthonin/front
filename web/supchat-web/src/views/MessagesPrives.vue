<template>
  <v-container fluid class="messages-prives-container pa-0 fill-height">
    <v-row no-gutters class="fill-height">
      <!-- Barre latérale avec la recherche et la liste des conversations -->
      <v-col cols="12" sm="4" md="3" class="sidebar">
        <v-card class="sidebar-card">
          <v-card-title class="sidebar-header">
            Messages privés
          </v-card-title>
          
          <!-- Barre de recherche d'utilisateurs -->
          <div class="search-container px-4 py-2">
            <UserSearch @start-conversation="onStartConversation" />
          </div>
          
          <!-- Liste des conversations -->
          <v-divider></v-divider>
          <PrivateConversationList />
        </v-card>
      </v-col>
      
      <!-- Zone principale pour afficher la conversation active -->
      <v-col cols="12" sm="8" md="9" class="conversation-area">
        <template v-if="activeUserId">
          <PrivateConversation :userId="activeUserId" />
        </template>
        <template v-else>
          <v-card class="empty-state-card">
            <v-card-text class="empty-state">
              <v-icon size="64" color="grey lighten-1">mdi-message-text</v-icon>
              <h3 class="mt-4">Aucune conversation sélectionnée</h3>
              <p class="text-body-2">
                Sélectionnez une conversation existante ou recherchez un utilisateur pour démarrer une nouvelle conversation.
              </p>
            </v-card-text>
          </v-card>
        </template>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import UserSearch from '@/components/UserSearch.vue';
import PrivateConversationList from '@/components/PrivateConversationList.vue';
import PrivateConversation from '@/components/PrivateConversation.vue';

export default {
  name: 'MessagesPrives',
  
  components: {
    UserSearch,
    PrivateConversationList,
    PrivateConversation
  },
  
  setup() {
    const route = useRoute();
    
    // Récupérer l'ID de l'utilisateur actif depuis les paramètres de route
    const activeUserId = computed(() => {
      if (route.name === 'conversation' && route.params.userId) {
        return route.params.userId;
      }
      return null;
    });
    
    // Fonction appelée lorsqu'une nouvelle conversation est démarrée
    const onStartConversation = (user) => {
      console.log('Conversation démarrée avec:', user);
    };
    
    return {
      activeUserId,
      onStartConversation
    };
  }
};
</script>

<style scoped>
.messages-prives-container {
  height: calc(100vh - 64px); /* Hauteur totale moins la hauteur de la barre de navigation */
}

.sidebar {
  border-right: 1px solid rgba(0, 0, 0, 0.12);
  height: 100%;
}

.sidebar-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 0;
}

.sidebar-header {
  padding: 16px;
  font-size: 1.25rem;
  font-weight: 500;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.search-container {
  z-index: 5;
}

.conversation-area {
  height: 100%;
  display: flex;
}

.empty-state-card {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 48px;
  color: rgba(0, 0, 0, 0.6);
}
</style>
