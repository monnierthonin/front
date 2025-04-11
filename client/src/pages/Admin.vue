<template>
  <div class="admin-container">
    <h1>Administration</h1>
    <div class="admin-sections">
      <div class="admin-section">
        <h2>Gestion des utilisateurs</h2>
        <UserManager />
      </div>
      <div class="admin-section">
        <h2>Gestion des canaux</h2>
        <ChannelManager />
      </div>
    </div>
  </div>
</template>

<script>
import UserManager from '../components/workspaceParamFile/UserManager.vue'
import ChannelManager from '../components/workspaceParamFile/ChannelManager.vue'

export default {
  name: 'Admin',
  components: {
    UserManager,
    ChannelManager
  }
}
</script>

<style scoped>
.admin-container {
  margin-left: var(--whidth-header);
  padding: 2rem;
  max-width: 100%;
  min-height: 100vh;
  background-color: var(--background-primary);
}

h1 {
  color: var(--text-primary);
  margin-bottom: 2rem;
  font-size: 2rem;
}

.admin-sections {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.admin-section {
  background: var(--background-secondary);
  border-radius: 10px;
  padding: 2rem;
}

h2 {
  color: var(--text-primary);
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}
</style>
