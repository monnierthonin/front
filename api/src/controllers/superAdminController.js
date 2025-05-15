const Workspace = require('../models/workspace');
const User = require('../models/user');
const Canal = require('../models/canal');
const Message = require('../models/message');
const MessagePrivate = require('../models/messagePrivate');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

/**
 * Contrôleur pour les fonctionnalités réservées aux super administrateurs
 */

// Récupérer tous les workspaces (peu importe la visibilité)
exports.obtenirTousLesWorkspaces = catchAsync(async (req, res) => {
    const workspaces = await Workspace.find()
        .populate('proprietaire', 'firstName lastName username email')
        .populate('membres.utilisateur', 'firstName lastName username email')
        .sort({ 'nom': 1 });

    res.status(200).json({
        status: 'success',
        resultats: workspaces.length,
        data: {
            workspaces
        }
    });
});

// Récupérer un workspace spécifique (peu importe la visibilité)
exports.obtenirWorkspace = catchAsync(async (req, res, next) => {
    const workspace = await Workspace.findById(req.params.id)
        .populate('proprietaire', 'firstName lastName username email')
        .populate('membres.utilisateur', 'firstName lastName username email');

    if (!workspace) {
        return next(new AppError('Workspace non trouvé', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            workspace
        }
    });
});

// Modifier un workspace
exports.modifierWorkspace = catchAsync(async (req, res, next) => {
    const { nom, description, visibilite } = req.body;
    
    const workspace = await Workspace.findByIdAndUpdate(
        req.params.id,
        { nom, description, visibilite },
        { new: true, runValidators: true }
    ).populate('proprietaire', 'firstName lastName username email')
     .populate('membres.utilisateur', 'firstName lastName username email');

    if (!workspace) {
        return next(new AppError('Workspace non trouvé', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            workspace
        }
    });
});

// Supprimer un workspace
exports.supprimerWorkspace = catchAsync(async (req, res, next) => {
    const workspace = await Workspace.findByIdAndDelete(req.params.id);

    if (!workspace) {
        return next(new AppError('Workspace non trouvé', 404));
    }

    // Supprimer également tous les canaux associés
    await Canal.deleteMany({ workspace: req.params.id });

    res.status(204).json({
        status: 'success',
        data: null
    });
});

// Récupérer tous les canaux d'un workspace (peu importe la visibilité)
exports.obtenirTousLesCanaux = catchAsync(async (req, res, next) => {
    const workspace = await Workspace.findById(req.params.workspaceId);
    if (!workspace) {
        return next(new AppError('Workspace non trouvé', 404));
    }

    const canaux = await Canal.find({ workspace: req.params.workspaceId })
        .populate('createur', 'firstName lastName username email')
        .populate('membres.utilisateur', 'firstName lastName username email')
        .sort({ 'nom': 1 });

    res.status(200).json({
        status: 'success',
        resultats: canaux.length,
        data: {
            canaux
        }
    });
});

// Modifier un canal
exports.modifierCanal = catchAsync(async (req, res, next) => {
    const { nom, description, visibilite, type } = req.body;
    
    const canal = await Canal.findByIdAndUpdate(
        req.params.canalId,
        { nom, description, visibilite, type },
        { new: true, runValidators: true }
    ).populate('createur', 'firstName lastName username email')
     .populate('membres.utilisateur', 'firstName lastName username email');

    if (!canal) {
        return next(new AppError('Canal non trouvé', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            canal
        }
    });
});

// Supprimer un canal
exports.supprimerCanal = catchAsync(async (req, res, next) => {
    const canal = await Canal.findByIdAndDelete(req.params.canalId);

    if (!canal) {
        return next(new AppError('Canal non trouvé', 404));
    }

    // Supprimer également tous les messages associés
    await Message.deleteMany({ canal: req.params.canalId });

    res.status(204).json({
        status: 'success',
        data: null
    });
});

// Récupérer tous les utilisateurs
exports.obtenirTousLesUtilisateurs = catchAsync(async (req, res) => {
    const utilisateurs = await User.find()
        .select('-password -resetPasswordToken -resetPasswordExpires -verificationToken -verificationTokenExpires')
        .sort({ 'username': 1 });

    res.status(200).json({
        status: 'success',
        resultats: utilisateurs.length,
        data: {
            utilisateurs
        }
    });
});

// Supprimer un utilisateur
exports.supprimerUtilisateur = catchAsync(async (req, res, next) => {
    // Empêcher la suppression d'un super admin par un autre super admin
    const utilisateur = await User.findById(req.params.id);
    
    if (!utilisateur) {
        return next(new AppError('Utilisateur non trouvé', 404));
    }

    if (utilisateur.role === 'super_admin' && req.user.id !== req.params.id) {
        return next(new AppError('Vous ne pouvez pas supprimer un autre super administrateur', 403));
    }

    // Supprimer l'utilisateur
    await User.findByIdAndDelete(req.params.id);

    // Supprimer l'utilisateur des workspaces où il est membre
    await Workspace.updateMany(
        { 'membres.utilisateur': req.params.id },
        { $pull: { membres: { utilisateur: req.params.id } } }
    );

    // Supprimer les messages de l'utilisateur
    await Message.deleteMany({ auteur: req.params.id });
    await MessagePrivate.deleteMany({ auteur: req.params.id });

    // Si l'utilisateur est propriétaire de workspaces, les supprimer
    const workspaces = await Workspace.find({ proprietaire: req.params.id });
    for (const workspace of workspaces) {
        await Canal.deleteMany({ workspace: workspace._id });
        await workspace.remove();
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
});

// Promouvoir un utilisateur au rang de super admin
exports.promouvoirSuperAdmin = catchAsync(async (req, res, next) => {
    const utilisateur = await User.findByIdAndUpdate(
        req.params.id,
        { role: 'super_admin' },
        { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -resetPasswordExpires -verificationToken -verificationTokenExpires');

    if (!utilisateur) {
        return next(new AppError('Utilisateur non trouvé', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            utilisateur
        }
    });
});

// Rétrograder un super admin au rang d'admin
exports.retrograderSuperAdmin = catchAsync(async (req, res, next) => {
    // Empêcher la rétrogradation d'un super admin par un autre super admin
    if (req.user.id !== req.params.id) {
        return next(new AppError('Vous ne pouvez rétrograder que votre propre compte super admin', 403));
    }

    const utilisateur = await User.findByIdAndUpdate(
        req.params.id,
        { role: 'admin' },
        { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -resetPasswordExpires -verificationToken -verificationTokenExpires');

    if (!utilisateur) {
        return next(new AppError('Utilisateur non trouvé', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            utilisateur
        }
    });
});

// Supprimer un message
exports.supprimerMessage = catchAsync(async (req, res, next) => {
    const message = await Message.findByIdAndDelete(req.params.messageId);

    if (!message) {
        return next(new AppError('Message non trouvé', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
});

// Supprimer un message privé
exports.supprimerMessagePrive = catchAsync(async (req, res, next) => {
    const message = await MessagePrivate.findByIdAndDelete(req.params.messageId);

    if (!message) {
        return next(new AppError('Message privé non trouvé', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
});
