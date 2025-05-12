const { fileTypeFromBuffer } = require('file-type');

// Liste des types MIME autorisés avec leurs extensions correspondantes
const MIME_TYPES_AUTORISES = {
    // Images
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    'image/svg+xml': ['.svg'],
    
    // Vidéos
    'video/mp4': ['.mp4'],
    'video/webm': ['.webm'],
    'video/quicktime': ['.mov'],
    
    // Audio
    'audio/ogg': ['.ogg'],
    'audio/wav': ['.wav'],
    'audio/mpeg': ['.mp3'],
    'audio/mp4': ['.m4a'],
    
    // Documents
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'application/vnd.ms-powerpoint': ['.ppt'],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    'text/plain': ['.txt'],
    'text/csv': ['.csv'],
    'text/html': ['.html', '.htm'],
    'application/json': ['.json'],
    
    // Archives
    'application/zip': ['.zip'],
    'application/x-rar-compressed': ['.rar'],
    'application/x-7z-compressed': ['.7z'],
    'application/gzip': ['.gz']
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
        console.log(`Vérification du fichier: ${nomFichier}, taille: ${taille} octets`);
        
        // Détecter le vrai type MIME à partir du contenu
        const typeDetecte = await fileTypeFromBuffer(buffer);
        
        // Si le type n'est pas détecté, utiliser le type basé sur l'extension
        if (!typeDetecte) {
            console.log(`Type MIME non détecté pour ${nomFichier}, utilisation de l'extension`);
            
            // Extraire l'extension du nom de fichier
            const extension = '.' + nomFichier.split('.').pop().toLowerCase();
            
            // Types MIME courants basés sur l'extension
            const extensionToMime = {
                '.txt': 'text/plain',
                '.html': 'text/html',
                '.htm': 'text/html',
                '.css': 'text/css',
                '.js': 'text/javascript',
                '.json': 'application/json',
                '.xml': 'application/xml',
                '.csv': 'text/csv'
            };
            
            const mimeType = extensionToMime[extension];
            
            if (mimeType) {
                console.log(`Type MIME déterminé par extension: ${mimeType}`);
                
                // Vérifier la taille du fichier
                const typeGeneral = mimeType.split('/')[0];
                const tailleMax = TAILLE_MAX_PAR_TYPE[typeGeneral] || TAILLE_MAX_PAR_TYPE['application'];
                
                if (taille > tailleMax) {
                    return { 
                        valide: false, 
                        erreur: `Taille de fichier non autorisée pour ce type (max: ${Math.round(tailleMax/1024/1024)} Mo)` 
                    };
                }
                
                return { 
                    valide: true, 
                    mimeType: mimeType 
                };
            }
            
            return { 
                valide: false, 
                erreur: 'Type de fichier non reconnu' 
            };
        }
        
        console.log(`Type MIME détecté: ${typeDetecte.mime} pour ${nomFichier}`);

        // Vérifier si le type MIME est autorisé
        if (!estMimeTypeAutorise(typeDetecte.mime)) {
            console.log(`Type MIME non autorisé: ${typeDetecte.mime}`);
            return { 
                valide: false, 
                erreur: `Type de fichier non autorisé: ${typeDetecte.mime}` 
            };
        }

        // Extraire l'extension du nom de fichier
        const extension = '.' + nomFichier.split('.').pop().toLowerCase();

        // Vérifier si l'extension correspond au type MIME
        if (!estExtensionValide(typeDetecte.mime, extension)) {
            console.log(`Extension invalide: ${extension} pour le type ${typeDetecte.mime}`);
            // On est plus permissif ici, on accepte malgré l'extension incorrecte
            console.log(`Extension invalide mais fichier accepté quand même`);
        }

        // Vérifier la taille du fichier
        if (!estTailleAutorisee(typeDetecte.mime, taille)) {
            const typeGeneral = typeDetecte.mime.split('/')[0];
            const tailleMax = TAILLE_MAX_PAR_TYPE[typeGeneral];
            console.log(`Taille non autorisée: ${taille} octets (max: ${tailleMax} octets)`);
            return { 
                valide: false, 
                erreur: `Taille de fichier non autorisée pour ce type (max: ${Math.round(tailleMax/1024/1024)} Mo)` 
            };
        }

        return { 
            valide: true, 
            mimeType: typeDetecte.mime 
        };
    } catch (error) {
        console.error('Erreur lors de la vérification du fichier:', error);
        return { 
            valide: false, 
            erreur: `Erreur lors de la vérification du fichier: ${error.message}` 
        };
    }
};

module.exports = {
    verifierFichier,
    MIME_TYPES_AUTORISES,
    TAILLE_MAX_PAR_TYPE
};
