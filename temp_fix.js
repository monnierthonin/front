/**
 * Voici la méthode handleReactionAdded corrigée à implémenter dans Message.vue
 */
async handleReactionAdded({ messageId, emoji, result }) {
  console.log('handleReactionAdded appelé avec messageId:', messageId, 'emoji:', emoji, 'et résultat:', result);
  
  try {
    let updatedMessage = null;
    let index = -1;
    
    // Trouver l'index du message dans le tableau
    index = this.messages.findIndex(m => this.getMessageId(m) === messageId);
    console.log('Index du message trouvé:', index);
    
    if (index === -1) {
      console.warn(`Message avec ID ${messageId} non trouvé dans le tableau`);
      return;
    }
    
    const originalMessage = this.messages[index];
    console.log('Message original:', originalMessage);
    
    // Copie complète du message original pour éviter les références partagées
    updatedMessage = JSON.parse(JSON.stringify(originalMessage));
    
    // Si le résultat de l'API contient directement les données mises à jour, on les utilise
    if (result && result.reactions) {
      updatedMessage.reactions = result.reactions;
      console.log('Structure des réactions après mise à jour API:', JSON.stringify(result.reactions));
    } else {
      // Sinon, mettre à jour manuellement en ajoutant l'emoji au message
      const currentUserId = this.currentUserId || this.getAuthorId();
      
      if (!currentUserId) {
        console.warn('ID utilisateur non disponible pour la mise à jour manuelle des réactions');
        return;
      }
      
      // Gérer différents formats de réactions selon le type de message
      if (this.isPrivate) {
        // Format pour messages privés (objet avec clés d'emoji)
        if (!updatedMessage.reactions) updatedMessage.reactions = {};
        
        // S'assurer que la structure est correcte
        if (Array.isArray(updatedMessage.reactions)) {
          // Convertir de tableau à objet si nécessaire
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
        
        // Initialiser l'emoji s'il n'existe pas encore
        if (!updatedMessage.reactions[emoji]) {
          updatedMessage.reactions[emoji] = { utilisateurs: [] };
        }
        
        // S'assurer que utilisateurs est un tableau
        if (!Array.isArray(updatedMessage.reactions[emoji].utilisateurs)) {
          updatedMessage.reactions[emoji].utilisateurs = [];
        }
        
        // Ajouter l'utilisateur courant s'il n'a pas déjà réagi
        const users = updatedMessage.reactions[emoji].utilisateurs;
        if (!users.includes(currentUserId)) {
          updatedMessage.reactions[emoji].utilisateurs = [...users, currentUserId];
        }
      } else {
        // Format pour messages de canal (tableau de réactions)
        if (!updatedMessage.reactions) updatedMessage.reactions = [];
        
        // S'assurer que la structure est correcte
        if (!Array.isArray(updatedMessage.reactions)) {
          // Convertir d'objet à tableau si nécessaire
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
        
        // Rechercher si cet emoji existe déjà
        const existingReaction = updatedMessage.reactions.find(r => r.emoji === emoji);
        
        if (existingReaction) {
          // S'assurer que utilisateurs est un tableau
          if (!Array.isArray(existingReaction.utilisateurs)) {
            existingReaction.utilisateurs = [];
          }
          
          // Ajouter l'utilisateur s'il n'a pas déjà réagi
          if (!existingReaction.utilisateurs.includes(currentUserId)) {
            existingReaction.utilisateurs = [...existingReaction.utilisateurs, currentUserId];
          }
        } else {
          // Créer une nouvelle réaction
          updatedMessage.reactions.push({
            emoji,
            utilisateurs: [currentUserId]
          });
        }
      }
      
      console.log(`Réaction ${emoji} ajoutée manuellement au message ${messageId}`);
    }
    
    // Au lieu de modifier la prop directement, on émet un événement pour que le parent fasse la mise à jour
    console.log('Message mis à jour:', JSON.stringify(updatedMessage.reactions));
    
    // Émettre un événement pour mettre à jour le message dans le composant parent
    this.$emit('update-message', { index, message: updatedMessage });
    
    // Également émettre l'événement reaction-added pour la compatibilité avec le code existant
    this.$emit('reaction-added', { messageId, emoji, updatedMessage });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des réactions:', error);
  }
}
