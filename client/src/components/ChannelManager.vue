<template>
  <div class="containerSettingUserChanel">
    <div class="search-header">
      <h3>Gestionnaire canal</h3>
      <div class="search-controls">
        <input type="text" v-model="channelSearchQuery" placeholder="Rechercher un canal..." class="search-input"/>
        <select v-model="channelFilter" class="filter-select">
          <option value="all">Tout</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
          <option value="guest">Invité</option>
        </select>
      </div>
      <div class="channels-list">
        <div v-for="channel in channels" :key="channel.id" class="channel-item">
          <img :src="channel.channelImage" :alt="channel.name" class="channel-avatar">
          <span class="channel-name">{{ channel.name }}</span>
          <select v-model="channel.status" class="status-select">
            <option value="public">Public</option>
            <option value="private">Privé</option>
          </select>
          <select v-model="channel.access" class="access-select">
            <option value="all">Tous</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
          <button class="delete-channel-button"><img src="../assets/styles/image/ban.png" alt="delete" class="delete"></button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ChannelManager',
  data() {
    return {
      channelSearchQuery: '',
      channelFilter: 'all',
      channels: [
        {
          id: 1,
          name: 'Général',
          channelImage: "../assets/styles/image/profilDelault.png",
          status: 'public',
          access: 'all'
        },
        {
          id: 2,
          name: 'Annonces',
          channelImage: "../assets/styles/image/profilDelault.png",
          status: 'private',
          access: 'admin'
        },
        {
          id: 3,
          name: 'Discussion',
          channelImage: "../assets/styles/image/profilDelault.png",
          status: 'public',
          access: 'user'
        },
        {
          id: 4,
          name: 'Discussion',
          channelImage: "../assets/styles/image/profilDelault.png",
          status: 'public',
          access: 'user'
        },
        {
          id: 5,
          name: 'Discussion',
          channelImage: "../assets/styles/image/profilDelault.png",
          status: 'public',
          access: 'user'
        },
        {
          id: 6,
          name: 'Discussion',
          channelImage: "../assets/styles/image/profilDelault.png",
          status: 'public',
          access: 'user'
        },
        {
          id: 7,
          name: 'Discussion',
          channelImage: "../assets/styles/image/profilDelault.png",
          status: 'public',
          access: 'user'
        },
        {
          id: 8,
          name: 'Discussion',
          channelImage: "../assets/styles/image/profilDelault.png",
          status: 'public',
          access: 'user'
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

.channels-list {
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

.channels-list::-webkit-scrollbar {
  width: 8px;
}

.channels-list::-webkit-scrollbar-track {
  background: #D9D9D9;
  border-radius: 4px;
}

.channels-list::-webkit-scrollbar-thumb {
  background-color: #7D7D7D;
  border-radius: 4px;
}

.channel-item {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  background: #443E3E;
  gap: 1rem;
  border-radius: 10px;
}

.channel-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.channel-name {
  color: #fff;
  flex: 1;
}

.status-select, .access-select {
  padding: 0.3rem;
  border-radius: 4px;
  background: #333;
  color: #fff;
  border: 1px solid #555;
}

.delete-channel-button {
  height: 40px;
  width: 40px;
  background: none;
  border: none;
  align-items: center;
  justify-content: center;
  display: flex;
}

.delete-channel-button img {
  width: 40px;
}
</style>
