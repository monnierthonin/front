const Message = require('../models/message');
const MessagePrivate = require('../models/messagePrivate');
const Canal = require('../models/canal');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { nettoyerDonnees } = require('../middleware/validateur');

// Messages de groupe
exports.envoyerMessageGroupe = catchAsync(async (req, res, next) => {
    const donneesNettoyees = nettoyerDonnees(req.body);
    const { contenu, canal } = donneesNettoyees;
    const mentions = Array.isArray(donneesNettoyees.mentions) ? donneesNettoyees.mentions : [];

    // Vérifier l'accès au canal
    const canalExiste = await Canal.findById(canal);
    if (!canalExiste) {
        return next(new AppError('Canal non trouvé', 404));
    }

    // Vérifier si l'utilisateur est membre du canal
    const estMembre = canalExiste.membres.some(membre => 
        membre.utilisateur.toString() === req.user._id.toString()
    );

    if (!estMembre) {
        return next(new AppError('Accès non autorisé à ce canal', 403));
    }

    const message = await Message.create({
        contenu,
        auteur: req.user._id,
        canal,
        mentions: mentions.length > 0 ? mentions : undefined,
        horodatage: new Date()
    });

    // Émettre via WebSocket
    const messagePopule = await message.populate([
        {
            path: 'auteur',
            select: 'firstName lastName email username profilePicture'
        },
        {
            path: 'mentions',
            select: 'firstName lastName email username profilePicture'
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

    // Vérifier si l'utilisateur est membre du canal
    const estMembre = canal.membres.some(membre => 
        membre.utilisateur.toString() === req.user._id.toString()
    );

    if (!estMembre) {
        return next(new AppError('Accès non autorisé à ce canal', 403));
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ canal: canal.id })
        .sort('-horodatage')
        .skip(skip)
        .limit(limit)
        .populate([
            { 
                path: 'auteur', 
                select: 'nom email username photo' 
            },
            { 
                path: 'mentions', 
                select: 'nom email username photo' 
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
                    select: 'nom email username photo' 
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
                select: 'nom email username photo'
            },
            {
                path: 'mentions',
                select: 'nom email username photo'
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
                select: 'nom email username photo'
            },
            {
                path: 'reponseA',
                select: 'contenu auteur',
                populate: { 
                    path: 'auteur', 
                    select: 'nom email username photo' 
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

// Messages privés
exports.envoyerMessagePrive = catchAsync(async (req, res, next) => {
    const donneesNettoyees = nettoyerDonnees(req.body);
    const { contenu, destinataire } = donneesNettoyees;

    const message = await MessagePrivate.create({
        contenu,
        expediteur: req.user._id,
        destinataire,
        horodatage: new Date()
    });

    // Émettre via WebSocket
    const socketService = req.app.get('socketService');
    const roomId = `dm_${[req.user._id, destinataire].sort().join('_')}`;
    
    socketService.emitToRoom(roomId, 'nouveau-message-prive', {
        message: await message.populate([
            {
                path: 'expediteur',
                select: 'nom email username photo'
            },
            {
                path: 'destinataire',
                select: 'nom email username photo'
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

// Obtenir l'historique des messages privés
exports.getMessagesPrives = catchAsync(async (req, res, next) => {
    const { utilisateur } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await MessagePrivate.find({
        $or: [
            { expediteur: req.user._id, destinataire: utilisateur },
            { expediteur: utilisateur, destinataire: req.user._id }
        ]
    })
    .sort({ horodatage: -1 })
    .skip(skip)
    .limit(limit)
    .populate([
        {
            path: 'expediteur',
            select: 'nom email username photo'
        },
        {
            path: 'destinataire',
            select: 'nom email username photo'
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

// Marquer un message privé comme lu
exports.marquerCommeLu = catchAsync(async (req, res, next) => {
    const { messageId } = req.params;

    const message = await MessagePrivate.findOneAndUpdate(
        {
            _id: messageId,
            destinataire: req.user._id
        },
        { lu: true },
        { new: true }
    );

    if (!message) {
        return next(new AppError('Message non trouvé', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            message
        }
    });
});

// Modifier un message privé
exports.modifierMessagePrive = catchAsync(async (req, res, next) => {
    const donneesNettoyees = nettoyerDonnees(req.body);
    const { contenu } = donneesNettoyees;

    const message = await MessagePrivate.findOne({
        _id: req.params.id,
        expediteur: req.user._id
    });

    if (!message) {
        return next(new AppError('Message non trouvé ou non autorisé', 404));
    }

    message.contenu = contenu;
    await message.save();

    // Émettre via WebSocket
    const socketService = req.app.get('socketService');
    const roomId = `dm_${[message.expediteur, message.destinataire].sort().join('_')}`;
    
    socketService.emitToRoom(roomId, 'message-prive-modifie', {
        message: await message.populate([
            {
                path: 'expediteur',
                select: 'nom email username photo'
            },
            {
                path: 'destinataire',
                select: 'nom email username photo'
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

// Supprimer un message privé
exports.supprimerMessagePrive = catchAsync(async (req, res, next) => {
    const message = await MessagePrivate.findOne({
        _id: req.params.id,
        expediteur: req.user._id
    });

    if (!message) {
        return next(new AppError('Message non trouvé ou non autorisé', 404));
    }

    await message.deleteOne();

    // Émettre via WebSocket
    const socketService = req.app.get('socketService');
    const roomId = `dm_${[message.expediteur, message.destinataire].sort().join('_')}`;
    
    socketService.emitToRoom(roomId, 'message-prive-supprime', {
        messageId: message._id
    });

    res.status(204).json({
        status: 'success',
        data: null
    });
});
