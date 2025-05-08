const Workspace = require('../models/workspace');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/user');
const Canal = require('../models/canal');
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

    // Créer le canal Général
    await Canal.create({
        nom: 'Général',
        description: 'Canal général du workspace',
        workspace: workspace._id,
        createur: req.user.id,
        type: 'texte',
        visibilite: 'public',
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
    })
        .populate('proprietaire', 'firstName lastName username email')
        .populate('membres.utilisateur', 'firstName lastName username email');

    res.status(200).json({
        status: 'success',
        resultats: workspaces.length,
        data: {
            workspaces
        }
    });
});

// Obtenir uniquement les workspaces dont l'utilisateur est membre
exports.obtenirMesWorkspaces = catchAsync(async (req, res) => {
    const workspaces = await Workspace.find({
        'membres.utilisateur': req.user.id
    })
        .populate('proprietaire', 'firstName lastName username email')
        .populate('membres.utilisateur', 'firstName lastName username email profilePicture')
        .sort({ 'nom': 1 }); // Tri par nom par ordre alphabétique

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
        .populate('proprietaire', 'firstName lastName username email')
        .populate('membres.utilisateur', 'firstName lastName username email');

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

    if (workspace.proprietaire.toString() !== req.user.id) {
        return next(new AppError('Seul le propriétaire peut modifier le workspace', 403));
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

    const { email } = req.body;
    if (!email) {
        return next(new AppError('L\'adresse email est requise', 400));
    }

    // Vérifier si l'utilisateur est déjà membre
    const utilisateurInvite = await User.findOne({ email });
    
    if (utilisateurInvite) {
        const estDejaMembre = workspace.estMembre(utilisateurInvite._id);
        if (estDejaMembre) {
            return next(new AppError('Cet utilisateur est déjà membre du workspace', 400));
        }

        // Vérifier si une invitation est déjà en attente pour un utilisateur existant
        const invitationExistante = workspace.invitationsEnAttente.find(
            invitation => invitation.email === email
        );
        if (invitationExistante) {
            return next(new AppError('Une invitation est déjà en attente pour cet utilisateur', 400));
        }
    } else {
        // Vérifier si une invitation est déjà en attente pour un email
        const invitationExistante = workspace.invitationsEnAttente.find(
            invitation => invitation.email === email
        );
        if (invitationExistante) {
            return next(new AppError('Une invitation est déjà en attente pour cet email', 400));
        }
    }

    try {
        // Générer un token d'invitation
        const token = workspace.genererTokenInvitation(
            utilisateurInvite ? utilisateurInvite._id : null,
            email
        );
        await workspace.save();

        // Construire l'URL d'invitation
        const urlInvitation = `${process.env.FRONTEND_URL}/workspaces/invitation/${workspace._id}/${token}`;

        // Envoyer l'email d'invitation
        // Récupérer le nom de l'inviteur
        const inviteur = await User.findById(req.user.id);
        
        await envoyerEmailInvitationWorkspace(
            email,  // email du destinataire
            inviteur.nom,  // nom de l'inviteur
            workspace.nom,  // nom du workspace
            workspace.description || '',  // description du workspace
            urlInvitation  // URL d'invitation complète
        );

        res.status(200).json({
            status: 'success',
            message: 'Invitation envoyée avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'invitation:', error);
        return next(new AppError('Une erreur est survenue lors de l\'envoi de l\'invitation', 500));
    }
});

// Méthode pour vérifier un token d'invitation
exports.verifierInvitation = catchAsync(async (req, res, next) => {
    const workspace = await Workspace.findById(req.params.workspaceId);
    if (!workspace) {
        return next(new AppError('Workspace non trouvé', 404));
    }

    // Vérifier si l'invitation existe
    const invitation = workspace.invitationsEnAttente.find(
        inv => inv.token === req.params.token
    );

    if (!invitation) {
        return next(new AppError('Invitation invalide ou expirée', 400));
    }

    // Vérifier si l'utilisateur est déjà inscrit
    const estInscrit = await User.exists({ email: invitation.email });

    res.status(200).json({
        status: 'success',
        data: {
            workspaceId: workspace._id,
            workspaceNom: workspace.nom,
            email: invitation.email,
            token: invitation.token,
            estInscrit: !!estInscrit
        }
    });
});

// Méthode pour accepter une invitation
exports.accepterInvitation = catchAsync(async (req, res, next) => {
    const workspace = await Workspace.findById(req.params.workspaceId);
    if (!workspace) {
        return next(new AppError('Workspace non trouvé', 404));
    }

    const invitation = workspace.verifierTokenInvitation(req.params.token);
    if (!invitation) {
        return next(new AppError('Invitation invalide ou expirée', 400));
    }

    // Vérifier que l'email de l'invitation correspond à l'utilisateur connecté
    if (invitation.email !== req.user.email) {
        return next(new AppError('Cette invitation ne vous est pas destinée', 403));
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

// Ajouter un membre au workspace
exports.ajouterMembre = catchAsync(async (req, res, next) => {
    const { utilisateurId, role = 'membre' } = req.body;

    // Vérifier si le workspace existe
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
        return next(new AppError('Workspace non trouvé', 404));
    }

    // Vérifier si l'utilisateur actuel a les droits d'admin
    const membreActuel = workspace.membres.find(
        membre => membre.utilisateur.toString() === req.user.id
    );
    if (!membreActuel || membreActuel.role !== 'admin') {
        return next(new AppError('Vous n\'avez pas les droits pour ajouter des membres', 403));
    }

    // Vérifier si l'utilisateur à ajouter existe
    const utilisateur = await User.findById(utilisateurId);
    if (!utilisateur) {
        return next(new AppError('Utilisateur non trouvé', 404));
    }

    // Vérifier si l'utilisateur est déjà membre
    const dejaMembre = workspace.membres.some(
        membre => membre.utilisateur.toString() === utilisateurId
    );
    if (dejaMembre) {
        return next(new AppError('L\'utilisateur est déjà membre de ce workspace', 400));
    }

    // Ajouter le nouveau membre
    workspace.membres.push({
        utilisateur: utilisateurId,
        role: role
    });

    await workspace.save();

    res.status(200).json({
        status: 'success',
        message: 'Membre ajouté avec succès',
        data: {
            workspace
        }
    });
});

// Supprimer un membre
exports.supprimerMembre = catchAsync(async (req, res, next) => {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
        return next(new AppError('Workspace non trouvé', 404));
    }

    // Vérifier si l'utilisateur est admin
    if (!workspace.estAdmin(req.user.id)) {
        return next(new AppError('Seuls les administrateurs peuvent supprimer des membres', 403));
    }

    // Vérifier que le membre existe
    const membre = workspace.membres.find(m => m.utilisateur.toString() === req.params.membreId);
    if (!membre) {
        return next(new AppError('Membre non trouvé', 404));
    }

    // Empêcher la suppression du dernier admin
    if (membre.role === 'admin' && workspace.membres.filter(m => m.role === 'admin').length === 1) {
        return next(new AppError('Impossible de supprimer le dernier administrateur', 400));
    }

    // Empêcher la suppression du propriétaire
    if (workspace.proprietaire.toString() === req.params.membreId) {
        return next(new AppError('Impossible de supprimer le propriétaire du workspace', 400));
    }

    workspace.membres = workspace.membres.filter(m => m.utilisateur.toString() !== req.params.membreId);
    await workspace.save();

    res.status(204).json({
        status: 'success',
        data: null
    });
});

// Modifier le rôle d'un membre
exports.modifierRoleMembre = catchAsync(async (req, res, next) => {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
        return next(new AppError('Workspace non trouvé', 404));
    }

    // Vérifier si l'utilisateur est admin
    if (!workspace.estAdmin(req.user.id)) {
        return next(new AppError('Seuls les administrateurs peuvent modifier les rôles', 403));
    }

    // Vérifier que le rôle est valide
    if (!['membre', 'moderateur', 'admin'].includes(req.body.role)) {
        return next(new AppError('Rôle invalide. Doit être "membre", "moderateur" ou "admin"', 400));
    }

    // Vérifier que le membre existe
    const membre = workspace.membres.find(m => m.utilisateur.toString() === req.params.membreId);
    if (!membre) {
        return next(new AppError('Membre non trouvé', 404));
    }

    // Empêcher la modification du rôle du propriétaire
    if (workspace.proprietaire.toString() === req.params.membreId) {
        return next(new AppError('Impossible de modifier le rôle du propriétaire', 400));
    }

    // Si on rétrograde le dernier admin
    if (membre.role === 'admin' && req.body.role !== 'admin' && 
        workspace.membres.filter(m => m.role === 'admin').length === 1) {
        return next(new AppError('Impossible de rétrograder le dernier administrateur', 400));
    }

    membre.role = req.body.role;
    await workspace.save();

    res.status(200).json({
        status: 'success',
        data: {
            workspace
        }
    });
});

// Révoquer une invitation
exports.revoquerInvitation = catchAsync(async (req, res, next) => {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
        return next(new AppError('Workspace non trouvé', 404));
    }

    // Vérifier si l'utilisateur est admin
    if (!workspace.estAdmin(req.user.id)) {
        return next(new AppError('Seuls les administrateurs peuvent révoquer des invitations', 403));
    }

    // Vérifier que l'invitation existe
    const invitation = workspace.invitationsEnAttente.find(inv => inv.token === req.params.token);
    if (!invitation) {
        return next(new AppError('Invitation non trouvée', 404));
    }

    workspace.invitationsEnAttente = workspace.invitationsEnAttente.filter(
        inv => inv.token !== req.params.token
    );

    await workspace.save();

    res.status(204).json({
        status: 'success',
        data: null
    });
});
