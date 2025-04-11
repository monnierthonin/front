<template>
  <div class="containerSettingUserChanel">
    <div class="search-header">
      <h3>Gestionnaire workspace</h3>
      <div class="search-controls">
        <input type="text" v-model="userSearchQuery" placeholder="Rechercher un workspace..." class="search-input"/>
      </div>
      <div class="workspaces-list">
        <div v-for="workspace in workspaces" :key="workspace.id" class="workspace-item">
          <img :src="workspace.avatar || '../../assets/styles/image/profilDelault.png'" :alt="workspace.name" class="workspace-avatar">
          <span class="workspace-name">{{ workspace.name }}</span>
          <select v-model="workspace.role" class="workspaceUser">
            <option value="admin">Admin</option>
            <option value="user">User</option>
            <option value="guest">Invité</option>
          </select>
          <select v-model="workspace.role" class="workspaceChanel">
            <option value="admin">Admin</option>
            <option value="user">User</option>
            <option value="guest">Invité</option>
          </select>
          <div class="action-buttons">
            <button class="report-button"><img src="../../assets/styles/image/signalement.png" alt="report" class="report"></button>
            <button class="bann-button"><img src="../../assets/styles/image/ban.png" alt="bann" class="bann"></button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'UserManager',
  data() {
    return {
      userSearchQuery: '',
      userFilter: 'all',
      workspaces: [
        {
          id: 1,
          name: 'Workspace 1',
          avatar: null
        },
        {
          id: 2,
          name: 'Workspace 2',
          avatar: null
        },
        {
          id: 3,
          name: 'Workspace 3',
          avatar: null
        },
        {
          id: 4,
          name: 'Workspace 4',
          avatar: null
        },
        {
          id: 5,
          name: 'Workspace 5',
          avatar: null
        },
        {
          id: 6,
          name: 'Workspace 6',
          avatar: null
        },
        {
          id: 7,
          name: 'Workspace 7',
          avatar: null
        }
      ]
    }
  }
}
</script>

<style scoped>
.containerSettingUserChanel {
  border: 5px solid #443E3E;
  border-radius: 10px;
  width: 70%;
  scrollbar-width: thin;
  scrollbar-color: #7D7D7D #D9D9D9;
}

.containerSettingUserChanel::-webkit-scrollbar {
  width: 8px;
}

.containerSettingUserChanel::-webkit-scrollbar-track {
  background: #D9D9D9;
  border-radius: 4px;
}

.containerSettingUserChanel::-webkit-scrollbar-thumb {
  background-color: #7D7D7D;
  border-radius: 4px;
}

.search-header {
  padding: 1rem;
}

.search-header h3 {
  margin-bottom: 1rem;
  color: #fff;
}

.search-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-input {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #2f3136;
  color: #fff;
  width: 60%;
}

.filter-select {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #2f3136;
  color: #fff;
  cursor: pointer;
}

.filter-select option {
  background-color: #2f3136;
  color: #fff;
}

.workspaces-list {
  max-height: 300px;
  overflow-y: auto;
  margin-top: 1rem;
  padding: 0 1rem;
  display: flex;
  flex-direction: column;
  gap: 10px;
  scrollbar-width: thin;
  scrollbar-color: #7D7D7D #D9D9D9;
}

.workspaces-list::-webkit-scrollbar {
  width: 8px;
}

.workspaces-list::-webkit-scrollbar-track {
  background: #D9D9D9;
  border-radius: 4px;
}

.workspaces-list::-webkit-scrollbar-thumb {
  background-color: #7D7D7D;
  border-radius: 4px;
}

.workspace-item {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  background: #443E3E;
  gap: 1rem;
  border-radius: 10px;
}

.workspace-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.workspace-name {
  color: #fff;
  flex: 1;
}

.workspaceUser {
  padding: 0.3rem;
  border-radius: 4px;
  background: #333;
  color: #fff;
  border: 1px solid #555;
}

.workspaceChanel {
  padding: 0.3rem;
  border-radius: 4px;
  background: #333;
  color: #fff;
  border: 1px solid #555;
}

.role-button {
  padding: 0.3rem 1rem;
  background: #444;
  color: #fff;
  border: 1px solid #555;
  border-radius: 4px;
  cursor: pointer;
}

.role-button:hover {
  background: #555;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.report-button img {
  width: 45px;
}

.report-button {
  height: 40px;
  width: 40px;
  background: none;
  border: none;
  align-items: center;
  justify-content: center;
  display: flex;
}

.bann-button img {
  width: 40px;
}

.bann-button {
  height: 40px;
  width: 40px;
  background: none;
  border: none;
  align-items: center;
  justify-content: center;
  display: flex;
}
</style>
