import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Home from './pages/Home.vue'
import Profile from './pages/Profile.vue'
import ParamWorkspace from './pages/ParamWorkspace.vue'
import Workspace from './pages/Workspace.vue'
import Admin from './pages/Admin.vue'
import Auth from './pages/Auth.vue'
import { createPinia } from 'pinia'
import socketService from './services/socketService'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home
    },
    {
      path: '/auth',
      name: 'Auth',
      component: Auth
    },
    {
      path: '/profile',
      name: 'Profile',
      component: Profile
    },
    {
      path: '/paramworkspace',
      name: 'ParamWorkspace',
      component: ParamWorkspace
    },
    {
      path: '/workspace/:id',
      name: 'Workspace',
      component: Workspace,
      props: true
    },
    {
      path: '/admin',
      name: 'Admin',
      component: Admin
    }
  ]
})

const pinia = createPinia()
const app = createApp(App)

// Initialisation de Socket.IO avec le token d'authentification
const token = localStorage.getItem('token')
if (token) {
  const socket = socketService.init(token)
  app.config.globalProperties.$socket = socket
  // Rendre socketService disponible dans toute l'application
  app.config.globalProperties.$socketService = socketService
}

app.use(pinia)
app.use(router)

// Intercepter les changements de route pour assurer que Socket.IO est connecté
router.beforeEach((to, from, next) => {
  // Si on n'est pas sur la page d'authentification et que Socket.IO n'est pas connecté
  if (to.name !== 'Auth' && !socketService.isConnected()) {
    const token = localStorage.getItem('token')
    if (token) {
      socketService.init(token)
    }
  }
  next()
})

app.mount('#app')
