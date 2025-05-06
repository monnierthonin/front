/**
 * Wrapper pour gérer les erreurs asynchrones
 * @param {Function} fn - Fonction asynchrone à exécuter
 * @returns {Function} Middleware Express
 */
module.exports = fn => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};
