<template>
  <img 
    :src="profilePictureUrl" 
    :alt="altText" 
    :class="imageClass"
    @error="handleImageError"
  />
</template>

<script>
export default {
  name: 'ProfilePicture',
  props: {
    userId: {
      type: String,
      required: false,
      default: null
    },
    profilePicture: {
      type: String,
      required: false,
      default: null
    },
    altText: {
      type: String,
      default: 'Photo de profil'
    },
    imageClass: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      error: false
    };
  },
  computed: {
    profilePictureUrl() {
      // Si une profilePicture est fournie directement en prop, l'utiliser
      if (this.profilePicture) {
        const imagePath = this.profilePicture;
        // Vérifier si c'est déjà une URL complète
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
          return imagePath;
        } else {
          // Sinon, construire l'URL
          return `http://localhost:3000/uploads/profiles/${imagePath}`;
        }
      }
      // Image par défaut si aucune image spécifiée
      return 'http://localhost:3000/uploads/profiles/default.jpg';
    }
  },
  methods: {
    handleImageError() {
      console.warn('Erreur de chargement de l\'image');
      this.error = true;
    }
  }
};
</script>

<style scoped>
img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
