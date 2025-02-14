const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const sanitize = require('mongo-sanitize');
const xss = require('xss');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Veuillez fournir un email valide'],
    set: (value) => sanitize(value.toLowerCase())
  },
  password: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
    minlength: [8, 'Le mot de passe doit contenir au moins 8 caractères'],
    maxlength: [72, 'Le mot de passe ne peut pas dépasser 72 caractères'], // Limite bcrypt
    select: false
  },
  username: {
    type: String,
    required: [true, 'Le nom d\'utilisateur est requis'],
    unique: true,
    trim: true,
    minlength: [3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères'],
    maxlength: [30, 'Le nom d\'utilisateur ne peut pas dépasser 30 caractères'],
    match: [/^[a-zA-Z0-9_-]+$/, 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores'],
    set: (value) => xss(sanitize(value.trim()))
  },
  firstName: {
    type: String,
    trim: true,
    maxlength: [50, 'Le prénom ne peut pas dépasser 50 caractères'],
    set: (value) => value ? xss(sanitize(value.trim())) : value
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères'],
    set: (value) => value ? xss(sanitize(value.trim())) : value
  },
  profilePicture: {
    type: String,
    default: 'default.jpg',
    validate: {
      validator: function(value) {
        return value === 'default.jpg' || /\.(jpg|jpeg|png)$/i.test(value);
      },
      message: 'Le format de l\'image n\'est pas valide (jpg, jpeg, png uniquement)'
    }
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationTokenExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  oauthProfiles: [{
    provider: {
      type: String,
      enum: ['google', 'microsoft', 'facebook']
    },
    id: String,
    email: String,
    name: String,
    picture: String
  }],
  lastLogin: Date,
  status: {
    type: String,
    enum: ['online', 'offline', 'away'],
    default: 'offline'
  }
}, {
  timestamps: true
});

// Middleware unique pour le nettoyage des données et le hachage du mot de passe
userSchema.pre('save', async function(next) {
  // Hash le mot de passe s'il a été modifié
  if (this.isModified('password')) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(error);
    }
  }

  // Nettoyer les champs de texte
  if (this.firstName) this.firstName = this.firstName.replace(/[<>]/g, '');
  if (this.lastName) this.lastName = this.lastName.replace(/[<>]/g, '');
  if (this.username) this.username = this.username.replace(/[<>]/g, '');

  next();
});

// Middleware pour nettoyer les données avant les mises à jour
userSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  if (!update) return next();

  // Nettoyer les champs de l'update
  if (update.firstName) update.firstName = xss(sanitize(update.firstName));
  if (update.lastName) update.lastName = xss(sanitize(update.lastName));
  if (update.username) update.username = xss(sanitize(update.username));

  next();
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Méthode pour générer un token de réinitialisation de mot de passe
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
