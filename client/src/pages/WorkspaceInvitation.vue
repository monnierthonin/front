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
    
    const loading = ref(true);
    const error = ref(false);
    const errorMessage = ref('');
    const workspaceName = ref('');
    const processing = ref(false);
    
    const workspaceId = route.params.workspaceId;
    const token = route.params.token;
    
    onMounted(async () => {
      try {
        if (!token || !workspaceId) {
          throw new Error("Lien d'invitation incomplet ou invalide");
        }
        
        const invitationData = await workspaceService.verifyInvitation(workspaceId, token);
        
        workspaceName.value = invitationData.workspaceNom || 'Workspace sans nom';
        
        if (!workspaceName.value || workspaceName.value === 'Workspace sans nom') {
          try {
            const workspaceDetails = await workspaceService.getWorkspaceById(workspaceId);
            if (workspaceDetails && workspaceDetails.nom) {
              workspaceName.value = workspaceDetails.nom;
            }
          } catch (e) {
            console.warn('Impossible de récupérer le nom du workspace:', e);
          }
        }
      } catch (e) {
        error.value = true;
        errorMessage.value = e.message || "Cette invitation n'est pas valide ou a expiré";
      } finally {
        loading.value = false;
      }
    });
    
    const acceptInvitation = async () => {
      processing.value = true;
      try {
        const response = await workspaceService.acceptInvitation(workspaceId, token);
        
        router.push(`/workspace/${workspaceId}`);
      } catch (e) {
        error.value = true;
        errorMessage.value = e.message || "Impossible d'accepter cette invitation";
        processing.value = false;
      }
    };
    
    const rejectInvitation = () => {
      router.push('/');
    };
    
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
  background-color: var(--background-color);
  padding: 20px;
}

.invitation-card {
  background-color: var(--background-list-message);
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
  padding: 30px;
  text-align: center;
}

.invitation-icon, .error-icon {
  font-size: 48px;
  color: var(--primary-color);
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
  color: var(--text-primary);
}

h2 {
  font-size: 28px;
  font-weight: 600;
  color: var(--primary-color);
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
  background-color: var(--primary-color);
  color: var(--text-color);
}

.btn-success {
  background-color: var(--hover-color);
  color: var(--text-color);
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
  border-top: 4px solid var(--primary-color);
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
