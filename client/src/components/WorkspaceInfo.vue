<template>
  <div class="workspace-info">
    <div class="containerSetting">
      <img src="../assets/styles/image/profilDelault.png" class="workspace-image-param" alt="profil">
      <div class="settings">
        <h2 class="owner">Owner</h2>
        <h2 class="name">name</h2>
      </div>
    </div>
    <div class="containerSettingWorkspace">
      <p class="description">
        Description : Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the le
      </p>
      <div class="statusComponent">
        <button class="status-button" @click="toggleStatusMenu">
          <span class="status-indicator" :class="statusColor"></span>
          {{ statusLabel }}
        </button>
      
        <ul v-if="showStatusMenu" class="status-menu">
          <li @click="setStatus('priver')">
            <span class="status-indicator orange"></span> Priver
          </li>
          <li @click="setStatus('publique')">
            <span class="status-indicator green"></span> Publique
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WorkspaceInfo',
  data() {
    return {
      status: "priver",
      showStatusMenu: false,
    }
  },
  computed: {
    statusLabel() {
      return {
        priver: "Priver",
        publique: "Publique",
      }[this.status];
    },
    statusColor() {
      return {
        priver: "orange",
        publique: "green",
      }[this.status];
    },
  },
  methods: {
    toggleStatusMenu() {
      this.showStatusMenu = !this.showStatusMenu;
    },
    setStatus(newStatus) {
      this.status = newStatus;
      this.showStatusMenu = false;
    }
  }
}
</script>

<style scoped>
.workspace-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.containerSetting {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  gap: 20%;
}

.containerSettingWorkspace {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 30px;
}

.workspace-image-param {
  width: 200px;
  height: 200px;
}

.description {
  width: 50%;
}

/* Conteneur compact */
.statusComponent {
  display: inline-block;
  position: relative;
}

/* Bouton compact */
.status-button {
  display: flex;
  align-items: center;
  background: var(--background-primary);
  color: var(--text-primary);
  padding: 8px 12px;
  border: 1px solid var(--secondary-color-transition);
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.status-button:hover {
  background: var(--secondary-color-transition);
}

/* Pastille de statut */
.status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
}

.green { background: green; }
.orange { background: orange; }

/* Menu déroulant */
.status-menu {
  position: absolute;
  top: 100%;
  left: 0;
  width: 200px;
  background: var(--background-primary);
  border: 1px solid var(--secondary-color-transition);
  border-radius: 4px;
  list-style: none;
  padding: 0;
  margin: 5px 0;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.status-menu li {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.status-menu li:hover {
  background: var(--secondary-color-transition);
}
</style>
