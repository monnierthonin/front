# Documentation Authentification

## Endpoints

### 1. Login

```http
POST /api/auth/login
```

**Corps de la requête :**
```json
{
  "email": "user@example.com",
  "password": "motdepasse"
}
```

**Réponse :**
```json
{
  "status": "success",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "nom": "John",
      "prenom": "Doe",
      "avatar": "/avatars/user_id.jpg"
    }
  }
}
```

### 2. Inscription

```http
POST /api/auth/register
```

**Corps de la requête :**
```json
{
  "email": "user@example.com",
  "password": "motdepasse",
  "nom": "Doe",
  "prenom": "John"
}
```

### 3. Déconnexion

```http
POST /api/auth/logout
```

## Intégration Vue.js

### 1. Store Vuex pour l'authentification

```javascript
// store/auth.js
import axios from 'axios'

export default {
  state: {
    token: localStorage.getItem('token'),
    user: JSON.parse(localStorage.getItem('user'))
  },
  
  mutations: {
    SET_TOKEN(state, token) {
      state.token = token
      localStorage.setItem('token', token)
    },
    SET_USER(state, user) {
      state.user = user
      localStorage.setItem('user', JSON.stringify(user))
    },
    CLEAR_AUTH(state) {
      state.token = null
      state.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  },
  
  actions: {
    async login({ commit }, credentials) {
      try {
        const { data } = await axios.post('/api/auth/login', credentials)
        commit('SET_TOKEN', data.data.token)
        commit('SET_USER', data.data.user)
        return data
      } catch (error) {
        throw error
      }
    },
    
    async logout({ commit }) {
      try {
        await axios.post('/api/auth/logout')
      } finally {
        commit('CLEAR_AUTH')
      }
    }
  }
}
```

### 2. Configuration Axios

```javascript
// plugins/axios.js
import axios from 'axios'
import store from '@/store'

axios.defaults.baseURL = process.env.VUE_APP_API_URL

// Ajouter le token à chaque requête
axios.interceptors.request.use(config => {
  const token = store.state.auth.token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Gérer les erreurs d'authentification
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      store.dispatch('auth/logout')
      router.push('/login')
    }
    return Promise.reject(error)
  }
)
```

### 3. Composant de Login

```vue
<!-- components/LoginForm.vue -->
<template>
  <form @submit.prevent="handleSubmit">
    <div class="form-group">
      <input
        v-model="email"
        type="email"
        placeholder="Email"
        required
      >
    </div>
    
    <div class="form-group">
      <input
        v-model="password"
        type="password"
        placeholder="Mot de passe"
        required
      >
    </div>
    
    <button type="submit" :disabled="loading">
      {{ loading ? 'Connexion...' : 'Se connecter' }}
    </button>
    
    <p v-if="error" class="error">
      {{ error }}
    </p>
  </form>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  data() {
    return {
      email: '',
      password: '',
      loading: false,
      error: null
    }
  },
  
  methods: {
    ...mapActions('auth', ['login']),
    
    async handleSubmit() {
      this.loading = true
      this.error = null
      
      try {
        await this.login({
          email: this.email,
          password: this.password
        })
        this.$router.push('/')
      } catch (error) {
        this.error = error.response?.data?.message || 'Erreur de connexion'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
```

### 4. Guard de Route

```javascript
// router/index.js
import store from '@/store'

const router = new VueRouter({
  routes: [
    {
      path: '/',
      component: Home,
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      component: Login
    }
  ]
})

router.beforeEach((to, from, next) => {
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!store.state.auth.token) {
      next('/login')
    } else {
      next()
    }
  } else {
    next()
  }
})
```

## Sécurité

1. Le token JWT est stocké dans le localStorage
2. Toutes les routes protégées nécessitent le token dans le header Authorization
3. Le token expire après 24h
4. Les mots de passe sont hachés avec bcrypt
5. Protection CSRF activée

## Gestion des erreurs

Les erreurs possibles :

- 401: Non authentifié
- 403: Non autorisé
- 422: Données invalides
- 429: Trop de tentatives

```javascript
// Exemple de gestion des erreurs
try {
  await login(credentials)
} catch (error) {
  switch (error.response?.status) {
    case 401:
      // Identifiants invalides
      break
    case 429:
      // Trop de tentatives
      break
    default:
      // Autre erreur
  }
}
```
