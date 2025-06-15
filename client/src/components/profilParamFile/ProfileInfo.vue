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
      if (this.currentProfilePicture) {
        // Si c'est déjà une URL complète, l'utiliser directement
        if (this.currentProfilePicture.startsWith('http://') || this.currentProfilePicture.startsWith('https://')) {
          return this.currentProfilePicture;
        }
        // Sinon, construire l'URL (ancien format)
        return `http://localhost:3000/uploads/profiles/${this.currentProfilePicture}`;
      }
      // Image par défaut si aucune image spécifiée
      return 'http://localhost:3000/uploads/profiles/default.jpg';
    }
  },
  created() {
    eventBus.on(APP_EVENTS.PROFILE_PICTURE_UPDATED, (newProfilePicture) => {
      this.currentProfilePicture = newProfilePicture;
    });
    
    eventBus.on(APP_EVENTS.USER_LOGGED_IN, () => {
      this.fetchUserProfile();
      this.currentProfilePicture = localStorage.getItem('profilePicture') || 'default.jpg';
    });
    
    eventBus.on(APP_EVENTS.USER_LOGGED_OUT, () => {
      this.currentUsername = '';
      this.currentEmail = '';
      this.username = '';
      this.email = '';
    });
    
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

  mounted() {
    if (!this.currentUsername || !this.currentEmail) {
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

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        this.errorMessage = 'Seules les images JPG, JPEG, PNG, WEBP et SVG sont acceptées.';
        return;
      }

      const maxSize = 5 * 1024 * 1024; 
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
        const formData = new FormData();
        formData.append('profilePicture', this.selectedFile);

        const response = await fetch('http://localhost:3000/api/v1/users/profile/picture', {
          method: 'PUT',
          credentials: 'include',
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erreur lors de la mise à jour de la photo de profil');
        }

        const data = await response.json();
        
        if (data.success && data.data && data.data.profilePicture) {
          const newProfilePicture = data.data.profilePicture;
          localStorage.setItem('profilePicture', newProfilePicture);
          
          this.currentProfilePicture = newProfilePicture;
          
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
        const profile = await userService.getProfile();
        
        if (profile && profile.data) {
          
          if (profile.data.username) {
            this.currentUsername = profile.data.username;
          } else {
            console.warn('Propriété username manquante dans profile.data');
            this.currentUsername = 'Utilisateur';
          }
          
          if (profile.data.email) {
            this.currentEmail = profile.data.email;
          } else {
            console.warn('Propriété email manquante dans profile.data');
            this.currentEmail = 'email@exemple.com';
          }
        } else {
          console.warn('Format de réponse inattendu, pas de propriété data dans la réponse');
          this.currentUsername = 'Utilisateur';
          this.currentEmail = 'email@exemple.com';
        }
        
        this.$forceUpdate();
        
        return profile;
      } catch (error) {
        console.error('Erreur lors de la récupération du profil:', error);
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
        if (this.selectedFile) {
          const success = await this.uploadProfileImage();
          if (success) {
            this.successMessage = 'Photo de profil mise à jour avec succès';
          }
        }

        if (this.username || this.email) {
          const profileData = {};
          
          if (this.username) {
            profileData.username = this.username;
          }
          
          if (this.email) {
            profileData.email = this.email;
          }
          
          try {
            const result = await userService.updateProfile(profileData);
            
            await this.fetchUserProfile();
            this.username = '';
            this.email = '';
            this.successMessage = 'Profil mis à jour avec succès';
          } catch (err) {
            this.errorMessage = `Erreur lors de la mise à jour du profil: ${err.message}`;
            throw err;
          }
        }
        
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
          
          try {
            await userService.updatePassword({
              oldPassword: this.oldPassword,
              newPassword: this.password
            });
            
            this.password = '';
            this.confirmPassword = '';
            this.oldPassword = '';
            this.successMessage = 'Mot de passe modifié avec succès';
          } catch (error) {
            this.errorMessage = error.message || 'Erreur lors du changement de mot de passe';
          }
        }
      } catch (error) {
        this.errorMessage = error.message || 'Une erreur est survenue';
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
