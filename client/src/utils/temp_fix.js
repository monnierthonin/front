/**
 * Voici la méthode handleReactionAdded corrigée à implémenter dans Message.vue
 */
async handleReactionAdded({ messageId, emoji, result }) {
  
  try {
    let updatedMessage = null;
    let index = -1;
    
    index = this.messages.findIndex(m => this.getMessageId(m) === messageId);
    
    if (index === -1) {
      return;
    }
    
    const originalMessage = this.messages[index];
    
    updatedMessage = JSON.parse(JSON.stringify(originalMessage));
    
    if (result && result.reactions) {
      updatedMessage.reactions = result.reactions;
    } else {
      const currentUserId = this.currentUserId || this.getAuthorId();
      
      if (!currentUserId) {
        console.warn('ID utilisateur non disponible pour la mise à jour manuelle des réactions');
        return;
      }
      
      if (this.isPrivate) {
        if (!updatedMessage.reactions) updatedMessage.reactions = {};
        
        if (Array.isArray(updatedMessage.reactions)) {
          const reactionsObj = {};
          updatedMessage.reactions.forEach(r => {
            if (r.emoji) {
              reactionsObj[r.emoji] = { 
                utilisateurs: Array.isArray(r.utilisateurs) ? r.utilisateurs : []
              };
            }
          });
          updatedMessage.reactions = reactionsObj;
        }
        
        if (!updatedMessage.reactions[emoji]) {
          updatedMessage.reactions[emoji] = { utilisateurs: [] };
        }
        
        if (!Array.isArray(updatedMessage.reactions[emoji].utilisateurs)) {
          updatedMessage.reactions[emoji].utilisateurs = [];
        }
        
        const users = updatedMessage.reactions[emoji].utilisateurs;
        if (!users.includes(currentUserId)) {
          updatedMessage.reactions[emoji].utilisateurs = [...users, currentUserId];
        }
      } else {
        if (!updatedMessage.reactions) updatedMessage.reactions = [];
        
        if (!Array.isArray(updatedMessage.reactions)) {
          const reactionsArray = [];
          for (const key in updatedMessage.reactions) {
            if (Object.prototype.hasOwnProperty.call(updatedMessage.reactions, key)) {
              const users = updatedMessage.reactions[key].utilisateurs || [];
              reactionsArray.push({
                emoji: key,
                utilisateurs: users
              });
            }
          }
          updatedMessage.reactions = reactionsArray;
        }
        
        const existingReaction = updatedMessage.reactions.find(r => r.emoji === emoji);
        
        if (existingReaction) {
          if (!Array.isArray(existingReaction.utilisateurs)) {
            existingReaction.utilisateurs = [];
          }
          
          if (!existingReaction.utilisateurs.includes(currentUserId)) {
            existingReaction.utilisateurs = [...existingReaction.utilisateurs, currentUserId];
          }
        } else {
          updatedMessage.reactions.push({
            emoji,
            utilisateurs: [currentUserId]
          });
        }
      }
    }
    
    this.$emit('update-message', { index, message: updatedMessage });
    
    this.$emit('reaction-added', { messageId, emoji, updatedMessage });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des réactions:', error);
  }
}
