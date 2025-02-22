/**
 * Classe pour gérer les erreurs de l'application
 * @extends Error
 */
class AppError extends Error {
    /**
     * @param {string} message - Message d'erreur
     * @param {number} statusCode - Code de statut HTTP
     */
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;
