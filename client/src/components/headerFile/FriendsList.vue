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
import messagePrivateService from '../../services/messagePrivateService';
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
        return payload.id; // Ou payload.userId selon la structure du token
      } catch (err) {
        console.error('Erreur lors du décodage du token:', err);
        return null;
      }
    };

    // Charger les conversations et extraire les contacts uniques
    const loadContacts = async () => {
      try {
        loading.value = true;
        error.value = null;
        contacts.value = [];
        
        // Récupérer l'ID de l'utilisateur actuel
        currentUserId.value = getCurrentUserId();
        if (!currentUserId.value) {
          throw new Error('Utilisateur non connecté');
        }
        
        console.log('ID utilisateur courant:', currentUserId.value);
        
        // Récupérer toutes les conversations privées
        const response = await messagePrivateService.getAllPrivateConversations();
        console.log('Réponse reçue dans le composant:', response);
        

        
        // Utiliser les données reçues de l'API si disponibles
        if (response && Array.isArray(response)) {
          // Traiter les conversations pour extraire les contacts uniques
          const contactsMap = new Map();
          
          // Si la réponse est un tableau d'objets conversations
          if (Array.isArray(response)) {
            response.forEach(conversation => {
              // IMPORTANT: On récupère l'ID de la conversation elle-même
              const conversationId = conversation._id || conversation.id;
              console.log('Conversation ID:', conversationId);
              
              // S'assurer que chaque conversation a un ID valide
              if (!conversationId) {
                console.warn('Conversation sans ID détectée', conversation);
                return; // Ignorer cette conversation
              }
              
              // Si l'objet a une propriété 'user', c'est probablement une structure de la forme {user: {...}, lastMessage: {...}}
              if (conversation.user && conversation.user._id && conversation.user._id.toString() !== currentUserId.value) {
                const userId = conversation.user._id.toString();
                
                // Stocker l'utilisateur avec son ID de conversation spécifique
                contactsMap.set(userId, {
                  ...conversation.user,
                  lastMessage: conversation.lastMessage,
                  conversationId: conversationId // Ajouter l'ID de la conversation spécifique à ce contact
                });
                
                console.log(`Contact ${userId} associé à la conversation ${conversationId}`);
              }
              // Si l'objet a une propriété 'participants', c'est probablement une conversation complète
              else if (conversation.participants && Array.isArray(conversation.participants)) {
                // Trouver l'autre participant (pas l'utilisateur courant)
                const otherParticipant = conversation.participants.find(p => {
                  const participantId = (p._id || p.id || (p.utilisateur && p.utilisateur._id));
                  return participantId && participantId.toString() !== currentUserId.value;
                });
                
                if (otherParticipant) {
                  // Déterminer l'ID du participant de manière fiable
                  const participantId = (
                    otherParticipant._id || 
                    otherParticipant.id || 
                    (otherParticipant.utilisateur && otherParticipant.utilisateur._id)
                  ).toString();
                  
                  // Récupérer les données du participant (soit directement, soit via la propriété utilisateur)
                  const participantData = otherParticipant.utilisateur || otherParticipant;
                  
                  // Ajouter à la map avec l'ID de conversation
                  contactsMap.set(participantId, {
                    _id: participantId,
                    username: participantData.username || 'Utilisateur',
                    prenom: participantData.prenom || participantData.firstName,
                    nom: participantData.nom || participantData.lastName,
                    profilePicture: participantData.profilePicture,
                    status: participantData.status || 'offline',
                    conversationId: conversationId // Stocker l'ID de la conversation spécifique à ce contact
                  });
                  
                  console.log(`Contact ${participantId} associé à la conversation ${conversationId}`);
                }
              }
              
              // Vérifier expéditeur/destinataire
              processMessageParticipants(conversation, contactsMap, currentUserId.value);
            });
          } 
          else if (typeof response === 'object') {
            // Si c'est un seul objet, on le traite comme un message
            processMessageParticipants(response, contactsMap, currentUserId.value);
          }
          
          // Convertir la Map en tableau
          contacts.value = Array.from(contactsMap.values());
          console.log('Contacts extraits:', contacts.value);
          
          // Ouvrir automatiquement la conversation avec le premier ami si des contacts existent
          if (contacts.value.length > 0) {
            // On utilise setTimeout pour s'assurer que ce code s'exécute une fois que Vue a fini de rendre la liste
            setTimeout(() => {
              openConversation(contacts.value[0]._id);
              console.log('Ouverture automatique de la conversation avec le premier contact:', contacts.value[0].username || contacts.value[0].prenom);
            }, 100);
          }
        }
        
      } catch (err) {
        console.error('Erreur lors du chargement des contacts:', err);
        error.value = err.message || 'Erreur lors du chargement des contacts';
        
        // Pour développement - données de test en cas d'erreur
        contacts.value = [
          { _id: '1', username: 'Alice', prenom: 'Alice', nom: 'Dupont', status: 'online' },
          { _id: '2', username: 'Bob', prenom: 'Bob', nom: 'Martin', status: 'offline' },
          { _id: '3', username: 'Charlie', prenom: 'Charles', nom: 'Garcia', status: 'idle' }
        ];
      } finally {
        loading.value = false;
      }
    };
    
    // Fonction utilitaire pour traiter les expéditeurs et destinataires des messages
    const processMessageParticipants = (message, contactsMap, currentUserId) => {
      // Récupérer l'ID de conversation si disponible
      // Le message peut venir d'une conversation directement
      const conversationId = message.conversation || message.conversationId || message._id;
      console.log('processMessageParticipants - conversationId:', conversationId);
      
      // Traiter l'expéditeur
      if (message.expediteur) {
        const expediteurId = typeof message.expediteur === 'object' ? 
          message.expediteur._id : message.expediteur;
        
        if (expediteurId && expediteurId.toString() !== currentUserId) {
          const expediteur = typeof message.expediteur === 'object' ? 
            message.expediteur : { _id: expediteurId };
          
          contactsMap.set(expediteurId.toString(), {
            _id: expediteurId,
            username: expediteur.username || 'Utilisateur',
            prenom: expediteur.prenom || expediteur.firstName,
            nom: expediteur.nom || expediteur.lastName,
            profilePicture: expediteur.profilePicture,
            status: expediteur.status || 'offline',
            conversationId: conversationId // Ajout de l'ID de conversation
          });
        }
      }
      
      // Traiter le destinataire
      if (message.destinataire) {
        const destinataireId = typeof message.destinataire === 'object' ? 
          message.destinataire._id : message.destinataire;
          
        if (destinataireId && destinataireId.toString() !== currentUserId) {
          const destinataire = typeof message.destinataire === 'object' ? 
            message.destinataire : { _id: destinataireId };
          
          contactsMap.set(destinataireId.toString(), {
            _id: destinataireId,
            username: destinataire.username || 'Utilisateur',
            prenom: destinataire.prenom || destinataire.firstName,
            nom: destinataire.nom || destinataire.lastName,
            profilePicture: destinataire.profilePicture,
            status: destinataire.status || 'offline',
            conversationId: conversationId // Ajout de l'ID de conversation
          });
        }
      }
    };

    // Obtenir le nom d'affichage du contact (prénom + nom ou username)
    const getContactName = (contact) => {
      if (contact.firstName && contact.lastName) {
        return `${contact.firstName} ${contact.lastName}`;
      } else if (contact.username) {
        return contact.username;
      }
      return 'Utilisateur inconnu';
    };

    // Ouvrir une conversation avec un contact
    const openConversation = (contactId) => {
      // Trouver le contact dans la liste
      const contact = contacts.value.find(c => c._id === contactId);
      if (!contact) {
        console.error('Contact non trouvé:', contactId);
        return;
      }
      
      // Vérifier si ce contact est une conversation déjà existante
      // Certains contacts dans la liste sont des conversations avec leur propre ID
      const conversationId = contact.conversationId || contact._id;
      
      console.log('Détails de la conversation sélectionnée:', {
        contactId: contactId,
        conversationId: conversationId,
        contactName: contact.username || contact.nom || 'Utilisateur',
        isConversation: !!contact.conversationId
      });
      
      // Émettre un événement personnalisé pour être capturé par le composant parent
      const event = new CustomEvent('open-private-conversation', {
        detail: {
          userId: contactId,          // ID de l'utilisateur/contact
          conversationId: conversationId, // ID de la conversation si disponible
          targetUser: contact
        },
        bubbles: true
      });
      document.dispatchEvent(event);
    };

    // Afficher le modal pour créer une nouvelle conversation
    const showNewMessageModal = () => {
      // Afficher un modal pour rechercher un utilisateur et démarrer une conversation
      console.log('Ouverture du modal pour une nouvelle conversation');
    };
    
    // Démarrer une conversation avec un utilisateur trouvé via la barre de recherche
    const startConversation = (user) => {
      console.log('Démarrage d\'une conversation avec l\'utilisateur:', user);
      // Si l'utilisateur existe déjà dans les contacts, ouvrir sa conversation
      const existingContact = contacts.value.find(contact => contact._id === user._id);
      
      if (existingContact) {
        openConversation(user._id);
      } else {
        // Ajouter temporairement l'utilisateur aux contacts et ouvrir la conversation
        contacts.value.push({
          _id: user._id,
          username: user.username,
          prenom: user.firstName,
          nom: user.lastName,
          profilePicture: user.profilePicture,
          status: user.status || 'online'
        });
        openConversation(user._id);
      }
    };

    // Charger les contacts au montage du composant
    onMounted(() => {
      loadContacts();
    });
    
    // Réexposer loadContacts pour pouvoir le rappeler si nécessaire depuis l'extérieur
    const refreshContacts = () => {
      loadContacts();
    };

    return {
      contacts,
      loading,
      error,
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
  overflow: hidden;
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
