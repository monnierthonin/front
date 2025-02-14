const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
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

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.API_URL}/api/v1/auth/google/callback`
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Vérifier si l'utilisateur existe déjà avec cet email
        const existingUser = await User.findOne({
          $or: [
            { email: profile.emails[0].value },
            { 'oauthProfiles.id': profile.id, 'oauthProfiles.provider': 'google' }
          ]
        });

        if (existingUser) {
          // Mettre à jour le profil OAuth si nécessaire
          const googleProfile = existingUser.oauthProfiles.find(p => p.provider === 'google');
          
          if (googleProfile) {
            // Mettre à jour les tokens et la date de dernière utilisation
            googleProfile.accessToken = accessToken;
            googleProfile.refreshToken = refreshToken;
            googleProfile.lastUsed = new Date();
          } else {
            // Ajouter le profil Google s'il n'existe pas
            existingUser.oauthProfiles.push({
              provider: 'google',
              id: profile.id,
              email: profile.emails[0].value,
              name: profile.displayName,
              picture: profile.photos[0]?.value,
              accessToken,
              refreshToken
            });
          }

          await existingUser.save();
          return done(null, existingUser);
        }

        // Créer un nouvel utilisateur
        const newUser = await User.create({
          email: profile.emails[0].value,
          username: `user_${profile.id}`, // Username temporaire
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          profilePicture: profile.photos[0]?.value || 'default.jpg',
          isVerified: true, // L'email est vérifié par Google
          oauthProfiles: [{
            provider: 'google',
            id: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            picture: profile.photos[0]?.value,
            accessToken,
            refreshToken
          }]
        });

        done(null, newUser);
      } catch (error) {
        done(error, null);
      }
    }
  )
);
