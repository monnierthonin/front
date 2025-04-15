/**
 * Décode un token JWT sans vérifier la signature
 * @param {string} token - Le token JWT à décoder
 * @returns {Object|null} - Le contenu décodé du token ou null si invalide
 */
export function decodeJWT(token) {
    if (!token) {
        console.warn('Token JWT manquant');
        return null;
    }

    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Erreur de décodage du JWT:', error);
        return null;
    }
}

/**
 * Vérifie si un token JWT est expiré
 * @param {string} token - Le token JWT à vérifier
 * @returns {Object} - Informations sur l'expiration du token
 */
export function checkJWTExpiration(token) {
    if (!token) {
        console.warn('Token JWT manquant pour la vérification d\'expiration');
        return {
            isExpired: true,
            expiresIn: 0,
            expirationDate: null
        };
    }

    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) {
        return {
            isExpired: true,
            expiresIn: 0,
            expirationDate: null
        };
    }

    const expirationDate = new Date(decoded.exp * 1000);
    const now = new Date();
    const timeUntilExpiration = expirationDate - now;

    return {
        isExpired: timeUntilExpiration <= 0,
        expiresIn: Math.max(0, Math.floor(timeUntilExpiration / 1000)), // en secondes
        expirationDate
    };
}
