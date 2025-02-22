const mongoose = require('mongoose');
const crypto = require('crypto');

const workspaceSchema = new mongoose.Schema({
    nom: {
        type: String,
        required: [true, 'Un nom est requis pour le workspace'],
        trim: true,
        maxLength: [50, 'Le nom ne peut pas dépasser 50 caractères']
    },
    description: {
        type: String,
        trim: true,
        maxLength: [500, 'La description ne peut pas dépasser 500 caractères']
    },
    proprietaire: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    visibilite: {
        type: String,
        enum: ['public', 'prive'],
        default: 'prive'
    },
    membres: [{
        utilisateur: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['admin', 'membre'],
            default: 'membre'
        },
        dateAjout: {
            type: Date,
            default: Date.now
        }
    }],
    canaux: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Canal'
    }],
    invitationsEnAttente: [{
        utilisateur: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        token: String,
        dateExpiration: Date,
        email: String
    }]
}, {
    timestamps: true
});

// Index pour améliorer les performances des recherches
workspaceSchema.index({ nom: 'text', description: 'text' });

// Méthode pour vérifier si un utilisateur est membre du workspace
workspaceSchema.methods.estMembre = function(userId) {
    return this.membres.some(membre => 
        membre.utilisateur.toString() === userId.toString()
    );
};

// Méthode pour vérifier si un utilisateur est admin du workspace
workspaceSchema.methods.estAdmin = function(userId) {
    return this.membres.some(membre => 
        membre.utilisateur.toString() === userId.toString() && 
        membre.role === 'admin'
    );
};

// Méthode pour générer un token d'invitation
workspaceSchema.methods.genererTokenInvitation = function(userId, email) {
    const token = crypto.randomBytes(32).toString('hex');
    const dateExpiration = new Date();
    dateExpiration.setHours(dateExpiration.getHours() + 24); // Expire après 24h

    // Supprimer toute invitation existante pour cet utilisateur
    this.invitationsEnAttente = this.invitationsEnAttente.filter(
        invitation => invitation.utilisateur.toString() !== userId.toString()
    );

    // Ajouter la nouvelle invitation
    this.invitationsEnAttente.push({
        utilisateur: userId,
        token,
        dateExpiration,
        email
    });

    return token;
};

// Méthode pour vérifier un token d'invitation
workspaceSchema.methods.verifierTokenInvitation = function(token) {
    const invitation = this.invitationsEnAttente.find(inv => inv.token === token);
    
    if (!invitation) {
        return null;
    }

    if (invitation.dateExpiration < new Date()) {
        // Supprimer l'invitation expirée
        this.invitationsEnAttente = this.invitationsEnAttente.filter(
            inv => inv.token !== token
        );
        return null;
    }

    return invitation;
};

const Workspace = mongoose.model('Workspace', workspaceSchema);
module.exports = Workspace;
