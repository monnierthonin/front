const Message = require('../models/message');
const Canal = require('../models/canal');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { nettoyerDonnees } = require('../middleware/validateur');

// Messages de groupe
exports.envoyerMessageGroupe = catchAsync(async (req, res, next) => {
    const donneesNettoyees = nettoyerDonnees(req.body);
    const { contenu } = donneesNettoyees;
    const canal = req.params.canalId; // Utiliser l'ID du canal depuis les paramètres de route

    // Vérifier l'accès au canal
    const canalExiste = await Canal.findById(canal);
    if (!canalExiste) {
        return next(new AppError('Canal non trouvé', 404));
    }

    // Pour les canaux privés, vérifier si l'utilisateur est membre
    if (canalExiste.visibilite === 'prive') {
        const estMembre = canalExiste.membres.some(membre => 
            membre.utilisateur.toString() === req.user._id.toString()
        );

        if (!estMembre) {
            return next(new AppError('Vous n\'avez pas accès à ce canal privé', 403));
        }
    }

    // Pour les canaux publics, vérifier si l'utilisateur est membre
    // Note: L'ajout automatique de l'utilisateur comme membre est géré par le contrôleur de canal
    if (canalExiste.visibilite === 'public') {
        const estMembre = canalExiste.membres.some(membre => 
            membre.utilisateur && membre.utilisateur.toString() === req.user._id.toString()
        );

        // Si l'utilisateur n'est pas membre, on le laisse quand même accéder au canal public
        // mais on ne l'ajoute pas automatiquement pour éviter les duplications
    }

    // Créer le message - les mentions seront extraites automatiquement par le middleware pre('save')
    const message = await Message.create({
        contenu,
        auteur: req.user._id,
        canal
    });

    // Émettre via WebSocket
    const messagePopule = await message.populate([
        {
            path: 'auteur',
            select: 'nom email username photo'
        },
        {
            path: 'mentions',
            select: 'nom email username photo'
        }
    ]);

    // Notifier les utilisateurs mentionnés
    if (messagePopule.mentions && messagePopule.mentions.length > 0) {
        messagePopule.mentions.forEach(user => {
            req.app.get('socketService').emitToUser(user._id, 'nouvelle-mention', {
                message: messagePopule,
                canal: canalExiste
            });
        });
    }

    req.app.get('socketService').emitToCanal(canal, 'nouveau-message', {
        message: messagePopule
    });

    res.status(201).json({
        status: 'success',
        data: {
            message: messagePopule
        }
    });
});

// Obtenir les messages d'un canal
exports.obtenirMessages = catchAsync(async (req, res, next) => {
    const canal = await Canal.findById(req.params.canalId);
    if (!canal) {
        return next(new AppError('Canal non trouvé', 404));
    }

    // Pour les canaux privés, vérifier si l'utilisateur est membre
    if (canal.visibilite === 'prive') {
        const estMembre = canal.membres.some(membre => 
            membre.utilisateur && membre.utilisateur.toString() === req.user._id.toString()
        );

        if (!estMembre) {
            return next(new AppError('Accès non autorisé à ce canal privé', 403));
        }
    }

    // Pour les canaux publics, vérifier si l'utilisateur est membre
    // Note: L'ajout automatique de l'utilisateur comme membre est géré par le contrôleur de canal
    if (canal.visibilite === 'public') {
        const estMembre = canal.membres.some(membre => 
            membre.utilisateur && membre.utilisateur.toString() === req.user._id.toString()
        );

        // Si l'utilisateur n'est pas membre, on le laisse quand même accéder au canal public
        // mais on ne l'ajoute pas automatiquement pour éviter les duplications
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ canal: canal.id })
        .sort('createdAt')
        .skip(skip)
        .limit(limit)
        .populate([
            { 
                path: 'auteur', 
                select: 'username email firstName lastName profilePicture' 
            },
            { 
                path: 'mentions', 
                select: 'username email firstName lastName profilePicture' 
            },
            { 
                path: 'canalsReferenced', 
                select: 'nom' 
            },
            { 
                path: 'reponseA',
                select: 'contenu auteur',
                populate: { 
                    path: 'auteur', 
                    select: 'username email firstName lastName profilePicture' 
                }
            }
        ]);

    res.status(200).json({
        status: 'success',
        resultats: messages.length,
        data: {
            messages
        }
    });
});

// Modifier un message
exports.modifierMessage = catchAsync(async (req, res, next) => {
    const donneesNettoyees = nettoyerDonnees(req.body);
    const { contenu } = donneesNettoyees;

    const message = await Message.findById(req.params.id);
    if (!message) {
        return next(new AppError('Message non trouvé', 404));
    }

    // Vérifier que l'utilisateur est l'auteur du message
    if (message.auteur.toString() !== req.user._id.toString()) {
        return next(new AppError('Vous ne pouvez pas modifier ce message', 403));
    }

    message.contenu = contenu;
    message.modifie = true;
    await message.save();

    // Émettre via WebSocket
    req.app.get('socketService').emitToCanal(message.canal, 'message-modifie', {
        message: await message.populate([
            {
                path: 'auteur',
                select: 'username email firstName lastName profilePicture'
            },
            {
                path: 'mentions',
                select: 'username email firstName lastName profilePicture'
            }
        ])
    });

    res.status(200).json({
        status: 'success',
        data: {
            message
        }
    });
});

// Supprimer un message
exports.supprimerMessage = catchAsync(async (req, res, next) => {
    const message = await Message.findById(req.params.id);
    if (!message) {
        return next(new AppError('Message non trouvé', 404));
    }

    // Vérifier que l'utilisateur est l'auteur du message
    if (message.auteur.toString() !== req.user._id.toString()) {
        return next(new AppError('Vous ne pouvez pas supprimer ce message', 403));
    }

    await message.deleteOne();

    // Émettre via WebSocket
    req.app.get('socketService').emitToCanal(message.canal, 'message-supprime', {
        messageId: message._id
    });

    res.status(204).json({
        status: 'success',
        data: null
    });
});

// Réagir à un message
exports.reagirMessage = catchAsync(async (req, res, next) => {
    const donneesNettoyees = nettoyerDonnees(req.body);
    const { emoji } = donneesNettoyees;

    const message = await Message.findById(req.params.id);
    if (!message) {
        return next(new AppError('Message non trouvé', 404));
    }

    // Trouver si l'emoji existe déjà dans les réactions
    let emojiReaction = message.reactions.find(r => r.emoji === emoji);
    
    if (emojiReaction) {
        // Vérifier si l'utilisateur a déjà réagi avec cet emoji
        const userIndex = emojiReaction.utilisateurs.findIndex(
            userId => userId.toString() === req.user._id.toString()
        );
        
        if (userIndex > -1) {
            // Retirer la réaction de l'utilisateur
            emojiReaction.utilisateurs.splice(userIndex, 1);
            
            // Si plus personne ne réagit avec cet emoji, retirer l'emoji
            if (emojiReaction.utilisateurs.length === 0) {
                const emojiIndex = message.reactions.findIndex(r => r.emoji === emoji);
                if (emojiIndex > -1) {
                    message.reactions.splice(emojiIndex, 1);
                }
            }
        } else {
            // Ajouter l'utilisateur à la liste des utilisateurs qui réagissent avec cet emoji
            emojiReaction.utilisateurs.push(req.user._id);
        }
    } else {
        // Créer une nouvelle réaction pour cet emoji
        message.reactions.push({
            emoji,
            utilisateurs: [req.user._id]
        });
    }

    await message.save();

    // Émettre via WebSocket
    req.app.get('socketService').emitToCanal(message.canal, 'reaction-message', {
        messageId: message._id,
        message: message
    });

    res.status(200).json({
        status: 'success',
        data: {
            message
        }
    });
});

// Répondre à un message
exports.repondreMessage = catchAsync(async (req, res, next) => {
    const donneesNettoyees = nettoyerDonnees(req.body);
    const { contenu } = donneesNettoyees;

    const messageOriginal = await Message.findById(req.params.id);
    if (!messageOriginal) {
        return next(new AppError('Message original non trouvé', 404));
    }

    const canal = await Canal.findById(messageOriginal.canal);
    if (!canal) {
        return next(new AppError('Canal non trouvé', 404));
    }

    // Vérifier l'accès au canal
    if (!canal.membres.includes(req.user._id)) {
        return next(new AppError('Vous n\'avez pas accès à ce canal', 403));
    }

    const message = await Message.create({
        contenu,
        auteur: req.user._id,
        canal: messageOriginal.canal,
        reponseA: messageOriginal._id,
        horodatage: new Date()
    });

    // Émettre via WebSocket
    req.app.get('socketService').emitToCanal(message.canal, 'nouvelle-reponse', {
        message: await message.populate([
            {
                path: 'auteur',
                select: 'username email firstName lastName profilePicture'
            },
            {
                path: 'reponseA',
                select: 'contenu auteur',
                populate: { 
                    path: 'auteur', 
                    select: 'username email firstName lastName profilePicture' 
                }
            }
        ])
    });

    res.status(201).json({
        status: 'success',
        data: {
            message
        }
    });
});
