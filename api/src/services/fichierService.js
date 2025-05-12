const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const AppError = require('../utils/appError');
const { verifierFichier } = require('./mimeService');
const { creerPreview } = require('./previewService');

/**
 * Détermine le dossier de destination en fonction du contexte
 * @param {string} contexte - Le contexte de l'upload (canal, conversation, profile)
 * @param {string} id - L'identifiant du contexte (canal ID, conversation ID)
 * @returns {string} Le chemin du dossier
 */
const determinerDossier = (contexte, id) => {
    switch(contexte) {
        case 'canal':
            return `uploads/canaux/${id}`;
        case 'conversation':
            return `uploads/conversations/${id}`;
        case 'profile':
            return 'uploads/profiles';
        default:
            return 'uploads';
    }
};

/**
 * Génère une icône par défaut en fonction du type MIME
 * @param {string} mimeType - Le type MIME du fichier
 * @returns {string} Le chemin de l'icône
 */
const getDefaultIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) {
        return 'assets/icons/image-icon.png';
    } else if (mimeType === 'application/pdf') {
        return 'assets/icons/pdf-icon.png';
    } else if (mimeType.includes('word')) {
        return 'assets/icons/word-icon.png';
    } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
        return 'assets/icons/excel-icon.png';
    } else if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) {
        return 'assets/icons/powerpoint-icon.png';
    } else if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('compressed')) {
        return 'assets/icons/archive-icon.png';
    } else if (mimeType.includes('text/')) {
        return 'assets/icons/text-icon.png';
    } else {
        return 'assets/icons/file-icon.png';
    }
};

/**
 * Sauvegarde un fichier sur le disque
 * @param {Object} file - Le fichier à sauvegarder (buffer et métadonnées)
 * @param {string} contexte - Le contexte de l'upload (canal, conversation, profile)
 * @param {string} id - L'identifiant du contexte
 * @returns {Object} Les informations du fichier sauvegardé
 */
const sauvegarderFichier = async (file, contexte = 'general', id = null) => {
    // Déterminer le dossier de destination
    const dossier = determinerDossier(contexte, id);
    
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    const nomFichierSanitize = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_'); // Sanitize le nom de fichier
    const nomFichier = `${timestamp}-${Math.random().toString(36).substring(7)}-${nomFichierSanitize}`;
    // Sauvegarder directement dans le dossier uploads pour correspondre à la configuration d'Express
    const cheminComplet = path.join(__dirname, '..', '..', dossier, nomFichier);
    
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
        // Utiliser une icône par défaut en fonction du type
        urlPreview = getDefaultIcon(file.detectedMimeType);
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
        // Utiliser le même chemin que pour la sauvegarde
        const cheminComplet = path.join(__dirname, '..', '..', url);
        await fs.unlink(cheminComplet);

        // Supprimer la prévisualisation si elle existe
        const nomFichier = path.basename(url);
        const nomPreview = `${path.basename(nomFichier, path.extname(nomFichier))}-preview.jpg`;
        const cheminPreview = path.join(__dirname, '..', '..', 'previews', nomPreview);
        
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
    sauvegarderFichier,
    supprimerFichier
};
