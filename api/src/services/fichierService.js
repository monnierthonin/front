const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const AppError = require('../utils/appError');

// Configuration du stockage
const storage = multer.diskStorage({
    destination: async function(req, file, cb) {
        const workspaceId = req.params.workspaceId;
        const canalId = req.params.id;
        const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'workspaces', workspaceId, 'canaux', canalId);
        
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(new AppError('Erreur lors de la création du dossier de stockage', 500));
        }
    },
    filename: function(req, file, cb) {
        // Générer un nom de fichier unique avec timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Filtre des fichiers
const fileFilter = (req, file, cb) => {
    const canal = req.canal; // Le canal sera attaché par le middleware précédent
    
    // Vérifier si l'extension est autorisée
    const extension = '.' + file.originalname.split('.').pop().toLowerCase();
    if (!canal.parametres.extensionsAutorisees.includes(extension)) {
        cb(new AppError(`Extension de fichier non autorisée: ${extension}`, 400), false);
        return;
    }

    // Vérifier la taille du fichier
    if (file.size > canal.parametres.tailleMaxFichier) {
        cb(new AppError(`Fichier trop volumineux. Maximum: ${canal.parametres.tailleMaxFichier} bytes`, 400), false);
        return;
    }

    cb(null, true);
};

// Configuration de Multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB par défaut, sera vérifié plus précisément par canal
    }
});

// Fonction pour supprimer un fichier
const supprimerFichier = async (workspaceId, canalId, nomFichier) => {
    const cheminFichier = path.join(__dirname, '..', '..', 'uploads', 'workspaces', workspaceId, 'canaux', canalId, nomFichier);
    
    try {
        await fs.unlink(cheminFichier);
    } catch (error) {
        throw new AppError('Erreur lors de la suppression du fichier', 500);
    }
};

// Fonction pour obtenir l'URL d'un fichier
const getUrlFichier = (workspaceId, canalId, nomFichier) => {
    return `/uploads/workspaces/${workspaceId}/canaux/${canalId}/${nomFichier}`;
};

// Fonction pour vérifier si un fichier existe
const fichierExiste = async (workspaceId, canalId, nomFichier) => {
    const cheminFichier = path.join(__dirname, '..', '..', 'uploads', 'workspaces', workspaceId, 'canaux', canalId, nomFichier);
    
    try {
        await fs.access(cheminFichier);
        return true;
    } catch {
        return false;
    }
};

module.exports = {
    upload,
    supprimerFichier,
    getUrlFichier,
    fichierExiste
};
