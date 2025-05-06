/**
 * Valide la complexité d'un mot de passe
 * @param {string} password - Le mot de passe à valider
 * @returns {Object} - Résultat de la validation avec message d'erreur si échec
 */
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    return {
      isValid: false,
      message: `Le mot de passe doit contenir au moins ${minLength} caractères`
    };
  }

  if (!hasUpperCase) {
    return {
      isValid: false,
      message: 'Le mot de passe doit contenir au moins une majuscule'
    };
  }

  if (!hasLowerCase) {
    return {
      isValid: false,
      message: 'Le mot de passe doit contenir au moins une minuscule'
    };
  }

  if (!hasNumbers) {
    return {
      isValid: false,
      message: 'Le mot de passe doit contenir au moins un chiffre'
    };
  }

  if (!hasSpecialChar) {
    return {
      isValid: false,
      message: 'Le mot de passe doit contenir au moins un caractère spécial'
    };
  }

  return {
    isValid: true,
    message: 'Mot de passe valide'
  };
};

module.exports = validatePassword;
