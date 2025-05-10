import marked from 'marked';
import DOMPurify from 'dompurify';

// Configuration de marked
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // Convertir les retours à la ligne en <br>
  sanitize: false, // Nous utilisons DOMPurify pour la sanitisation
  silent: true // Ne pas lancer d'erreur en cas de problème
});

/**
 * Convertit un texte Markdown en HTML sécurisé
 * @param {string} text - Texte en Markdown à convertir
 * @returns {string} - HTML sécurisé
 */
export const markdownToHtml = (text) => {
  if (!text) return '';
  
  try {
    // Convertir le Markdown en HTML
    const html = marked.parse(text);
    
    // Sanitiser l'HTML pour éviter les attaques XSS
    // Note: DOMPurify doit être importé séparément
    // Si DOMPurify n'est pas disponible, on peut utiliser une version simplifiée
    if (typeof DOMPurify !== 'undefined') {
      return DOMPurify.sanitize(html);
    }
    
    // Version de secours si DOMPurify n'est pas disponible
    return html;
  } catch (error) {
    console.error('Erreur lors de la conversion Markdown:', error);
    return text; // Retourner le texte original en cas d'erreur
  }
};

/**
 * Vérifie si un texte contient du Markdown
 * @param {string} text - Texte à vérifier
 * @returns {boolean} - True si le texte contient du Markdown
 */
export const containsMarkdown = (text) => {
  if (!text) return false;
  
  // Expressions régulières pour détecter les éléments Markdown courants
  const markdownPatterns = [
    /[*_]{1,2}[^*_]+[*_]{1,2}/, // Gras et italique
    /`[^`]+`/, // Code inline
    /```[\s\S]*?```/, // Blocs de code
    /^\s*#{1,6}\s+.+$/m, // Titres
    /^\s*[-*+]\s+.+$/m, // Listes non ordonnées
    /^\s*\d+\.\s+.+$/m, // Listes ordonnées
    /\[.+\]\(.+\)/, // Liens
    /!\[.+\]\(.+\)/, // Images
    /^\s*>\s+.+$/m, // Citations
    /^\s*---+\s*$/m, // Séparateurs horizontaux
    /~~.+~~/, // Texte barré
  ];
  
  return markdownPatterns.some(pattern => pattern.test(text));
};

export default {
  markdownToHtml,
  containsMarkdown
};
