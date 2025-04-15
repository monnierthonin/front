const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const crypto = require('crypto');
const { envoyerEmailVerification, envoyerEmailReinitialisationMotDePasse } = require('../services/emailService');

// Générer un token JWT
const genererToken = (user, rememberMe = false) => {
    const expiresIn = rememberMe ? '30d' : process.env.JWT_EXPIRES_IN || '24h';
    return jwt.sign(
        { 
            id: user._id,
            email: user.email,
            username: user.username
        },
        process.env.JWT_SECRET || 'supchat_secret_dev',
        { expiresIn }
    );
};

// Configuration des cookies
const getCookieOptions = (rememberMe = false) => ({
    expires: new Date(Date.now() + (rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000), // 30 jours ou 24 heures
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
});

// Envoyer le token dans un cookie et la réponse
const envoyerToken = (user, statusCode, res, rememberMe = false) => {
    const token = genererToken(user, rememberMe);

    // Envoyer le cookie avec la durée appropriée
    res.cookie('jwt', token, getCookieOptions(rememberMe));

    // Retirer le mot de passe de la réponse
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(statusCode).json({
        success: true,
        token,
        data: {
            user: userResponse
        }
    });
};

// Inscription
exports.inscription = async (req, res) => {
    try {
        const nouvelUtilisateur = await User.create({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
            firstName: req.body.firstName,
            lastName: req.body.lastName
        });

        // Générer le token de vérification
        const verificationToken = crypto.randomBytes(32).toString('hex');
        nouvelUtilisateur.verificationToken = crypto
            .createHash('sha256')
            .update(verificationToken)
            .digest('hex');
        nouvelUtilisateur.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 heures

        await nouvelUtilisateur.save();

        // Envoyer l'email de vérification
        try {
            await envoyerEmailVerification(
                nouvelUtilisateur.email,
                nouvelUtilisateur.username,
                verificationToken
            );
        } catch (erreurEmail) {
            console.error('Erreur lors de l\'envoi de l\'email:', erreurEmail);
            // On continue malgré l'erreur d'envoi d'email
        }
        
        envoyerToken(nouvelUtilisateur, 201, res);
    } catch (erreur) {
        console.error('Erreur lors de l\'inscription:', erreur);
        res.status(400).json({
            success: false,
            message: 'Erreur lors de l\'inscription',
            error: process.env.NODE_ENV === 'development' ? erreur.message : undefined
        });
    }
};

// Connexion d'un utilisateur
exports.connexion = async (req, res) => {
    try {
        console.log('Tentative de connexion pour:', req.body.email);
        const { email, password, rememberMe } = req.body;

        // Vérifier si l'utilisateur existe et récupérer explicitement le mot de passe
        const utilisateur = await User.findOne({ email }).select('+password');
        
        if (!utilisateur) {
            console.log('Utilisateur non trouvé:', email);
            return res.status(401).json({
                success: false,
                message: 'Email ou mot de passe incorrect'
            });
        }

        // Vérifier si l'utilisateur est vérifié
        if (!utilisateur.isVerified) {
            console.log('Utilisateur non vérifié:', email);
            return res.status(401).json({
                success: false,
                message: 'Veuillez vérifier votre email avant de vous connecter'
            });
        }

        // Vérifier si le mot de passe est correct
        const motDePasseValide = await bcrypt.compare(password, utilisateur.password);
        
        if (!motDePasseValide) {
            console.log('Mot de passe invalide pour:', email);
            return res.status(401).json({
                success: false,
                message: 'Email ou mot de passe incorrect'
            });
        }

        console.log('Connexion réussie pour:', email);

        // Générer le token JWT
        envoyerToken(utilisateur, 200, res, rememberMe);
    } catch (erreur) {
        console.error('Erreur lors de la connexion:', erreur);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la connexion',
            error: process.env.NODE_ENV === 'development' ? erreur.message : undefined
        });
    }
};

// Déconnexion
exports.deconnexion = async (req, res) => {
    try {
        if (req.user) {
            // Mettre à jour le statut de l'utilisateur
            const utilisateur = await User.findById(req.user.id);
            if (utilisateur) {
                utilisateur.status = 'offline';
                await utilisateur.save();
            }
        }

        // Supprimer le cookie
        res.clearCookie('jwt');

        res.status(200).json({
            success: true,
            message: 'Déconnexion réussie'
        });
    } catch (erreur) {
        console.error('Erreur lors de la déconnexion:', erreur);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la déconnexion',
            error: process.env.NODE_ENV === 'development' ? erreur.message : undefined
        });
    }
};

// Vérifier l'email
exports.verifierEmail = async (req, res) => {
    try {
        const hashedToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        const utilisateur = await User.findOne({
            verificationToken: hashedToken,
            verificationTokenExpires: { $gt: Date.now() }
        });

        if (!utilisateur) {
            // Rediriger vers la page de connexion avec un message d'erreur
            return res.redirect(`${process.env.CLIENT_URL}/login?error=token_invalide`);
        }

        // Si l'utilisateur est déjà vérifié
        if (utilisateur.isVerified) {
            return res.redirect(`${process.env.CLIENT_URL}/login?message=deja_verifie`);
        }

        // Mettre à jour le statut de vérification
        utilisateur.isVerified = true;
        utilisateur.verificationToken = undefined;
        utilisateur.verificationTokenExpires = undefined;

        await utilisateur.save({ validateBeforeSave: false });

        // Rediriger vers la page de connexion avec un message de succès
        res.redirect(`${process.env.CLIENT_URL}/login?message=email_verifie`);
    } catch (erreur) {
        console.error('Erreur lors de la vérification de l\'email:', erreur);
        res.redirect(`${process.env.CLIENT_URL}/login?error=erreur_verification`);
    }
};

// Demander la réinitialisation du mot de passe
exports.demanderReinitialisationMotDePasse = async (req, res) => {
    try {
        const utilisateur = await User.findOne({ email: req.body.email });

        if (!utilisateur) {
            return res.status(404).json({
                success: false,
                message: 'Aucun compte associé à cet email'
            });
        }

        // Générer un token de réinitialisation
        const resetToken = crypto.randomBytes(32).toString('hex');
        utilisateur.resetPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
        
        // Expiration dans 1 heure
        utilisateur.resetPasswordExpires = Date.now() + 3600000;
        await utilisateur.save({ validateBeforeSave: false });

        try {
            await envoyerEmailReinitialisationMotDePasse(
                utilisateur.email,
                utilisateur.firstName || utilisateur.username,
                resetToken
            );

            res.status(200).json({
                success: true,
                message: 'Email de réinitialisation envoyé'
            });
        } catch (erreurEmail) {
            utilisateur.resetPasswordToken = undefined;
            utilisateur.resetPasswordExpires = undefined;
            await utilisateur.save({ validateBeforeSave: false });

            return res.status(500).json({
                success: false,
                message: 'Erreur lors de l\'envoi de l\'email de réinitialisation'
            });
        }
    } catch (erreur) {
        res.status(400).json({
            success: false,
            message: 'Erreur lors de la demande de réinitialisation',
            error: process.env.NODE_ENV === 'development' ? erreur.message : undefined
        });
    }
};

// Réinitialiser le mot de passe
exports.reinitialiserMotDePasse = async (req, res) => {
    try {
        const hashedToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        const utilisateur = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!utilisateur) {
            return res.redirect(`${process.env.CLIENT_URL}/login?error=token_invalide`);
        }

        if (!req.body.password || !req.body.confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Veuillez fournir un nouveau mot de passe et sa confirmation'
            });
        }

        if (req.body.password !== req.body.confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Les mots de passe ne correspondent pas'
            });
        }

        utilisateur.password = req.body.password;
        utilisateur.resetPasswordToken = undefined;
        utilisateur.resetPasswordExpires = undefined;

        await utilisateur.save();

        // Rediriger vers la page de connexion avec un message de succès
        res.redirect(`${process.env.CLIENT_URL}/login?message=mot_de_passe_reinitialise`);
    } catch (erreur) {
        console.error('Erreur lors de la réinitialisation du mot de passe:', erreur);
        res.redirect(`${process.env.CLIENT_URL}/login?error=erreur_reinitialisation`);
    }
};

// Délier un compte OAuth
exports.delierCompteOAuth = async (req, res) => {
    try {
        const { provider } = req.params;
        const user = await User.findById(req.user.id).select('+password');

        // Vérifier que le provider est valide
        if (!['google', 'microsoft', 'facebook'].includes(provider)) {
            return res.status(400).json({
                success: false,
                message: 'Provider OAuth invalide'
            });
        }

        // Vérifier si l'utilisateur a un mot de passe configuré
        if (!user.password) {
            return res.status(400).json({
                success: false,
                message: 'Vous devez configurer un mot de passe avant de délier votre compte ' + provider
            });
        }

        // Vérifier si l'utilisateur a le provider à délier
        const oauthProfile = user.oauthProfiles.find(p => p.provider === provider);
        if (!oauthProfile) {
            return res.status(404).json({
                success: false,
                message: `Aucun compte ${provider} n'est lié à votre compte`
            });
        }

        // Si c'est le seul moyen de connexion, empêcher la suppression
        if (user.oauthProfiles.length === 1 && !user.password) {
            return res.status(400).json({
                success: false,
                message: 'Impossible de délier le compte : c\'est votre seule méthode de connexion'
            });
        }

        try {
            // Révoquer le token d'accès Google
            if (provider === 'google' && oauthProfile.accessToken) {
                await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${oauthProfile.accessToken}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                });
            }
        } catch (error) {
            console.error('Erreur lors de la révocation du token:', error);
            // On continue même si la révocation échoue
        }

        // Retirer le profil OAuth
        user.oauthProfiles = user.oauthProfiles.filter(p => p.provider !== provider);
        await user.save();

        res.status(200).json({
            success: true,
            message: `Compte ${provider} délié avec succès`
        });
    } catch (error) {
        console.error('Erreur lors de la déliaison du compte OAuth:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la déliaison du compte',
            error: error.message
        });
    }
};

// Route de développement pour vérifier directement un utilisateur
exports.verifierUtilisateurDev = async (req, res) => {
    // Ne permettre cette route qu'en développement
    if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({
            success: false,
            message: 'Route non trouvée'
        });
    }

    try {
        const utilisateur = await User.findOne({ email: req.params.email });
        
        if (!utilisateur) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        utilisateur.isVerified = true;
        utilisateur.verificationToken = undefined;
        utilisateur.verificationTokenExpires = undefined;
        
        await utilisateur.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true,
            message: 'Utilisateur vérifié avec succès'
        });
    } catch (erreur) {
        res.status(400).json({
            success: false,
            message: 'Erreur lors de la vérification',
            error: process.env.NODE_ENV === 'development' ? erreur.message : undefined
        });
    }
};

// Récupérer l'utilisateur courant
exports.getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                user
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
};

// Callback Google OAuth2
exports.googleCallback = async (req, res) => {
    try {
        const token = genererToken(req.user);
        res.cookie('jwt', token, getCookieOptions());
        res.redirect(`${process.env.FRONTEND_URL}/auth/callback`);
    } catch (error) {
        console.error('Erreur lors du callback Google:', error);
        res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
    }
};

// Callback Microsoft OAuth2
exports.microsoftCallback = async (req, res) => {
    try {
        const token = genererToken(req.user);
        res.cookie('jwt', token, getCookieOptions());
        res.redirect(`${process.env.FRONTEND_URL}/auth/callback`);
    } catch (error) {
        console.error('Erreur lors du callback Microsoft:', error);
        res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
    }
};

// Callback Facebook OAuth2
exports.facebookCallback = async (req, res) => {
    try {
        const token = genererToken(req.user);
        res.cookie('jwt', token, getCookieOptions());
        res.redirect(`${process.env.FRONTEND_URL}/auth/callback`);
    } catch (error) {
        console.error('Erreur lors du callback Facebook:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur',
            error: error.message
        });
    }
};

module.exports = {
    inscription: exports.inscription,
    connexion: exports.connexion,
    deconnexion: exports.deconnexion,
    verifierEmail: exports.verifierEmail,
    demanderReinitialisationMotDePasse: exports.demanderReinitialisationMotDePasse,
    reinitialiserMotDePasse: exports.reinitialiserMotDePasse,
    delierCompteOAuth: exports.delierCompteOAuth,
    verifierUtilisateurDev: exports.verifierUtilisateurDev,
    googleCallback: exports.googleCallback,
    microsoftCallback: exports.microsoftCallback,
    facebookCallback: exports.facebookCallback,
    getCurrentUser: exports.getCurrentUser
};
