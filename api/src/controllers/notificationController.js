const notificationService = require('../services/notificationService');
const Canal = require('../models/canal');
const Message = require('../models/message');
const User = require('../models/user');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

/**
 * Récupère toutes les notifications non lues de l'utilisateur connecté
 */
exports.getNonLues = catchAsync(async (req, res, next) => {
    const notifications = await notificationService.getNonLues(req.user.id);
    
    res.status(200).json({
        status: 'success',
        results: notifications.length,
        data: {
            notifications
        }
    });
});

/**
 * Marque une notification comme lue
 */
exports.marquerCommeLue = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    
    const notification = await notificationService.marquerCommeLue(id, req.user.id);
    
    if (!notification) {
        return next(new AppError('Notification non trouvée ou non autorisée', 404));
    }
    
    res.status(200).json({
        status: 'success',
        data: {
            notification
        }
    });
});

/**
 * Marque toutes les notifications d'un canal comme lues
 */
exports.marquerToutesCommeLues = catchAsync(async (req, res, next) => {
    const { canalId } = req.params;
    
    // Vérifier si l'utilisateur est membre du canal
    const canal = await Canal.findById(canalId);
    if (!canal) {
        return next(new AppError('Canal non trouvé', 404));
    }
    
    if (!canal.estMembre(req.user.id)) {
        return next(new AppError('Vous n\'êtes pas membre de ce canal', 403));
    }
    
    const resultat = await notificationService.marquerToutesCommeLues(canalId, req.user.id);
    
    res.status(200).json({
        status: 'success',
        data: {
            count: resultat.count
        }
    });
});

/**
 * Marque toutes les notifications d'une conversation comme lues
 */
exports.marquerToutesConversationCommeLues = catchAsync(async (req, res, next) => {
    const { conversationId } = req.params;
    const userId = req.user.id;
    
    const resultat = await notificationService.marquerToutesConversationCommeLues(conversationId, userId);
    
    res.status(200).json({
        status: 'success',
        data: {
            count: resultat.count
        }
    });
});

/**
 * Compte les notifications non lues par canal
 */
exports.compterNonLuesPourCanal = catchAsync(async (req, res, next) => {
    const { canalId } = req.params;
    
    // Vérifier si l'utilisateur est membre du canal
    const canal = await Canal.findById(canalId);
    if (!canal) {
        return next(new AppError('Canal non trouvé', 404));
    }
    
    if (!canal.estMembre(req.user.id)) {
        return next(new AppError('Vous n\'êtes pas membre de ce canal', 403));
    }
    
    const count = await notificationService.compterNonLuesPourCanal(req.user.id, canalId);
    
    res.status(200).json({
        status: 'success',
        data: {
            count
        }
    });
});

/**
 * Compte les notifications non lues pour une conversation
 */
exports.compterNonLuesPourConversation = catchAsync(async (req, res, next) => {
    const { conversationId } = req.params;
    
    const count = await notificationService.compterNonLuesPourConversation(req.user.id, conversationId);
    
    res.status(200).json({
        status: 'success',
        data: {
            count
        }
    });
});

/**
 * Compte toutes les notifications non lues
 */
exports.compterToutesNonLues = catchAsync(async (req, res, next) => {
    const count = await notificationService.compterNonLues(req.user.id);
    
    res.status(200).json({
        status: 'success',
        data: {
            count
        }
    });
});

/**
 * Récupère les préférences de notification de l'utilisateur
 */
exports.getPreferences = catchAsync(async (req, res, next) => {
    const userId = req.user.id;
    
    const user = await User.findById(userId).select('preferences.notifications');
    
    if (!user) {
        return next(new AppError('Utilisateur non trouvé', 404));
    }
    
    // Valeurs par défaut si les préférences n'existent pas encore
    const preferences = user.preferences?.notifications || {
        mentionsOnly: false,
        soundEnabled: true,
        desktopEnabled: true
    };
    
    res.status(200).json({
        status: 'success',
        data: {
            preferences
        }
    });
});

/**
 * Met à jour les préférences de notification de l'utilisateur
 */
exports.updatePreferences = catchAsync(async (req, res, next) => {
    const userId = req.user.id;
    const { mentionsOnly, soundEnabled, desktopEnabled } = req.body;
    
    // Vérifier que les valeurs sont bien des booléens
    if (mentionsOnly !== undefined && typeof mentionsOnly !== 'boolean') {
        return next(new AppError('mentionsOnly doit être un booléen', 400));
    }
    
    if (soundEnabled !== undefined && typeof soundEnabled !== 'boolean') {
        return next(new AppError('soundEnabled doit être un booléen', 400));
    }
    
    if (desktopEnabled !== undefined && typeof desktopEnabled !== 'boolean') {
        return next(new AppError('desktopEnabled doit être un booléen', 400));
    }
    
    // Construire l'objet de mise à jour
    const updateObj = {};
    
    if (mentionsOnly !== undefined) {
        updateObj['preferences.notifications.mentionsOnly'] = mentionsOnly;
    }
    
    if (soundEnabled !== undefined) {
        updateObj['preferences.notifications.soundEnabled'] = soundEnabled;
    }
    
    if (desktopEnabled !== undefined) {
        updateObj['preferences.notifications.desktopEnabled'] = desktopEnabled;
    }
    
    // Mettre à jour l'utilisateur
    const user = await User.findByIdAndUpdate(
        userId,
        { $set: updateObj },
        { new: true, runValidators: true }
    ).select('preferences.notifications');
    
    if (!user) {
        return next(new AppError('Utilisateur non trouvé', 404));
    }
    
    res.status(200).json({
        status: 'success',
        message: 'Préférences de notification mises à jour avec succès',
        data: {
            preferences: user.preferences?.notifications
        }
    });
});

/**
 * Récupère tous les canaux avec des messages non lus
 */
exports.getCanauxAvecMessagesNonLus = catchAsync(async (req, res, next) => {
    const { workspaceId } = req.params;
    
    const canaux = await Canal.getAvecMessagesNonLus(req.user.id, workspaceId);
    
    res.status(200).json({
        status: 'success',
        results: canaux.length,
        data: {
            canaux
        }
    });
});
