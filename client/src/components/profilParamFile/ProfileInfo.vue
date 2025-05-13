<template>
  <div class="containerSetting">
    <div class="profile-image-container">
      <img :src="profileImageUrl" class="profile-image-param" alt="profil">
      <div class="profile-image-overlay" @click="openFileSelector">
        <span>Modifier la photo</span>
      </div>
      <input 
        type="file" 
        ref="fileInput" 
        class="file-input" 
        @change="handleFileChange" 
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
      >
    </div>
    <div class="settings">
      <h2 class="username">{{ currentUsername }}</h2>
      <h2 class="email">{{ currentEmail }}</h2>
      <input type="text" v-model="username" placeholder="Changer votre nom d'utilisateur">
      <input type="email" v-model="email" placeholder="Changer votre email">
      <div class="password-container">
        <input :type="showPassword ? 'text' : 'password'" v-model="password" placeholder="Changer votre mot de passe">
        <img src="../../assets/styles/image/cacher.png" class="toggle-password" @click="togglePassword">
      </div>
      <div class="password-container">
        <input :type="showPassword ? 'text' : 'password'" v-model="confirmPassword" placeholder="Confirmer votre nouveau mot de passe">
        <img src="../../assets/styles/image/cacher.png" class="toggle-password" @click="togglePassword">
      </div>
      <div class="password-container">
        <input :type="showPassword ? 'text' : 'password'" v-model="oldPassword" placeholder="Entrer votre ancien mot de passe">
        <img src="../../assets/styles/image/cacher.png" class="toggle-password" @click="togglePassword">
      </div>
      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
      <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
      <button class="save-button" @click="saveSettings">Enregistrer</button>
    </div>
  </div>
</template>

<script>
import userService from '../../services/userService.js';
import { eventBus, APP_EVENTS } from '../../utils/eventBus.js';

export default {
  name: 'ProfileInfo',
  data() {
    return {
      selectedFile: null,
      currentProfilePicture: localStorage.getItem('profilePicture') || 'default.jpg',
      currentUsername: '',
      currentEmail: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      oldPassword: '',
      showPassword: false,
      errorMessage: '',
      successMessage: ''
    }
  },
  computed: {
    profileImageUrl() {
      // Utiliser directement l'API qui gère déjà l'image par défaut
      const imagePath = this.currentProfilePicture || 'default.jpg';
      return `http://localhost:3000/uploads/profiles/${imagePath}`;
    }
  },
  created() {
    // S'abonner à l'événement de mise à jour de la photo de profil
    eventBus.on(APP_EVENTS.PROFILE_PICTURE_UPDATED, (newProfilePicture) => {
      console.log('ProfileInfo a reçu l\'\u00e9vénement de mise à jour de la photo de profil:', newProfilePicture);
      this.currentProfilePicture = newProfilePicture;
    });
    
    // S'abonner à l'événement de connexion
    eventBus.on(APP_EVENTS.USER_LOGGED_IN, () => {
      console.log('ProfileInfo a reçu l\'\u00e9vénement de connexion');
      // Recharger les données du profil après connexion
      this.fetchUserProfile();
      // Récupérer la nouvelle photo de profil du localStorage
      this.currentProfilePicture = localStorage.getItem('profilePicture') || 'default.jpg';
    });
    
    // S'abonner à l'événement de déconnexion
    eventBus.on(APP_EVENTS.USER_LOGGED_OUT, () => {
      console.log('ProfileInfo a reçu l\'\u00e9vénement de déconnexion');
      // Réinitialiser les données du profil sauf la photo
      // La photo sera correctement actualisée lors de la prochaine connexion
      this.currentUsername = '';
      this.currentEmail = '';
      this.username = '';
      this.email = '';
    });
    
    console.log('Component created, fetching profile...');
    // Utilisation de then/catch au lieu de async/await pour s'assurer que le cycle de vie est complet
    this.fetchUserProfile()
      .then(() => {
        console.log('Profil chargé avec succès dans created!');
        console.log('Username actuel:', this.currentUsername);
        console.log('Email actuel:', this.currentEmail);
      })
      .catch(error => {
        this.errorMessage = "Erreur lors du chargement du profil";
        console.error('Erreur lors du chargement du profil:', error);
      });
  },


  
  // S'assurer que les données sont bien mises à jour après le montage du composant
  mounted() {
    console.log('Component mounted, verifying profile data...');
    console.log('Username après montage:', this.currentUsername);
    console.log('Email après montage:', this.currentEmail);
    
    // Si les données ne sont pas disponibles après le montage, essayer de les récupérer à nouveau
    if (!this.currentUsername || !this.currentEmail) {
      console.log('Données manquantes, nouvel essai...');
      this.fetchUserProfile();
    }
  },
  methods: {
    openFileSelector() {
      this.$refs.fileInput.click();
    },

    async handleFileChange(event) {
      const file = event.target.files[0];
      if (!file) return;

      // Vérifier le type de fichier (comme dans multer.js)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        this.errorMessage = 'Seules les images JPG, JPEG, PNG, WEBP et SVG sont acceptées.';
        return;
      }

      // Vérifier la taille du fichier (max 5MB comme dans multer.js)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        this.errorMessage = 'L\'image ne doit pas dépasser 5MB.';
        return;
      }

      this.selectedFile = file;
      this.errorMessage = '';
      this.successMessage = 'Image sélectionnée. Cliquez sur Enregistrer pour valider.';
    },

    async uploadProfileImage() {
      if (!this.selectedFile) return false;

      try {
        // Créer un nouveau FormData pour l'envoi
        const formData = new FormData();
        formData.append('profilePicture', this.selectedFile);

        // Appel à l'API
        const response = await fetch('http://localhost:3000/api/v1/users/profile/picture', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erreur lors de la mise à jour de la photo de profil');
        }

        const data = await response.json();
        console.log('Photo de profil mise à jour:', data);
        
        // Mettre à jour le localStorage avec le nouveau nom de fichier
        if (data.success && data.data && data.data.profilePicture) {
          const newProfilePicture = data.data.profilePicture;
          localStorage.setItem('profilePicture', newProfilePicture);
          console.log('localStorage mis à jour avec la nouvelle photo:', newProfilePicture);
          
          // Mettre à jour notre propre composant en même temps
          this.currentProfilePicture = newProfilePicture;
          
          // Émettre un événement pour informer les autres composants
          eventBus.emit(APP_EVENTS.PROFILE_PICTURE_UPDATED, newProfilePicture);
        }
        
        this.selectedFile = null;
        return true;
      } catch (error) {
        console.error('Erreur lors de l\'upload de l\'image:', error);
        this.errorMessage = error.message || 'Erreur lors de la mise à jour de la photo de profil';
        return false;
      }
    },
    async fetchUserProfile() {
      try {
        console.log('Exécution de fetchUserProfile...');
        const profile = await userService.getProfile();
        console.log('Données du profil reçues:', profile);
        
        // Vérifier la structure de la réponse et accéder aux données correctement
        // La réponse semble être au format {success: true, data: {...}}
        if (profile && profile.data) {
          console.log('Contenu de profile.data:', profile.data);
          
          if (profile.data.username) {
            this.currentUsername = profile.data.username;
            console.log('Username assigné:', this.currentUsername);
          } else {
            console.warn('Propriété username manquante dans profile.data');
            this.currentUsername = 'Utilisateur';
          }
          
          if (profile.data.email) {
            this.currentEmail = profile.data.email;
            console.log('Email assigné:', this.currentEmail);
          } else {
            console.warn('Propriété email manquante dans profile.data');
            this.currentEmail = 'email@exemple.com';
          }
        } else {
          console.warn('Format de réponse inattendu, pas de propriété data dans la réponse');
          this.currentUsername = 'Utilisateur';
          this.currentEmail = 'email@exemple.com';
        }
        
        // Forcer la mise à jour du DOM
        this.$forceUpdate();
        
        return profile;
      } catch (error) {
        console.error('Erreur lors de la récupération du profil:', error);
        // Définir des valeurs par défaut en cas d'erreur
        this.currentUsername = 'Erreur de chargement';
        this.currentEmail = 'Erreur de chargement';
        throw error;
      }
    },
    togglePassword() {
      this.showPassword = !this.showPassword;
    },
    async saveSettings() {
      this.errorMessage = '';
      this.successMessage = '';
      
      try {
        // Si une image a été sélectionnée, la télécharger d'abord
        if (this.selectedFile) {
          const success = await this.uploadProfileImage();
          if (success) {
            this.successMessage = 'Photo de profil mise à jour avec succès';
          }
        }

        // Gestion de la mise à jour du profil (email et/ou username)
        if (this.username || this.email) {
          const profileData = {};
          
          if (this.username) {
            profileData.username = this.username;
          }
          
          if (this.email) {
            profileData.email = this.email;
          }
          
          await userService.updateProfile(profileData);
          
          // Mise à jour des informations affichées
          await this.fetchUserProfile();
          this.username = '';
          this.email = '';
          this.successMessage = 'Profil mis à jour avec succès';
        }
        
        // Gestion du changement de mot de passe
        const passwordFieldsFilled = [this.password, this.confirmPassword, this.oldPassword].filter(Boolean).length;
        
        if (passwordFieldsFilled > 0 && passwordFieldsFilled < 3) {
          this.errorMessage = 'Tous les champs de mot de passe doivent être remplis pour changer le mot de passe';
          return;
        }
        
        if (passwordFieldsFilled === 3) {
          if (this.password !== this.confirmPassword) {
            this.errorMessage = 'Les nouveaux mots de passe ne correspondent pas';
            return;
          }
          
          console.log('Tentative de mise à jour du mot de passe via le composant');
          try {
            await userService.updatePassword({
              oldPassword: this.oldPassword,
              newPassword: this.password
            });
            
            // Réinitialisation des champs de mot de passe
            this.password = '';
            this.confirmPassword = '';
            this.oldPassword = '';
            this.successMessage = 'Mot de passe modifié avec succès';
          } catch (error) {
            console.error('Erreur attrapée dans le composant:', error);
            this.errorMessage = error.message || 'Erreur lors du changement de mot de passe';
          }
        }
      } catch (error) {
        this.errorMessage = error.message || 'Une erreur est survenue';
        console.error('Erreur lors de la sauvegarde des paramètres:', error);
      }
    }
  }
}
</script>

<style scoped>
.containerSetting {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  gap: 20%;
}

.profile-image-container {
  position: relative;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
}

.profile-image-param {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.profile-image-container:hover .profile-image-overlay {
  opacity: 1;
}

.profile-image-overlay span {
  color: white;
  font-weight: bold;
  text-align: center;
  padding: 0 10px;
}

.file-input {
  display: none;
}

.settings {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  width: 30%;
}

.settings input[type="text"],
.settings input[type="email"],
.settings input[type="password"] {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--secondary-color-transition);
  border-radius: 4px;
  background: var(--secondary-color-transition);
  color: var(--text-primary);
  margin-top: 0.5rem;
  padding-right: 40px;
}

.password-container {
  position: relative;
  width: 100%;
}

.toggle-password {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  width: 20px;
  height: 20px;
  opacity: 0.7;
  transition: opacity 0.3s;
}

.save-button {
  background: #00C900;
  border: 1px solid #00C900;
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  margin-top: 1rem;
  width: 200px;
}

.save-button:hover {
  background-color: #009600;
  border: 1px solid #009600;
}

.error-message {
  color: #ff3333;
  margin-top: 1rem;
  font-weight: bold;
  background-color: rgba(255, 0, 0, 0.1);
  padding: 0.5rem;
  border-radius: 4px;
  border-left: 3px solid #ff3333;
}

.success-message {
  color: #00C900;
  margin-top: 1rem;
  font-weight: bold;
  background-color: rgba(0, 201, 0, 0.1);
  padding: 0.5rem;
  border-radius: 4px;
  border-left: 3px solid #00C900;
}
</style>
