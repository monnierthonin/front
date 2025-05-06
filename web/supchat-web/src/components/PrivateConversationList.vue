<template>
  <div class="conversation-list">
    <v-list>
      <v-subheader>Messages directs</v-subheader>
      
      <div v-if="loading" class="text-center pa-4">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </div>
      
      <div v-else-if="conversations.length === 0" class="text-center pa-4">
        <p class="text-body-2">Aucune conversation</p>
        <p class="text-caption">Utilisez la recherche pour trouver des utilisateurs</p>
      </div>
      
      <template v-else>
        <v-list-item
          v-for="conversation in conversations"
          :key="conversation.user._id"
          :class="{ 'active-conversation': isActive(conversation.user._id) }"
          @click="openConversation(conversation.user._id)"
        >
          <v-list-item-avatar>
            <v-badge
              :content="conversation.unreadCount"
              :value="conversation.unreadCount > 0"
              color="error"
              offset-x="10"
              offset-y="10"
            >
              <v-img
                :src="getUserAvatar(conversation.user)"
                alt="Avatar"
              ></v-img>
            </v-badge>
          </v-list-item-avatar>
          
          <v-list-item-content>
            <v-list-item-title>
              {{ conversation.user.prenom && conversation.user.nom ? 
                 `${conversation.user.prenom} ${conversation.user.nom}` : 
                 conversation.user.username }}
            </v-list-item-title>
            <v-list-item-subtitle class="text-truncate">
              <span v-if="conversation.lastMessage.isFromMe" class="text-caption">
                Vous: 
              </span>
              {{ conversation.lastMessage.contenu }}
            </v-list-item-subtitle>
          </v-list-item-content>
          
          <v-list-item-action>
            <v-list-item-action-text>
              {{ formatDate(conversation.lastMessage.horodatage) }}
            </v-list-item-action-text>
            <v-icon v-if="conversation.lastMessage.isFromMe" 
                   :color="conversation.lastMessage.lu ? 'success' : 'grey'"
                   small>
              {{ conversation.lastMessage.lu ? 'mdi-eye' : 'mdi-check' }}
            </v-icon>
          </v-list-item-action>
        </v-list-item>
      </template>
    </v-list>
  </div>
</template>

<script>
import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { fr } from 'date-fns/locale';

export default {
  name: 'PrivateConversationList',
  
  setup() {
    const store = useStore();
    const router = useRouter();
    const route = useRoute();
    const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:3000';
    
    const loading = ref(false);
    
    // Récupérer les conversations depuis le store
    const conversations = computed(() => store.state.messagePrivate.conversations);
    
    // Récupérer l'ID de l'utilisateur actif (si on est dans une conversation)
    const activeUserId = computed(() => {
      if (route.name === 'conversation' && route.params.userId) {
        return route.params.userId;
      }
      return null;
    });
    
    // Charger les conversations au montage du composant
    onMounted(async () => {
      loading.value = true;
      await store.dispatch('messagePrivate/fetchConversations');
      loading.value = false;
    });
    
    // Formater la date du dernier message
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      
      if (isToday(date)) {
        return format(date, 'HH:mm');
      } else if (isYesterday(date)) {
        return 'Hier';
      } else if (isThisWeek(date)) {
        return format(date, 'EEEE', { locale: fr });
      } else {
        return format(date, 'dd/MM/yyyy');
      }
    };
    
    // Obtenir l'avatar d'un utilisateur
    const getUserAvatar = (user) => {
      if (!user.profilePicture) return '/img/default-avatar.png';
      
      if (user.profilePicture.startsWith('http')) {
        return user.profilePicture;
      }
      
      return `${API_URL}/uploads/profiles/${user.profilePicture}`;
    };
    
    // Vérifier si une conversation est active
    const isActive = (userId) => {
      return userId === activeUserId.value;
    };
    
    // Ouvrir une conversation
    const openConversation = (userId) => {
      router.push({ 
        name: 'conversation', 
        params: { userId } 
      });
    };
    
    return {
      conversations,
      loading,
      formatDate,
      getUserAvatar,
      isActive,
      openConversation
    };
  }
};
</script>

<style scoped>
.conversation-list {
  height: 100%;
  overflow-y: auto;
}

.active-conversation {
  background-color: rgba(var(--v-theme-primary), 0.1);
}

.text-truncate {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
