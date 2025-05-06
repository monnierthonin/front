import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/auth',
    name: 'Auth',
    component: () => import('@/pages/Auth.vue')
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('@/pages/Home.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/pages/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/paramworkspace',
    name: 'ParamWorkspace',
    component: () => import('@/pages/ParamWorkspace.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/pages/Admin.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/auth/callback',
    name: 'AuthCallback',
    component: () => import('@/views/AuthCallback.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Guard de navigation
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  // Si la route requiert une authentification et que l'utilisateur n'est pas connecté
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // Rediriger vers la page de connexion
    next({ name: 'Auth' })
  } else if (to.name === 'Auth' && authStore.isAuthenticated) {
    // Si l'utilisateur est déjà connecté et essaie d'accéder à la page de connexion
    next({ name: 'Home' })
  } else {
    next()
  }
  const authStore = useAuthStore()
  const publicPages = ['/login', '/register', '/auth/callback']
  const authRequired = !publicPages.includes(to.path)

  if (authRequired && !authStore.isAuthenticated) {
    return next('/login')
  }

  next()
})

export default router
