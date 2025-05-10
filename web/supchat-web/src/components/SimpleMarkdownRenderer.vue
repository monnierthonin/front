<template>
  <div class="markdown-content" v-html="renderedContent"></div>
</template>

<script>
import { computed } from 'vue';
import marked from 'marked';
import DOMPurify from 'dompurify';

export default {
  name: 'SimpleMarkdownRenderer',
  
  props: {
    content: {
      type: String,
      required: true
    }
  },
  
  setup(props) {
    // Configuration de marked
    marked.setOptions({
      gfm: true,
      breaks: true,
      sanitize: false,
      silent: true
    });
    
    // Fonction pour convertir le Markdown en HTML
    const markdownToHtml = (text) => {
      if (!text) return '';
      
      try {
        // Convertir le Markdown en HTML
        const html = marked(text);
        
        // Sanitiser l'HTML pour éviter les attaques XSS
        return DOMPurify.sanitize(html);
      } catch (error) {
        console.error('Erreur lors de la conversion Markdown:', error);
        return text; // Retourner le texte original en cas d'erreur
      }
    };
    
    // Calculer le contenu rendu
    const renderedContent = computed(() => {
      return markdownToHtml(props.content);
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
</style>
