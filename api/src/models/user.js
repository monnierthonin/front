const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const sanitize = require('mongo-sanitize');
const xss = require('xss');

async function generateUniqueUsername(baseUsername) {
  let username = baseUsername;
  let counter = 1;
  
  while (await mongoose.model('User').findOne({ username })) {
    username = `${baseUsername}${counter}`;
    counter++;
  }
  
  return username;
}

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
  username: {
    type: String,
    required: [true, 'Le nom d\'utilisateur est requis'],
    trim: true,
    minlength: [3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères'],
    maxlength: [50, 'Le nom d\'utilisateur ne peut pas dépasser 50 caractères'],
    validate: {
      validator: function(v) {
        // Si l'utilisateur a un compte OAuth, on accepte tous les caractères
        if (this.oauthProfiles && this.oauthProfiles.length > 0) {
          return true;
        }
        // Sinon on applique la validation standard
        return /^[a-zA-Z0-9_-]+$/.test(v);
      },
      message: 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores'
    },
    set: function(value) {
      return xss(sanitize(value.trim()));
    }
  },
  password: {
    type: String,
    required: function() {
      // Le mot de passe est requis seulement si l'utilisateur n'utilise pas OAuth
      return !(this.oauthProfiles && this.oauthProfiles.length > 0);
    },
    minlength: [8, 'Le mot de passe doit contenir au moins 8 caractères'],
    maxlength: [72, 'Le mot de passe ne peut pas dépasser 72 caractères'], // Limite bcrypt
    select: false
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
        // Accepter les URLs pour les photos de profil OAuth
        if (value.startsWith('http://') || value.startsWith('https://')) return true;
        // Pour les fichiers uploadés, vérifier l'extension
        return /\.(jpg|jpeg|png|webp|svg)$/i.test(value);
      },
      message: "Le format de l'image n'est pas valide (jpg, jpeg, png, webp, svg uniquement)"
    }
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'super_admin'],
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
      enum: ['google', 'microsoft', 'facebook'],
      required: true
    },
    id: {
      type: String,
      required: true
    },
    email: String,
    name: String,
    picture: String,
    accessToken: String,
    refreshToken: String,
    lastUsed: {
      type: Date,
      default: Date.now
    }
  }],
  lastLogin: Date,
  estConnecte: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['en ligne', 'absent', 'ne pas déranger'],
    default: 'en ligne'
  },
  dernierActivite: {
    type: Date,
    default: Date.now
  },
  theme: {
    type: String,
    enum: ['clair', 'sombre'],
    default: 'sombre'
  },
  preferences: {
    notifications: {
      mentionsOnly: {
        type: Boolean,
        default: false
      },
      soundEnabled: {
        type: Boolean,
        default: true
      },
      desktopEnabled: {
        type: Boolean,
        default: true
      }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Transformation pour générer des URLs complètes pour les photos de profil
userSchema.set('toJSON', {
  transform: function(doc, ret) {
    if (ret.profilePicture) {
      // Si c'est une URL externe (OAuth), la laisser telle quelle
      if (ret.profilePicture.startsWith('http')) {
        // Ne rien changer
      } else {
        // Construire l'URL complète pour les images stockées localement
        const baseUrl = process.env.API_URL || 'http://localhost:3000';
        ret.profilePicture = `${baseUrl}/uploads/profiles/${ret.profilePicture}`;
      }
    }
    return ret;
  }
});

// Ne pas hasher le mot de passe s'il n'a pas été modifié ou si c'est une connexion OAuth
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
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
  console.log('Comparing passwords...');
  console.log('Candidate password:', candidatePassword);
  console.log('Stored password exists:', !!this.password);
  if (!this.password) {
    console.log('No password stored for user');
    return false;
  }
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  console.log('Password match:', isMatch);
  return isMatch;
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

// Middleware pour générer un nom d'utilisateur unique avant la création d'un utilisateur
userSchema.pre('save', async function(next) {
  if (!this.isNew) return next();

  this.username = await generateUniqueUsername(this.username);
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
