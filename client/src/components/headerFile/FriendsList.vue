<template>
  <div class="friends-sidebar">
    <div class="friends-list">
      <div class="friends-header">
        <h2>Contacts</h2>
        <SearchBar @user-selected="startConversation" />
      </div>
      <!-- Message de chargement ou d'erreur -->
      <div v-if="loading" class="loading-message">Chargement des conversations...</div>
      <div v-else-if="error" class="error-message">{{ error }}</div>
      <div v-else-if="contacts.length === 0" class="empty-message">Aucune conversation</div>
      
      <!-- Liste des contacts de conversations privées -->
      <div 
        v-for="contact in contacts" 
        :key="contact._id"
        class="friend-item"
        :class="{ 'active': selectedContactId === contact._id }"
        @click="openConversation(contact._id, contact)"
      >
        <div class="friend-avatar">
          <img 
            :src="contact.profilePicture ? `http://localhost:3000/uploads/profiles/${contact.profilePicture}` : defaultProfileImg" 
            :alt="getContactName(contact)"
          >
          <div class="status-indicator" :class="contact.status || 'offline'"></div>
        </div>
        <div class="friend-name">{{ getContactName(contact) }}</div>
      </div>
    </div>
    <div class="add-friend">
      <button class="add-friend-button" @click="showNewMessageModal">
        <img src="../../assets/styles/image/logoAjout.png" alt="Nouvelle conversation">
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import defaultProfileImg from '../../assets/styles/image/profilDelault.png';
import SearchBar from '../common/SearchBar.vue';

// Données de contacts simulées pour le développement
const mockContacts = [
  {
    _id: '1',
    username: 'johndoe',
    prenom: 'John',
    nom: 'Doe',
    profilePicture: '',
    status: 'online'
  },
  {
    _id: '2',
    username: 'janedoe',
    prenom: 'Jane',
    nom: 'Doe',
    profilePicture: '',
    status: 'offline'
  },
  {
    _id: '3',
    username: 'bobsmith',
    prenom: 'Bob',
    nom: 'Smith',
    profilePicture: '',
    status: 'idle'
  }
];

export default {
  name: 'FriendsList',
  components: {
    SearchBar
  },
  emits: ['select-contact'],
  setup(props, { emit }) {
    const contacts = ref([]);
    const loading = ref(true);
    const error = ref(null);
    const currentUserId = ref(null);
    const selectedContactId = ref(null);
    const selectedContact = ref(null);

    // Récupérer l'ID de l'utilisateur connecté à partir du token JWT
    const getCurrentUserId = () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return null;
        
        // Décoder le token JWT
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const payload = JSON.parse(jsonPayload);
        return payload._id || payload.id; // Utiliser l'un ou l'autre selon la structure
      } catch (err) {
        console.error('Erreur lors du décodage du token:', err);
        return null;
      }
    };

    // Simuler le chargement des contacts
    const loadContacts = async () => {
      try {
        loading.value = true;
        error.value = null;
        
        // En production, cette partie sera remplacée par un appel API
        // Pour l'instant, on utilise des données fictives
        await new Promise(resolve => setTimeout(resolve, 500)); // Simuler un délai réseau
        contacts.value = mockContacts;
        
        currentUserId.value = getCurrentUserId();
        console.log('ID utilisateur courant:', currentUserId.value);
        
      } catch (err) {
        console.error('Erreur lors du chargement des contacts:', err);
        error.value = err.message || 'Erreur lors du chargement des contacts';
      } finally {
        loading.value = false;
      }
    };

    // Obtenir le nom d'affichage du contact
    const getContactName = (contact) => {
      if (!contact) return 'Utilisateur inconnu';
      if (contact.prenom && contact.nom) return `${contact.prenom} ${contact.nom}`;
      if (contact.username) return contact.username;
      return 'Utilisateur inconnu';
    };

    // Ouvrir une conversation avec un contact
    const openConversation = (contactId, contact) => {
      selectedContactId.value = contactId;
      selectedContact.value = contact;
      emit('select-contact', { contactId, contact });
    };

    // Afficher le modal pour créer une nouvelle conversation
    const showNewMessageModal = () => {
      // Cette fonction sera implémentée plus tard
      console.log('Ouverture du modal de nouvelle conversation');
    };

    // Démarrer une conversation avec un utilisateur trouvé via la barre de recherche
    const startConversation = (user) => {
      if (!user || !user._id) {
        console.error('Utilisateur invalide');
        return;
      }
      
      console.log('Démarrage d\'une conversation avec:', user);
      
      // Vérifier si le contact existe déjà
      const existingContact = contacts.value.find(c => c._id === user._id);
      if (existingContact) {
        openConversation(existingContact._id, existingContact);
        return;
      }
      
      // Créer un nouveau contact à partir de l'utilisateur trouvé
      const newContact = {
        _id: user._id,
        username: user.username,
        prenom: user.firstName,
        nom: user.lastName,
        profilePicture: user.profilePicture,
        status: user.status || 'online'
      };
      
      // Ajouter l'utilisateur aux contacts et ouvrir la conversation
      contacts.value.push(newContact);
      openConversation(user._id, newContact);
    };

    // Charger les contacts au montage du composant
    onMounted(() => {
      loadContacts().then(() => {
        // Sélectionner automatiquement le premier contact si disponible
        if (contacts.value.length > 0) {
          const firstContact = contacts.value[0];
          openConversation(firstContact._id, firstContact);
        }
      });
    });

    // Fonction pour rafraîchir manuellement la liste des contacts
    const refreshContacts = () => {
      return loadContacts();
    };

    return {
      contacts,
      loading,
      error,
      selectedContactId,
      selectedContact,
      defaultProfileImg,
      getContactName,
      openConversation,
      showNewMessageModal,
      startConversation,
      refreshContacts
    };
  }
}
</script>

<style scoped>
.friends-container {
  display: flex;
  width: 100%;
  height: 100vh;
}

.friends-sidebar {
  position: fixed;
  left: var(--whidth-header);
  top: 0;
  height: 100vh;
  width: var(--whidth-friendsList);
  background-color: #2B3132;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-left: 1px solid var(--border-color);
  z-index: 10;
}

.friends-header {
  padding: 15px;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 10px;
}

.friends-header h2 {
  font-size: 16px;
  margin-bottom: 10px;
  color: var(--text-color);
}

.private-messages-view {
  position: fixed;
  left: calc(var(--whidth-header) + var(--whidth-friendsList));
  top: 0;
  height: 100vh;
  width: calc(100% - var(--whidth-header) - var(--whidth-friendsList));
  background-color: var(--color-background);
  overflow-y: auto;
}

.friends-list {
  height: calc(100% - 60px);
  overflow-y: auto;
  scrollbar-width: none;
  padding: 20px 10px;
}

.friends-list::-webkit-scrollbar {
  display: none;
}

.friend-item {
  display: flex;
  align-items: center;
  padding: 10px;
  margin-bottom: 8px;
  border-radius: 8px;
  cursor: pointer;
  background-color:var(--secondary-color);
  transition: background-color 0.2s ease;
}

.friend-item:hover {
  background-color: var(--secondary-color-transition);
}

.friend-item.active {
  background-color: var(--secondary-color-transition);
  border-left: 3px solid var(--primary-color);
}

.friend-avatar {
  position: relative;
  width: 32px;
  height: 32px;
  margin-right: 12px;
}

.friend-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.status-indicator {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid var(--secondary-color);
}

.status-indicator.online {
  background-color: #43b581;
}

.status-indicator.offline {
  background-color: #747f8d;
}

.status-indicator.idle {
  background-color: #faa61a;
}

.status-indicator.dnd {
  background-color: #f04747;
}

.friend-name {
  color: var(--text-color);
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
}

.loading-message, .error-message, .empty-message {
  color: var(--text-secondary);
  text-align: center;
  padding: 20px 10px;
  font-size: 14px;
}

.error-message {
  color: #f04747;
}

.add-friend {
  padding: 10px;
  display: flex;
  justify-content: left;
  border-top: 1px solid var(--border-color);
}

.add-friend-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.add-friend-button img {
  width: 100%;
  height: 100%;
}

.add-friend-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
</style>
