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
    visibilite: {
        type: String,
        enum: ['public', 'prive'],
        default: 'public'
    },
    membres: [{
        utilisateur: {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['membre', 'moderateur', 'admin'],
            default: 'membre'
        }
    }],
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

// Méthodes pour vérifier les permissions
canalSchema.methods.hasPermission = function(userId, permission) {
    const membre = this.membres.find(m => m.utilisateur.toString() === userId.toString());
    if (!membre) return false;

    // Obtenir toutes les permissions du rôle + rôles inférieurs
    let permissions = [];
    switch(membre.role) {
        case 'admin':
            permissions = [...permissions, ...PERMISSIONS.admin];
        case 'moderateur':
            permissions = [...permissions, ...PERMISSIONS.moderateur];
        case 'membre':
            permissions = [...permissions, ...PERMISSIONS.membre];
    }

    return permissions.includes(permission);
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
