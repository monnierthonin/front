import { createRouter, createWebHistory } from 'vue-router'
import store from '../store'
import LoginPage from '../views/Login.vue'
import RegisterPage from '../views/Register.vue'
import ForgotPasswordPage from '../views/ForgotPassword.vue'
import ResetPasswordPage from '../views/ResetPassword.vue'
import HomePage from '../views/Home.vue'
import WorkspacePage from '../views/Workspace.vue'
import CanalPage from '../views/Canal.vue'
import AuthCallback from '../views/AuthCallback.vue'
import Profile from '../views/Profile.vue'
import InvitationWorkspace from '../views/InvitationWorkspace.vue'
import MessagesPrives from '../views/MessagesPrives.vue'
import Conversation from '../views/Conversation.vue'
import ConversationView from '../views/ConversationView.vue'

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
    path: '/mot-de-passe-oublie',
    name: 'ForgotPassword',
    component: ForgotPasswordPage,
    meta: { requiresGuest: true }
  },
  {
    path: '/reinitialiser-mot-de-passe/:token',
    name: 'ResetPassword',
    component: ResetPasswordPage,
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
      if (!to.params.workspaceId || !to.params.canalId || 
          to.params.workspaceId === 'undefined' || to.params.canalId === 'undefined') {
        next('/')
        return
      }
      next()
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true }
  },
  {
    path: '/workspaces/invitation/:workspaceId/:token',
    name: 'InvitationWorkspace',
    component: InvitationWorkspace
  },
  {
    path: '/workspaces/invitation/:workspaceId/:token/verifier',
    name: 'VerifierInvitation',
    component: InvitationWorkspace
  },
  {
    path: '/workspaces/invitation/:workspaceId/:token/accepter',
    name: 'AccepterInvitation',
    component: InvitationWorkspace,
    meta: { requiresAuth: true }
  },
  {
    path: '/messages',
    name: 'MessagesPrives',
    component: MessagesPrives,
    meta: { requiresAuth: true }
  },
  {
    path: '/messages/:userId',
    name: 'conversation',
    component: Conversation,
    meta: { requiresAuth: true },
    beforeEnter: (to, from, next) => {
      if (!to.params.userId || to.params.userId === 'undefined') {
        next('/messages')
        return
      }
      next()
    }
  },
  {
    path: '/messages/conversation/:id',
    name: 'conversationGroup',
    component: ConversationView,
    meta: { requiresAuth: true },
    beforeEnter: (to, from, next) => {
      if (!to.params.id || to.params.id === 'undefined') {
        next('/messages')
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

// Initialiser l'état d'authentification
let authInitialized = false

router.beforeEach(async (to, from, next) => {
  // Liste des routes publiques qui ne nécessitent pas d'authentification
  const publicRoutes = ['InvitationWorkspace', 'VerifierInvitation', 'ResetPassword', 'ForgotPassword', 'Login', 'Register']
  
  // Si c'est une route publique, on ne vérifie pas l'authentification
  if (publicRoutes.includes(to.name)) {
    next()
    return
  }

  // Initialiser l'état d'authentification si ce n'est pas déjà fait
  if (!authInitialized) {
    await store.dispatch('auth/initAuth')
    await store.dispatch('auth/checkAuth')
    authInitialized = true
  }

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
