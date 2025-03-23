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
        visibilite: req.body.visibilite || 'prive',
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
    console.log('Obtenir workspace - ID:', req.params.id);
    console.log('Utilisateur connecté:', req.user.id);

    const workspace = await Workspace.findById(req.params.id)
        .populate('proprietaire', 'nom email')
        .populate('membres.utilisateur', 'nom email');

    if (!workspace) {
        console.log('Workspace non trouvé');
        return next(new AppError('Workspace non trouvé', 404));
    }

    console.log('Workspace trouvé:', {
        id: workspace._id,
        nom: workspace.nom,
        visibilite: workspace.visibilite,
        membres: workspace.membres.map(m => ({
            id: m.utilisateur._id || m.utilisateur,
            role: m.role
        }))
    });

    // Vérifier si l'utilisateur est membre ou si le workspace est public
    const estMembre = workspace.estMembre(req.user.id);
    console.log('Est membre?', estMembre);
    console.log('Est public?', workspace.visibilite === 'public');

    if (workspace.visibilite === 'prive' && !estMembre) {
        console.log('Accès refusé - workspace privé et utilisateur non membre');
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

// Envoyer une invitation à un utilisateur
exports.envoyerInvitation = catchAsync(async (req, res, next) => {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
        return next(new AppError('Workspace non trouvé', 404));
    }

    // Vérifier si l'utilisateur est admin
    if (!workspace.estAdmin(req.user.id)) {
        return next(new AppError('Seuls les administrateurs peuvent envoyer des invitations', 403));
    }

    // Vérifier si l'utilisateur invité existe
    const utilisateurInvite = await User.findById(req.params.userId);
    if (!utilisateurInvite) {
        return next(new AppError('Utilisateur non trouvé', 404));
    }

    // Vérifier si l'utilisateur est déjà membre
    if (workspace.estMembre(utilisateurInvite.id)) {
        return next(new AppError('Cet utilisateur est déjà membre du workspace', 400));
    }

    // Générer un token d'invitation
    const token = workspace.genererTokenInvitation(utilisateurInvite.id, utilisateurInvite.email);
    await workspace.save();

    // Envoyer l'email d'invitation
    await envoyerEmailInvitationWorkspace(
        utilisateurInvite.email,
        workspace.nom,
        token,
        req.user.nom
    );

    res.status(200).json({
        status: 'success',
        message: 'Invitation envoyée avec succès'
    });
});

// Accepter une invitation
exports.accepterInvitation = catchAsync(async (req, res, next) => {
    const workspace = await Workspace.findById(req.params.workspaceId);
    if (!workspace) {
        return next(new AppError('Workspace non trouvé', 404));
    }

    // Vérifier le token d'invitation
    const invitation = workspace.verifierTokenInvitation(req.params.token);
    if (!invitation) {
        return next(new AppError('Token d\'invitation invalide ou expiré', 400));
    }

    // Vérifier que l'utilisateur qui accepte est bien celui qui a été invité
    if (invitation.utilisateur.toString() !== req.user.id) {
        return next(new AppError('Cette invitation ne vous est pas destinée', 403));
    }

    // Ajouter l'utilisateur comme membre
    if (!workspace.estMembre(req.user.id)) {
        workspace.membres.push({
            utilisateur: req.user.id,
            role: 'membre'
        });
    }

    // Supprimer l'invitation
    workspace.invitationsEnAttente = workspace.invitationsEnAttente.filter(
        inv => inv.token !== req.params.token
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
