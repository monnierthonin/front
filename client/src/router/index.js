import { createRouter, createWebHistory } from 'vue-router'

// Définition des routes avec protection
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

// Fonction pour vérifier si un token JWT est valide (non expiré)
function isTokenValid(token) {
  if (!token) return false;
  
  try {
    // Extraire le payload du token
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    // Vérifier si le token a expiré
    const expiration = payload.exp * 1000; // Convertir en millisecondes
    return Date.now() < expiration;
  } catch (error) {
    console.error('Erreur lors de la validation du token:', error);
    return false;
  }
}

// Guard de navigation pour protéger TOUTES les routes qui nécessitent une authentification
router.beforeEach((to, from, next) => {
  // Récupérer et valider le token d'authentification
  const token = localStorage.getItem('token');
  const isAuthenticated = token && isTokenValid(token);
  
  // Si le token existe mais n'est pas valide, le supprimer
  if (token && !isTokenValid(token)) {
    console.log('Token expiré ou invalide, suppression...');
    localStorage.removeItem('token');
  }
  
  // Définir les routes accessibles sans authentification
  const publicRoutes = ['/auth', '/auth/callback'];
  
  // Vérifier si la route actuelle est une route publique
  const isPublicRoute = publicRoutes.includes(to.path);
  
  console.log(`Nav vers: ${to.path}, Auth: ${isAuthenticated}, Public: ${isPublicRoute}`);
  
  // Si la route n'est pas publique et l'utilisateur n'est pas authentifié
  if (!isPublicRoute && !isAuthenticated) {
    console.warn(`Accès non autorisé à ${to.path} - redirection vers /auth`);
    return next('/auth');
  }
  
  // Si l'utilisateur est authentifié et essaie d'accéder à la page d'authentification
  if (isPublicRoute && isAuthenticated) {
    console.log('Utilisateur déjà connecté, redirection vers la page d\'accueil');
    return next('/');
  }
  
  // Dans tous les autres cas, autoriser la navigation
  next();
})

export default router
