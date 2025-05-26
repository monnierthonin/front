const mongoose = require('mongoose');

const conversationPriveeSchema = new mongoose.Schema({
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

// Middleware pour deleteMany qui peut être utilisé pour supprimer plusieurs conversations
conversationPriveeSchema.pre('deleteMany', async function(next) {
    try {
        const MessagePrivate = require('./messagePrivate');
        const query = this.getQuery();
        const conversations = await mongoose.model('ConversationPrivee').find(query, '_id');
        const conversationIds = conversations.map(conv => conv._id);
        
        if (conversationIds.length > 0) {
            console.log(`Suppression des messages pour ${conversationIds.length} conversations`);
            await MessagePrivate.deleteMany({ conversation: { $in: conversationIds } });
        }
        next();
    } catch (error) {
        console.error('Erreur lors de la suppression des messages associés:', error);
        next(error);
    }
});

// Méthode pour vérifier si un utilisateur est participant à la conversation
conversationPriveeSchema.methods.estParticipant = function(userId) {
    console.log('Vérification si utilisateur est participant:', userId);
    
    if (!userId) {
        console.error('ID utilisateur manquant dans estParticipant');
        return false;
    }
    
    // Conversion explicite en chaîne pour éviter les problèmes de comparaison d'objets
    const userIdStr = userId.toString();
    
    // Vérification détaillée de chaque participant
    const result = this.participants.some(p => {
        // Vérifier si l'utilisateur est un objet ou un ID
        if (p.utilisateur) {
            // Si c'est un objet avec _id
            if (p.utilisateur._id) {
                return p.utilisateur._id.toString() === userIdStr;
            }
            // Si c'est un ObjectId
            return p.utilisateur.toString() === userIdStr;
        }
        return false;
    });
    
    console.log('Résultat final estParticipant pour', userIdStr, ':', result);
    return result;
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
