const Message = require('../models/message');
const Canal = require('../models/canal');
const User = require('../models/user');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// Créer un message
exports.creerMessage = catchAsync(async (req, res, next) => {
    // Vérifier si le canal existe et est de type texte
    const canal = await Canal.findById(req.params.canalId);
    if (!canal) {
        return next(new AppError('Canal non trouvé', 404));
    }

    if (canal.type !== 'texte') {
        return next(new AppError('Ce canal n\'accepte pas les messages texte', 400));
    }

    // Vérifier si l'utilisateur peut envoyer des messages
    if (!canal.peutEnvoyerMessage(req.user.id)) {
        return next(new AppError('Vous n\'avez pas la permission d\'envoyer des messages', 403));
    }

    // Créer le message
    const message = await Message.create({
        contenu: req.body.contenu,
        auteur: req.user.id,
        canal: canal.id,
        fichiers: req.body.fichiers
    });

    // Peupler les références
    await message.populate([
        { path: 'auteur', select: 'nom email' },
        { path: 'mentions', select: 'nom email' },
        { path: 'canalsReferenced', select: 'nom' }
    ]);

    res.status(201).json({
        status: 'success',
        data: {
            message
        }
    });
});

// Obtenir les messages d'un canal
exports.obtenirMessages = catchAsync(async (req, res, next) => {
    const canal = await Canal.findById(req.params.canalId);
    if (!canal) {
        return next(new AppError('Canal non trouvé', 404));
    }

    // Vérifier si l'utilisateur peut lire les messages
    if (!canal.peutLire(req.user.id)) {
        return next(new AppError('Vous n\'avez pas accès à ce canal', 403));
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ canal: canal.id })
        .sort('-createdAt')
        .skip(skip)
        .limit(limit)
        .populate([
            { path: 'auteur', select: 'nom email' },
            { path: 'mentions', select: 'nom email' },
            { path: 'canalsReferenced', select: 'nom' },
            { 
                path: 'reponseA',
                select: 'contenu auteur',
                populate: { path: 'auteur', select: 'nom email' }
            }
        ]);

    res.status(200).json({
        status: 'success',
        results: messages.length,
        data: {
            messages
        }
    });
});

// Modifier un message
exports.modifierMessage = catchAsync(async (req, res, next) => {
    const message = await Message.findById(req.params.id);
    if (!message) {
        return next(new AppError('Message non trouvé', 404));
    }

    // Vérifier si l'utilisateur peut modifier le message
    if (!message.peutModifier(req.user.id)) {
        return next(new AppError('Vous ne pouvez pas modifier ce message', 403));
    }

    message.contenu = req.body.contenu;
    await message.save();

    await message.populate([
        { path: 'auteur', select: 'nom email' },
        { path: 'mentions', select: 'nom email' },
        { path: 'canalsReferenced', select: 'nom' }
    ]);

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

    // Obtenir le rôle de l'utilisateur dans le canal
    const canal = await Canal.findById(message.canal);
    const membre = canal.membres.find(m => m.utilisateur.toString() === req.user.id.toString());
    const role = membre ? membre.role : null;

    // Vérifier si l'utilisateur peut supprimer le message
    if (!message.peutSupprimer(req.user.id, role)) {
        return next(new AppError('Vous ne pouvez pas supprimer ce message', 403));
    }

    await Message.findByIdAndDelete(req.params.id);

    res.status(204).json({
        status: 'success',
        data: null
    });
});

// Réagir à un message
exports.reagirMessage = catchAsync(async (req, res, next) => {
    const { emoji } = req.body;
    if (!emoji) {
        return next(new AppError('Veuillez fournir un emoji', 400));
    }

    const message = await Message.findById(req.params.id);
    if (!message) {
        return next(new AppError('Message non trouvé', 404));
    }

    // Vérifier si l'utilisateur a accès au canal
    const canal = await Canal.findById(message.canal);
    if (!canal.peutLire(req.user.id)) {
        return next(new AppError('Vous n\'avez pas accès à ce canal', 403));
    }

    message.ajouterReaction(emoji, req.user.id);
    await message.save();

    res.status(200).json({
        status: 'success',
        data: {
            message
        }
    });
});

// Répondre à un message
exports.repondreMessage = catchAsync(async (req, res, next) => {
    const messageOriginal = await Message.findById(req.params.id);
    if (!messageOriginal) {
        return next(new AppError('Message original non trouvé', 404));
    }

    const canal = await Canal.findById(messageOriginal.canal);
    if (!canal) {
        return next(new AppError('Canal non trouvé', 404));
    }

    // Vérifier si l'utilisateur peut envoyer des messages
    if (!canal.peutEnvoyerMessage(req.user.id)) {
        return next(new AppError('Vous n\'avez pas la permission d\'envoyer des messages', 403));
    }

    const message = await Message.create({
        contenu: req.body.contenu,
        auteur: req.user.id,
        canal: canal.id,
        reponseA: messageOriginal.id,
        fichiers: req.body.fichiers
    });

    await message.populate([
        { path: 'auteur', select: 'nom email' },
        { path: 'mentions', select: 'nom email' },
        { path: 'canalsReferenced', select: 'nom' },
        { 
            path: 'reponseA',
            select: 'contenu auteur',
            populate: { path: 'auteur', select: 'nom email' }
        }
    ]);

    res.status(201).json({
        status: 'success',
        data: {
            message
        }
    });
});
