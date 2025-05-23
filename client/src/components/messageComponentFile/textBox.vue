<template>
  <!-- Utiliser InputBase comme composant central pour l'envoi de messages -->
  <InputBase
    :target="canalActif"
    :targetActive="!!canalActif"
    :messageType="canalActif && canalActif.type === 'private' ? 'private' : 'channel'"
    :workspaceId="workspaceId"
    :replyingToMessage="replyingToMessage"
    @send-channel-message="handleSendChannelMessage"
    @send-private-message="handleSendPrivateMessage"
    @reply-to-message="handleReplyToMessage"
    @cancel-reply="handleCancelReply"
    @refresh-messages="handleRefreshMessages"
  />
</template>

<script>
import InputBase from '../common/InputBase.vue';

export default {
  name: 'textBox',
  components: {
    InputBase
  },
  props: {
    workspaceId: {
      type: String,
      default: ''
    },
    canalActif: {
      type: Object,
      default: () => null
    },
    replyingToMessage: {
      type: Object,
      default: null
    }
  },
  data() {
    return {};
  },

  methods: {
    /**
     * Gérer l'envoi d'un message au canal
     */
    handleSendChannelMessage(data) {
      // Rediriger vers l'ancien événement pour la rétrocompatibilité
      this.$emit('envoyer-message', data);
    },
    
    /**
     * Gérer l'envoi d'un message privé
     */
    handleSendPrivateMessage(data) {
      // Rediriger vers l'ancien événement pour la rétrocompatibilité
      this.$emit('message-sent', data.content);
    },
    
    /**
     * Gérer la réponse à un message
     */
    handleReplyToMessage(data) {
      // Rediriger vers l'ancien événement pour la rétrocompatibilité
      this.$emit('reply-to-message', data);
    },
    
    /**
     * Gérer l'annulation d'une réponse
     */
    handleCancelReply() {
      // Rediriger vers l'ancien événement pour la rétrocompatibilité
      this.$emit('cancel-reply');
    },
    
    /**
     * Gérer le rafraîchissement des messages
     */
    handleRefreshMessages() {
      // Rediriger vers l'ancien événement pour la rétrocompatibilité
      this.$emit('refresh-messages');
    }
  },

};
</script>

<style scoped>
/* Les styles sont maintenant dans InputBase.vue */
</style>