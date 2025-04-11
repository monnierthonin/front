<template>
  <div class="containerSettingUserChanel">
    <div class="search-header">
      <h3>Gestionnaire utilisateur</h3>
      <div class="search-controls">
        <input type="text" v-model="userSearchQuery" placeholder="Rechercher un utilisateur..." class="search-input"/>
      </div>
      <div class="users-list">
        <div v-for="user in users" :key="user.id" class="user-item">
          <img :src="user.profileImage" :alt="user.username" class="user-avatar">
          <span class="username">{{ user.username }}</span>
          <select v-model="user.role" class="UserMessages">
            <option value="admin">Admin</option>
            <option value="user">User</option>
            <option value="guest">Invité</option>
          </select>
          <select v-model="user.role" class="UserWorkspace">
            <option value="admin">Admin</option>
            <option value="user">User</option>
            <option value="guest">Invité</option>
          </select>
          <div class="action-buttons">
            <button class="exit-button"><img src="../../assets/styles/image/banTempo.png" alt="exit" class="exit"></button>
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
      users: [
        {
          id: 1,
          username: 'JohnDoe',
          profileImage: "../../assets/styles/image/profilDelault.png",
          role: 'admin'
        },
        {
          id: 2,
          username: 'JaneSmith',
          profileImage: "../../assets/styles/image/profilDelault.png",
          role: 'user'
        },
        {
          id: 3,
          username: 'GuestUser',
          profileImage: "../../assets/styles/image/profilDelault.png",
          role: 'guest'
        },
        {
          id: 4,
          username: 'GuestUser',
          profileImage: "../../assets/styles/image/profilDelault.png",
          role: 'guest'
        },
        {
          id: 5,
          username: 'GuestUser',
          profileImage: "../../assets/styles/image/profilDelault.png",
          role: 'guest'
        },
        {
          id: 6,
          username: 'GuestUser',
          profileImage: "../../assets/styles/image/profilDelault.png",
          role: 'guest'
        },
        {
          id: 7,
          username: 'GuestUser',
          profileImage: "../../assets/styles/image/profilDelault.png",
          role: 'guest'
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

.users-list {
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

.users-list::-webkit-scrollbar {
  width: 8px;
}

.users-list::-webkit-scrollbar-track {
  background: #D9D9D9;
  border-radius: 4px;
}

.users-list::-webkit-scrollbar-thumb {
  background-color: #7D7D7D;
  border-radius: 4px;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  background: #443E3E;
  gap: 1rem;
  border-radius: 10px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.username {
  color: #fff;
  flex: 1;
}

.UserMessages {
  padding: 0.3rem;
  border-radius: 4px;
  background: #333;
  color: #fff;
  border: 1px solid #555;
}

.UserWorkspace {
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

.exit-button img {
  width: 40px;
}

.exit-button {
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
