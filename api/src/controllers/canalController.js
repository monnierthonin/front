const Canal = require('../models/canal');
const Workspace = require('../models/workspace');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const fichierService = require('../services/fichierService');

// Créer un nouveau canal
exports.creerCanal = catchAsync(async (req, res, next) => {
    // Vérifier si l'utilisateur a le rôle admin dans le workspace
    const workspace = await Workspace.findById(req.params.workspaceId);
    if (!workspace) {
        return next(new AppError('Workspace non trouvé', 404));
    }

    const membreWorkspace = workspace.membres.find(m => 
        m.utilisateur.toString() === req.user.id.toString()
    );

    if (!membreWorkspace || membreWorkspace.role !== 'admin') {
        return next(new AppError('Seuls les administrateurs peuvent créer des canaux', 403));
    }

    const canal = await Canal.create({
        nom: req.body.nom,
        description: req.body.description,
        type: req.body.type,
        visibilite: req.body.visibilite,
        workspace: workspace.id,
        createur: req.user.id,
        membres: [{
            utilisateur: req.user.id,
            role: 'admin'
        }]
    });

    res.status(201).json({
        status: 'success',
        data: {
            canal
        }
    });
});

// Obtenir tous les canaux d'un workspace
exports.obtenirCanaux = catchAsync(async (req, res, next) => {
    const canaux = await Canal.find({
        workspace: req.params.workspaceId,
        $or: [
            { visibilite: 'public' },
            { 'membres.utilisateur': req.user.id }
        ]
    });

    res.status(200).json({
        status: 'success',
        results: canaux.length,
        data: {
            canaux
        }
    });
});

// Obtenir un canal spécifique
exports.obtenirCanal = catchAsync(async (req, res, next) => {
    const canal = await Canal.findById(req.params.id);
    if (!canal) {
        return next(new AppError('Canal non trouvé', 404));
    }

    // Vérifier l'accès
    if (canal.visibilite === 'prive' && !canal.peutLire(req.user.id)) {
        return next(new AppError('Vous n\'avez pas accès à ce canal', 403));
    }

    res.status(200).json({
        status: 'success',
        data: {
            canal
        }
    });
});

// Mettre à jour un canal
exports.mettreAJourCanal = catchAsync(async (req, res, next) => {
    const canal = await Canal.findById(req.params.id);
    if (!canal) {
        return next(new AppError('Canal non trouvé', 404));
    }

    // Vérifier les permissions
    if (!canal.peutModifierCanal(req.user.id)) {
        return next(new AppError('Vous n\'avez pas la permission de modifier ce canal', 403));
    }

    const updatedCanal = await Canal.findByIdAndUpdate(
        req.params.id,
        {
            nom: req.body.nom,
            description: req.body.description,
            visibilite: req.body.visibilite,
            parametres: req.body.parametres
        },
        {
            new: true,
            runValidators: true
        }
    );

    res.status(200).json({
        status: 'success',
        data: {
            canal: updatedCanal
        }
    });
});

// Supprimer un canal
exports.supprimerCanal = catchAsync(async (req, res, next) => {
    const canal = await Canal.findById(req.params.id);
    if (!canal) {
        return next(new AppError('Canal non trouvé', 404));
    }

    // Vérifier les permissions
    if (!canal.peutSupprimerCanal(req.user.id)) {
        return next(new AppError('Vous n\'avez pas la permission de supprimer ce canal', 403));
    }

    // Utiliser remove() pour déclencher le middleware de suppression en cascade
    await canal.remove();

    res.status(204).json({
        status: 'success',
        data: null
    });
});

// Ajouter un membre
exports.ajouterMembre = catchAsync(async (req, res, next) => {
    const canal = await Canal.findById(req.params.id);
    if (!canal) {
        return next(new AppError('Canal non trouvé', 404));
    }

    // Vérifier les permissions
    if (!canal.peutGererMembres(req.user.id)) {
        return next(new AppError('Vous n\'avez pas la permission de gérer les membres', 403));
    }

    // Vérifier si l'utilisateur est déjà membre
    if (canal.estMembre(req.body.utilisateur)) {
        return next(new AppError('L\'utilisateur est déjà membre du canal', 400));
    }

    canal.membres.push({
        utilisateur: req.body.utilisateur,
        role: req.body.role || 'membre'
    });

    await canal.save();

    res.status(200).json({
        status: 'success',
        data: {
            canal
        }
    });
});

// Modifier le rôle d'un membre
exports.modifierRoleMembre = catchAsync(async (req, res, next) => {
    const canal = await Canal.findById(req.params.id);
    if (!canal) {
        return next(new AppError('Canal non trouvé', 404));
    }

    // Vérifier les permissions
    if (!canal.peutGererRoles(req.user.id)) {
        return next(new AppError('Vous n\'avez pas la permission de gérer les rôles', 403));
    }

    const membre = canal.membres.id(req.params.membreId);
    if (!membre) {
        return next(new AppError('Membre non trouvé', 404));
    }

    membre.role = req.body.role;
    await canal.save();

    res.status(200).json({
        status: 'success',
        data: {
            canal
        }
    });
});

// Supprimer un membre
exports.supprimerMembre = catchAsync(async (req, res, next) => {
    const canal = await Canal.findById(req.params.id);
    if (!canal) {
        return next(new AppError('Canal non trouvé', 404));
    }

    // Vérifier les permissions
    if (!canal.peutGererMembres(req.user.id)) {
        return next(new AppError('Vous n\'avez pas la permission de gérer les membres', 403));
    }

    canal.membres.pull(req.params.membreId);
    await canal.save();

    res.status(204).json({
        status: 'success',
        data: null
    });
});

// Upload de fichiers
exports.uploadFichier = catchAsync(async (req, res, next) => {
    const canal = await Canal.findById(req.params.id);
    if (!canal) {
        return next(new AppError('Canal non trouvé', 404));
    }

    // Vérifier les permissions
    if (!canal.peutEnvoyerMessage(req.user.id)) {
        return next(new AppError('Vous n\'avez pas la permission d\'envoyer des fichiers', 403));
    }

    if (!req.files || req.files.length === 0) {
        return next(new AppError('Aucun fichier fourni', 400));
    }

    const fichiersSauvegardes = [];
    for (const file of req.files) {
        const fichier = await fichierService.sauvegarderFichier(
            file,
            `workspaces/${canal.workspace}/canaux/${canal.id}/fichiers`
        );
        fichiersSauvegardes.push(fichier);
    }

    // Ajouter les fichiers au canal
    canal.fichiers.push(...fichiersSauvegardes);
    await canal.save();

    res.status(200).json({
        status: 'success',
        data: {
            fichiers: fichiersSauvegardes
        }
    });
});

// Supprimer un fichier
exports.supprimerFichier = catchAsync(async (req, res, next) => {
    const canal = await Canal.findById(req.params.id);
    if (!canal) {
        return next(new AppError('Canal non trouvé', 404));
    }

    // Vérifier les permissions
    if (!canal.peutGererFichiers(req.user.id)) {
        return next(new AppError('Vous n\'avez pas la permission de supprimer des fichiers', 403));
    }

    const fichier = canal.fichiers.id(req.params.fichierId);
    if (!fichier) {
        return next(new AppError('Fichier non trouvé', 404));
    }

    // Supprimer le fichier physique
    await fichierService.supprimerFichier(
        req.params.workspaceId,
        req.params.id,
        fichier.nom
    );

    // Supprimer la référence dans la base de données
    canal.fichiers.pull(req.params.fichierId);
    await canal.save();

    res.status(204).json({
        status: 'success',
        data: null
    });
});

// Obtenir la liste des fichiers
exports.obtenirFichiers = catchAsync(async (req, res, next) => {
    const canal = await Canal.findById(req.params.id);
    if (!canal) {
        return next(new AppError('Canal non trouvé', 404));
    }

    // Vérifier l'accès au canal
    if (!canal.peutLire(req.user.id)) {
        return next(new AppError('Vous n\'avez pas accès à ce canal', 403));
    }

    res.status(200).json({
        status: 'success',
        results: canal.fichiers.length,
        data: {
            fichiers: canal.fichiers
        }
    });
});
