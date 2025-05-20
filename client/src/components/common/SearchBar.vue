<template>
  <div class="search-container">
    <div class="search-bar">
      <i class="fas fa-search search-icon"></i>
      <input 
        type="text" 
        placeholder="Rechercher un utilisateur..." 
        v-model="searchQuery"
        @input="handleSearchInput"
        @focus="isFocused = true"
        @blur="handleBlur"
      />
      <i 
        v-if="searchQuery && searchQuery.length > 0" 
        class="fas fa-times clear-icon" 
        @click="clearSearch"
      ></i>
    </div>
    
    <!-- Résultats de recherche -->
    <div v-if="isFocused && (loading || results.length > 0 || error)" class="search-results">
      <div v-if="loading" class="loading-results">
        <i class="fas fa-spinner fa-spin"></i> Recherche en cours...
      </div>
      <div v-else-if="error" class="error-results">
        <i class="fas fa-exclamation-circle"></i> {{ error }}
      </div>
      <div v-else-if="results.length > 0" class="results-list">
        <div 
          v-for="user in results" 
          :key="user._id" 
          class="result-item"
          @click="selectUser(user)"
        >
          <div class="user-avatar">
            <img v-if="user.profilePicture" :src="user.profilePicture" :alt="user.username" />
            <div v-else class="default-avatar">{{ getInitials(user) }}</div>
          </div>
          <div class="user-info">
            <div class="user-name">{{ user.username }}</div>
            <div class="user-email">{{ user.email }}</div>
          </div>
          <div class="user-status" :class="user.status || 'offline'"></div>
        </div>
      </div>
      <div v-else-if="searchQuery.length > 0" class="no-results">
        Aucun utilisateur trouvé pour "{{ searchQuery }}"
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, onMounted } from 'vue';
import searchService from '../../services/searchService';

export default {
  name: 'SearchBar',
  emits: ['user-selected'],
  setup(props, { emit }) {
    const searchQuery = ref('');
    const results = ref([]);
    const loading = ref(false);
    const error = ref('');
    const isFocused = ref(false);
    let searchTimeout = null;

    // Fonction pour gérer la saisie de recherche avec debounce
    const handleSearchInput = () => {
      clearTimeout(searchTimeout);
      
      if (searchQuery.value.length === 0) {
        results.value = [];
        loading.value = false;
        error.value = '';
        return;
      }
      
      loading.value = true;
      
      // Attendre 300ms après la dernière frappe avant de déclencher la recherche
      searchTimeout = setTimeout(async () => {
        try {
          if (searchQuery.value.length >= 2) {
            results.value = await searchService.searchUsers(searchQuery.value);
          } else {
            results.value = [];
          }
          error.value = '';
        } catch (err) {
          console.error('Erreur de recherche:', err);
          error.value = err.message || 'Erreur lors de la recherche';
          results.value = [];
        } finally {
          loading.value = false;
        }
      }, 300);
    };

    // Effacer le champ de recherche
    const clearSearch = () => {
      searchQuery.value = '';
      results.value = [];
      error.value = '';
    };

    // Gérer la perte de focus
    const handleBlur = () => {
      // Petit délai pour permettre l'événement click sur un résultat
      setTimeout(() => {
        isFocused.value = false;
      }, 200);
    };

    // Sélectionner un utilisateur dans les résultats
    const selectUser = (user) => {
      emit('user-selected', user);
      clearSearch();
      isFocused.value = false;
    };

    // Extraire les initiales pour l'avatar par défaut
    const getInitials = (user) => {
      if (user.firstName && user.lastName) {
        return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
      } else if (user.username) {
        return user.username.charAt(0).toUpperCase();
      }
      return '?';
    };

    return {
      searchQuery,
      results,
      loading,
      error,
      isFocused,
      handleSearchInput,
      clearSearch,
      handleBlur,
      selectUser,
      getInitials
    };
  }
};
</script>

<style scoped>
.search-container {
  position: relative;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

.search-bar {
  display: flex;
  align-items: center;
  background-color: var(--search-bg, #202225);
  border-radius: 4px;
  padding: 8px 12px;
  position: relative;
}

.search-icon, .clear-icon {
  color: var(--search-icon, #72767d);
  font-size: 16px;
}

.search-icon {
  margin-right: 8px;
}

.clear-icon {
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
  margin-left: 8px;
}

.clear-icon:hover {
  opacity: 1;
}

input {
  background: transparent;
  border: none;
  color: var(--text-color, #ffffff);
  font-size: 14px;
  outline: none;
  flex: 1;
  width: 100%;
}

input::placeholder {
  color: var(--placeholder-color, #72767d);
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: var(--dropdown-bg, #36393f);
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  margin-top: 5px;
  max-height: 350px;
  overflow-y: auto;
  z-index: 10;
}

.loading-results, .error-results, .no-results {
  padding: 15px;
  text-align: center;
  color: var(--text-muted, #72767d);
  font-size: 14px;
}

.error-results {
  color: var(--text-danger, #ed4245);
}

.results-list {
  padding: 8px 0;
}

.result-item {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.result-item:hover {
  background-color: var(--hover-bg, #2f3136);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 12px;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.default-avatar {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--avatar-bg, #5865f2);
  color: white;
  font-weight: bold;
  font-size: 14px;
}

.user-info {
  flex: 1;
}

.user-name {
  font-weight: 500;
  margin-bottom: 2px;
  color: var(--text-color, #ffffff);
}

.user-email {
  font-size: 12px;
  color: var(--text-muted, #72767d);
}

.user-status {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-left: 8px;
}

.user-status.online {
  background-color: #3ba55d;
}

.user-status.idle {
  background-color: #faa81a;
}

.user-status.dnd {
  background-color: #ed4245;
}

.user-status.offline {
  background-color: #72767d;
}
</style>
