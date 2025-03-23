module.exports = {
    secret: process.env.JWT_SECRET || 'votre_clef_secrete_par_defaut',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
};
