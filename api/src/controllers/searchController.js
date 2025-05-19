const Workspace = require('../models/workspace');
const Canal = require('../models/canal');
const Message = require('../models/message');
const User = require('../models/user');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const searchController = {
    /**
     * Rechercher des workspaces auxquels l'utilisateur appartient
     */
    searchMyWorkspaces: catchAsync(async (req, res) => {
        const searchTerm = req.query.q || '';
        
        // Construire la requête de recherche
        let query = {
            'membres.utilisateur': req.user.id
        };
        
        // Ajouter la recherche par terme si fourni
        if (searchTerm && searchTerm.trim() !== '') {
            query.$or = [
                { nom: { $regex: searchTerm, $options: 'i' } },
                { description: { $regex: searchTerm, $options: 'i' } }
            ];
        }
        
        const workspaces = await Workspace.find(query)
            .populate('proprietaire', 'firstName lastName username email')
            .populate('membres.utilisateur', 'firstName lastName username email')
            .sort({ 'nom': 1 });
        
        res.status(200).json({
            status: 'success',
            results: workspaces.length,
            data: {
                workspaces
            }
        });
    }),
    
    /**
     * Rechercher des canaux dans un workspace spécifique
     */
    searchChannelsInWorkspace: catchAsync(async (req, res, next) => {
        const { workspaceId } = req.params;
        const searchTerm = req.query.q || '';
        
        // Vérifier l'accès au workspace
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return next(new AppError('Workspace non trouvé', 404));
        }
        
        // Vérifier si l'utilisateur est membre du workspace
        if (!workspace.estMembre(req.user.id)) {
            return next(new AppError('Vous n\'avez pas accès à ce workspace', 403));
        }
        
        // Construire la requête de recherche
        let query = {
            workspace: workspaceId,
            $or: [
                { visibilite: 'public' },
                { 'membres.utilisateur': req.user.id }
            ]
        };
        
        // Ajouter la recherche par terme si fourni
        if (searchTerm && searchTerm.trim() !== '') {
            query.$and = [
                {
                    $or: [
                        { nom: { $regex: searchTerm, $options: 'i' } },
                        { description: { $regex: searchTerm, $options: 'i' } }
                    ]
                }
            ];
        }
        
        const canaux = await Canal.find(query)
            .populate('membres.utilisateur', 'username email profilePicture')
            .sort({ 'nom': 1 });
        
        res.status(200).json({
            status: 'success',
            results: canaux.length,
            data: {
                canaux
            }
        });
    }),
    
    /**
     * Rechercher des messages dans un workspace par mots-clés
     */
    searchMessagesInWorkspace: catchAsync(async (req, res, next) => {
        const { workspaceId } = req.params;
        const searchTerm = req.query.q || '';
        
        if (!searchTerm || searchTerm.trim() === '') {
            return next(new AppError('Terme de recherche requis', 400));
        }
        
        // Vérifier l'accès au workspace
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return next(new AppError('Workspace non trouvé', 404));
        }
        
        // Vérifier si l'utilisateur est membre du workspace
        if (!workspace.estMembre(req.user.id)) {
            return next(new AppError('Vous n\'avez pas accès à ce workspace', 403));
        }
        
        // Trouver tous les canaux accessibles à l'utilisateur dans ce workspace
        const canaux = await Canal.find({
            workspace: workspaceId,
            $or: [
                { visibilite: 'public' },
                { 'membres.utilisateur': req.user.id }
            ]
        });
        
        const canalIds = canaux.map(canal => canal._id);
        
        // Rechercher les messages dans ces canaux
        const messages = await Message.find({
            canal: { $in: canalIds },
            contenu: { $regex: searchTerm, $options: 'i' }
        })
        .populate('auteur', 'username firstName lastName profilePicture')
        .populate('canal', 'nom')
        .sort({ createdAt: -1 })
        .limit(50);
        
        res.status(200).json({
            status: 'success',
            results: messages.length,
            data: {
                messages
            }
        });
    }),
    
    /**
     * Rechercher des utilisateurs dans l'application
     */
    searchUsers: catchAsync(async (req, res) => {
        const searchTerm = req.query.q || '';
        const all = req.query.all === 'true';
        
        let query = {};
        
        // Si le paramètre all est fourni, on ne vérifie pas la présence d'un terme de recherche
        if (!all && !searchTerm) {
            return res.status(400).json({
                status: 'error',
                message: 'Un terme de recherche est requis ou le paramètre all=true'
            });
        }
        
        // Ajouter les critères de recherche si all n'est pas spécifié
        if (!all && searchTerm) {
            query.$or = [
                { username: { $regex: searchTerm, $options: 'i' } },
                { firstName: { $regex: searchTerm, $options: 'i' } },
                { lastName: { $regex: searchTerm, $options: 'i' } },
                { email: { $regex: searchTerm, $options: 'i' } }
            ];
        }
        
        // Récupérer les utilisateurs
        const users = await User.find(query)
            .select('_id username firstName lastName email profilePicture status')
            .limit(all ? 50 : 20);
        
        res.status(200).json({
            status: 'success',
            results: users.length,
            data: {
                users
            }
        });
    })
};

module.exports = searchController;
