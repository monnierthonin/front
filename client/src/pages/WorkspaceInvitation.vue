<template>
  <div class="invitation-container">
    <div class="invitation-card">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Chargement de l'invitation...</p>
      </div>
      
      <div v-else-if="error" class="error-state">
        <i class="fas fa-exclamation-circle error-icon"></i>
        <h1>Erreur</h1>
        <p>{{ errorMessage }}</p>
        <button @click="goToHome" class="btn-primary">Retour à l'accueil</button>
      </div>
      
      <div v-else class="invitation-content">
        <i class="fas fa-envelope-open-text invitation-icon"></i>
        <h1>Invitation à un workspace</h1>
        
        <div class="workspace-info">
          <p>Vous êtes invité à rejoindre le workspace :</p>
          <h2>{{ workspaceName }}</h2>
        </div>
        
        <div class="invitation-actions">
          <button @click="acceptInvitation" class="btn-success" :disabled="processing">
            <span v-if="processing">Traitement...</span>
            <span v-else>Accepter</span>
          </button>
          <button @click="rejectInvitation" class="btn-secondary" :disabled="processing">Refuser</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import workspaceService from '@/services/workspaceService';
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';

export default {
  name: 'WorkspaceInvitation',
  
  setup() {
    const router = useRouter();
    const route = useRoute();
    
    // États du composant
    const loading = ref(true);
    const error = ref(false);
    const errorMessage = ref('');
    const workspaceName = ref('');
    const processing = ref(false);
    
    // Récupérer les paramètres de l'URL
    const workspaceId = route.params.workspaceId;
    const token = route.params.token;
    
    // Vérifier l'invitation au chargement
    onMounted(async () => {
      try {
        // Vérifier que l'on a bien un token et un ID de workspace
        if (!token || !workspaceId) {
          throw new Error("Lien d'invitation incomplet ou invalide");
        }
        
        console.log(`Vérification de l'invitation pour workspace ${workspaceId} avec token ${token}`);
        
        // Vérifier la validité de l'invitation
        const invitationData = await workspaceService.verifyInvitation(workspaceId, token);
        
        // Extraire les informations du workspace
        workspaceName.value = invitationData.workspace?.nom || 'Workspace sans nom';
        
        console.log('Invitation valide pour le workspace:', workspaceName.value);
      } catch (e) {
        console.error("Erreur lors de la vérification de l'invitation:", e);
        error.value = true;
        errorMessage.value = e.message || "Cette invitation n'est pas valide ou a expiré";
      } finally {
        loading.value = false;
      }
    });
    
    // Accepter l'invitation
    const acceptInvitation = async () => {
      processing.value = true;
      try {
        console.log(`Acceptation de l'invitation pour workspace ${workspaceId}`);
        
        // Appel à l'API pour accepter l'invitation
        const response = await workspaceService.acceptInvitation(workspaceId, token);
        
        // Redirection vers le workspace rejoint
        console.log('Invitation acceptée avec succès:', response);
        router.push(`/workspace/${workspaceId}`);
      } catch (e) {
        console.error("Erreur lors de l'acceptation de l'invitation:", e);
        error.value = true;
        errorMessage.value = e.message || "Impossible d'accepter cette invitation";
        processing.value = false;
      }
    };
    
    // Refuser l'invitation
    const rejectInvitation = () => {
      console.log("Invitation refusée");
      router.push('/');
    };
    
    // Redirection vers la page d'accueil
    const goToHome = () => {
      router.push('/');
    };
    
    return {
      loading,
      error,
      errorMessage,
      workspaceName,
      processing,
      acceptInvitation,
      rejectInvitation,
      goToHome
    };
  }
};
</script>

<style scoped>
.invitation-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20px;
}

.invitation-card {
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
  padding: 30px;
  text-align: center;
}

.invitation-icon, .error-icon {
  font-size: 48px;
  color: #5865f2;
  margin-bottom: 20px;
}

.error-icon {
  color: #e74c3c;
}

.workspace-info {
  margin: 24px 0;
}

h1 {
  font-size: 24px;
  margin-bottom: 16px;
  color: #333;
}

h2 {
  font-size: 28px;
  font-weight: 600;
  color: #5865f2;
  margin: 10px 0;
}

p {
  color: #666;
  margin-bottom: 8px;
}

.invitation-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 24px;
}

.btn-primary, .btn-success, .btn-secondary {
  padding: 12px 24px;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.btn-primary {
  background-color: #5865f2;
  color: white;
}

.btn-success {
  background-color: #43b581;
  color: white;
}

.btn-secondary {
  background-color: #f2f3f5;
  color: #4f5660;
}

.btn-primary:hover, .btn-success:hover {
  opacity: 0.9;
}

.btn-secondary:hover {
  background-color: #e3e5e8;
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border-top: 4px solid #5865f2;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
