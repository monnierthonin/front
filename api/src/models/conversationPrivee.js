const mongoose = require('mongoose');

const conversationPriveeSchema = new mongoose.Schema({
    nom: {
        type: String,
        trim: true,
        default: '' // Le nom peut être vide pour les conversations 1:1
    },
    participants: [{
        utilisateur: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: true
        },
        dateAjout: {
            type: Date,
            default: Date.now
        }
    }],
    createur: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Une conversation doit avoir un créateur']
    },
    dateCreation: {
        type: Date,
        default: Date.now
    },
    dernierMessage: {
        type: mongoose.Schema.ObjectId,
        ref: 'MessagePrivate'
    },
    estGroupe: {
        type: Boolean,
        default: false // Par défaut, c'est une conversation 1:1
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Middleware pour supprimer les messages associés avant de supprimer la conversation
conversationPriveeSchema.pre('findOneAndDelete', async function(next) {
    try {
        const MessagePrivate = require('./messagePrivate');
        const conversationId = this.getQuery()._id;
        console.log(`Suppression des messages de la conversation ${conversationId}`);
        await MessagePrivate.deleteMany({ conversation: conversationId });
        next();
    } catch (error) {
        console.error('Erreur lors de la suppression des messages associés:', error);
        next(error);
    }
});

// Middleware pour findByIdAndDelete qui utilise findOneAndDelete en interne
conversationPriveeSchema.pre('deleteOne', async function(next) {
    try {
        const MessagePrivate = require('./messagePrivate');
        const conversationId = this.getQuery()._id;
        console.log(`Suppression des messages de la conversation ${conversationId}`);
        await MessagePrivate.deleteMany({ conversation: conversationId });
        next();
    } catch (error) {
        console.error('Erreur lors de la suppression des messages associés:', error);
        next(error);
    }
});

// Méthode pour vérifier si un utilisateur est participant à la conversation
conversationPriveeSchema.methods.estParticipant = function(userId) {
    return this.participants.some(p => p.utilisateur.toString() === userId.toString());
};

// Méthode pour ajouter un participant à la conversation
conversationPriveeSchema.methods.ajouterParticipant = function(userId) {
    if (!this.estParticipant(userId)) {
        this.participants.push({
            utilisateur: userId,
            dateAjout: Date.now()
        });
        
        // Si la conversation a plus de 2 participants, c'est un groupe
        if (this.participants.length > 2) {
            this.estGroupe = true;
        }
    }
    return this;
};

// Méthode pour supprimer un participant de la conversation
conversationPriveeSchema.methods.supprimerParticipant = function(userId) {
    this.participants = this.participants.filter(p => p.utilisateur.toString() !== userId.toString());
    return this;
};

const ConversationPrivee = mongoose.model('ConversationPrivee', conversationPriveeSchema);

module.exports = ConversationPrivee;
