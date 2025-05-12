const { sauvegarderFichier, supprimerFichier } = require('../services/fichierService');
const { verifierFichier } = require('../services/mimeService');
const AppError = require('../utils/appError');
const Message = require('../models/message');
const MessagePrivate = require('../models/messagePrivate');
const catchAsync = require('../utils/catchAsync');

/**
 * Télécharge un fichier dans un canal et l'associe à un message
 * @route POST /api/v1/fichiers/canal/:canalId
 */
exports.uploadFichierCanal = catchAsync(async (req, res, next) => {
    if (!req.file) {
        return next(new AppError('Aucun fichier fourni', 400));
    }

    // Vérification MIME du fichier
    console.log(`Vérification MIME pour ${req.file.originalname} (taille: ${req.file.size})`);
    try {
        const resultat = await verifierFichier(
            req.file.buffer,
            req.file.originalname,
            req.file.size
        );

        if (!resultat.valide) {
            return next(new AppError(resultat.erreur, 400));
        }

        // Ajouter le vrai type MIME au fichier
        req.file.detectedMimeType = resultat.mimeType;
        console.log(`Type MIME détecté: ${resultat.mimeType}`);
    } catch (error) {
        console.error('Erreur lors de la vérification MIME:', error);
        return next(new AppError(`Erreur lors de la vérification du fichier: ${error.message}`, 400));
    }

    const { canalId } = req.params;
    const { messageId } = req.body;

    // Sauvegarder le fichier
    const fichierInfo = await sauvegarderFichier(req.file, 'canal', canalId);
    console.log('Informations du fichier sauvegardé:', JSON.stringify(fichierInfo));

    // Si un ID de message est fourni, ajouter le fichier à ce message
    if (messageId) {
        const message = await Message.findById(messageId);
        if (!message) {
            return next(new AppError('Message non trouvé', 404));
        }

        // Vérifier si l'utilisateur est l'auteur du message
        if (message.auteur.toString() !== req.user.id) {
            return next(new AppError('Vous n\'êtes pas autorisé à modifier ce message', 403));
        }

        // Ajouter le fichier au message de façon structurée
        console.log('Ajout du fichier au message existant');
        
        // Créer un nouvel objet fichier avec les propriétés exactes attendues
        const nouveauFichier = {
            nom: fichierInfo.nom,
            type: fichierInfo.type,
            url: fichierInfo.url,
            urlPreview: fichierInfo.urlPreview,
            taille: fichierInfo.taille
        };
        
        // Ajouter le fichier au tableau
        message.fichiers.push(nouveauFichier);
        
        await message.save();

        return res.status(200).json({
            success: true,
            data: {
                fichier: fichierInfo,
                message
            }
        });
    }

    // Si aucun ID de message n'est fourni, créer un nouveau message
    console.log('Création d\'un nouveau message avec fichier');
    
    // Créer d'abord le message sans fichier
    const nouveauMessage = new Message({
        contenu: req.body.contenu || '',
        auteur: req.user.id,
        canal: canalId,
        fichiers: [] // Commencer avec un tableau vide
    });
    
    // Ajouter le fichier manuellement au tableau fichiers
    nouveauMessage.fichiers.push({
        nom: fichierInfo.nom,
        type: fichierInfo.type,
        url: fichierInfo.url,
        urlPreview: fichierInfo.urlPreview,
        taille: fichierInfo.taille
    });
    
    // Sauvegarder le message
    await nouveauMessage.save();

    res.status(201).json({
        success: true,
        data: {
            fichier: fichierInfo,
            message: nouveauMessage
        }
    });
});

/**
 * Télécharge un fichier dans une conversation privée et l'associe à un message
 * @route POST /api/v1/fichiers/conversation/:conversationId
 */
exports.uploadFichierConversation = catchAsync(async (req, res, next) => {
    if (!req.file) {
        return next(new AppError('Aucun fichier fourni', 400));
    }

    // Vérification MIME du fichier
    console.log(`Vérification MIME pour ${req.file.originalname} (taille: ${req.file.size})`);
    try {
        const resultat = await verifierFichier(
            req.file.buffer,
            req.file.originalname,
            req.file.size
        );

        if (!resultat.valide) {
            return next(new AppError(resultat.erreur, 400));
        }

        // Ajouter le vrai type MIME au fichier
        req.file.detectedMimeType = resultat.mimeType;
        console.log(`Type MIME détecté: ${resultat.mimeType}`);
    } catch (error) {
        console.error('Erreur lors de la vérification MIME:', error);
        return next(new AppError(`Erreur lors de la vérification du fichier: ${error.message}`, 400));
    }

    const { conversationId } = req.params;
    const { messageId } = req.body;

    // Sauvegarder le fichier
    const fichierInfo = await sauvegarderFichier(req.file, 'conversation', conversationId);
    console.log('Informations du fichier conversation:', JSON.stringify(fichierInfo));

    // Si un ID de message est fourni, ajouter le fichier à ce message
    if (messageId) {
        const message = await MessagePrivate.findById(messageId);
        if (!message) {
            return next(new AppError('Message non trouvé', 404));
        }

        // Vérifier si l'utilisateur est l'expéditeur du message
        if (message.expediteur.toString() !== req.user.id) {
            return next(new AppError('Vous n\'êtes pas autorisé à modifier ce message', 403));
        }

        // Ajouter le fichier au message de façon structurée
        console.log('Ajout du fichier au message privé existant');
        
        // Créer un nouvel objet fichier avec les propriétés exactes attendues
        const nouveauFichier = {
            nom: fichierInfo.nom,
            type: fichierInfo.type,
            url: fichierInfo.url,
            urlPreview: fichierInfo.urlPreview,
            taille: fichierInfo.taille
        };
        
        // Ajouter le fichier au tableau
        message.fichiers.push(nouveauFichier);
        
        await message.save();

        return res.status(200).json({
            success: true,
            data: {
                fichier: fichierInfo,
                message
            }
        });
    }

    // Si aucun ID de message n'est fourni, créer un nouveau message
    console.log('Création d\'un nouveau message privé avec fichier');
    
    // Créer d'abord le message sans fichier
    const nouveauMessage = new MessagePrivate({
        contenu: req.body.contenu || '',
        expediteur: req.user.id,
        conversation: conversationId,
        fichiers: [] // Commencer avec un tableau vide
    });
    
    // Ajouter le fichier manuellement au tableau fichiers
    nouveauMessage.fichiers.push({
        nom: fichierInfo.nom,
        type: fichierInfo.type,
        url: fichierInfo.url,
        urlPreview: fichierInfo.urlPreview,
        taille: fichierInfo.taille
    });
    
    // Sauvegarder le message
    await nouveauMessage.save();

    res.status(201).json({
        success: true,
        data: {
            fichier: fichierInfo,
            message: nouveauMessage
        }
    });
});

/**
 * Supprime un fichier
 * @route DELETE /api/v1/fichiers/:messageType/:messageId/:fichierUrl
 */
exports.supprimerFichier = catchAsync(async (req, res, next) => {
    const { messageType, messageId, fichierUrl } = req.params;
    let message;

    // Récupérer le message selon son type
    if (messageType === 'canal') {
        message = await Message.findById(messageId);
    } else if (messageType === 'conversation') {
        message = await MessagePrivate.findById(messageId);
    } else {
        return next(new AppError('Type de message invalide', 400));
    }

    if (!message) {
        return next(new AppError('Message non trouvé', 404));
    }

    // Vérifier si l'utilisateur est autorisé à supprimer le fichier
    const isAuteur = messageType === 'canal' 
        ? message.auteur.toString() === req.user.id
        : message.expediteur.toString() === req.user.id;
    
    if (!isAuteur && req.user.role !== 'admin') {
        return next(new AppError('Vous n\'êtes pas autorisé à supprimer ce fichier', 403));
    }

    // Trouver le fichier dans le message
    const fichierIndex = message.fichiers.findIndex(f => f.url === fichierUrl);
    if (fichierIndex === -1) {
        return next(new AppError('Fichier non trouvé dans ce message', 404));
    }

    // Supprimer le fichier du système de fichiers
    const fichier = message.fichiers[fichierIndex];
    await supprimerFichier(fichier.url);

    // Retirer le fichier du message
    message.fichiers.splice(fichierIndex, 1);
    await message.save();

    res.status(200).json({
        success: true,
        data: null
    });
});

/**
 * Liste tous les fichiers d'un canal
 * @route GET /api/v1/fichiers/canal/:canalId
 */
exports.listerFichiersCanal = catchAsync(async (req, res, next) => {
    const { canalId } = req.params;
    
    // Trouver tous les messages du canal qui ont des fichiers
    const messages = await Message.find({
        canal: canalId,
        'fichiers.0': { $exists: true } // Au moins un fichier
    }).populate('auteur', 'username avatar');

    // Extraire les fichiers avec leurs métadonnées
    const fichiers = messages.flatMap(message => 
        message.fichiers.map(fichier => ({
            ...fichier.toObject(),
            messageId: message._id,
            auteur: message.auteur,
            dateEnvoi: message.createdAt
        }))
    );

    res.status(200).json({
        success: true,
        resultats: fichiers.length,
        data: {
            fichiers
        }
    });
});

/**
 * Liste tous les fichiers d'une conversation
 * @route GET /api/v1/fichiers/conversation/:conversationId
 */
exports.listerFichiersConversation = catchAsync(async (req, res, next) => {
    const { conversationId } = req.params;
    
    // Trouver tous les messages de la conversation qui ont des fichiers
    const messages = await MessagePrivate.find({
        conversation: conversationId,
        'fichiers.0': { $exists: true } // Au moins un fichier
    }).populate('expediteur', 'username avatar');

    // Extraire les fichiers avec leurs métadonnées
    const fichiers = messages.flatMap(message => 
        message.fichiers.map(fichier => ({
            ...fichier.toObject(),
            messageId: message._id,
            expediteur: message.expediteur,
            dateEnvoi: message.createdAt
        }))
    );

    res.status(200).json({
        success: true,
        resultats: fichiers.length,
        data: {
            fichiers
        }
    });
});

/**
 * Télécharge une photo de profil pour l'utilisateur
 * @route POST /api/v1/fichiers/profile
 */
exports.uploadPhotoProfil = catchAsync(async (req, res, next) => {
    if (!req.file) {
        return next(new AppError('Aucun fichier fourni', 400));
    }

    // Vérification MIME du fichier
    console.log(`Vérification MIME pour la photo de profil: ${req.file.originalname} (taille: ${req.file.size})`);
    try {
        const resultat = await verifierFichier(
            req.file.buffer,
            req.file.originalname,
            req.file.size
        );

        if (!resultat.valide) {
            return next(new AppError(resultat.erreur, 400));
        }

        // Ajouter le vrai type MIME au fichier
        req.file.detectedMimeType = resultat.mimeType;
        console.log(`Type MIME détecté: ${resultat.mimeType}`);

        // Vérifier que c'est bien une image JPG ou PNG
        const allowedProfileTypes = ['image/jpeg', 'image/png'];
        if (!allowedProfileTypes.includes(resultat.mimeType)) {
            return next(new AppError('Seules les images JPG et PNG sont acceptées pour les photos de profil.', 400));
        }
    } catch (error) {
        console.error('Erreur lors de la vérification MIME:', error);
        return next(new AppError(`Erreur lors de la vérification du fichier: ${error.message}`, 400));
    }

    // Sauvegarder le fichier
    const fichierInfo = await sauvegarderFichier(req.file, 'profile');

    // Mettre à jour l'avatar de l'utilisateur
    req.user.avatar = fichierInfo.url;
    await req.user.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true,
        data: {
            fichier: fichierInfo,
            user: {
                id: req.user.id,
                avatar: req.user.avatar
            }
        }
    });
});
