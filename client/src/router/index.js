import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  // ... vos autres routes ...
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
  const publicPages = ['/login', '/register', '/auth/callback']
  const authRequired = !publicPages.includes(to.path)

  if (authRequired && !authStore.isAuthenticated) {
    return next('/login')
  }

  next()
})

export default router
