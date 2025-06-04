const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Schéma pour les notifications
 */
const notificationSchema = new Schema({
  // Utilisateur destinataire de la notification
  utilisateur: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // Type de notification (canal, conversation, mention)
  type: { 
    type: String, 
    enum: ['canal', 'conversation', 'mention'], 
    required: true 
  },
  
  // ID de référence (canal ou conversation)
  reference: { 
    type: Schema.Types.ObjectId, 
    refPath: 'onModel', 
    required: true 
  },
  
  // Modèle de référence (Canal ou Conversation)
  onModel: { 
    type: String, 
    enum: ['Canal', 'Conversation'], 
    required: true 
  },
  
  // Message associé à la notification
  message: { 
    type: Schema.Types.ObjectId, 
    ref: 'Message', 
    required: true 
  },
  
  // Statut de lecture
  lu: { 
    type: Boolean, 
    default: false 
  },
  
  // Date de création
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Index pour améliorer les performances des requêtes
notificationSchema.index({ utilisateur: 1, lu: 1 });
notificationSchema.index({ reference: 1, type: 1 });

// Méthode pour marquer une notification comme lue
notificationSchema.methods.marquerCommeLue = async function() {
  this.lu = true;
  return this.save();
};

// Méthode statique pour récupérer les notifications non lues d'un utilisateur
notificationSchema.statics.getNonLuesPourUtilisateur = async function(utilisateurId) {
  return this.find({
    utilisateur: utilisateurId,
    lu: false
  })
  .sort({ createdAt: -1 })
  .populate('message')
  .populate('reference');
};

// Méthode statique pour compter les notifications non lues par type et référence
notificationSchema.statics.compterNonLues = async function(utilisateurId, type, referenceId) {
  return this.countDocuments({
    utilisateur: utilisateurId,
    type: type,
    reference: referenceId,
    lu: false
  });
};

// Méthode statique pour compter toutes les notifications non lues d'un utilisateur
notificationSchema.statics.compterToutesNonLues = async function(utilisateurId) {
  return this.countDocuments({
    utilisateur: utilisateurId,
    lu: false
  });
};

module.exports = mongoose.model('Notification', notificationSchema);
