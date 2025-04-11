<template>
  <div class="admin-container">
    <h1>Administration</h1>
    <div class="admin-sections">
      <AdminUserManager />
      <AdminWorkspaceManager />
    </div>
  </div>
</template>

<script>
import AdminUserManager from '../components/adminFile/AdminUserManager.vue'
import AdminWorkspaceManager from '../components/adminFile/AdminWorkspaceManager.vue'

export default {
  name: 'Admin',
  components: {
    AdminUserManager,
    AdminWorkspaceManager
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
