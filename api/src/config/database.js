const mongoose = require('mongoose');

/**
 * Initialise la connexion à la base de données MongoDB
 */
const initialiserBaseDeDonnees = async () => {
  try {
    const connexion = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log(`MongoDB connectée: ${connexion.connection.host}`);

    // Gestion des événements de connexion
    mongoose.connection.on('error', (err) => {
      console.error('Erreur MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('Déconnexion de MongoDB');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('Connexion MongoDB fermée suite à l\'arrêt de l\'application');
      process.exit(0);
    });

  } catch (erreur) {
    console.error('Erreur de connexion MongoDB:', erreur);
    process.exit(1);
  }
};

module.exports = initialiserBaseDeDonnees;
