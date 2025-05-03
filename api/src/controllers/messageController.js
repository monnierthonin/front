const Message = require('../models/message');
const Canal = require('../models/canal');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { nettoyerDonnees } = require('../middleware/validateur');

// Messages de groupe
exports.envoyerMessageGroupe = catchAsync(async (req, res, next) => {
    const donneesNettoyees = nettoyerDonnees(req.body);
    const { contenu } = donneesNettoyees;
    const mentions = Array.isArray(donneesNettoyees.mentions) ? donneesNettoyees.mentions : [];
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

    // Pour les canaux publics, ajouter automatiquement l'utilisateur comme membre s'il ne l'est pas déjà
    if (canalExiste.visibilite === 'public') {
        const estMembre = canalExiste.membres.some(membre => 
            membre.utilisateur.toString() === req.user._id.toString()
        );

        if (!estMembre) {
            canalExiste.membres.push({
                utilisateur: req.user._id,
                role: 'membre'
            });
            await canalExiste.save();
        }
    }

    const message = await Message.create({
        contenu,
        auteur: req.user._id,
        canal,
        mentions
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
            membre.utilisateur.toString() === req.user._id.toString()
        );

        if (!estMembre) {
            return next(new AppError('Accès non autorisé à ce canal privé', 403));
        }
    }

    // Pour les canaux publics, ajouter automatiquement l'utilisateur comme membre s'il ne l'est pas déjà
    if (canal.visibilite === 'public') {
        const estMembre = canal.membres.some(membre => 
            membre.utilisateur.toString() === req.user._id.toString()
        );

        if (!estMembre) {
            canal.membres.push({
                utilisateur: req.user._id,
                role: 'membre'
            });
            await canal.save();
        }
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

    // Ajouter ou retirer la réaction
    const reaction = {
        utilisateur: req.user._id,
        emoji
    };

    const index = message.reactions.findIndex(
        r => r.utilisateur.toString() === req.user._id.toString() && r.emoji === emoji
    );

    if (index > -1) {
        message.reactions.splice(index, 1);
    } else {
        message.reactions.push(reaction);
    }

    await message.save();

    // Émettre via WebSocket
    req.app.get('socketService').emitToCanal(message.canal, 'reaction-message', {
        messageId: message._id,
        reaction
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
