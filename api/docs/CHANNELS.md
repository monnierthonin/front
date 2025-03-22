# Documentation des Canaux

## Endpoints

### 1. Créer un canal

```http
POST /api/canaux
```

**Corps de la requête :**
```json
{
  "nom": "general",
  "description": "Canal général",
  "type": "public" | "private",
  "membres": ["user_id1", "user_id2"]
}
```

**Réponse :**
```json
{
  "status": "success",
  "data": {
    "canal": {
      "id": "canal_id",
      "nom": "general",
      "description": "Canal général",
      "type": "public",
      "createur": "user_id",
      "membres": [
        {
          "id": "user_id1",
          "nom": "Doe",
          "prenom": "John",
          "role": "admin"
        }
      ],
      "dateCreation": "2025-03-22T11:00:00.000Z"
    }
  }
}
```

### 2. Récupérer les canaux

```http
GET /api/canaux
```

### 3. Récupérer un canal

```http
GET /api/canaux/:id
```

### 4. Modifier un canal

```http
PUT /api/canaux/:id
```

### 5. Supprimer un canal

```http
DELETE /api/canaux/:id
```

### 6. Gérer les membres

```http
POST /api/canaux/:id/membres
DELETE /api/canaux/:id/membres/:userId
PUT /api/canaux/:id/membres/:userId/role
```

## Intégration Vue.js

### 1. Store Vuex pour les canaux

```javascript
// store/channels.js
import axios from 'axios'

export default {
  state: {
    canaux: [],
    canalActif: null
  },
  
  mutations: {
    SET_CANAUX(state, canaux) {
      state.canaux = canaux
    },
    SET_CANAL_ACTIF(state, canal) {
      state.canalActif = canal
    },
    ADD_CANAL(state, canal) {
      state.canaux.push(canal)
    },
    UPDATE_CANAL(state, canal) {
      const index = state.canaux.findIndex(c => c.id === canal.id)
      if (index !== -1) {
        state.canaux.splice(index, 1, canal)
      }
    },
    REMOVE_CANAL(state, canalId) {
      state.canaux = state.canaux.filter(c => c.id !== canalId)
    }
  },
  
  actions: {
    async fetchCanaux({ commit }) {
      const { data } = await axios.get('/api/canaux')
      commit('SET_CANAUX', data.data.canaux)
    },
    
    async createCanal({ commit }, canalData) {
      const { data } = await axios.post('/api/canaux', canalData)
      commit('ADD_CANAL', data.data.canal)
      return data.data.canal
    },
    
    async deleteCanal({ commit }, canalId) {
      await axios.delete(`/api/canaux/${canalId}`)
      commit('REMOVE_CANAL', canalId)
    }
  }
}
```

### 2. Composant Liste des Canaux

```vue
<!-- components/ChannelList.vue -->
<template>
  <div class="channel-list">
    <div v-for="canal in canaux" 
         :key="canal.id"
         class="channel-item"
         :class="{ active: isActive(canal) }"
         @click="selectCanal(canal)">
      
      <div class="channel-info">
        <span class="channel-name">
          {{ canal.type === 'private' ? '🔒' : '#' }} {{ canal.nom }}
        </span>
        <span v-if="canal.messagesNonLus" 
              class="unread-badge">
          {{ canal.messagesNonLus }}
        </span>
      </div>
      
      <div v-if="peutGerer(canal)" 
           class="channel-actions">
        <button @click.stop="modifierCanal(canal)">
          ⚙️
        </button>
        <button @click.stop="supprimerCanal(canal)">
          🗑️
        </button>
      </div>
    </div>
    
    <button v-if="peutCreerCanal"
            @click="showCreateModal = true"
            class="create-channel">
      + Nouveau canal
    </button>
    
    <!-- Modal création canal -->
    <ChannelCreateModal
      v-if="showCreateModal"
      @close="showCreateModal = false"
      @created="handleCanalCreated"
    />
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import ChannelCreateModal from './ChannelCreateModal.vue'

export default {
  components: {
    ChannelCreateModal
  },
  
  data() {
    return {
      showCreateModal: false
    }
  },
  
  computed: {
    ...mapState('channels', ['canaux', 'canalActif']),
    ...mapState('auth', ['user']),
    
    peutCreerCanal() {
      return this.user.role === 'admin'
    }
  },
  
  methods: {
    ...mapActions('channels', [
      'fetchCanaux',
      'deleteCanal'
    ]),
    
    isActive(canal) {
      return this.canalActif?.id === canal.id
    },
    
    peutGerer(canal) {
      return canal.createur === this.user.id || 
             this.user.role === 'admin'
    },
    
    selectCanal(canal) {
      this.$router.push(`/canaux/${canal.id}`)
    },
    
    async supprimerCanal(canal) {
      if (confirm(`Supprimer le canal ${canal.nom} ?`)) {
        try {
          await this.deleteCanal(canal.id)
          this.$toast.success('Canal supprimé')
        } catch (error) {
          this.$toast.error('Erreur lors de la suppression')
        }
      }
    },
    
    handleCanalCreated(canal) {
      this.showCreateModal = false
      this.$router.push(`/canaux/${canal.id}`)
    }
  },
  
  created() {
    this.fetchCanaux()
  }
}
</script>
```

### 3. Composant Détails du Canal

```vue
<!-- components/ChannelDetails.vue -->
<template>
  <div v-if="canal" class="channel-details">
    <div class="channel-header">
      <h2>
        {{ canal.type === 'private' ? '🔒' : '#' }} 
        {{ canal.nom }}
      </h2>
      <p class="description">{{ canal.description }}</p>
      
      <div class="member-count">
        {{ canal.membres.length }} membres
      </div>
    </div>
    
    <div class="member-list">
      <div v-for="membre in canal.membres" 
           :key="membre.id"
           class="member-item">
        <img :src="membre.avatar" :alt="membre.nom">
        <span>{{ membre.prenom }} {{ membre.nom }}</span>
        <span class="role">{{ membre.role }}</span>
        
        <button v-if="peutGererMembres"
                @click="changerRole(membre)">
          Changer rôle
        </button>
        <button v-if="peutGererMembres"
                @click="retirerMembre(membre)">
          Retirer
        </button>
      </div>
    </div>
    
    <button v-if="peutGererMembres"
            @click="showAddMemberModal = true">
      Ajouter des membres
    </button>
    
    <!-- Modal ajout membres -->
    <AddMemberModal
      v-if="showAddMemberModal"
      :canal="canal"
      @close="showAddMemberModal = false"
      @added="handleMembresAdded"
    />
  </div>
</template>

<script>
export default {
  props: {
    canalId: {
      type: String,
      required: true
    }
  },
  
  data() {
    return {
      showAddMemberModal: false
    }
  },
  
  computed: {
    canal() {
      return this.$store.state.channels.canaux
        .find(c => c.id === this.canalId)
    },
    
    peutGererMembres() {
      return this.canal?.createur === this.user.id || 
             this.user.role === 'admin'
    }
  },
  
  methods: {
    async changerRole(membre) {
      const nouveauRole = membre.role === 'admin' ? 'member' : 'admin'
      try {
        await this.$store.dispatch('channels/updateMemberRole', {
          canalId: this.canal.id,
          userId: membre.id,
          role: nouveauRole
        })
      } catch (error) {
        this.$toast.error('Erreur lors du changement de rôle')
      }
    },
    
    async retirerMembre(membre) {
      if (confirm(`Retirer ${membre.prenom} ${membre.nom} du canal ?`)) {
        try {
          await this.$store.dispatch('channels/removeMember', {
            canalId: this.canal.id,
            userId: membre.id
          })
        } catch (error) {
          this.$toast.error('Erreur lors du retrait du membre')
        }
      }
    },
    
    handleMembresAdded() {
      this.showAddMemberModal = false
      this.$toast.success('Membres ajoutés avec succès')
    }
  }
}
</script>
```

## WebSocket Events

Les canaux utilisent WebSocket pour les mises à jour en temps réel :

```javascript
// Événements reçus
socket.on('CANAL_CREE', canal => {
  store.commit('ADD_CANAL', canal)
})

socket.on('CANAL_MODIFIE', canal => {
  store.commit('UPDATE_CANAL', canal)
})

socket.on('CANAL_SUPPRIME', canalId => {
  store.commit('REMOVE_CANAL', canalId)
})

socket.on('MEMBRE_AJOUTE', ({ canalId, membre }) => {
  // Mettre à jour la liste des membres
})

socket.on('MEMBRE_RETIRE', ({ canalId, membreId }) => {
  // Retirer le membre de la liste
})
```

## Permissions

Les permissions sont gérées par rôles :

- **Admin** : Peut tout faire
- **Créateur** : Peut gérer son canal
- **Membre** : Peut voir et participer
- **Non-membre** : Peut voir si public

```javascript
// Exemple de vérification de permission
const peutGererCanal = (canal, user) => {
  return canal.createur === user.id || 
         user.role === 'admin'
}
```
