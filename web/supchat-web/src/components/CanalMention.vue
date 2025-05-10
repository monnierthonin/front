<template>
  <div class="canal-mention-container">
    <!-- Popup de suggestion qui apparaît lorsqu'on tape # -->
    <div 
      v-if="showSuggestions && filteredCanaux.length > 0" 
      class="canal-suggestions"
      ref="suggestionsContainer"
    >
      <div class="suggestion-header">
        <span>Canaux disponibles ({{ filteredCanaux.length }})</span>
      </div>
      <div class="suggestions-list">
        <div 
          v-for="canal in filteredCanaux" 
          :key="canal._id"
          class="suggestion-item"
          @click="selectCanal(canal)"
          :class="{ 'active': selectedIndex === filteredCanaux.indexOf(canal) }"
        >
          <div class="canal-icon">
            <v-icon small>mdi-pound</v-icon>
          </div>
          <div class="canal-info">
            <div class="canal-name">{{ canal.nom }}</div>
            <div class="workspace-name">{{ canal.workspaceNom }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';

export default {
  name: 'CanalMention',
  
  props: {
    query: {
      type: String,
      required: true
    },
    show: {
      type: Boolean,
      required: true
    },
    position: {
      type: Object,
      required: true
    }
  },
  
  emits: ['select', 'close'],
  
  setup(props, { emit }) {
    const canaux = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const selectedIndex = ref(0);
    const suggestionsContainer = ref(null);
    const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:3000';
    
    // Filtrer les canaux en fonction de la requête
    const filteredCanaux = computed(() => {
      if (!props.query) return canaux.value;
      
      const query = props.query.toLowerCase();
      return canaux.value.filter(canal => 
        canal.nom.toLowerCase().includes(query) || 
        canal.workspaceNom.toLowerCase().includes(query)
      );
    });
    
    // Calculer si les suggestions doivent être affichées
    const showSuggestions = computed(() => {
      return props.show && filteredCanaux.value.length > 0;
    });
    
    // Charger les canaux depuis l'API
    const loadCanaux = async (query = '') => {
      loading.value = true;
      error.value = null;
      
      try {
        const url = query 
          ? `${API_URL}/api/v1/search/canaux?q=${encodeURIComponent(query)}` 
          : `${API_URL}/api/v1/search/canaux?all=true`;
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'success' && data.data && data.data.canaux) {
          canaux.value = data.data.canaux;
          console.log(`Canaux chargés: ${canaux.value.length}`);
        } else {
          canaux.value = [];
          console.warn('Format de réponse inattendu:', data);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des canaux:', err);
        error.value = err.message;
        canaux.value = [];
      } finally {
        loading.value = false;
      }
    };
    
    // Sélectionner un canal
    const selectCanal = (canal) => {
      emit('select', canal);
    };
    
    // Gérer les touches du clavier pour la navigation dans les suggestions
    const handleKeyDown = (event) => {
      if (!showSuggestions.value) return;
      
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          selectedIndex.value = (selectedIndex.value + 1) % filteredCanaux.value.length;
          scrollToSelected();
          break;
        case 'ArrowUp':
          event.preventDefault();
          selectedIndex.value = (selectedIndex.value - 1 + filteredCanaux.value.length) % filteredCanaux.value.length;
          scrollToSelected();
          break;
        case 'Enter':
          event.preventDefault();
          if (filteredCanaux.value[selectedIndex.value]) {
            selectCanal(filteredCanaux.value[selectedIndex.value]);
          }
          break;
        case 'Escape':
          event.preventDefault();
          emit('close');
          break;
      }
    };
    
    // Faire défiler jusqu'à l'élément sélectionné
    const scrollToSelected = () => {
      if (suggestionsContainer.value) {
        const activeItem = suggestionsContainer.value.querySelector('.suggestion-item.active');
        if (activeItem) {
          activeItem.scrollIntoView({ block: 'nearest' });
        }
      }
    };
    
    // Charger les canaux au montage du composant
    onMounted(() => {
      loadCanaux();
      window.addEventListener('keydown', handleKeyDown);
    });
    
    // Nettoyer les événements avant de démonter le composant
    onBeforeUnmount(() => {
      window.removeEventListener('keydown', handleKeyDown);
    });
    
    // Recharger les canaux lorsque la requête change
    watch(() => props.query, (newQuery) => {
      if (newQuery && newQuery.length > 0) {
        loadCanaux(newQuery);
      } else if (canaux.value.length === 0) {
        loadCanaux();
      }
    });
    
    return {
      canaux,
      filteredCanaux,
      loading,
      error,
      selectedIndex,
      showSuggestions,
      suggestionsContainer,
      selectCanal
    };
  }
};
</script>

<style scoped>
.canal-mention-container {
  position: relative;
}

.canal-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  width: 300px;
  max-height: 300px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.suggestion-header {
  padding: 8px 12px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  font-weight: 500;
  font-size: 0.9rem;
}

.suggestions-list {
  overflow-y: auto;
  max-height: 250px;
}

.suggestion-item {
  padding: 8px 12px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.suggestion-item:hover, .suggestion-item.active {
  background-color: #f0f0f0;
}

.canal-icon {
  margin-right: 8px;
  color: #1976d2;
}

.canal-info {
  flex: 1;
}

.canal-name {
  font-weight: 500;
}

.workspace-name {
  font-size: 0.8rem;
  color: #757575;
}
</style>
