const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    contenu: {
        type: String,
        required: [true, 'Un message ne peut pas être vide'],
        trim: true,
        maxLength: [2000, 'Un message ne peut pas dépasser 2000 caractères']
    },
    auteur: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Un message doit avoir un auteur']
    },
    canal: {
        type: mongoose.Schema.ObjectId,
        ref: 'Canal',
        required: [true, 'Un message doit appartenir à un canal']
    },
    mentions: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }],
    canalsReferenced: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Canal'
    }],
    reponseA: {
        type: mongoose.Schema.ObjectId,
        ref: 'Message'
    },
    fichiers: [{
        nom: String,
        type: String,
        url: String,
        taille: Number
    }],
    reactions: [{
        emoji: String,
        utilisateurs: [{
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }]
    }],
    modifie: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Index pour la recherche
messageSchema.index({ contenu: 'text' });

// Index composé pour le canal et la date de création
messageSchema.index({ canal: 1, createdAt: -1 });

// Méthodes d'instance
messageSchema.methods.estAuteur = function(userId) {
    return this.auteur.toString() === userId.toString();
};

messageSchema.methods.peutModifier = function(userId) {
    return this.estAuteur(userId);
};

messageSchema.methods.peutSupprimer = function(userId, userRole) {
    return this.estAuteur(userId) || userRole === 'admin';
};

messageSchema.methods.ajouterReaction = function(emoji, userId) {
    // Trouver la réaction existante avec cet emoji
    let reaction = this.reactions.find(r => r.emoji === emoji);
    
    if (reaction) {
        // Vérifier si l'utilisateur a déjà réagi avec cet emoji
        const dejaReagi = reaction.utilisateurs.some(u => u.toString() === userId.toString());
        if (dejaReagi) {
            // Si oui, retirer sa réaction
            reaction.utilisateurs = reaction.utilisateurs.filter(u => u.toString() !== userId.toString());
            if (reaction.utilisateurs.length === 0) {
                // Si plus personne n'utilise cet emoji, le retirer
                this.reactions = this.reactions.filter(r => r.emoji !== emoji);
            }
        } else {
            // Si non, ajouter sa réaction
            reaction.utilisateurs.push(userId);
        }
    } else {
        // Créer une nouvelle réaction
        this.reactions.push({
            emoji,
            utilisateurs: [userId]
        });
    }
};

// Middleware pour extraire les mentions et références de canaux
messageSchema.pre('save', async function(next) {
    if (this.isModified('contenu')) {
        // Extraire les mentions (@username)
        const mentionsMatch = this.contenu.match(/@(\w+)/g);
        if (mentionsMatch) {
            // Convertir les mentions en IDs d'utilisateurs
            const User = mongoose.model('User');
            const usernames = mentionsMatch.map(mention => mention.substring(1));
            const users = await User.find({ username: { $in: usernames } });
            
            // Stocker les IDs des utilisateurs trouvés
            this.mentions = users.map(user => user._id);
        } else {
            this.mentions = [];
        }

        // Extraire les références de canaux (#canal)
        const canalsMatch = this.contenu.match(/#(\w+)/g);
        if (canalsMatch) {
            this.canalsReferenced = canalsMatch.map(canal => canal.substring(1));
        }

        // Marquer comme modifié si ce n'est pas une nouvelle création
        if (!this.isNew) {
            this.modifie = true;
        }
    }
    next();
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
