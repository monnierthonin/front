const { fileTypeFromBuffer } = require('file-type');

// Liste des types MIME autorisés avec leurs extensions correspondantes
const MIME_TYPES_AUTORISES = {
    // Images
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    
    // Vidéos
    'video/mp4': ['.mp4'],
    'video/webm': ['.webm'],
    
    // Audio
    'audio/ogg': ['.ogg'],
    'audio/wav': ['.wav'],
    'audio/mpeg': ['.mp3'],
    
    // Documents
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
};

// Taille maximale par type de fichier (en octets)
const TAILLE_MAX_PAR_TYPE = {
    'image': 5 * 1024 * 1024,    // 5MB pour les images
    'video': 50 * 1024 * 1024,   // 50MB pour les vidéos
    'audio': 10 * 1024 * 1024,   // 10MB pour l'audio
    'application': 20 * 1024 * 1024 // 20MB pour les documents
};

/**
 * Vérifie si le type MIME est autorisé
 * @param {string} mimeType - Le type MIME à vérifier
 * @returns {boolean}
 */
const estMimeTypeAutorise = (mimeType) => {
    return Object.keys(MIME_TYPES_AUTORISES).includes(mimeType);
};

/**
 * Vérifie si l'extension correspond au type MIME
 * @param {string} mimeType - Le type MIME
 * @param {string} extension - L'extension du fichier (avec le point)
 * @returns {boolean}
 */
const estExtensionValide = (mimeType, extension) => {
    if (!MIME_TYPES_AUTORISES[mimeType]) return false;
    return MIME_TYPES_AUTORISES[mimeType].includes(extension.toLowerCase());
};

/**
 * Vérifie si la taille du fichier est autorisée pour son type
 * @param {string} mimeType - Le type MIME
 * @param {number} taille - La taille du fichier en octets
 * @returns {boolean}
 */
const estTailleAutorisee = (mimeType, taille) => {
    const typeGeneral = mimeType.split('/')[0];
    const tailleMax = TAILLE_MAX_PAR_TYPE[typeGeneral];
    return tailleMax ? taille <= tailleMax : false;
};

/**
 * Vérifie un fichier (type MIME, extension et taille)
 * @param {Buffer} buffer - Le contenu du fichier
 * @param {string} nomFichier - Le nom du fichier original
 * @param {number} taille - La taille du fichier en octets
 * @returns {Promise<{valide: boolean, erreur?: string}>}
 */
const verifierFichier = async (buffer, nomFichier, taille) => {
    try {
        // Détecter le vrai type MIME à partir du contenu
        const typeDetecte = await fileTypeFromBuffer(buffer);
        
        if (!typeDetecte) {
            return { 
                valide: false, 
                erreur: 'Type de fichier non reconnu' 
            };
        }

        // Vérifier si le type MIME est autorisé
        if (!estMimeTypeAutorise(typeDetecte.mime)) {
            return { 
                valide: false, 
                erreur: 'Type de fichier non autorisé' 
            };
        }

        // Extraire l'extension du nom de fichier
        const extension = '.' + nomFichier.split('.').pop().toLowerCase();

        // Vérifier si l'extension correspond au type MIME
        if (!estExtensionValide(typeDetecte.mime, extension)) {
            return { 
                valide: false, 
                erreur: 'Extension de fichier invalide pour ce type de contenu' 
            };
        }

        // Vérifier la taille du fichier
        if (!estTailleAutorisee(typeDetecte.mime, taille)) {
            return { 
                valide: false, 
                erreur: 'Taille de fichier non autorisée pour ce type' 
            };
        }

        return { 
            valide: true, 
            mimeType: typeDetecte.mime 
        };
    } catch (error) {
        return { 
            valide: false, 
            erreur: 'Erreur lors de la vérification du fichier' 
        };
    }
};

module.exports = {
    verifierFichier,
    MIME_TYPES_AUTORISES,
    TAILLE_MAX_PAR_TYPE
};
