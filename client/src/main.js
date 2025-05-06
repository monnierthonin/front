import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Home from './pages/Home.vue'
import Profile from './pages/Profile.vue'
import ParamWorkspace from './pages/ParamWorkspace.vue'
import Admin from './pages/Admin.vue'
import Auth from './pages/Auth.vue'
import { createPinia } from 'pinia'

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
      path: '/admin',
      name: 'Admin',
      component: Admin
    }
  ]
})

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(router)
app.mount('#app')
