const Workspace = require('../models/workspace');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/user');
const { envoyerEmailInvitationWorkspace } = require('../services/emailService');

// Créer un nouveau workspace
exports.creerWorkspace = catchAsync(async (req, res) => {
    const workspace = await Workspace.create({
        nom: req.body.nom,
        description: req.body.description,
        proprietaire: req.user.id,
        visibilite: req.body.visibilite,
        membres: [{
            utilisateur: req.user.id,
            role: 'admin'
        }]
    });

    res.status(201).json({
        status: 'success',
        data: {
            workspace
        }
    });
});

// Obtenir tous les workspaces (publics ou dont l'utilisateur est membre)
exports.obtenirWorkspaces = catchAsync(async (req, res) => {
    const workspaces = await Workspace.find({
        $or: [
            { visibilite: 'public' },
            { 'membres.utilisateur': req.user.id }
        ]
    }).populate('proprietaire', 'nom email');

    res.status(200).json({
        status: 'success',
        resultats: workspaces.length,
        data: {
            workspaces
        }
    });
});

// Obtenir un workspace spécifique
exports.obtenirWorkspace = catchAsync(async (req, res, next) => {
    const workspace = await Workspace.findById(req.params.id)
        .populate('proprietaire', 'nom email')
        .populate('membres.utilisateur', 'nom email');

    if (!workspace) {
        return next(new AppError('Workspace non trouvé', 404));
    }

    if (workspace.visibilite === 'prive' && !workspace.estMembre(req.user.id)) {
        return next(new AppError('Vous n\'avez pas accès à ce workspace', 403));
    }

    res.status(200).json({
        status: 'success',
        data: {
            workspace
        }
    });
});

// Mettre à jour un workspace
exports.mettreAJourWorkspace = catchAsync(async (req, res, next) => {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
        return next(new AppError('Workspace non trouvé', 404));
    }

    if (!workspace.estAdmin(req.user.id)) {
        return next(new AppError('Seuls les administrateurs peuvent modifier le workspace', 403));
    }

    const champsAutorises = ['nom', 'description', 'visibilite'];
    Object.keys(req.body).forEach(key => {
        if (champsAutorises.includes(key)) {
            workspace[key] = req.body[key];
        }
    });

    await workspace.save();

    res.status(200).json({
        status: 'success',
        data: {
            workspace
        }
    });
});

// Supprimer un workspace
exports.supprimerWorkspace = catchAsync(async (req, res, next) => {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
        return next(new AppError('Workspace non trouvé', 404));
    }

    if (workspace.proprietaire.toString() !== req.user.id) {
        return next(new AppError('Seul le propriétaire peut supprimer le workspace', 403));
    }

    await Workspace.findByIdAndDelete(req.params.id);

    res.status(204).json({
        status: 'success',
        data: null
    });
});

// Gestion des membres
exports.ajouterMembre = catchAsync(async (req, res, next) => {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
        return next(new AppError('Workspace non trouvé', 404));
    }

    if (!workspace.estAdmin(req.user.id)) {
        return next(new AppError('Seuls les administrateurs peuvent ajouter des membres', 403));
    }

    if (workspace.estMembre(req.body.utilisateurId)) {
        return next(new AppError('Cet utilisateur est déjà membre du workspace', 400));
    }

    workspace.membres.push({
        utilisateur: req.body.utilisateurId,
        role: req.body.role || 'membre'
    });

    await workspace.save();

    res.status(200).json({
        status: 'success',
        data: {
            workspace
        }
    });
});

// Générer un lien d'invitation
exports.genererLienInvitation = catchAsync(async (req, res, next) => {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
        return next(new AppError('Workspace non trouvé', 404));
    }

    if (!workspace.estAdmin(req.user.id)) {
        return next(new AppError('Seuls les administrateurs peuvent générer des liens d\'invitation', 403));
    }

    const code = workspace.genererLienInvitation(req.body.dureeValidite);
    await workspace.save();

    res.status(200).json({
        status: 'success',
        data: {
            lienInvitation: code
        }
    });
});

// Rejoindre un workspace via un code d'invitation
exports.rejoindreParInvitation = catchAsync(async (req, res, next) => {
    const { code } = req.body;

    // Trouver le workspace avec le code d'invitation valide
    const workspace = await Workspace.findOne({
        'lienInvitation.code': code,
        'lienInvitation.dateExpiration': { $gt: new Date() }
    });

    if (!workspace) {
        return next(new AppError('Code d\'invitation invalide ou expiré', 400));
    }

    // Vérifier si l'utilisateur est déjà membre
    if (workspace.estMembre(req.user.id)) {
        return next(new AppError('Vous êtes déjà membre de ce workspace', 400));
    }

    // Ajouter l'utilisateur comme membre
    workspace.membres.push({
        utilisateur: req.user.id,
        role: 'membre'
    });

    await workspace.save();

    res.status(200).json({
        status: 'success',
        message: 'Vous avez rejoint le workspace avec succès',
        data: {
            workspace
        }
    });
});

// Envoyer une invitation par email
exports.envoyerInvitation = catchAsync(async (req, res, next) => {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
        return next(new AppError('Workspace non trouvé', 404));
    }

    if (!workspace.estAdmin(req.user.id)) {
        return next(new AppError('Seuls les administrateurs peuvent envoyer des invitations', 403));
    }

    const utilisateurInvite = await User.findById(req.params.userId);
    if (!utilisateurInvite) {
        return next(new AppError('Utilisateur invité non trouvé', 404));
    }

    if (workspace.estMembre(utilisateurInvite.id)) {
        return next(new AppError('Cet utilisateur est déjà membre du workspace', 400));
    }

    // Générer le token d'invitation
    const token = workspace.genererTokenInvitation(utilisateurInvite.id, utilisateurInvite.email);
    await workspace.save();

    // Construire l'URL d'invitation
    const urlInvitation = `${process.env.CLIENT_URL}/workspaces/invitation/${workspace.id}/${token}`;

    // Envoyer l'email d'invitation
    try {
        await envoyerEmailInvitationWorkspace(
            utilisateurInvite.email,
            req.user.username,
            workspace.nom,
            workspace.description || 'Aucune description',
            urlInvitation
        );

        res.status(200).json({
            status: 'success',
            message: `Invitation envoyée à ${utilisateurInvite.email}`
        });
    } catch (error) {
        // Supprimer l'invitation en cas d'échec d'envoi de l'email
        workspace.invitationsEnAttente = workspace.invitationsEnAttente.filter(
            inv => inv.token !== token
        );
        await workspace.save();

        return next(new AppError('Erreur lors de l\'envoi de l\'email d\'invitation', 500));
    }
});

// Accepter une invitation
exports.accepterInvitation = catchAsync(async (req, res, next) => {
    const { workspaceId, token } = req.params;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
        return next(new AppError('Workspace non trouvé', 404));
    }

    const invitation = workspace.verifierTokenInvitation(token);
    if (!invitation) {
        return next(new AppError('Invitation invalide ou expirée', 400));
    }

    if (invitation.utilisateur.toString() !== req.user.id) {
        return next(new AppError('Cette invitation ne vous est pas destinée', 403));
    }

    // Ajouter l'utilisateur comme membre
    workspace.membres.push({
        utilisateur: req.user.id,
        role: 'membre'
    });

    // Supprimer l'invitation
    workspace.invitationsEnAttente = workspace.invitationsEnAttente.filter(
        inv => inv.token !== token
    );

    await workspace.save();

    res.status(200).json({
        status: 'success',
        message: 'Vous avez rejoint le workspace avec succès',
        data: {
            workspace
        }
    });
});
