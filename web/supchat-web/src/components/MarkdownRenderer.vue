<template>
  <div class="markdown-content" v-html="renderedContent"></div>
</template>

<script>
import { computed } from 'vue';
import { markdownToHtml, containsMarkdown } from '@/utils/markdown';

export default {
  name: 'MarkdownRenderer',
  
  props: {
    content: {
      type: String,
      required: true,
      default: ''
    },
    mentions: {
      type: Array,
      default: () => []
    },
    canalMentions: {
      type: Array,
      default: () => []
    }
  },
  
  setup(props) {
    // Fonction pour traiter les mentions d'utilisateurs
    const processUserMentions = (text) => {
      if (!text) return '';
      
      let processedText = text;
      
      // Si des mentions sont fournies, les traiter
      if (props.mentions && props.mentions.length > 0) {
        props.mentions.forEach(mention => {
          if (mention && mention.username) {
            const regex = new RegExp(`@${mention.username}\\b`, 'g');
            processedText = processedText.replace(
              regex,
              `<span class="mention-tag mention-clickable" data-user-id="${mention._id}" data-username="${mention.username}">@${mention.username}</span>`
            );
          }
        });
      } else {
        // Sinon, chercher les mentions dans le texte
        const mentionRegex = /@(\w+)/g;
        let match;
        
        while ((match = mentionRegex.exec(text)) !== null) {
          const username = match[1];
          const fullMention = match[0]; // @username
          
          // Remplacer par un span cliquable
          processedText = processedText.replace(
            fullMention,
            `<span class="mention-tag mention-clickable" data-username="${username}">@${username}</span>`
          );
        }
      }
      
      return processedText;
    };
    
    // Fonction pour traiter les mentions de canaux
    const processCanalMentions = (text) => {
      if (!text) return '';
      
      let processedText = text;
      
      // Format attendu: #nomCanal:canalId
      const canalMentionRegex = /#([\w-]+):(\w+)/g;
      let canalMatch;
      
      while ((canalMatch = canalMentionRegex.exec(text)) !== null) {
        const canalNom = canalMatch[1];
        const canalId = canalMatch[2];
        const fullCanalMention = canalMatch[0]; // #nomCanal:canalId
        
        // Remplacer par un span cliquable pour le canal
        processedText = processedText.replace(
          fullCanalMention,
          `<span class="canal-mention-tag canal-mention-clickable" data-canal-id="${canalId}" data-canal-nom="${canalNom}">#${canalNom}</span>`
        );
      }
      
      return processedText;
    };
    
    // Fonction pour appliquer le formatage Markdown
    const applyMarkdown = (text) => {
      if (!text) return '';
      
      try {
        if (containsMarkdown(text)) {
          return markdownToHtml(text);
        }
        return text;
      } catch (error) {
        console.error('Erreur lors du formatage Markdown:', error);
        return text;
      }
    };
    
    // Calculer le contenu rendu avec toutes les transformations
    const renderedContent = computed(() => {
      // Appliquer les transformations dans l'ordre
      let result = props.content || '';
      
      // 1. Traiter les mentions d'utilisateurs
      result = processUserMentions(result);
      
      // 2. Traiter les mentions de canaux
      result = processCanalMentions(result);
      
      // 3. Appliquer le formatage Markdown
      result = applyMarkdown(result);
      
      return result;
    });
    
    return {
      renderedContent
    };
  }
};
</script>

<style scoped>
.markdown-content {
  word-break: break-word;
  white-space: pre-wrap;
}

.markdown-content :deep(h1) {
  font-size: 1.5rem;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

.markdown-content :deep(h2) {
  font-size: 1.25rem;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

.markdown-content :deep(h3) {
  font-size: 1.1rem;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

.markdown-content :deep(p) {
  margin-bottom: 0.5rem;
}

.markdown-content :deep(ul), 
.markdown-content :deep(ol) {
  padding-left: 1.5rem;
  margin-bottom: 0.5rem;
}

.markdown-content :deep(li) {
  margin-bottom: 0.25rem;
}

.markdown-content :deep(code) {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  font-family: monospace;
}

.markdown-content :deep(pre) {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 0.5rem;
  border-radius: 4px;
  overflow-x: auto;
  margin-bottom: 0.5rem;
}

.markdown-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
}

.markdown-content :deep(blockquote) {
  border-left: 3px solid rgba(0, 0, 0, 0.2);
  padding-left: 0.5rem;
  margin-left: 0.5rem;
  color: rgba(0, 0, 0, 0.6);
}

.markdown-content :deep(a) {
  color: #1976d2;
  text-decoration: none;
}

.markdown-content :deep(a:hover) {
  text-decoration: underline;
}

.markdown-content :deep(img) {
  max-width: 100%;
  height: auto;
}

.markdown-content :deep(hr) {
  border: none;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  margin: 1rem 0;
}

.markdown-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 1rem;
}

.markdown-content :deep(th), 
.markdown-content :deep(td) {
  border: 1px solid rgba(0, 0, 0, 0.1);
  padding: 0.5rem;
  text-align: left;
}

.markdown-content :deep(th) {
  background-color: rgba(0, 0, 0, 0.05);
}
</style>

<style>
/* Styles globaux pour les mentions */
.mention-tag {
  background-color: rgba(29, 155, 240, 0.1);
  color: #1d9bf0;
  padding: 2px 4px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
}

.mention-tag:hover {
  background-color: rgba(29, 155, 240, 0.2);
  text-decoration: underline;
}

.canal-mention-tag {
  background-color: rgba(76, 175, 80, 0.1);
  color: #4caf50;
  padding: 2px 4px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
}

.canal-mention-tag:hover {
  background-color: rgba(76, 175, 80, 0.2);
  text-decoration: underline;
}
</style>
