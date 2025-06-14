import { createRouter, createWebHistory } from 'vue-router'
import authService from '../services/authService' // Import du service d'authentification

// Définition des routes avec protection
const routes = [
  {
    // Route explicite pour /workspace (sans id) qui redirige vers l'authentification si déconnecté
    path: '/workspace',
    name: 'WorkspaceRedirect',
    beforeEnter: async (to, from, next) => {
      try {
        // Vérifier l'authentification
        const isAuthenticated = await authService.isAuthenticated();
        
        if (!isAuthenticated) {
          // Rediriger vers l'authentification si l'utilisateur n'est pas connecté
          return next('/auth');
        }
        
        // Si authentifié, redirige vers la page d'accueil qui chargera le premier workspace
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
    component: () => import('@/pages/Workspace.vue'), // Composant pour les workspaces
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
    component: () => import('@/pages/Home.vue'), // Page des messages privés
    meta: { requiresAuth: true },
    beforeEnter: async (to, from, next) => {
      try {
        const workspaceService = await import('@/services/workspaceService.js');
        const response = await workspaceService.default.getUserWorkspaces();
        if (response && response.data && response.data.length > 0) {
          // Rediriger vers le premier workspace
          next({ name: 'Workspace', params: { id: response.data[0]._id } });
        } else {
          // Si pas de workspace, continuer vers la page d'accueil
          next();
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des workspaces:', error);
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

// La validation du token est maintenant gérée par authService.isAuthenticated()
// qui vérifie l'authentification via les cookies HTTP-only

// Guard de navigation pour protéger les routes qui nécessitent une authentification
router.beforeEach(async (to, from, next) => {
  console.log('Navigation vers:', to.path);
  
  // Vérifier si la route nécessite une authentification
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const isAuthPage = to.path === '/auth' || to.path === '/auth/callback';
  
  // Vérifier l'état d'authentification de l'utilisateur avec le service d'authentification
  // qui utilise les cookies HTTP-only
  const isAuthenticated = await authService.isAuthenticated();
  console.log('Est authentifié (via cookie):', isAuthenticated);
  
  // Logique de redirection
  if (isAuthPage && isAuthenticated) {
    // Si l'utilisateur est déjà connecté et essaie d'accéder à la page d'authentification
    console.log('Redirection: utilisateur authentifié essayant d\'accéder à /auth, redirection vers /');
    return next('/');
  } else if (requiresAuth && !isAuthenticated) {
    // Si l'utilisateur n'est pas connecté et essaie d'accéder à une route protégée
    console.log('Redirection: accès refusé à une page protégée, redirection vers /auth');
    return next('/auth');
  }
  
  // Dans tous les autres cas, permettre la navigation
  console.log('Navigation autorisée vers:', to.path);
  next();
})

export default router
