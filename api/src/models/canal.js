const mongoose = require('mongoose');

// Définition des permissions par rôle
const PERMISSIONS = {
    membre: [
        'lire',
        'envoyerMessage',
        'uploadFichier'
    ],
    moderateur: [
        'supprimerMessage',
        'gererFichiers',
        'gererMembres'
    ],
    admin: [
        'modifierCanal',
        'supprimerCanal',
        'gererRoles'
    ]
};

const canalSchema = new mongoose.Schema({
    nom: {
        type: String,
        required: [true, 'Un canal doit avoir un nom'],
        trim: true,
        maxLength: [50, 'Le nom du canal ne peut pas dépasser 50 caractères']
    },
    description: {
        type: String,
        trim: true,
        maxLength: [200, 'La description ne peut pas dépasser 200 caractères']
    },
    workspace: {
        type: mongoose.Schema.ObjectId,
        ref: 'Workspace',
        required: [true, 'Un canal doit appartenir à un workspace']
    },
    createur: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Un canal doit avoir un créateur']
    },
    dateCreation: {
        type: Date,
        default: Date.now
    },
    type: {
        type: String,
        enum: ['texte', 'vocal'],
        default: 'texte'
    },
    visibilite: {
        type: String,
        enum: ['public', 'prive'],
        default: 'public'
    },
    membres: [{
        utilisateur: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: true
        },
        role: {
            type: String,
            enum: ['admin', 'moderateur', 'membre'],
            default: 'membre'
        },
        dateAjout: {
            type: Date,
            default: Date.now
        }
    }],
    parametresVocal: {
        participantsActifs: [{
            utilisateur: {
                type: mongoose.Schema.ObjectId,
                ref: 'User'
            },
            camera: {
                type: Boolean,
                default: false
            },
            micro: {
                type: Boolean,
                default: false
            },
            partageEcran: {
                type: Boolean,
                default: false
            },
            dateJoint: {
                type: Date,
                default: Date.now
            }
        }],
        limiteParticipants: {
            type: Number,
            default: 25
        }
    },
    fichiers: [{
        nom: String,
        type: String,
        url: String,
        taille: Number,
        uploadePar: {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    }],
    parametres: {
        extensionsAutorisees: {
            type: [String],
            default: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx']
        },
        tailleMaxFichier: {
            type: Number,
            default: 5 * 1024 * 1024 // 5MB par défaut
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Middleware pour supprimer les messages et fichiers associés avant la suppression du canal
canalSchema.pre('remove', async function(next) {
    try {
        // Récupérer les messages du canal pour avoir accès aux fichiers
        const Message = require('./message');
        const messages = await Message.find({ canal: this._id });

        // Supprimer les fichiers des messages
        const fichierService = require('../services/fichierService');
        for (const message of messages) {
            if (message.fichiers && message.fichiers.length > 0) {
                for (const fichier of message.fichiers) {
                    await fichierService.supprimerFichier(fichier.url);
                }
            }
        }

        // Supprimer les fichiers du canal lui-même
        if (this.fichiers && this.fichiers.length > 0) {
            for (const fichier of this.fichiers) {
                await fichierService.supprimerFichier(fichier.url);
            }
        }

        // Supprimer tous les messages du canal
        await Message.deleteMany({ canal: this._id });

        next();
    } catch (error) {
        next(error);
    }
});

// Méthodes pour vérifier les permissions
canalSchema.methods.hasPermission = function(userId, permission) {
    // Convertir userId en string pour la comparaison
    const userIdStr = userId.toString();
    
    // Trouver le membre dans le canal
    let membre = null;
    for (const m of this.membres) {
        // Vérifier si l'utilisateur est un objet ou juste un ID
        const membreId = m.utilisateur._id ? m.utilisateur._id.toString() : m.utilisateur.toString();
        if (membreId === userIdStr) {
            membre = m;
            break;
        }
    }
    
    // Si l'utilisateur n'est pas membre du canal, il n'a aucune permission
    if (!membre) {
        console.log(`L'utilisateur ${userId} n'est pas membre du canal`);
        return false;
    }
    
    console.log(`Vérification de la permission ${permission} pour l'utilisateur ${userId} avec le rôle ${membre.role}`);
    
    // Obtenir toutes les permissions du rôle + rôles inférieurs
    let permissions = [];
    
    // S'assurer que les admins ont toutes les permissions (admin, moderateur, membre)
    if (membre.role === 'admin') {
        permissions = [...PERMISSIONS.admin, ...PERMISSIONS.moderateur, ...PERMISSIONS.membre];
    }
    // S'assurer que les moderateurs ont toutes les permissions des moderateurs et membres
    else if (membre.role === 'moderateur') {
        permissions = [...PERMISSIONS.moderateur, ...PERMISSIONS.membre];
    }
    // Les membres n'ont que les permissions des membres
    else if (membre.role === 'membre') {
        permissions = [...PERMISSIONS.membre];
    }
    
    const hasPermission = permissions.includes(permission);
    console.log(`Permissions disponibles pour ${membre.role}:`, permissions);
    console.log(`L'utilisateur ${userId} ${hasPermission ? 'a' : 'n\'a pas'} la permission ${permission}`);
    
    return hasPermission;
};

canalSchema.methods.peutLire = function(userId) {
    return this.hasPermission(userId, 'lire');
};

canalSchema.methods.peutEnvoyerMessage = function(userId) {
    return this.hasPermission(userId, 'envoyerMessage');
};

canalSchema.methods.peutGererMessages = function(userId) {
    return this.hasPermission(userId, 'supprimerMessage');
};

canalSchema.methods.peutGererFichiers = function(userId) {
    return this.hasPermission(userId, 'gererFichiers');
};

canalSchema.methods.peutGererMembres = function(userId) {
    return this.hasPermission(userId, 'gererMembres');
};

canalSchema.methods.peutModifierCanal = function(userId) {
    return this.hasPermission(userId, 'modifierCanal');
};

canalSchema.methods.peutSupprimerCanal = function(userId) {
    return this.hasPermission(userId, 'supprimerCanal');
};

canalSchema.methods.peutGererRoles = function(userId) {
    return this.hasPermission(userId, 'gererRoles');
};

canalSchema.methods.estMembre = function(userId) {
    return this.membres.some(m => m.utilisateur.toString() === userId.toString());
};

canalSchema.methods.verifierExtensionFichier = function(nomFichier) {
    const extension = '.' + nomFichier.split('.').pop().toLowerCase();
    return this.parametres.extensionsAutorisees.includes(extension);
};

// Index pour la recherche
canalSchema.index({ nom: 'text', description: 'text' });

// Index composé pour workspace et visibilité
canalSchema.index({ workspace: 1, visibilite: 1 });

const Canal = mongoose.model('Canal', canalSchema);

module.exports = Canal;
