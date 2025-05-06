const bcrypt = require('bcrypt');

const password = 'Azerty123!'; // Remplacez par le mot de passe souhaité
const saltRounds = 10;

bcrypt.hash(password, saltRounds, function(err, hash) {
    if (err) {
        console.error('Erreur lors de la génération du hash:', err);
        return;
    }
    console.log('Hash généré:', hash);
});
