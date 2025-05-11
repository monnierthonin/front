<template>
  <div class="containerSetting2">
    <div class="statusComponent">
      <button class="status-button" @click="toggleStatusMenu">
        <span class="status-indicator" :class="statusColor"></span>
        {{ statusLabel }}
      </button>
    
      <ul v-if="showStatusMenu" class="status-menu">
        <li @click="setStatus('online')">
          <span class="status-indicator green"></span> En ligne
        </li>
        <li @click="setStatus('away')">
          <span class="status-indicator orange"></span> Absent
        </li>
        <li @click="setStatus('offline')">
          <span class="status-indicator red"></span> Hors ligne
        </li>
      </ul>
    </div>
    <div class="modeClaireSombre">
      <p>{{ darkMode ? 'Mode clair' : 'Mode sombre' }}</p>
      <label class="switch">
        <input type="checkbox" v-model="darkMode" @change="updateThemePreference">
        <span class="slider"></span>
      </label>
    </div>
  </div>
</template>

<script>
import userService from '../../services/userService.js';

export default {
  name: 'ProfileStatus',
  data() {
    return {
      status: "online",
      showStatusMenu: false,
      darkMode: false,
      loading: false,
      error: null
    }
  },
  async created() {
    try {
      // Récupérer le profil de l'utilisateur pour obtenir son statut et son thème actuels
      const response = await userService.getProfile();
      if (response && response.data) {
        // Définir le statut correctement
        this.status = response.data.status || 'online';
        
        // Récupérer le thème correctement (en français dans l'API)
        this.darkMode = response.data.theme === 'sombre';
        
        // NE PAS redéfinir les classes CSS ici pour éviter de surcharger App.vue
        // Le thème est déjà appliqué par App.vue lors du chargement initial
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      this.error = 'Impossible de charger vos préférences';
    }
  },
  computed: {
    statusLabel() {
      return {
        online: "En ligne",
        away: "Absent",
        offline: "Hors ligne",
      }[this.status] || "En ligne";
    },
    statusColor() {
      return {
        online: "green",
        away: "orange",
        offline: "red",
      }[this.status] || "green";
    }
  },
  methods: {
    toggleStatusMenu() {
      this.showStatusMenu = !this.showStatusMenu;
    },
    async setStatus(newStatus) {
      this.loading = true;
      this.error = null;
      
      try {
        await userService.updateStatus(newStatus);
        this.status = newStatus;
        this.showStatusMenu = false;
      } catch (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
        this.error = 'Impossible de mettre à jour votre statut';
      } finally {
        this.loading = false;
      }
    },
    async updateThemePreference() {
      // Le service userService s'attend à des valeurs en français
      const theme = this.darkMode ? 'sombre' : 'clair';
      this.loading = true;
      this.error = null;
      
      try {
        await userService.updateTheme(theme);
        
        // Sauvegarder le thème en anglais dans le localStorage pour la cohérence avec App.vue
        const localTheme = this.darkMode ? 'dark' : 'light';
        localStorage.setItem('theme', localTheme);
        
        // Appliquer le thème à l'application
        if (this.darkMode) {
          document.documentElement.classList.remove('light-theme');
          document.documentElement.classList.add('dark-theme');
        } else {
          document.documentElement.classList.remove('dark-theme');
          document.documentElement.classList.add('light-theme');
        }
      } catch (error) {
        console.error('Erreur lors de la mise à jour du thème:', error);
        this.error = 'Impossible de mettre à jour votre thème';
        // Revenir à l'état précédent en cas d'erreur
        this.darkMode = !this.darkMode;
      } finally {
        this.loading = false;
      }
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
