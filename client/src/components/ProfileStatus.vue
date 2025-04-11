<template>
  <div class="containerSetting2">
    <div class="statusComponent">
      <button class="status-button" @click="toggleStatusMenu">
        <span class="status-indicator" :class="statusColor"></span>
        {{ statusLabel }}
      </button>
    
      <ul v-if="showStatusMenu" class="status-menu">
        <li @click="setStatus('active')">
          <span class="status-indicator green"></span> En ligne
        </li>
        <li @click="setStatus('noInteract')">
          <span class="status-indicator orange"></span> Ne pas déranger
        </li>
        <li @click="setStatus('invisible')">
          <span class="status-indicator red"></span> Invisible
        </li>
        <li @click="setStatus('inactive')">
          <span class="status-indicator red"></span> Hors ligne
        </li>
      </ul>
    </div>
    <div class="modeClaireSombre">
      <p>Mode sombre</p>
      <label class="switch">
        <input type="checkbox" v-model="darkMode">
        <span class="slider"></span>
      </label>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProfileStatus',
  data() {
    return {
      status: "active",
      showStatusMenu: false,
      darkMode: false
    }
  },
  computed: {
    statusLabel() {
      return {
        active: "En ligne",
        noInteract: "Ne pas déranger",
        invisible: "Invisible",
        inactive: "Hors ligne",
      }[this.status];
    },
    statusColor() {
      return {
        active: "green",
        noInteract: "orange",
        invisible: "red",
        inactive: "red",
      }[this.status];
    }
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
.containerSetting2 {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 90%;
}

.modeClaireSombre {
  display: flex;
  flex-direction: row;
  gap: 10px;
}

.statusComponent {
  display: inline-block;
  position: relative;
}

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

.status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
}

.green { background: green; }
.orange { background: orange; }
.red { background: red; }

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

.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 25px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 25px;
}

.slider::before {
  content: "";
  position: absolute;
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 2.5px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #2b2b2b;
}

input:checked + .slider::before {
  transform: translateX(25px);
}
</style>
