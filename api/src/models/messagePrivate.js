const mongoose = require('mongoose');

const messagePrivateSchema = new mongoose.Schema({
    contenu: {
        type: String,
        required: [true, 'Un message ne peut pas être vide'],
        trim: true,
        maxLength: [2000, 'Un message ne peut pas dépasser 2000 caractères']
    },
    expediteur: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Un message doit avoir un expéditeur']
    },
    // Champ destinataire conservé pour la rétrocompatibilité
    destinataire: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    // Nouveau champ pour référencer la conversation
    conversation: {
        type: mongoose.Schema.ObjectId,
        ref: 'ConversationPrivee'
    },
    lu: {
        // Tableau des utilisateurs qui ont lu le message
        type: [{
            utilisateur: {
                type: mongoose.Schema.ObjectId,
                ref: 'User'
            },
            dateLecture: {
                type: Date,
                default: Date.now
            }
        }],
        default: []
    },
    envoye: {
        type: Boolean,
        default: true
    },
    reponseA: {
        type: mongoose.Schema.ObjectId,
        ref: 'MessagePrivate'
    },
    horodatage: {
        type: Date,
        default: Date.now
    },
    modifie: {
        type: Boolean,
        default: false
    },
    dateModification: {
        type: Date,
        default: null
    },
    // Utilisateurs mentionnés dans le message
    mentions: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Middleware pour extraire les mentions (@username) du contenu du message
messagePrivateSchema.pre('save', async function(next) {
    try {
        // Ne traiter les mentions que si le contenu a été modifié
        if (!this.isModified('contenu')) {
            return next();
        }
        
        // Extraire les mentions (@username)
        const mentionsMatch = this.contenu.match(/@(\w+)/g);
        
        // Si aucune mention, continuer
        if (!mentionsMatch || mentionsMatch.length === 0) {
            this.mentions = [];
            return next();
        }
        
        // Convertir les mentions en noms d'utilisateurs
        const usernames = mentionsMatch.map(mention => mention.substring(1));
        
        // Récupérer les utilisateurs correspondants
        const User = mongoose.model('User');
        const users = await User.find({ username: { $in: usernames } });
        
        // Si aucun utilisateur trouvé, continuer
        if (!users || users.length === 0) {
            this.mentions = [];
            return next();
        }
        
        // Si le message est associé à une conversation, vérifier que les utilisateurs mentionnés sont des participants
        if (this.conversation) {
            const ConversationPrivee = mongoose.model('ConversationPrivee');
            const conversation = await ConversationPrivee.findById(this.conversation);
            
            if (conversation) {
                // Filtrer les utilisateurs qui sont des participants actuels de la conversation
                const participantIds = conversation.participants.map(p => p.utilisateur.toString());
                const validMentions = users.filter(user => participantIds.includes(user._id.toString()));
                
                // Mettre à jour les mentions avec les utilisateurs valides
                this.mentions = validMentions.map(user => user._id);
            } else {
                // Si la conversation n'existe pas, ne pas ajouter de mentions
                this.mentions = [];
            }
        } else if (this.destinataire) {
            // Pour les messages directs (ancien système), n'autoriser que la mention du destinataire
            const validMentions = users.filter(user => user._id.toString() === this.destinataire.toString());
            this.mentions = validMentions.map(user => user._id);
        } else {
            // Cas par défaut (ne devrait pas arriver)
            this.mentions = [];
        }
        
        next();
    } catch (error) {
        console.error('Erreur lors de l\'extraction des mentions:', error);
        next(error);
    }
});

// Index pour améliorer les performances des requêtes
messagePrivateSchema.index({ expediteur: 1, destinataire: 1 });
messagePrivateSchema.index({ horodatage: -1 });

// Méthode virtuelle pour obtenir l'ID de la conversation
messagePrivateSchema.virtual('conversationId').get(function() {
    return [this.expediteur, this.destinataire].sort().join('_');
});

const MessagePrivate = mongoose.model('MessagePrivate', messagePrivateSchema);
module.exports = MessagePrivate;
