const Canal = require('../models/canal');
const Message = require('../models/message');
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
    }).populate('membres.utilisateur', 'username email profilePicture');

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

    // Utiliser let au lieu de const pour permettre la réassignation plus tard
    let canal = await Canal.findOne({
        _id: req.params.id,
        workspace: req.params.workspaceId,
        $or: [
            { visibilite: 'public' },
            { 
                visibilite: 'prive',
                'membres.utilisateur': req.user.id 
            }
        ]
    }).populate('membres.utilisateur', 'username email profilePicture');

    if (!canal) {
        return next(new AppError('Canal non trouvé ou accès non autorisé', 404));
    }

    // Pour les canaux publics, ajouter automatiquement l'utilisateur comme membre s'il ne l'est pas déjà
    if (canal.visibilite === 'public') {
        // Vérifier si l'utilisateur est déjà membre en utilisant les IDs
        const estMembre = canal.membres.some(membre => 
            membre.utilisateur && 
            (membre.utilisateur._id 
                ? membre.utilisateur._id.toString() === req.user.id.toString() 
                : membre.utilisateur.toString() === req.user.id.toString())
        );
        
        if (!estMembre) {
            canal.membres.push({
                utilisateur: req.user.id,
                role: 'membre'
            });
            await canal.save();
            
            // Recharger le canal avec les membres populés pour éviter "Utilisateur Inconnu"
            const canalMisAJour = await Canal.findById(canal._id)
                .populate('membres.utilisateur', 'username email profilePicture');
                
            if (canalMisAJour) {
                canal = canalMisAJour;
            }
        }
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
    if (!canal.peutModifier(req.user.id)) {
        return next(new AppError('Vous n\'avez pas la permission de modifier ce canal', 403));
    }

    // Filtrer les champs autorisés
    const filteredBody = {};
    if (req.body.nom) filteredBody.nom = req.body.nom;
    if (req.body.description) filteredBody.description = req.body.description;
    if (req.body.visibilite) filteredBody.visibilite = req.body.visibilite;

    const updatedCanal = await Canal.findByIdAndUpdate(
        req.params.id,
        filteredBody,
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

    // Supprimer d'abord les messages associés
    console.log(`Suppression des messages du canal: ${canal._id}`);
    const messagesSupprimes = await Message.deleteMany({ canal: canal._id });
    console.log(`${messagesSupprimes.deletedCount} messages supprimés`);
    
    // Supprimer également les réactions et les fichiers associés aux messages
    // Note: Cela pourrait être géré par des hooks dans le modèle Message si nécessaire

    // Puis supprimer le canal
    await canal.deleteOne();

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

    const canal = await Canal.findOne({
        _id: req.params.id,
        workspace: req.params.workspaceId
    });

    if (!canal) {
        return next(new AppError('Canal non trouvé', 404));
    }

    // Vérifier si l'utilisateur courant est membre du canal
    const membreCourant = canal.membres.find(m => 
        m.utilisateur.toString() === req.user.id.toString()
    );

    if (!membreCourant) {
        return next(new AppError('Vous n\'êtes pas membre de ce canal', 403));
    }

    // Autoriser explicitement les administrateurs et modérateurs
    if (!['admin', 'moderateur'].includes(membreCourant.role)) {
        return next(new AppError('Vous n\'avez pas la permission d\'ajouter des membres', 403));
    }

    // Vérifier si l'utilisateur à ajouter existe et est membre du workspace
    const utilisateurId = req.body.utilisateur || req.body.utilisateurId;
    if (!utilisateurId) {
        return next(new AppError('ID utilisateur requis', 400));
    }
    
    // Vérifier si l'utilisateur est membre du workspace
    const membreWorkspace = workspace.membres.find(m => 
        m.utilisateur.toString() === utilisateurId.toString()
    );

    if (!membreWorkspace) {
        return next(new AppError('L\'utilisateur n\'est pas membre du workspace', 400));
    }

    // Vérifier si l'utilisateur est déjà membre du canal
    const dejaMembreCanal = canal.membres.find(m => 
        m.utilisateur.toString() === utilisateurId.toString()
    );

    if (dejaMembreCanal) {
        return next(new AppError('L\'utilisateur est déjà membre du canal', 400));
    }

    // Définir le rôle (par défaut 'membre')
    const role = req.body.role && ['admin', 'moderateur', 'membre'].includes(req.body.role) 
        ? req.body.role 
        : 'membre';

    // Ajouter l'utilisateur comme membre
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
    }).populate('membres.utilisateur', 'username email profilePicture');

    if (!canal) {
        return next(new AppError('Canal non trouvé', 404));
    }

    // Vérifier si l'utilisateur courant est membre du canal avec des droits d'admin
    if (!canal.peutGererMembres(req.user.id)) {
        return next(new AppError('Vous n\'avez pas la permission de modifier les rôles', 403));
    }

    // Vérifier si le membre à modifier existe
    const membre = canal.membres.id(req.params.membreId);
    if (!membre) {
        return next(new AppError('Membre non trouvé', 404));
    }

    // Vérifier le rôle demandé
    if (!['admin', 'moderateur', 'membre'].includes(req.body.role)) {
        return next(new AppError('Rôle invalide. Doit être "admin", "moderateur" ou "membre"', 400));
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
// Note: Les méthodes de gestion des fichiers ont été déplacées vers fichierController.js

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
    }).populate('membres.utilisateur', 'username email profilePicture');

    if (!canal) {
        return next(new AppError('Canal non trouvé', 404));
    }

    // Vérifier les permissions
    if (!canal.peutGererMembres(req.user.id)) {
        return next(new AppError('Vous n\'avez pas la permission de gérer les membres', 403));
    }

    canal.membres.pull(req.params.membreId);
    await canal.save();
    
    // Recharger le canal pour obtenir les données à jour
    const canalMisAJour = await Canal.findById(canal._id).populate('membres.utilisateur', 'username email profilePicture');

    res.status(200).json({
        status: 'success',
        data: {
            canal: canalMisAJour
        }
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
    }).populate('membres.utilisateur', 'username email profilePicture');

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

// Rechercher des canaux publics (pour les mentions)
exports.rechercherCanauxPublics = catchAsync(async (req, res, next) => {
    const { q, all } = req.query;
    
    // Si ni q ni all ne sont fournis, renvoyer une erreur
    if (!q && all !== 'true') {
        return res.status(400).json({
            status: 'fail',
            message: 'Un terme de recherche (q) ou le paramètre all=true est requis'
        });
    }
    
    let query = { visibilite: 'public' };
    
    // Si un terme de recherche est fourni, ajouter la condition de recherche
    if (q) {
        query.$or = [
            { nom: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } }
        ];
    }
    
    // Récupérer les canaux publics qui correspondent à la recherche
    const canaux = await Canal.find(query)
        .select('_id nom description workspace visibilite')
        .populate('workspace', 'nom')
        .limit(all === 'true' ? 50 : 10);
    
    // Transformer les résultats pour inclure le nom du workspace
    const canauxAvecWorkspace = canaux.map(canal => {
        const workspaceNom = canal.workspace ? canal.workspace.nom : 'Workspace inconnu';
        return {
            _id: canal._id,
            nom: canal.nom,
            description: canal.description,
            workspaceId: canal.workspace._id,
            workspaceNom: workspaceNom,
            visibilite: canal.visibilite,
            // Créer un identifiant unique pour le canal (pour les mentions)
            mentionId: `${canal._id}:${canal.workspace._id}`
        };
    });
    
    res.status(200).json({
        status: 'success',
        results: canauxAvecWorkspace.length,
        data: {
            canaux: canauxAvecWorkspace
        }
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
    }).populate('membres.utilisateur', 'username email profilePicture');

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
