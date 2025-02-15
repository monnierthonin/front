const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const User = require('../models/user');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Stratégie Google OAuth2
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.API_URL}/api/v1/auth/google/callback`,
    scope: ['profile', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Vérifier si l'utilisateur existe déjà
      let user = await User.findOne({
        'oauthProfiles.provider': 'google',
        'oauthProfiles.id': profile.id
      });

      // Si l'utilisateur n'existe pas, vérifier par email
      if (!user && profile.emails?.[0]?.value) {
        user = await User.findOne({ email: profile.emails[0].value });
      }

      if (user) {
        // Mettre à jour le profil OAuth s'il existe
        const oauthIndex = user.oauthProfiles.findIndex(p => p.provider === 'google');
        if (oauthIndex > -1) {
          user.oauthProfiles[oauthIndex].accessToken = accessToken;
          user.oauthProfiles[oauthIndex].lastUsed = new Date();
        } else {
          // Ajouter le profil OAuth s'il n'existe pas
          user.oauthProfiles.push({
            provider: 'google',
            id: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            picture: profile.photos?.[0]?.value,
            accessToken
          });
        }
        await user.save();
        return done(null, user);
      }

      // Créer un nouvel utilisateur
      const newUser = await User.create({
        email: profile.emails[0].value,
        username: `user_${profile.id}`,
        firstName: profile.name?.givenName || '',
        lastName: profile.name?.familyName || '',
        isVerified: true,
        oauthProfiles: [{
          provider: 'google',
          id: profile.id,
          email: profile.emails[0].value,
          name: profile.displayName,
          picture: profile.photos?.[0]?.value,
          accessToken
        }]
      });

      done(null, newUser);
    } catch (error) {
      done(error, null);
    }
  }
));

// Stratégie Microsoft OAuth2
passport.use(new MicrosoftStrategy({
    clientID: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    callbackURL: `${process.env.API_URL}/api/v1/auth/microsoft/callback`,
    scope: ['openid', 'offline_access', 'profile', 'email', 'user.read'],
    tenant: 'common',
    authorizationURL: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenURL: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    profileURL: 'https://graph.microsoft.com/v1.0/me'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('Microsoft profile:', profile); // Ajout de log pour debug

      let user = await User.findOne({
        'oauthProfiles.provider': 'microsoft',
        'oauthProfiles.id': profile.id
      });

      if (!user) {
        // Vérifier si un utilisateur existe avec cet email
        const email = profile.emails?.[0]?.value;
        if (email) {
          user = await User.findOne({ email });
        }

        if (!user) {
          // Créer un nouvel utilisateur
          user = new User({
            email: email,
            username: profile.displayName || email?.split('@')[0],
            oauthProfiles: [{
              provider: 'microsoft',
              id: profile.id,
              accessToken,
              refreshToken
            }]
          });
        } else {
          // Lier le compte Microsoft à l'utilisateur existant
          user.oauthProfiles.push({
            provider: 'microsoft',
            id: profile.id,
            accessToken,
            refreshToken
          });
        }
        await user.save();
      } else {
        // Mettre à jour les tokens
        const microsoftProfile = user.oauthProfiles.find(p => p.provider === 'microsoft');
        if (microsoftProfile) {
          microsoftProfile.accessToken = accessToken;
          microsoftProfile.refreshToken = refreshToken;
          await user.save();
        }
      }

      return done(null, user);
    } catch (error) {
      console.error('Erreur Microsoft OAuth:', error);
      return done(error);
    }
  }
));

module.exports = passport;
