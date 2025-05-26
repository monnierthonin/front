/**
 * Utilitaires liés à l'utilisateur
 */

/**
 * Récupère l'ID de l'utilisateur connecté à partir du token JWT
 * @returns {String|null} L'ID de l'utilisateur ou null si non connecté/erreur
 */
export function getCurrentUserId() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    // Décoder le token JWT
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    const payload = JSON.parse(jsonPayload);
    return payload.id; // Ou payload.userId selon la structure du token
  } catch (err) {
    console.error('Erreur lors du décodage du token:', err);
    return null;
  }
}

/**
 * Vérifie si l'utilisateur donné est l'utilisateur actuellement connecté
 * @param {String} userId - ID de l'utilisateur à vérifier
 * @returns {Boolean} True si c'est l'utilisateur actuel, false sinon
 */
export function isCurrentUser(userId) {
  const currentUserId = getCurrentUserId();
  return userId === currentUserId;
}
