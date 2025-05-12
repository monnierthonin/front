const fs = require('fs').promises;
const path = require('path');

/**
 * Crée les dossiers nécessaires pour le stockage des fichiers
 */
async function createUploadDirectories() {
    const baseDir = path.join(__dirname, '..', '..');
    
    // Liste des dossiers à créer
    const directories = [
        'uploads',
        'uploads/canaux',
        'uploads/conversations',
        'uploads/profiles',
        'previews'
    ];
    
    for (const dir of directories) {
        const fullPath = path.join(baseDir, dir);
        try {
            await fs.mkdir(fullPath, { recursive: true });
            console.log(`Dossier créé: ${fullPath}`);
        } catch (error) {
            if (error.code !== 'EEXIST') {
                console.error(`Erreur lors de la création du dossier ${fullPath}:`, error);
            } else {
                console.log(`Le dossier existe déjà: ${fullPath}`);
            }
        }
    }
    
    console.log('Tous les dossiers ont été créés avec succès!');
}

// Exécuter la fonction
createUploadDirectories()
    .then(() => console.log('Initialisation des dossiers terminée'))
    .catch(err => console.error('Erreur lors de l\'initialisation des dossiers:', err));

module.exports = createUploadDirectories;
