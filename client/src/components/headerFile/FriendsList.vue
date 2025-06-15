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
        @click="openConversation(contact._id)"
      >
        <div class="friend-avatar">
          <ProfilePicture 
            :userId="contact._id" 
            :profilePicture="contact.profilePicture" 
            :altText="getContactName(contact)"
            imageClass="profile-image"
          />
          <!-- Indicateur de statut déplacé hors du conteneur ProfilePicture mais avec position absolue -->
        </div>
        <div class="status-indicator" :class="getUserStatusClass(contact)"></div>
        <div class="friend-name">{{ getContactName(contact) }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import messagePrivateService from '../../services/messagePrivateService';
import authService from '../../services/authService';
import { ref, onMounted } from 'vue';
import defaultProfileImg from '../../assets/styles/image/profilDelault.png';
import SearchBar from '../common/SearchBar.vue';
import ProfilePicture from '../common/ProfilePicture.vue';

export default {
  name: 'FriendsList',
  components: {
    SearchBar,
    ProfilePicture
  },
  setup() {
    const contacts = ref([]);
    const loading = ref(true);
    const error = ref(null);
    const currentUserId = ref(null);
    const userProfiles = ref({});
    const fetchingProfiles = ref(false);

    const getCurrentUserId = async () => {
      try {
        const isLoggedIn = await authService.isAuthenticated();
        if (!isLoggedIn) {
          console.warn('Utilisateur non authentifié selon authService.isAuthenticated()');
          return null;
        }
        
        const userData = await authService.checkAuthStatus();
        
        if (userData && userData.data && userData.data.user) {
          const userId = userData.data.user.id || userData.data.user._id;
          localStorage.setItem('userId', userId);
          return userId;
        }
        
        return null;
      } catch (err) {
        console.error('Erreur lors de la récupération de l\'ID utilisateur:', err);
        return null;
      }
    };

    const loadContacts = async () => {
      try {
        loading.value = true;
        error.value = null;
        contacts.value = [];
        
        currentUserId.value = await getCurrentUserId();
        if (!currentUserId.value) {
          throw new Error('Utilisateur non connecté');
        }
        
        
        const response = await messagePrivateService.getAllPrivateConversations();
        
        const uniqueContacts = [];
        
        if (!response || !Array.isArray(response)) {
          console.warn('Format de réponse invalide:', response);
          error.value = 'Format de réponse invalide';
          loading.value = false;
          return;
        }
        
        response.forEach(conversation => {
          const conversationId = conversation._id || conversation.id;
          if (!conversationId) {
            console.warn('Conversation sans ID détectée', conversation);
            return;
          }
          
          let users = [];
          
          if (conversation.participants && Array.isArray(conversation.participants)) {
            users = conversation.participants.map(p => {
              const user = p.utilisateur || p;
              return {
                id: (user._id || user.id).toString(),
                username: user.username,
                firstName: user.prenom || user.firstName,
                lastName: user.nom || user.lastName,
                profilePicture: user.profilePicture,
                status: user.status || 'offline'
              };
            });
          } else {
            if (conversation.user) {
              users.push({
                id: (conversation.user._id || conversation.user.id).toString(),
                username: conversation.user.username,
                firstName: conversation.user.prenom || conversation.user.firstName,
                lastName: conversation.user.nom || conversation.user.lastName,
                profilePicture: conversation.user.profilePicture,
                status: conversation.user.status || 'offline'
              });
            }
            
            if (conversation.otherUser) {
              users.push({
                id: (conversation.otherUser._id || conversation.otherUser.id).toString(),
                username: conversation.otherUser.username,
                firstName: conversation.otherUser.prenom || conversation.otherUser.firstName,
                lastName: conversation.otherUser.nom || conversation.otherUser.lastName,
                profilePicture: conversation.otherUser.profilePicture,
                status: conversation.otherUser.status || 'offline'
              });
            }
          }
          
          const otherUsers = users.filter(user => user.id !== currentUserId.value);
          
          if (otherUsers.length > 0) {
            const otherUser = otherUsers[0];
            
            const contact = {
              _id: otherUser.id,
              username: otherUser.username,
              prenom: otherUser.firstName,
              nom: otherUser.lastName,
              profilePicture: otherUser.profilePicture,
              status: otherUser.status,
              conversationId: conversationId
            };
            
            if (conversation.lastMessage) {
              contact.lastMessage = conversation.lastMessage;
            }
            
            const exists = uniqueContacts.some(c => c._id === contact._id);
            if (!exists) {
              uniqueContacts.push(contact);
            }
          } else {
            console.warn('Aucun interlocuteur trouvé dans la conversation', conversation);
          }
        });
        
        contacts.value = uniqueContacts;
        
        if (contacts.value.length > 0) {
          setTimeout(() => {
            openConversation(contacts.value[0]._id);
          }, 100);   
        }
        
      } catch (err) {
        console.error('Erreur lors du chargement des contacts:', err);
        error.value = err.message || 'Erreur lors du chargement des contacts';
        
        contacts.value = [
          { _id: '1', username: 'Alice', prenom: 'Alice', nom: 'Dupont', status: 'online' },
          { _id: '2', username: 'Bob', prenom: 'Bob', nom: 'Martin', status: 'offline' },
          { _id: '3', username: 'Charlie', prenom: 'Charles', nom: 'Garcia', status: 'idle' }
        ];
      } finally {
        loading.value = false;
      }
    };
    
    const processMessageParticipants = (message, contactsMap, currentUserId) => {
      const conversationId = message.conversation || message.conversationId || message._id;
      
      let currentUserInfo = null;
      
      if (message.expediteur) {
        const expediteurId = typeof message.expediteur === 'object' ? 
          message.expediteur._id : message.expediteur;
        
        const expediteur = typeof message.expediteur === 'object' ? 
          message.expediteur : { _id: expediteurId };
        
        if (expediteurId && expediteurId.toString() === currentUserId) {
          currentUserInfo = {
            _id: expediteurId,
            username: expediteur.username || 'Moi',
            prenom: expediteur.prenom || expediteur.firstName,
            nom: expediteur.nom || expediteur.lastName
          };
        }
        else if (expediteurId) {
          contactsMap.set(expediteurId.toString(), {
            _id: expediteurId,
            username: expediteur.username || 'Utilisateur',
            prenom: expediteur.prenom || expediteur.firstName,
            nom: expediteur.nom || expediteur.lastName,
            profilePicture: expediteur.profilePicture,
            status: expediteur.status || 'offline',
            conversationId: conversationId
          });
        }
      }
      
      if (message.destinataire) {
        const destinataireId = typeof message.destinataire === 'object' ? 
          message.destinataire._id : message.destinataire;
          
        const destinataire = typeof message.destinataire === 'object' ? 
          message.destinataire : { _id: destinataireId };
        
        if (destinataireId && destinataireId.toString() === currentUserId) {
          currentUserInfo = {
            _id: destinataireId,
            username: destinataire.username || 'Moi',
            prenom: destinataire.prenom || destinataire.firstName,
            nom: destinataire.nom || destinataire.lastName
          }; 
        }
        else if (destinataireId) {
          contactsMap.set(destinataireId.toString(), {
            _id: destinataireId,
            username: destinataire.username || 'Utilisateur',
            prenom: destinataire.prenom || destinataire.firstName,
            nom: destinataire.nom || destinataire.lastName,
            profilePicture: destinataire.profilePicture,
            status: destinataire.status || 'offline',
            conversationId: conversationId
          });
        }
      }
      
      if (message.conversation && (message.expediteur || message.destinataire)) {
        const otherUser = contactsMap.get(
          message.expediteur && message.expediteur._id && message.expediteur._id.toString() !== currentUserId ? 
            message.expediteur._id.toString() : 
            (message.destinataire && message.destinataire._id ? message.destinataire._id.toString() : null)
        );
        
        if (otherUser) {
          otherUser.conversationId = message.conversation;
        }
      }
    };

    const getContactName = (contact) => {
      if (contact._id === currentUserId.value) {
        console.warn('Tentative d\'affichage de l\'utilisateur actuel comme contact', contact);
        return 'Moi';
      }
      
      if (contact.prenom && contact.nom) {
        return `${contact.prenom} ${contact.nom}`;
      } else if (contact.firstName && contact.lastName) {
        return `${contact.firstName} ${contact.lastName}`;
      } else if (contact.username) {
        return contact.username;
      } else if (contact.otherUserName) {
        return contact.otherUserName;
      }
      
      return `User-${contact._id.substring(0, 6)}`;
    };

    const openConversation = (contactId) => {
      const contact = contacts.value.find(c => c._id === contactId);
      if (!contact) {
        console.error('Contact non trouvé:', contactId);
        return;
      }
      
      const conversationId = contact.conversationId || contact._id;
      
      const event = new CustomEvent('open-private-conversation', {
        detail: {
          userId: contactId,
          conversationId: conversationId,
          targetUser: contact
        },
        bubbles: true
      });
      document.dispatchEvent(event);
    };

    const showNewMessageModal = () => {
      console.log('Ouverture du modal pour une nouvelle conversation');
    };
    
    const startConversation = async (user) => { 
      try {
        const conversation = await messagePrivateService.createOrGetConversation(user._id);

        if (conversation && conversation._id && conversation.participants) {
          const otherParticipantEntry = conversation.participants.find(
            p => p.utilisateur && p.utilisateur._id && p.utilisateur._id.toString() !== currentUserId.value
          );

          if (!otherParticipantEntry || !otherParticipantEntry.utilisateur) {
            console.error("Impossible de trouver l'autre participant dans les données de la conversation:", conversation);
            error.value = "Erreur lors de l'initialisation de la conversation.";
            return;
          }
          
          const otherUserDetails = otherParticipantEntry.utilisateur; // Contient _id, username, firstName, lastName, profilePicture

          let contactInList = contacts.value.find(c => c._id === otherUserDetails._id);

          if (contactInList) {
            contactInList.conversationId = conversation._id;
          } else {
            contactInList = {
              _id: otherUserDetails._id,
              username: otherUserDetails.username,
              prenom: otherUserDetails.firstName,
              nom: otherUserDetails.lastName,
              profilePicture: otherUserDetails.profilePicture,
              status: otherUserDetails.status || 'online',
              conversationId: conversation._id
            };
            contacts.value.unshift(contactInList);
          }
          
          openConversation(otherUserDetails._id);

        } else {
          error.value = "Impossible de démarrer la conversation: réponse invalide du serveur.";
        }
      } catch (err) {
        error.value = err.message || 'Une erreur est survenue lors du démarrage de la conversation.';
      }
    };

    onMounted(() => {
      loadContacts();
      const statusInterval = setInterval(() => {
        refreshUserProfiles();
      }, 60000);
      return () => clearInterval(statusInterval);
    });
    
    const refreshContacts = () => {
      loadContacts();
      refreshUserProfiles();
    };

    /**
     * Récupère les données de profil d'un utilisateur via l'API
     * @param {String} userId - L'identifiant de l'utilisateur
     * @returns {Promise} - Promesse résolue avec les données de profil
     */
    const fetchUserProfile = async (userId) => {
      try {
        const response = await fetch(`http://localhost:3000/api/v1/users/profile/${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération du profil utilisateur');
        }
        
        const data = await response.json();
        if (data.success && data.data && data.data.user) {
          userProfiles.value[userId] = data.data.user;
          return data.data.user;
        }
      } catch (error) {
        console.error('Erreur:', error);
        return null;
      }
    };
    
    /**
     * Récupère les profils de tous les contacts
     */
    const refreshUserProfiles = async () => {
      if (fetchingProfiles.value || contacts.value.length === 0) return;
      
      fetchingProfiles.value = true;
      
      try {
        for (const contact of contacts.value) {
          if (!contact || !contact._id) continue;
          
          const userId = contact._id;
          
          await fetchUserProfile(userId);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des profils:', error);
      } finally {
        fetchingProfiles.value = false;
      }
    };
    
    /**
     * Détermine la classe CSS appropriée pour l'indicateur de statut
     * @param {Object} contact - L'objet contact
     * @returns {String} - Classe CSS correspondant au statut
     */
    const getUserStatusClass = (contact) => {
      if (!contact || !contact._id) return 'offline';
      
      const userProfile = userProfiles.value[contact._id];
      if (!userProfile) return contact.status || 'offline';
      
      const estConnecte = userProfile.estConnecte === true;
      
      if (!estConnecte) return 'offline';
      
      const status = userProfile.status || '';
      
      switch (status) {
        case 'en ligne':
          return 'online';
        case 'absent':
          return 'idle';
        case 'ne pas déranger':
          return 'dnd';
        default:
          return 'online';
      }
    };
    
    return {
      contacts,
      loading,
      error,
      getContactName,
      openConversation,
      showNewMessageModal,
      startConversation,
      refreshContacts,
      getUserStatusClass
    };
  }
}
</script>

<style scoped>
.friends-sidebar {
  position: fixed;
  left: var(--whidth-header);
  top: 0;
  height: 100vh;
  width: var(--whidth-friendsList);
  background-color:var(--background-list-message);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-left: 1px solid var(--border-color);
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
  width: 100%;
  box-sizing: border-box;
}

.friend-item:hover {
  background-color: var(--secondary-color-transition);
}

.friend-avatar {
  position: relative;
  min-width: 40px;
  width: 40px;
  height: 40px;
  margin-right: 12px;
  border-radius: 50%;
  background-color: #2f3136;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.friend-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  object-position: center;
}

.friend-item {
  position: relative; /* Ajouté pour que le status-indicator puisse se positionner par rapport à cet élément */
}

.status-indicator {
  position: absolute;
  bottom: 8px; /* Ajusté pour le bon positionnement */
  left: 30px; /* Ajusté pour aligner avec le côté droit de l'avatar */
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid var(--secondary-color);
  z-index: 2; /* Assurer qu'il reste au-dessus des autres éléments */
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
  max-width: calc(100% - 8px);
  flex: 1;
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
