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
        
        // Initialisation du tableau pour stocker les contacts uniques
        const uniqueContacts = [];
        
        // Traiter les données reçues de l'API
        if (!response || !Array.isArray(response)) {
          console.warn('Format de réponse invalide:', response);
          error.value = 'Format de réponse invalide';
          loading.value = false;
          return;
        }
        
        console.log(`Traitement de ${response.length} conversations`);
        
        // Parcourir chaque conversation
        response.forEach(conversation => {
          // Vérifier que nous avons un ID de conversation valide
          const conversationId = conversation._id || conversation.id;
          if (!conversationId) {
            console.warn('Conversation sans ID détectée', conversation);
            return; // Ignorer cette conversation
          }
          
          // Initialiser les utilisateurs de la conversation
          let users = [];
          
          // Extraire les utilisateurs selon la structure de la conversation
          if (conversation.participants && Array.isArray(conversation.participants)) {
            // Structure avec participants
            users = conversation.participants.map(p => {
              // Normaliser la structure de l'utilisateur
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
            // Structure alternative: vérifier la présence d'utilisateurs directs
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
          
          console.log(`Conversation ${conversationId} contient ${users.length} utilisateurs:`, users);
          
          // Filtrer pour trouver l'interlocuteur (l'autre utilisateur)
          const otherUsers = users.filter(user => user.id !== currentUserId.value);
          
          // Si on a trouvé un interlocuteur, l'ajouter à notre liste de contacts
          if (otherUsers.length > 0) {
            const otherUser = otherUsers[0]; // Prendre le premier interlocuteur trouvé
            
            console.log(`Interlocuteur trouvé: ${otherUser.username} (${otherUser.id})`);
            
            // Créer l'objet contact à ajouter à la liste
            const contact = {
              _id: otherUser.id,
              username: otherUser.username,
              prenom: otherUser.firstName,
              nom: otherUser.lastName,
              profilePicture: otherUser.profilePicture,
              status: otherUser.status,
              conversationId: conversationId
            };
            
            // Ajouter des infos supplémentaires si disponibles
            if (conversation.lastMessage) {
              contact.lastMessage = conversation.lastMessage;
            }
            
            // Vérifier que ce contact n'existe pas déjà
            const exists = uniqueContacts.some(c => c._id === contact._id);
            if (!exists) {
              uniqueContacts.push(contact);
              console.log(`Contact ajouté: ${contact.username || contact._id}`);
            }
          } else {
            console.warn('Aucun interlocuteur trouvé dans la conversation', conversation);
          }
        });
        
        // Mettre à jour la liste des contacts
        contacts.value = uniqueContacts;
        console.log('Liste finale des contacts:', contacts.value);
        console.log('Contacts extraits:', contacts.value);
        
        // Ouvrir automatiquement la conversation avec le premier ami si des contacts existent
        if (contacts.value.length > 0) {
          // On utilise setTimeout pour s'assurer que ce code s'exécute une fois que Vue a fini de rendre la liste
          setTimeout(() => {
            openConversation(contacts.value[0]._id);
            console.log('Ouverture automatique de la conversation avec le premier contact:', contacts.value[0].username || contacts.value[0].prenom);
          }, 100);   
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
      
      // Pour stocker temporairement les informations sur l'utilisateur courant (pour les cas où nous avons besoin de ses données)
      let currentUserInfo = null;
      
      // Traiter l'expéditeur
      if (message.expediteur) {
        const expediteurId = typeof message.expediteur === 'object' ? 
          message.expediteur._id : message.expediteur;
        
        const expediteur = typeof message.expediteur === 'object' ? 
          message.expediteur : { _id: expediteurId };
        
        // Si c'est l'utilisateur actuel, stocker ses informations mais ne pas l'ajouter à la liste des contacts
        if (expediteurId && expediteurId.toString() === currentUserId) {
          currentUserInfo = {
            _id: expediteurId,
            username: expediteur.username || 'Moi',
            prenom: expediteur.prenom || expediteur.firstName,
            nom: expediteur.nom || expediteur.lastName
          };
        }
        // Si c'est un autre utilisateur, l'ajouter normalement
        else if (expediteurId) {
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
          
        const destinataire = typeof message.destinataire === 'object' ? 
          message.destinataire : { _id: destinataireId };
        
        // Si c'est l'utilisateur actuel, stocker ses informations mais ne pas l'ajouter à la liste des contacts
        if (destinataireId && destinataireId.toString() === currentUserId) {
          currentUserInfo = {
            _id: destinataireId,
            username: destinataire.username || 'Moi',
            prenom: destinataire.prenom || destinataire.firstName,
            nom: destinataire.nom || destinataire.lastName
          };
        }
        // Si c'est un autre utilisateur, l'ajouter normalement
        else if (destinataireId) {
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
      
      // Lorsque nous avons à la fois l'utilisateur courant et une conversation, nous devons créer une entrée spéciale
      // qui représente la conversation elle-même plutôt que l'utilisateur
      if (message.conversation && (message.expediteur || message.destinataire)) {
        // Vérifier si nous avons un expéditeur ou un destinataire qui n'est pas l'utilisateur courant
        const otherUser = contactsMap.get(
          message.expediteur && message.expediteur._id && message.expediteur._id.toString() !== currentUserId ? 
            message.expediteur._id.toString() : 
            (message.destinataire && message.destinataire._id ? message.destinataire._id.toString() : null)
        );
        
        if (otherUser) {
          // Nous pouvons enrichir cette entrée avec des informations supplémentaires
          otherUser.conversationId = message.conversation;
        }
      }
    };

    // Obtenir le nom d'affichage du contact (prénom + nom ou username)
    const getContactName = (contact) => {
      // Vérification de sécurité: si le contact est l'utilisateur actuel (ne devrait jamais arriver)
      if (contact._id === currentUserId.value) {
        console.warn('Tentative d\'affichage de l\'utilisateur actuel comme contact', contact);
        return 'Moi';
      }
      
      // Préférence pour prénom + nom si disponibles
      if (contact.prenom && contact.nom) {
        return `${contact.prenom} ${contact.nom}`;
      } else if (contact.firstName && contact.lastName) {
        return `${contact.firstName} ${contact.lastName}`;
      } else if (contact.username) {
        return contact.username;
      } else if (contact.otherUserName) {
        return contact.otherUserName;
      }
      
      // Dernier recours: utiliser l'ID de l'utilisateur
      return `User-${contact._id.substring(0, 6)}`;
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
    const startConversation = async (user) => { // Rendre la méthode asynchrone
      console.log('Démarrage d\'une conversation avec l\'utilisateur (depuis SearchBar):', user);
      try {
        // Appeler le service pour créer ou récupérer la conversation
        // user._id est l'ID de l'utilisateur sélectionné dans la barre de recherche
        const conversation = await messagePrivateService.createOrGetConversation(user._id);
        console.log('Conversation créée ou récupérée par le service:', conversation);

        if (conversation && conversation._id && conversation.participants) {
          // Trouver l'autre participant dans la conversation retournée par le backend
          // currentUserId.value est l'ID de l'utilisateur actuellement connecté
          const otherParticipantEntry = conversation.participants.find(
            p => p.utilisateur && p.utilisateur._id && p.utilisateur._id.toString() !== currentUserId.value
          );

          if (!otherParticipantEntry || !otherParticipantEntry.utilisateur) {
            console.error("Impossible de trouver l'autre participant dans les données de la conversation:", conversation);
            error.value = "Erreur lors de l'initialisation de la conversation.";
            return;
          }
          
          const otherUserDetails = otherParticipantEntry.utilisateur; // Contient _id, username, firstName, lastName, profilePicture

          // Vérifier si ce contact (l'autre utilisateur) est déjà dans notre liste `contacts.value`
          let contactInList = contacts.value.find(c => c._id === otherUserDetails._id);

          if (contactInList) {
            // Le contact existe, s'assurer que son conversationId est à jour
            console.log('Contact existant trouvé:', contactInList.username, 'Mise à jour de conversationId.');
            contactInList.conversationId = conversation._id;
          } else {
            // Le contact n'est pas dans la liste, l'ajouter
            console.log('Nouveau contact à ajouter à la liste:', otherUserDetails.username);
            contactInList = {
              _id: otherUserDetails._id,
              username: otherUserDetails.username,
              prenom: otherUserDetails.firstName, // S'aligner sur la population du backend (firstName)
              nom: otherUserDetails.lastName,   // S'aligner sur la population du backend (lastName)
              profilePicture: otherUserDetails.profilePicture,
              status: otherUserDetails.status || 'online', // 'status' pourrait ne pas être dans la population standard
              conversationId: conversation._id
            };
            contacts.value.unshift(contactInList); // Ajouter au début pour une meilleure visibilité
          }
          
          // Appeler openConversation avec l'ID de l'autre utilisateur
          // openConversation s'attend à l'ID de l'utilisateur contact, pas l'ID de la conversation
          openConversation(otherUserDetails._id);

        } else {
          console.error('Réponse invalide du service createOrGetConversation:', conversation);
          error.value = "Impossible de démarrer la conversation: réponse invalide du serveur.";
        }
      } catch (err) {
        console.error('Erreur détaillée lors du démarrage de la conversation:', err);
        error.value = err.message || 'Une erreur est survenue lors du démarrage de la conversation.';
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
