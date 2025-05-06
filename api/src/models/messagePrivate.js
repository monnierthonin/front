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
    destinataire: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Un message doit avoir un destinataire']
    },
    lu: {
        type: Boolean,
        default: false
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
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
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
