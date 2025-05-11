const User = require('../models/user');

/**
 * Middleware pour mettre à jour la date de dernière activité de l'utilisateur
 * et gérer le changement automatique de statut
 */
const updateActivity = async (req, res, next) => {
  try {
    // Vérifier si l'utilisateur est authentifié
    if (req.user && req.user.id) {
      const now = Date.now();
      
      // Récupérer l'utilisateur
      const user = await User.findById(req.user.id);
      
      if (user) {
        // Mettre à jour la date de dernière activité
        user.dernierActivite = now;
        
        // Si l'utilisateur est connecté et que son statut est "en ligne",
        // vérifier s'il a été inactif pendant plus de 5 minutes
        if (user.estConnecte && user.status === 'en ligne') {
          const inactivityTime = now - new Date(user.dernierActivite).getTime();
          const fiveMinutesInMs = 5 * 60 * 1000;
          
          if (inactivityTime > fiveMinutesInMs) {
            user.status = 'absent';
          } else {
            // Si l'utilisateur était absent et qu'il interagit à nouveau, le remettre en ligne
            user.status = 'en ligne';
          }
        }
        
        // Sauvegarder les modifications
        await user.save({ validateBeforeSave: false });
      }
    }
    
    next();
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'activité:', error);
    next();
  }
};

/**
 * Middleware pour vérifier périodiquement l'inactivité des utilisateurs
 * et mettre à jour leur statut en conséquence
 */
const setupInactivityChecker = (app) => {
  // Vérifier toutes les minutes
  setInterval(async () => {
    try {
      const now = Date.now();
      const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);
      
      // Trouver tous les utilisateurs connectés avec le statut "en ligne"
      // et inactifs depuis plus de 5 minutes
      const inactiveUsers = await User.find({
        estConnecte: true,
        status: 'en ligne',
        dernierActivite: { $lt: fiveMinutesAgo }
      });
      
      // Mettre à jour leur statut
      for (const user of inactiveUsers) {
        user.status = 'absent';
        await user.save({ validateBeforeSave: false });
        console.log(`Utilisateur ${user.username} marqué comme absent pour inactivité`);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification d\'inactivité:', error);
    }
  }, 60000); // Vérifier toutes les minutes
};

module.exports = {
  updateActivity,
  setupInactivityChecker
};
