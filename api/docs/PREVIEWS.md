# Documentation des prévisualisations de fichiers

## Structure des données

Lorsqu'un fichier est uploadé via l'API, la réponse inclut maintenant un champ `urlPreview`. Voici un exemple de réponse :

```json
{
  "status": "success",
  "data": {
    "fichiers": [
      {
        "nom": "document.pdf",
        "type": "application/pdf",
        "url": "/workspaces/123/canaux/456/fichiers/1234567890-abc.pdf",
        "urlPreview": "/previews/1234567890-abc-preview.jpg",
        "taille": 1234567
      }
    ]
  }
}
```

## Accès aux prévisualisations dans Vue.js

### 1. Dans les props d'un composant

```vue
<script>
export default {
  props: {
    fichier: {
      type: Object,
      required: true
    }
  }
}
</script>
```

### 2. Affichage de la prévisualisation

```vue
<template>
  <div class="file-preview">
    <img v-if="fichier.urlPreview"
         :src="baseUrl + fichier.urlPreview"
         :alt="fichier.nom">
  </div>
</template>

<script>
export default {
  data() {
    return {
      baseUrl: process.env.VUE_APP_API_URL // URL de base de l'API
    }
  }
}
</script>
```

## Types de prévisualisations supportés

- **Images** (.jpg, .png, .gif) :
  - Redimensionnées à 300x300px
  - Format JPEG optimisé
  
- **PDF** :
  - Première page convertie en image
  - Dimensions : 300x400px
  
- **Vidéos** (.mp4, .webm) :
  - Capture de la première seconde
  - Dimensions : 300px de large
  
- **Audio** (.mp3, .wav, .ogg) :
  - Image par défaut

## Gestion des erreurs

Si la génération de la prévisualisation échoue, `urlPreview` sera `null`. Votre composant devrait gérer ce cas :

```vue
<template>
  <div class="file-preview">
    <template v-if="fichier.urlPreview">
      <img :src="baseUrl + fichier.urlPreview" :alt="fichier.nom">
    </template>
    <template v-else>
      <!-- Afficher une icône ou un placeholder basé sur fichier.type -->
      <div class="fallback-preview">
        <i :class="getIconClass(fichier.type)"></i>
        <span>{{ fichier.nom }}</span>
      </div>
    </template>
  </div>
</template>

<script>
export default {
  methods: {
    getIconClass(type) {
      // Retourne une classe d'icône basée sur le type MIME
      const typeBase = type.split('/')[0]
      const icons = {
        'image': 'fas fa-image',
        'video': 'fas fa-video',
        'audio': 'fas fa-music',
        'application': 'fas fa-file'
      }
      return icons[typeBase] || 'fas fa-file'
    }
  }
}
</script>
```

## Notes importantes

1. Les prévisualisations sont toujours au format JPEG
2. Le chemin de base des prévisualisations est `/previews/`
3. Les prévisualisations sont générées automatiquement lors de l'upload
4. Les prévisualisations sont supprimées automatiquement lors de la suppression du fichier

## Exemple d'intégration complète

```vue
<!-- FilePreview.vue -->
<template>
  <div class="file-preview" @click="handleClick">
    <div v-if="fichier.urlPreview" class="preview-image">
      <img :src="previewUrl" 
           :alt="fichier.nom"
           @error="handleImageError">
    </div>
    <div v-else class="preview-fallback">
      <i :class="getIconClass(fichier.type)"></i>
      <span class="filename">{{ fichier.nom }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FilePreview',
  
  props: {
    fichier: {
      type: Object,
      required: true
    }
  },

  computed: {
    previewUrl() {
      return this.fichier.urlPreview 
        ? `${process.env.VUE_APP_API_URL}${this.fichier.urlPreview}`
        : null
    }
  },

  methods: {
    handleClick() {
      // Ouvrir le fichier original
      window.open(`${process.env.VUE_APP_API_URL}${this.fichier.url}`)
    },

    handleImageError(e) {
      // En cas d'erreur de chargement de la prévisualisation
      e.target.style.display = 'none'
      this.$el.querySelector('.preview-fallback').style.display = 'flex'
    }
  }
}
</script>
```
