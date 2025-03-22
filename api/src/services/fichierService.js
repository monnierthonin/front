const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const AppError = require('../utils/appError');
const { verifierFichier } = require('./mimeService');
const { creerPreview } = require('./previewService');

// Configuration du stockage
const storage = multer.memoryStorage(); // Stockage en mémoire pour vérification MIME

// Configuration de multer avec vérification MIME
const upload = multer({
    storage: storage,
    fileFilter: async (req, file, cb) => {
        try {
            // Vérification MIME du fichier
            const resultat = await verifierFichier(
                file.buffer,
                file.originalname,
                file.size
            );

            if (!resultat.valide) {
                cb(new AppError(resultat.erreur, 400), false);
            } else {
                // Ajouter le vrai type MIME au fichier
                file.detectedMimeType = resultat.mimeType;
                cb(null, true);
            }
        } catch (error) {
            cb(new AppError('Erreur lors de la vérification du fichier', 400), false);
        }
    }
});

// Sauvegarder le fichier sur le disque
const sauvegarderFichier = async (file, dossier = 'uploads') => {
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    const nomFichier = `${timestamp}-${Math.random().toString(36).substring(7)}${extension}`;
    const cheminComplet = path.join(__dirname, '..', '..', 'public', dossier, nomFichier);
    
    // Créer le dossier s'il n'existe pas
    await fs.mkdir(path.dirname(cheminComplet), { recursive: true });
    
    // Sauvegarder le fichier
    await fs.writeFile(cheminComplet, file.buffer);

    let urlPreview = null;
    try {
        // Créer une prévisualisation si possible
        urlPreview = await creerPreview(cheminComplet, file.detectedMimeType);
    } catch (error) {
        console.error('Erreur lors de la création de la prévisualisation:', error);
        // Ne pas bloquer le processus si la prévisualisation échoue
    }
    
    return {
        nom: file.originalname,
        type: file.detectedMimeType,
        url: `${dossier}/${nomFichier}`,
        urlPreview,
        taille: file.size
    };
};

// Supprimer un fichier et sa prévisualisation
const supprimerFichier = async (url) => {
    try {
        const cheminComplet = path.join(__dirname, '..', '..', 'public', url);
        await fs.unlink(cheminComplet);

        // Supprimer la prévisualisation si elle existe
        const nomFichier = path.basename(url);
        const nomPreview = `${path.basename(nomFichier, path.extname(nomFichier))}-preview.jpg`;
        const cheminPreview = path.join(__dirname, '..', '..', 'public', 'previews', nomPreview);
        
        try {
            await fs.unlink(cheminPreview);
        } catch (error) {
            // Ignorer l'erreur si la prévisualisation n'existe pas
        }

        return true;
    } catch (error) {
        console.error('Erreur lors de la suppression du fichier:', error);
        return false;
    }
};

module.exports = {
    upload,
    sauvegarderFichier,
    supprimerFichier
};
