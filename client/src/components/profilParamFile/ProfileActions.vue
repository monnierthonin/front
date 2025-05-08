<template>
  <div class="containerSetting2">
    <button class="deco-button" @click="disconnect">Déconnection</button>
    <button class="suppr-button" @click="showDeleteConfirm">Supprimer</button>

    <!-- Modal de confirmation de suppression -->
    <div v-if="showDeleteModal" class="modal">
      <div class="modal-content">
        <h3>Supprimer le compte</h3>
        <p>Cette action est irréversible. Veuillez entrer votre mot de passe pour confirmer.</p>
        
        <div class="form-group">
          <input 
            type="password" 
            v-model="password" 
            placeholder="Votre mot de passe"
            class="password-input"
          />
          <p v-if="error" class="error-message">{{ error }}</p>
        </div>

        <div class="modal-actions">
          <button class="cancel-button" @click="showDeleteModal = false">Annuler</button>
          <button class="confirm-button" @click="confirmDelete">Confirmer</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import authService from '../../services/authService';
import userService from '../../services/userService';
import { useRouter } from 'vue-router';

export default {
  name: 'ProfileActions',
  setup() {
    const router = useRouter();
    return { router };
  },
  data() {
    return {
      showDeleteModal: false,
      password: '',
      error: ''
    };
  },
  methods: {
    async disconnect() {
      try {
        await authService.logout();
        this.router.push('/auth');
      } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
      }
    },
    showDeleteConfirm() {
      this.showDeleteModal = true;
      this.password = '';
      this.error = '';
    },

    async confirmDelete() {
      if (!this.password) {
        this.error = 'Veuillez entrer votre mot de passe';
        return;
      }
      
      try {
        await userService.deleteAccount(this.password);
        this.showDeleteModal = false;
        this.router.push('/auth');
      } catch (error) {
        this.error = error.message || 'Erreur lors de la suppression du compte';
        console.error('Erreur lors de la suppression du compte:', error);
      }
    }
  }
}
</script>

<style scoped>
.containerSetting2 {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 90%;
  position: relative;
}

.deco-button,
.suppr-button {
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  width: 200px;
}

.deco-button {
  background: #C87400;
  border: 1px solid #C87400;
}

.deco-button:hover {
  background-color: #6b3e00;
  border: 1px solid #6b3e00;
}

.suppr-button {
  background: #C80000;
  border: 1px solid #C80000;
}

.suppr-button:hover {
  background-color: #520000;
  border: 1px solid #520000;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
}

.modal-content h3 {
  margin-top: 0;
  color: #333;
}

.form-group {
  margin: 1.5rem 0;
}

.password-input {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-top: 0.5rem;
}

.error-message {
  color: #C80000;
  margin-top: 0.5rem;
  font-size: 0.9rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.cancel-button,
.confirm-button {
  padding: 0.8rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.cancel-button {
  background: #f5f5f5;
  border: 1px solid #ddd;
  color: #333;
}

.confirm-button {
  background: #C80000;
  border: 1px solid #C80000;
  color: white;
}

.cancel-button:hover {
  background: #eee;
}

.confirm-button:hover {
  background-color: #520000;
  border: 1px solid #520000;
}
</style>
