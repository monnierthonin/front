import { createRouter, createWebHistory } from 'vue-router'
import store from '../store'
import LoginPage from '../views/Login.vue'
import RegisterPage from '../views/Register.vue'
import HomePage from '../views/Home.vue'
import WorkspacePage from '../views/Workspace.vue'
import CanalPage from '../views/Canal.vue'
import AuthCallback from '../views/AuthCallback.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterPage,
    meta: { requiresGuest: true }
  },
  {
    path: '/auth/callback',
    name: 'AuthCallback',
    component: AuthCallback
  },
  {
    path: '/',
    name: 'Home',
    component: HomePage,
    meta: { requiresAuth: true }
  },
  {
    path: '/workspace/:id',
    name: 'Workspace',
    component: WorkspacePage,
    meta: { requiresAuth: true },
    beforeEnter: (to, from, next) => {
      // Vérifier que l'ID du workspace est défini
      if (!to.params.id || to.params.id === 'undefined') {
        next('/')
        return
      }
      next()
    }
  },
  {
    path: '/workspace/:workspaceId/canal/:canalId',
    name: 'Canal',
    component: CanalPage,
    meta: { requiresAuth: true },
    beforeEnter: (to, from, next) => {
      // Vérifier que les IDs sont définis
      if (!to.params.workspaceId || !to.params.canalId || 
          to.params.workspaceId === 'undefined' || to.params.canalId === 'undefined') {
        next('/')
        return
      }
      next()
    }
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

router.beforeEach((to, from, next) => {
  const isAuthenticated = store.getters['auth/isAuthenticated']

  // Si la route requiert l'authentification et que l'utilisateur n'est pas connecté
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
    return
  }

  // Si la route est pour les invités (login/register) et que l'utilisateur est connecté
  if (to.meta.requiresGuest && isAuthenticated) {
    next('/')
    return
  }

  next()
})

export default router
