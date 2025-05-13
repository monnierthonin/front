<template>
  <img 
    :src="profilePictureUrl" 
    :alt="altText" 
    :class="imageClass"
    @error="handleImageError"
  />
</template>

<script>
import userService from '../../services/userService.js';

export default {
  name: 'ProfilePicture',
  props: {
    userId: {
      type: String,
      required: true
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
      profilePictureUrl: '',
      loading: true,
      error: false
    };
  },
  created() {
    this.loadProfilePicture();
  },
  watch: {
    userId: {
      handler() {
        this.loadProfilePicture();
      }
    }
  },
  methods: {
    async loadProfilePicture() {
      if (!this.userId) {
        this.profilePictureUrl = '';
        return;
      }
      
      try {
        this.loading = true;
        const response = await userService.getUserProfileById(this.userId);
        console.log('Réponse brute de getUserProfileById:', response);
        
        // Vérification de la structure de la réponse
        let userProfile;
        if (response && response.data) {
          // Si les données sont encapsulées dans un objet data
          userProfile = response.data;
          console.log('Données utilisateur dans response.data:', userProfile);
        } else {
          // Si les données sont directement dans la réponse
          userProfile = response;
          console.log('Données utilisateur directement dans response:', userProfile);
        }
        
        if (userProfile) {
          console.log('Photo de profil récupérée:', userProfile.profilePicture);
          
          // Construire l'URL complète si nécessaire
          if (userProfile.profilePicture && (userProfile.profilePicture.startsWith('http://') || userProfile.profilePicture.startsWith('https://'))) {
            // Si c'est déjà une URL complète
            this.profilePictureUrl = userProfile.profilePicture;
            console.log('URL complète utilisée:', this.profilePictureUrl);
          } else {
            // Sinon, utiliser le chemin vers l'API avec le nom d'image
            // L'image default.jpg sera automatiquement utilisée si aucune image n'est définie
            const imagePath = userProfile.profilePicture || 'default.jpg';
            this.profilePictureUrl = `http://localhost:3000/uploads/profiles/${imagePath}`;
            console.log('URL construite:', this.profilePictureUrl);
          }
        } else {
          // Même en cas d'erreur, on pointe vers l'image par défaut
          this.profilePictureUrl = 'http://localhost:3000/uploads/profiles/default.jpg';
          console.log('URL par défaut utilisée:', this.profilePictureUrl);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la photo de profil:', error);
        this.error = true;
        this.profilePictureUrl = '';
      } finally {
        this.loading = false;
      }
    },
    
    handleImageError() {
      console.warn('Erreur de chargement de l\'image pour l\'utilisateur:', this.userId);
      // Ne pas essayer de recharger l'image en erreur pour éviter les boucles infinies
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
