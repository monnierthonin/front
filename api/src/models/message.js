const mongoose = require('mongoose');

// Définir un sous-schéma pour les fichiers pour assurer une structure cohérente
const fichierSchema = new mongoose.Schema({
    nom: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    urlPreview: {
        type: String,
        required: false
    },
    taille: {
        type: Number,
        required: true
    }
}, { _id: false }); // Pas besoin d'ID pour les sous-documents

const messageSchema = new mongoose.Schema({
    contenu: {
        type: String,
        // Le contenu est requis sauf si un fichier est présent
        required: false,
        trim: true,
        maxLength: [2000, 'Un message ne peut pas dépasser 2000 caractères'],
        validate: {
            validator: function(val) {
                // Le message doit avoir soit du contenu, soit un fichier
                return val || (this.fichiers && this.fichiers.length > 0);
            },
            message: 'Un message doit contenir du texte ou un fichier'
        }
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
    fichiers: [fichierSchema], // Utiliser le sous-schéma pour les fichiers
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
    },
    // Suivi des lectures de messages par utilisateur
    lecteurs: [{
        utilisateur: {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        },
        lu: {
            type: Boolean,
            default: true
        },
        luAt: {
            type: Date,
            default: Date.now
        }
    }]
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

// Méthode pour marquer un message comme lu par un utilisateur
messageSchema.methods.marquerCommeLu = function(userId) {
    // Vérifier si l'utilisateur a déjà lu ce message
    const lecteurIndex = this.lecteurs.findIndex(l => 
        l.utilisateur && l.utilisateur.toString() === userId.toString()
    );
    
    if (lecteurIndex >= 0) {
        // Mettre à jour la date de lecture
        this.lecteurs[lecteurIndex].lu = true;
        this.lecteurs[lecteurIndex].luAt = Date.now();
    } else {
        // Ajouter un nouveau lecteur
        this.lecteurs.push({
            utilisateur: userId,
            lu: true,
            luAt: Date.now()
        });
    }
    
    return this.save();
};

// Méthode pour vérifier si un message a été lu par un utilisateur
messageSchema.methods.estLuPar = function(userId) {
    return this.lecteurs.some(l => 
        l.utilisateur && 
        l.utilisateur.toString() === userId.toString() && 
        l.lu === true
    );
};

// Méthode statique pour marquer plusieurs messages comme lus
messageSchema.statics.marquerPlusieursCommeLus = async function(messageIds, userId) {
    return this.updateMany(
        { _id: { $in: messageIds } },
        { 
            $addToSet: { 
                lecteurs: { 
                    utilisateur: userId, 
                    lu: true, 
                    luAt: Date.now() 
                } 
            } 
        }
    );
};

// Méthode statique pour compter les messages non lus dans un canal pour un utilisateur
messageSchema.statics.compterNonLusDansCanal = async function(canalId, userId) {
    return this.countDocuments({
        canal: canalId,
        'lecteurs.utilisateur': { $ne: userId },
        auteur: { $ne: userId } // Ne pas compter les messages envoyés par l'utilisateur lui-même
    });
};

// Middleware pour extraire les mentions et références de canaux
messageSchema.pre('save', async function(next) {
    if (this.isModified('contenu')) {
        // Extraire les mentions (@username)
        const mentionsMatch = this.contenu ? this.contenu.match(/@(\w+)/g) : null;
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

        // Gestion des références de canaux (#canal)
        // Vérifier si canalsReferenced est déjà défini et non vide
        const hasPresetCanals = this.canalsReferenced && Array.isArray(this.canalsReferenced) && this.canalsReferenced.length > 0;
        
        // Si canalsReferenced n'est pas déjà défini par le frontend
        if (!hasPresetCanals) {
            // Extraire les références de canaux (#canal) du contenu
            const canalsMatch = this.contenu ? this.contenu.match(/#(\w+)/g) : null;
            if (canalsMatch) {
                // Rechercher les canaux correspondants dans la base de données
                const Canal = mongoose.model('Canal');
                const canalNames = canalsMatch.map(canal => canal.substring(1));
                
                try {
                    // Trouver les canaux correspondants
                    const canals = await Canal.find({ nom: { $in: canalNames } });
                    
                    // Stocker les IDs des canaux trouvés
                    this.canalsReferenced = canals.map(canal => canal._id);
                } catch (error) {
                    console.error('Erreur lors de la recherche des canaux référencés:', error);
                    this.canalsReferenced = [];
                }
            } else {
                this.canalsReferenced = [];
            }
        } else {
            // Utiliser les canalsReferenced déjà fournis par le frontend
            console.log('Utilisation des canaux référencés fournis par le frontend:', this.canalsReferenced);
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
