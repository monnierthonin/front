<template>
  <FriendsList @select-contact="handleContactSelect" />
  <div class="home">
    <!-- En-tête affichant le nom du contact -->
    <div v-if="selectedContact" class="private-header">
      <div class="contact-info">
        <div class="contact-avatar">
          <img 
            :src="selectedContact.profilePicture ? `http://localhost:3000/uploads/profiles/${selectedContact.profilePicture}` : defaultProfileImage" 
            :alt="getContactName(selectedContact)"
          >
          <div class="status-indicator" :class="selectedContact.status || 'offline'"></div>
        </div>
        <div class="contact-name">{{ getContactName(selectedContact) }}</div>
      </div>
    </div>
    
    <!-- Zone d'affichage des messages -->
    <div class="messages-container">
      <div v-if="selectedContactId" class="messages-list">
        <MessagesPrives 
          :user-id="selectedContactId"
          :recipient-name="getContactName(selectedContact)"
        />
      </div>
      <div v-else class="welcome-message">
        <img src="../assets/styles/image/logoSupchat.png" alt="Logo" class="welcome-logo">
        <h2>Bienvenue sur SupChat</h2>
        <p>Sélectionnez un contact pour commencer à discuter</p>
      </div>
    </div>
  </div>
</template>

<script>
import FriendsList from '../components/headerFile/FriendsList.vue'
import MessagesPrives from '../components/messageComponentFile/MessagesPrives.vue'
import defaultProfileImg from '../assets/styles/image/profilDelault.png'

export default {
  name: 'Home',
  components: {
    FriendsList,
    MessagesPrives
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
      selectedContactId: null,
      selectedContact: null,
      defaultProfileImage: defaultProfileImg,
      conversationId: localStorage.getItem('lastConversationId') || null,
      currentUser: this.getCurrentUser()
    }
  },
  created() {
    console.log('Component created');
  },
  methods: {
    // Gérer la sélection d'un contact dans la liste d'amis
    handleContactSelect(data) {
      console.log('Contact sélectionné:', data);
      
      // Mettre à jour les informations du contact
      this.selectedContactId = data.contactId;
      this.selectedContact = data.contact;
      
      // Stocker l'ID de conversation si disponible
      if (data.conversationId) {
        this.conversationId = data.conversationId;
        localStorage.setItem('lastConversationId', data.conversationId);
      }
      
      // Note: La logique de chargement des messages sera implémentée plus tard
    },
    
    // Obtenir le nom d'affichage d'un contact
    getContactName(contact) {
      if (!contact) return '';
      
      // Priorité: nom d'affichage > prénom + nom > nom d'utilisateur > email
      if (contact.displayName) return contact.displayName;
      if (contact.firstName && contact.lastName) return `${contact.firstName} ${contact.lastName}`;
      if (contact.username) return contact.username;
      if (contact.email) return contact.email;
      
      return 'Utilisateur inconnu';
    },
    
    // Récupérer les informations de l'utilisateur connecté depuis le token JWT
    getCurrentUser() {
      try {
        const token = localStorage.getItem('token');
        if (!token) return { _id: null };
        
        // Décoder le token JWT
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        return JSON.parse(jsonPayload);
      } catch (err) {
        console.error('Erreur lors du décodage du token:', err);
        return { _id: null };
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
  flex-direction: column;
  position: relative;
}

/* Styles pour l'en-tête de contact privé */
.private-header {
  background-color: var(--secondary-color);
  padding: 10px 20px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: fixed;
  top: 0;
  right: 0;
  left: calc(var(--whidth-header) + var(--whidth-friendsList));
  z-index: 10;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  margin-top: 60px; /* Pour laisser de l'espace pour l'en-tête */
  height: calc(100vh - 60px);
  position: relative;
}

.messages-list {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.welcome-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: var(--text-color);
}

.welcome-logo {
  width: 150px;
  margin-bottom: 20px;
}

.contact-info {
  display: flex;
  align-items: center;
}

.contact-avatar {
  position: relative;
  width: 40px;
  height: 40px;
  margin-right: 15px;
}

.contact-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.status-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
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

.contact-name {
  font-weight: bold;
  font-size: 16px;
  color: var(--text-color);
}
</style>
