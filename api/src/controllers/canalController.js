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

    // Valider le type et la visibilité
    if (!['texte', 'vocal'].includes(req.body.type)) {
        return next(new AppError('Type de canal invalide. Doit être "texte" ou "vocal"', 400));
    }

    if (!['public', 'prive'].includes(req.body.visibilite)) {
        return next(new AppError('Visibilité invalide. Doit être "public" ou "prive"', 400));
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
    // Vérifier d'abord si l'utilisateur a accès au workspace
    const workspace = await Workspace.findById(req.params.workspaceId);
    if (!workspace) {
        return next(new AppError('Workspace non trouvé', 404));
    }

    // Vérifier si l'utilisateur est membre du workspace ou si le workspace est public
    if (workspace.visibilite !== 'public' && !workspace.estMembre(req.user.id)) {
        return next(new AppError('Vous n\'avez pas accès à ce workspace', 403));
    }

    // Récupérer les canaux
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
    // Vérifier d'abord si l'utilisateur a accès au workspace
    const workspace = await Workspace.findById(req.params.workspaceId);
    if (!workspace) {
        return next(new AppError('Workspace non trouvé', 404));
    }

    // Vérifier si l'utilisateur est membre du workspace ou si le workspace est public
    if (workspace.visibilite !== 'public' && !workspace.estMembre(req.user.id)) {
        return next(new AppError('Vous n\'avez pas accès à ce workspace', 403));
    }

    const canal = await Canal.findOne({
        _id: req.params.id,
        workspace: req.params.workspaceId
    });

    if (!canal) {
        return next(new AppError('Canal non trouvé', 404));
    }

    // Vérifier l'accès au canal
    if (canal.visibilite === 'prive' && !canal.estMembre(req.user.id)) {
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
    // Vérifier d'abord si l'utilisateur a accès au workspace
    const workspace = await Workspace.findById(req.params.workspaceId);
    if (!workspace) {
        return next(new AppError('Workspace non trouvé', 404));
    }

    // Vérifier si l'utilisateur est membre du workspace
    if (!workspace.estMembre(req.user.id)) {
        return next(new AppError('Vous n\'avez pas accès à ce workspace', 403));
    }

    const canal = await Canal.findOne({
        _id: req.params.id,
        workspace: req.params.workspaceId
    });

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
    // Vérifier d'abord si l'utilisateur a accès au workspace
    const workspace = await Workspace.findById(req.params.workspaceId);
    if (!workspace) {
        return next(new AppError('Workspace non trouvé', 404));
    }

    // Vérifier si l'utilisateur est membre du workspace
    if (!workspace.estMembre(req.user.id)) {
        return next(new AppError('Vous n\'avez pas accès à ce workspace', 403));
    }

    const canal = await Canal.findOne({
        _id: req.params.id,
        workspace: req.params.workspaceId
    });

    if (!canal) {
        return next(new AppError('Canal non trouvé', 404));
    }

    // Vérifier les permissions
    if (!canal.peutSupprimerCanal(req.user.id)) {
        return next(new AppError('Vous n\'avez pas la permission de supprimer ce canal', 403));
    }

    await canal.remove();

    res.status(204).json({
        status: 'success',
        data: null
    });
});

// Ajouter un membre au canal
exports.ajouterMembre = catchAsync(async (req, res, next) => {
    // Vérifier d'abord si l'utilisateur a accès au workspace
    const workspace = await Workspace.findById(req.params.workspaceId);
    if (!workspace) {
        return next(new AppError('Workspace non trouvé', 404));
    }

    // Vérifier si l'utilisateur est membre du workspace
    if (!workspace.estMembre(req.user.id)) {
        return next(new AppError('Vous n\'avez pas accès à ce workspace', 403));
    }

    // Trouver le canal
    const canal = await Canal.findOne({
        _id: req.params.id,
        workspace: req.params.workspaceId
    });

    if (!canal) {
        return next(new AppError('Canal non trouvé', 404));
    }

    // Vérifier les permissions
    if (!canal.peutGererMembres(req.user.id)) {
        return next(new AppError('Vous n\'avez pas la permission d\'ajouter des membres', 403));
    }

    // Vérifier si l'utilisateur à ajouter existe et est membre du workspace
    const utilisateurId = req.body.utilisateurId;
    if (!workspace.estMembre(utilisateurId)) {
        return next(new AppError('L\'utilisateur doit d\'abord être membre du workspace', 400));
    }

    // Vérifier si l'utilisateur n'est pas déjà membre du canal
    if (canal.estMembre(utilisateurId)) {
        return next(new AppError('L\'utilisateur est déjà membre de ce canal', 400));
    }

    // Vérifier que le rôle est valide
    const role = req.body.role || 'membre';
    if (!['membre', 'moderateur', 'admin'].includes(role)) {
        return next(new AppError('Rôle invalide. Doit être "membre", "moderateur" ou "admin"', 400));
    }

    // Ajouter le membre
    canal.membres.push({
        utilisateur: utilisateurId,
        role: role
    });

    await canal.save();

    res.status(200).json({
        status: 'success',
        message: 'Membre ajouté avec succès',
        data: {
            canal
        }
    });
});

// Modifier le rôle d'un membre
exports.modifierRoleMembre = catchAsync(async (req, res, next) => {
    // Vérifier d'abord si l'utilisateur a accès au workspace
    const workspace = await Workspace.findById(req.params.workspaceId);
    if (!workspace) {
        return next(new AppError('Workspace non trouvé', 404));
    }

    // Vérifier si l'utilisateur est membre du workspace
    if (!workspace.estMembre(req.user.id)) {
        return next(new AppError('Vous n\'avez pas accès à ce workspace', 403));
    }

    const canal = await Canal.findOne({
        _id: req.params.id,
        workspace: req.params.workspaceId
    });

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

    // Vérifier que le rôle est valide
    if (!['membre', 'moderateur', 'admin'].includes(req.body.role)) {
        return next(new AppError('Rôle invalide. Doit être "membre", "moderateur" ou "admin"', 400));
    }

    // Empêcher un non-admin de promouvoir quelqu'un admin
    const membreActuel = canal.membres.find(m => m.utilisateur.toString() === req.user.id);
    if (req.body.role === 'admin' && membreActuel.role !== 'admin') {
        return next(new AppError('Seul un admin peut promouvoir un autre membre en admin', 403));
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

// Upload de fichiers
exports.uploadFichier = catchAsync(async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
        return next(new AppError('Aucun fichier n\'a été uploadé', 400));
    }

    // Vérifier d'abord si l'utilisateur a accès au workspace
    const workspace = await Workspace.findById(req.params.workspaceId);
    if (!workspace) {
        return next(new AppError('Workspace non trouvé', 404));
    }

    // Vérifier si l'utilisateur est membre du workspace
    if (!workspace.estMembre(req.user.id)) {
        return next(new AppError('Vous n\'avez pas accès à ce workspace', 403));
    }

    const canal = await Canal.findOne({
        _id: req.params.id,
        workspace: req.params.workspaceId
    });

    if (!canal) {
        return next(new AppError('Canal non trouvé', 404));
    }

    // Vérifier les permissions
    if (!canal.peutGererFichiers(req.user.id)) {
        return next(new AppError('Vous n\'avez pas la permission de gérer les fichiers', 403));
    }

    // Vérifier les extensions des fichiers
    for (const file of req.files) {
        if (!canal.verifierExtensionFichier(file.originalname)) {
            // Supprimer les fichiers déjà uploadés
            req.files.forEach(f => fichierService.supprimerFichier(f.filename));
            return next(new AppError(`Extension de fichier non autorisée: ${file.originalname}`, 400));
        }

        // Vérifier la taille du fichier
        if (file.size > canal.parametres.tailleMaxFichier) {
            // Supprimer les fichiers déjà uploadés
            req.files.forEach(f => fichierService.supprimerFichier(f.filename));
            return next(new AppError(`Le fichier ${file.originalname} dépasse la taille maximale autorisée`, 400));
        }
    }

    // Ajouter les fichiers au canal
    const fichiers = req.files.map(file => ({
        nom: file.originalname,
        type: file.mimetype,
        taille: file.size,
        url: `/uploads/${file.filename}`,
        uploadePar: req.user.id
    }));

    canal.fichiers.push(...fichiers);
    await canal.save();

    res.status(200).json({
        status: 'success',
        message: `${req.files.length} fichier(s) uploadé(s) avec succès`,
        data: {
            fichiers
        }
    });
});

// Supprimer un membre
exports.supprimerMembre = catchAsync(async (req, res, next) => {
    // Vérifier d'abord si l'utilisateur a accès au workspace
    const workspace = await Workspace.findById(req.params.workspaceId);
    if (!workspace) {
        return next(new AppError('Workspace non trouvé', 404));
    }

    // Vérifier si l'utilisateur est membre du workspace
    if (!workspace.estMembre(req.user.id)) {
        return next(new AppError('Vous n\'avez pas accès à ce workspace', 403));
    }

    const canal = await Canal.findOne({
        _id: req.params.id,
        workspace: req.params.workspaceId
    });

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

// Supprimer un fichier
exports.supprimerFichier = catchAsync(async (req, res, next) => {
    // Vérifier d'abord si l'utilisateur a accès au workspace
    const workspace = await Workspace.findById(req.params.workspaceId);
    if (!workspace) {
        return next(new AppError('Workspace non trouvé', 404));
    }

    // Vérifier si l'utilisateur est membre du workspace
    if (!workspace.estMembre(req.user.id)) {
        return next(new AppError('Vous n\'avez pas accès à ce workspace', 403));
    }

    const canal = await Canal.findOne({
        _id: req.params.id,
        workspace: req.params.workspaceId
    });

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
    // Vérifier d'abord si l'utilisateur a accès au workspace
    const workspace = await Workspace.findById(req.params.workspaceId);
    if (!workspace) {
        return next(new AppError('Workspace non trouvé', 404));
    }

    // Vérifier si l'utilisateur est membre du workspace
    if (!workspace.estMembre(req.user.id)) {
        return next(new AppError('Vous n\'avez pas accès à ce workspace', 403));
    }

    const canal = await Canal.findOne({
        _id: req.params.id,
        workspace: req.params.workspaceId
    });

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
