<template>
    <div class="chanels-sidebar">
      <div class="baniere">
        <img src="../../assets/styles/image/baniere.png" alt="baniere">
      </div>
      <div class="chanel-parametre">
        <router-link to="/paramworkspace">
          <button class="parametre-button">
            <img src="../../assets/styles/image/parametre.png" alt="parametre">
          </button>
        </router-link>
      </div>
      <div class="chanels-list">
        <!-- Liste des amis -->
        <div class="chanel-item" v-for="(chanel, index) in chanels" :key="index">
          <div class="chanel-name">{{ chanel.name }}</div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'chanelsList',
    data() {
      return {
        chanels: [
          { name: "travail"},
          { name: "Reunion"},
          { name: "staf"},
          { name: "inviter"},
          { name: "client"},
          { name: "stagiaire"},
          { name: "travail"},
          { name: "Reunion"},
          { name: "staf"},
          { name: "inviter"},
          { name: "client"},
          { name: "stagiaire"},
          { name: "travail"},
          { name: "Reunion"},
          { name: "staf"},
          { name: "inviter"},
          { name: "client"},
          { name: "stagiaire"},
          { name: "client"}
        ]
      }
    }
  }
  </script>
  
  <style scoped>
  .chanels-sidebar {
    position: fixed;
    left: var(--whidth-header);
    top: 0;
    height: 100vh;
    width: var(--whidth-chanelWorkspace);
    background-color: #2B3132;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    border-left: 1px solid var(--border-color);
  }
  
  .chanels-list {
    height: calc(100% - 250px);
    overflow-y: auto;
    scrollbar-width: none;
    padding: 10px;
    margin-top: 10px;
    margin-bottom: 10px;
  }
  
  .chanels-list::-webkit-scrollbar {
    display: none;
  }
  
  .chanel-item {
    display: flex;
    align-items: center;
    padding: 10px;
    margin-bottom: 8px;
    border-radius: 8px;
    cursor: pointer;
    background-color:var(--secondary-color);
    transition: background-color 0.2s ease;
  }
  
  .chanel-item:hover {
    background-color: var(--secondary-color-transition);
  }
  
  .chanel-name {
    color: var(--text-color);
    font-size: 14px;
  }
  
  .chanel-parametre {
    padding: 10px;
    display: flex;
    justify-content: left;
    border-top: 1px solid var(--border-color);
  }
  
  .parametre-button {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background: none;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  
  .parametre-button img {
    width: 100%;
    height: 100%;
  }

  .baniere img{
    width: 200px;
    height: 200px
  }
  
  .parametre-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  </style>
  