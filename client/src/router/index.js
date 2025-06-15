import { createRouter, createWebHistory } from 'vue-router'
import authService from '../services/authService'

const routes = [
  {
    path: '/workspace',
    name: 'WorkspaceRedirect',
    beforeEnter: async (to, from, next) => {
      try {
        const isAuthenticated = await authService.isAuthenticated();
        
        if (!isAuthenticated) {
          return next('/auth');
        }
        
        return next('/');
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'authentification:', error);
        return next('/auth');
      }
    }
  },
  {
    path: '/workspace/:id',
    name: 'Workspace',
    component: () => import('@/pages/Workspace.vue'),
    meta: { requiresAuth: true },
    props: true
  },
  {
    path: '/auth',
    name: 'Auth',
    component: () => import('@/pages/Auth.vue')
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('@/pages/Home.vue'),
    meta: { requiresAuth: true },
    beforeEnter: async (to, from, next) => {
      try {
        const workspaceService = await import('@/services/workspaceService.js');
        const response = await workspaceService.default.getUserWorkspaces();
        if (response && response.data && response.data.length > 0) {
          next({ name: 'Workspace', params: { id: response.data[0]._id } });
        } else {
          next();
        }
      } catch (error) {
        next();
      }
    }
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
  },
  {
    path: '/workspaces/invitation/:workspaceId/:token',
    name: 'WorkspaceInvitation',
    component: () => import('@/pages/WorkspaceInvitation.vue')
  },
  {
    path: '/mot-de-passe-oublie',
    name: 'ForgotPassword',
    component: () => import('@/pages/ForgotPassword.vue')
  },
  {
    path: '/reinitialiser-mot-de-passe/:token',
    name: 'ResetPassword',
    component: () => import('@/pages/ResetPassword.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const isAuthPage = to.path === '/auth' || to.path === '/auth/callback';
  
  const isAuthenticated = await authService.isAuthenticated();
  
  if (isAuthPage && isAuthenticated) {
    return next('/');
  } else if (requiresAuth && !isAuthenticated) {
    return next('/auth');
  }
  
  next();
})

export default router
