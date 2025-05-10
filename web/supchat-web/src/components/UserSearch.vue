<template>
  <div class="user-search">
    <v-text-field
      v-model="searchQuery"
      label="Rechercher un utilisateur"
      prepend-inner-icon="mdi-magnify"
      clearable
      outlined
      dense
      @input="onSearch"
      class="search-field"
    ></v-text-field>
    
    <v-list v-if="results.length > 0" class="search-results">
      <v-list-item
        v-for="user in results"
        :key="user._id"
        @click="selectUser(user)"
      >
        <v-list-item-avatar>
          <v-img
            :src="getUserAvatar(user)"
            alt="Avatar"
          ></v-img>
        </v-list-item-avatar>
        
        <v-list-item-content>
          <v-list-item-title>
            {{ user.prenom && user.nom ? `${user.prenom} ${user.nom}` : user.username }}
          </v-list-item-title>
          <v-list-item-subtitle v-if="user.prenom && user.nom">
            @{{ user.username }}
          </v-list-item-subtitle>
        </v-list-item-content>
        
        <v-list-item-action>
          <v-btn
            icon
            small
            @click.stop="startConversation(user)"
            title="Démarrer une conversation"
          >
            <v-icon>mdi-message-text</v-icon>
          </v-btn>
        </v-list-item-action>
      </v-list-item>
    </v-list>
    
    <div v-else-if="searchQuery && !loading" class="no-results">
      <p>Aucun utilisateur trouvé</p>
    </div>
    
    <div v-if="loading" class="loading">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import axios from 'axios';
import debounce from 'lodash.debounce';

export default {
  name: 'UserSearch',
  
  setup(props, { emit }) {
    const store = useStore();
    const router = useRouter();
    const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:3000';
    
    const searchQuery = ref('');
    const results = ref([]);
    const loading = ref(false);
    
    // Fonction de recherche avec debounce pour limiter les appels API
    const debouncedSearch = debounce(async (query) => {
      if (!query || query.length < 2) {
        results.value = [];
        return;
      }
      
      loading.value = true;
      
      try {
        const response = await axios.get(`${API_URL}/api/v1/search/users?q=${query}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        console.log('Réponse de recherche d\'utilisateurs:', response.data);
        
        // Vérifier la structure exacte de la réponse et extraire les utilisateurs
        if (response.data.success && response.data.data && Array.isArray(response.data.data.users)) {
          results.value = response.data.data.users;
          console.log('Utilisateurs trouvés:', results.value.length);
        } else if (response.data.data && Array.isArray(response.data.data)) {
          results.value = response.data.data;
          console.log('Utilisateurs trouvés directement dans data:', results.value.length);
        } else {
          console.warn('Structure de réponse inattendue, impossible de trouver les utilisateurs');
          results.value = [];
        }
      } catch (error) {
        console.error('Erreur lors de la recherche d\'utilisateurs:', error);
        results.value = [];
      } finally {
        loading.value = false;
      }
    }, 300);
    
    // Fonction appelée lors de la saisie dans le champ de recherche
    const onSearch = () => {
      debouncedSearch(searchQuery.value);
    };
    
    // Fonction pour obtenir l'avatar d'un utilisateur
    const getUserAvatar = (user) => {
      if (!user.profilePicture) return '/img/default-avatar.png';
      
      if (user.profilePicture.startsWith('http')) {
        return user.profilePicture;
      }
      
      return `${API_URL}/uploads/profiles/${user.profilePicture}`;
    };
    
    // Fonction pour sélectionner un utilisateur
    const selectUser = (user) => {
      emit('select-user', user);
    };
    
    // Fonction pour démarrer une conversation avec un utilisateur
    const startConversation = async (user) => {
      try {
        // Récupérer les messages avec cet utilisateur
        await store.dispatch('messagePrivate/fetchMessages', user._id);
        
        // Naviguer vers la vue de conversation
        router.push({ 
          name: 'conversation', 
          params: { userId: user._id } 
        });
        
        // Émettre un événement pour informer le composant parent
        emit('start-conversation', user);
      } catch (error) {
        console.error('Erreur lors du démarrage de la conversation:', error);
      }
    };
    
    // Réinitialiser les résultats lorsque la requête est vide
    watch(searchQuery, (newVal) => {
      if (!newVal) {
        results.value = [];
      }
    });
    
    return {
      searchQuery,
      results,
      loading,
      onSearch,
      getUserAvatar,
      selectUser,
      startConversation
    };
  }
};
</script>

<style scoped>
.user-search {
  position: relative;
  width: 100%;
}

.search-field {
  margin-bottom: 0;
}

.search-results {
  position: absolute;
  width: 100%;
  z-index: 10;
  max-height: 300px;
  overflow-y: auto;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  background: white;
}

.no-results, .loading {
  padding: 16px;
  text-align: center;
  background: white;
  border-radius: 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.loading {
  display: flex;
  justify-content: center;
  padding: 24px;
}
</style>
