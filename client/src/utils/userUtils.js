/**
 * Utilitaires liés à l'utilisateur
 */
import authService from '../services/authService';

/**
 * Récupère l'ID de l'utilisateur connecté à partir de l'API /auth/me ou du cache local
 * @returns {String|null} L'ID de l'utilisateur ou null si non connecté/erreur
 */
export function getCurrentUserId() {
  try {
    const cachedUserId = localStorage.getItem('userId');
    if (cachedUserId) {
      return cachedUserId;
    }
    return null;
  } catch (err) {
    console.error('Erreur lors de la récupération de l\'ID utilisateur:', err);
    return null;
  }
}

/**
 * Version asynchrone de getCurrentUserId qui interroge l'API auth/me
 * @returns {Promise<String|null>} L'ID de l'utilisateur ou null si non connecté/erreur
 */
export async function getCurrentUserIdAsync() {
  try {
    const isAuthenticated = await authService.isAuthenticated();
    if (!isAuthenticated) {
      console.warn('Utilisateur non authentifié lors de la tentative de récupération de son ID');
      return null;
    }
    const userData = await authService.checkAuthStatus();
    
    if (userData && userData.data && userData.data.user) {
      const userId = userData.data.user.id || userData.data.user._id;
      localStorage.setItem('userId', userId);
      return userId;
    }
    
    return null;
  } catch (err) {
    console.error('Erreur lors de la récupération asynchrone de l\'ID utilisateur:', err);
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

/**
 * Version asynchrone de isCurrentUser qui vérifie si l'utilisateur donné est l'utilisateur actuellement connecté
 * @param {String} userId - ID de l'utilisateur à vérifier
 * @returns {Promise<Boolean>} True si c'est l'utilisateur actuel, false sinon
 */
export async function isCurrentUserAsync(userId) {
  const currentUserId = await getCurrentUserIdAsync();
  return userId === currentUserId;
}
