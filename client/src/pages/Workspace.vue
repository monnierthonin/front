<template>
  <chanelWorkspace 
    :canaux="canaux" 
    :canalActifId="canalActif ? canalActif._id : ''" 
    :workspaceId="workspaceId"
    @canal-selectionne="changerCanalActif" 
  />
  <UserList :membres="membres" />
  <div class="workspace-content">
    <Message 
      :messages="messages" 
      :isLoading="isLoadingMessages" 
      :currentUserId="userId"
      @reply-to-message="handleReplyToMessage" 
    />
    <textBox 
      :workspaceId="workspaceId" 
      :canalActif="canalActif"
      :replyingToMessage="replyingToMessage"
      @envoyer-message="envoyerMessage"
      @reply-to-message="envoyerReponse"
      @cancel-reply="cancelReply"
      @refresh-messages="chargerMessages"
    />
  </div>
</template>

<script>
import Message from '../components/messageComponentFile/Message.vue'
import textBox from '../components/messageComponentFile/textBox.vue'
import UserList from '../components/headerFile/UserChanelList.vue'
import chanelWorkspace from '../components/headerFile/chanelWorkspace.vue'
import workspaceService from '../services/workspaceService'
import canalService from '../services/canalService'
import messageService from '../services/messageService'
import websocketService from '../services/websocketService'

export default {
  name: 'Workspace',
  components: {
    Message,
    textBox,
    UserList,
    chanelWorkspace
  },
  data() {
    return {
      workspaceId: '',
      workspace: null,
      canaux: [],
      membres: [],
      canalActif: null,
      messages: [],
      userId: null,
      isLoading: true,
      isLoadingMessages: false,
      error: null,
      // Message en cours de réponse
      replyingToMessage: null,
      // Abonnement WebSocket
      wsConnected: false,
      wsChannelUnsubscribe: null // Fonction pour se désabonner du canal courant
    }
  },
  watch: {
    // Surveiller les changements d'ID de workspace dans l'URL
    '$route.params.id': {
      immediate: true,
      handler(newId) {
        if (newId && newId !== this.workspaceId) {
          this.workspaceId = newId;
          // Recharger les données du workspace
          this.chargerDonnees();
          
          // Réinitialiser l'état
          this.canalActif = null;
          this.messages = [];
        }
      }
    }
  },
  
  created() {
    // Récupérer l'ID du workspace depuis l'URL
    this.workspaceId = this.$route.params.id

    
    // Récupérer l'ID de l'utilisateur connecté
    this.userId = messageService.getUserIdFromToken()

    
    if (this.workspaceId) {

      this.chargerDonnees()
      
      // Initialiser la connexion WebSocket
      this.initWebSocket()
    } else {
      this.error = 'ID de workspace non spécifié'

    }
  },
  beforeUnmount() {
    // Se désabonner du canal actuel si nécessaire
    this.unsubscribeFromCurrentChannel();
    
    // Fermer la connexion WebSocket
    if (this.wsConnected) {
      websocketService.disconnect();
      this.wsConnected = false;
    }
  },
  
  methods: {
    /**
     * Charger les données initiales du workspace (membres et canaux)
     */
    async chargerDonnees() {
      try {
        this.isLoading = true
        this.error = null
        
        // Chargement du workspace (qui contient les membres)
        const workspaceData = await workspaceService.getWorkspaceById(this.workspaceId)
        this.workspace = workspaceData.workspace
        this.membres = this.workspace.membres || []

        
        // Chargement des canaux du workspace
        const canauxData = await canalService.getWorkspaceCanaux(this.workspaceId)
        this.canaux = canauxData || []

        
        // Sélectionner le premier canal par défaut si des canaux existent
        if (this.canaux.length > 0) {
          await this.changerCanalActif(this.canaux[0])
        }
      } catch (error) {
        this.error = `Erreur lors du chargement des données: ${error.message}`

      } finally {
        this.isLoading = false
      }
    },
    
    /**
     * Changer le canal actif et charger ses messages
     * @param {Object} canal - Le canal à activer
     */
    async changerCanalActif(canal) {
      if (!canal) {
        return
      }
      
      if (this.canalActif && canal._id === this.canalActif._id) {
        return
      }
      
      // Réinitialiser le message en cours de réponse lors du changement de canal
      this.replyingToMessage = null;
      
      this.canalActif = canal

      
      // Charger les messages du canal sélectionné

      await this.chargerMessages()
      
      // S'abonner au canal via WebSocket pour recevoir les messages en temps réel
      if (this.wsConnected) {

        this.subscribeToChannel(canal)
      } else {

      }
    },
    
    /**
     * Charger les messages du canal actif
     */
    async chargerMessages() {
      console.log('Début de la méthode chargerMessages()...')
      
      if (!this.canalActif) {
        console.error('Aucun canal actif, impossible de charger les messages')
        return
      }
      
      try {
        console.log(`Tentative de chargement des messages pour le canal ${this.canalActif.nom} (ID: ${this.canalActif._id}) dans le workspace ${this.workspaceId}`)
        this.isLoadingMessages = true
        this.messages = []  // Réinitialiser les messages précédents
        
        const messages = await messageService.getCanalMessages(this.workspaceId, this.canalActif._id)
        console.log('Réponse du service messageService.getCanalMessages:', messages)
        
        this.messages = messages
        console.log(`${messages ? messages.length : 0} messages chargés pour le canal ${this.canalActif.nom}`)
        
        // Afficher quelques détails sur les messages (pour debug)
        if (messages && messages.length > 0) {
          console.log('Premier message:', messages[0])
        }
      } catch (error) {
        console.error('Erreur lors du chargement des messages:', error)
        this.error = `Erreur lors du chargement des messages: ${error.message}`
      } finally {
        this.isLoadingMessages = false
        console.log('Fin de la méthode chargerMessages(), isLoadingMessages =', this.isLoadingMessages)
      }
    },
    
    /**
     * Initialiser la connexion WebSocket
     */
    async initWebSocket() {
      try {
        // Récupérer le token JWT pour l'authentification
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('Impossible d\'initialiser WebSocket: aucun token disponible');
          return;
        }
        
        console.log('Initialisation de la connexion WebSocket...');
        
        // Établir la connexion WebSocket
        await websocketService.connect(token);
        this.wsConnected = true;
        console.log('Connexion WebSocket établie');
        
        // Si un canal est déjà actif, s'y abonner
        if (this.canalActif) {
          this.subscribeToChannel(this.canalActif);
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation WebSocket:', error);
        this.error = `Erreur de connexion WebSocket: ${error.message}`;
      }
    },
    
    /**
     * S'abonner aux messages d'un canal
     * @param {Object} canal - Le canal auquel s'abonner
     */
    subscribeToChannel(canal) {
      // D'abord se désabonner du canal actuel si nécessaire
      this.unsubscribeFromCurrentChannel();
      
      if (!this.wsConnected || !canal) return;
      
      console.log(`Abonnement aux messages du canal ${canal.nom} (ID: ${canal._id})`);
      
      // S'abonner aux messages du nouveau canal
      this.wsChannelUnsubscribe = websocketService.subscribeToChannelMessages(
        this.workspaceId,
        canal._id,
        this.handleRealtimeMessage
      );
    },
    
    /**
     * Se désabonner du canal actuel
     */
    unsubscribeFromCurrentChannel() {
      if (this.wsChannelUnsubscribe) {
        console.log('Désabonnement du canal précédent');
        this.wsChannelUnsubscribe();
        this.wsChannelUnsubscribe = null;
      }
    },
    
    /**
     * Gérer la demande de réponse à un message
     * @param {Object} message - Le message auquel répondre
     */
    handleReplyToMessage(message) {
      console.log('Workspace.vue a reçu une demande de réponse au message:', message);
      
      // Récupérer l'ID du message auquel répondre
      let messageId = null;
      
      // Traiter différentes structures de message possibles
      if (typeof message === 'object') {
        if (message._id) {
          messageId = message._id;
        } else if (message.id) {
          messageId = message.id;
        } else if (message.messageId) {
          // Dans certains cas, l'ID peut être dans une propriété messageId
          messageId = message.messageId;
        }
      } else if (typeof message === 'string') {
        // Si on reçoit directement un ID de message
        messageId = message;
      }
      
      if (!messageId) {
        console.error('Impossible de répondre : ID du message parent invalide ou manquant', message);
        return;
      }
      
      // Pour une compatibilité maximale, stocker juste l'ID du message
      // Cette approche est plus simple et fonctionne avec tous les composants
      this.replyingToMessage = messageId;
      
      console.log('Préparation de la réponse au message:', {
        messageId: messageId,
        channelId: this.canalActif ? this.canalActif._id : '',
        content: ''
      });
    },
    
    /**
     * Annuler la réponse en cours
     */
    cancelReply() {
      console.log('Annulation de la réponse en cours');
      this.replyingToMessage = null;
    },
    
    /**
     * Gérer un nouveau message reçu en temps réel
     * @param {Object} message - Le nouveau message reçu
     */
    handleRealtimeMessage(message) {
      console.log('Message en temps réel reçu:', message);
      
      // Vérifier que le message appartient bien au canal actif
      if (!this.canalActif || message.canalId !== this.canalActif._id) {
        console.log('Message ignoré car il n\'appartient pas au canal actif');
        return;
      }
      
      // Vérifier si le message existe déjà dans la liste
      const messageExists = this.messages.some(msg => msg._id === message._id);
      
      if (!messageExists) {
        // Ajouter le nouveau message à la liste
        this.messages.push(message);
        console.log('Nouveau message ajouté à la liste');
      }
    },
    
    /**
     * Envoyer un message au canal actif
     * @param {Object} messageData - Données du message à envoyer
     */
    async envoyerMessage(messageData) {
      console.log('Début de la méthode envoyerMessage() avec les données:', messageData)
      
      if (!this.canalActif) {
        console.error('Aucun canal actif sélectionné, impossible d\'envoyer le message')
        return
      }
      
      if (!this.workspaceId) {
        console.error('ID du workspace manquant, impossible d\'envoyer le message')
        return
      }
      
      try {
        const { contenu } = messageData
        console.log(`Tentative d'envoi du message au canal ${this.canalActif.nom} (ID: ${this.canalActif._id}):`)
        console.log('- Contenu:', contenu)
        console.log('- Workspace ID:', this.workspaceId)
        
        // Appeler le service pour envoyer le message
        const nouveauMessage = await messageService.sendMessage(this.workspaceId, this.canalActif._id, contenu)
        console.log('Réponse du service messageService.sendMessage:', nouveauMessage)
        
        if (!nouveauMessage) {
          console.error('Aucun message retourné par le service après envoi')
          return
        }
        
        // Le message sera ajouté automatiquement via WebSocket
        // Mais par sécurité, on l'ajoute manuellement si c'est notre propre message
        // pour garantir une expérience fluide même en cas de problème WebSocket
        const messageExists = this.messages.some(msg => msg._id === nouveauMessage._id);
        if (!messageExists) {
          this.messages.push(nouveauMessage);
          console.log('Message ajouté localement en attendant la confirmation WebSocket');
        }
        
        console.log('Message envoyé avec succès:', nouveauMessage);
      } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error)
        console.error('Détails de l\'erreur:', error.message, error.stack)
        this.error = `Erreur lors de l'envoi du message: ${error.message}`
      }
      
      console.log('Fin de la méthode envoyerMessage()')
    },
    
    /**
     * Envoyer une réponse à un message
     * @param {Object} messageData - Données de la réponse
     */
    async envoyerReponse(messageData) {
      console.log('Début de la méthode envoyerReponse() avec les données:', messageData)
      
      if (!this.canalActif) {
        console.error('Aucun canal actif sélectionné, impossible d\'envoyer la réponse')
        return
      }
      
      if (!this.workspaceId) {
        console.error('ID du workspace manquant, impossible d\'envoyer la réponse')
        return
      }
      
      if (!messageData.parentMessageId) {
        console.error('ID du message parent manquant, impossible d\'envoyer la réponse')
        return
      }
      
      try {
        const { contenu, parentMessageId } = messageData
        console.log(`Tentative d'envoi d'une réponse au message ${parentMessageId}:`);
        console.log('- Contenu:', contenu)
        console.log('- Workspace ID:', this.workspaceId)
        console.log('- Canal ID:', this.canalActif._id)
        
        // Appeler le service pour envoyer la réponse au message
        const nouvelleReponse = await messageService.sendReply(
          this.workspaceId,
          this.canalActif._id,
          parentMessageId,
          contenu
        )
        
        console.log('Réponse du service messageService.sendReply:', nouvelleReponse)
        
        if (!nouvelleReponse) {
          console.error('Aucune réponse retournée par le service après envoi')
          return
        }
        
        // Ajouter la réponse localement pour une expérience fluide
        const messageExists = this.messages.some(msg => msg._id === nouvelleReponse._id);
        if (!messageExists) {
          this.messages.push(nouvelleReponse);
          console.log('Réponse ajoutée localement en attendant la confirmation WebSocket');
        }
        
        // Réinitialiser l'état de réponse
        this.replyingToMessage = null;
        
        console.log('Réponse envoyée avec succès:', nouvelleReponse);
      } catch (error) {
        console.error('Erreur lors de l\'envoi de la réponse:', error)
        console.error('Détails de l\'erreur:', error.message, error.stack)
        this.error = `Erreur lors de l'envoi de la réponse: ${error.message}`
      }
      
      console.log('Fin de la méthode envoyerReponse()')
    }
  }
}
</script>

<style scoped>
.workspace-content {
  margin-left: calc(var(--whidth-header) + var(--whidth-chanelWorkspace));
  margin-right: var(--whidth-userChanel);
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
}
</style>
