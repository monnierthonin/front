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
import { getCurrentUserIdAsync } from '../utils/userUtils'

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
      replyingToMessage: null,
      wsConnected: false,
      wsChannelUnsubscribe: null
    }
  },
  watch: {
    '$route.params.id': {
      immediate: true,
      handler(newId) {
        if (newId && newId !== this.workspaceId) {
          this.workspaceId = newId;
          this.chargerDonnees();
          this.canalActif = null;
          this.messages = [];
        }
      }
    }
  },
  
  async created() {
    this.workspaceId = this.$route.params.id

    try {
      this.userId = await getCurrentUserIdAsync();
    } catch (error) {
      console.error('Workspace.vue: Erreur lors de la récupération de l\'ID utilisateur:', error);
      this.userId = null;
    }

    if (this.workspaceId) {
      await this.chargerDonnees()
      this.initWebSocket()
    } else {
      this.error = 'ID de workspace non spécifié'

    }
  },
  beforeUnmount() {
    this.unsubscribeFromCurrentChannel();
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
        const workspaceData = await workspaceService.getWorkspaceById(this.workspaceId)
        this.workspace = workspaceData.workspace
        this.membres = this.workspace.membres || []
        const canauxData = await canalService.getWorkspaceCanaux(this.workspaceId)
        this.canaux = canauxData || []
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
      
      this.replyingToMessage = null;
      
      this.canalActif = canal

      await this.chargerMessages()
      
      if (this.wsConnected) {

        this.subscribeToChannel(canal)
      } else {

      }
    },
    
    /**
     * Charger les messages du canal actif
     */
    async chargerMessages() {
      if (!this.canalActif) {
        return
      }
      
      try {
        this.isLoadingMessages = true
        this.messages = []  
        const messages = await messageService.getCanalMessages(this.workspaceId, this.canalActif._id)
        
        this.messages = messages
      } catch (error) {
        console.error('Erreur lors du chargement des messages:', error)
        this.error = `Erreur lors du chargement des messages: ${error.message}`
      } finally {
        this.isLoadingMessages = false
      }
    },
    
    /**
     * Initialiser la connexion WebSocket
     */
    async initWebSocket() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          return;
        }
        
        await websocketService.connect(token);
        this.wsConnected = true;
        
        if (this.canalActif) {
          this.subscribeToChannel(this.canalActif);
        }
      } catch (error) {
        this.error = `Erreur de connexion WebSocket: ${error.message}`;
      }
    },
    
    /**
     * S'abonner aux messages d'un canal
     * @param {Object} canal - Le canal auquel s'abonner
     */
    subscribeToChannel(canal) {
      this.unsubscribeFromCurrentChannel();
      
      if (!this.wsConnected || !canal) return;
      
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
        this.wsChannelUnsubscribe();
        this.wsChannelUnsubscribe = null;
      }
    },
    
    /**
     * Gérer la demande de réponse à un message
     * @param {Object} message - Le message auquel répondre
     */
    handleReplyToMessage(message) {
      let messageId = null;
      
      if (typeof message === 'object') {
        if (message._id) {
          messageId = message._id;
        } else if (message.id) {
          messageId = message.id;
        } else if (message.messageId) {
          messageId = message.messageId;
        }
      } else if (typeof message === 'string') {
        messageId = message;
      }
      
      if (!messageId) {
        console.error('Impossible de répondre : ID du message parent invalide ou manquant', message);
        return;
      }
      
      this.replyingToMessage = messageId;
      
    },
    
    /**
     * Annuler la réponse en cours
     */
    cancelReply() {
      this.replyingToMessage = null;
    },
    
    /**
     * Gérer un nouveau message reçu en temps réel
     * @param {Object} message - Le nouveau message reçu
     */
    handleRealtimeMessage(message) {
      
      if (!this.canalActif || message.canalId !== this.canalActif._id) {
        return;
      }
      
      const messageExists = this.messages.some(msg => msg._id === message._id);
      
      if (!messageExists) {
        this.messages.push(message);
      }
    },
    
    /**
     * Envoyer un message au canal actif
     * @param {Object} messageData - Données du message à envoyer
     */
    async envoyerMessage(messageData) {
      
      if (!this.canalActif) {
        return
      }
      
      if (!this.workspaceId) {
        return
      }
      
      try {
        const { contenu } = messageData
        
        const nouveauMessage = await messageService.sendMessage(this.workspaceId, this.canalActif._id, contenu)
        
        if (!nouveauMessage) {
          return
        }
        
        const messageExists = this.messages.some(msg => msg._id === nouveauMessage._id);
        if (!messageExists) {
          this.messages.push(nouveauMessage);
        }
        
      } catch (error) {
        this.error = `Erreur lors de l'envoi du message: ${error.message}`
      }
    },
    
    /**
     * Envoyer une réponse à un message
     * @param {Object} messageData - Données de la réponse
     */
    async envoyerReponse(messageData) {
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
        
        const nouvelleReponse = await messageService.sendReply(
          this.workspaceId,
          this.canalActif._id,
          parentMessageId,
          contenu
        )
        
        if (!nouvelleReponse) {
          console.error('Aucune réponse retournée par le service après envoi')
          return
        }
        
        const messageExists = this.messages.some(msg => msg._id === nouvelleReponse._id);
        if (!messageExists) {
          this.messages.push(nouvelleReponse);
        }
        
        this.replyingToMessage = null;
        
      } catch (error) {
        this.error = `Erreur lors de l'envoi de la réponse: ${error.message}`
      }
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
