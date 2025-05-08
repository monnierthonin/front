/**
 * Service pour la gestion des utilisateurs avec l'API
 */

const API_URL = 'http://localhost:3000/api/v1';

const userService = {
  /**
   * Supprimer le compte de l'utilisateur
   * @returns {Promise} Promesse avec le résultat de la suppression
   */
  async deleteAccount(password) {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Non authentifié');
    }

    try {
      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password }),
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        console.log('Erreur détaillée:', data);
        throw new Error(data.message || (data.error ? `Erreur: ${data.error}` : 'Erreur lors de la suppression du compte'));
      }

      // Supprimer le token après la suppression réussie
      localStorage.removeItem('token');
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du compte:', error);
      throw error;
    }
  }
};

export default userService;
