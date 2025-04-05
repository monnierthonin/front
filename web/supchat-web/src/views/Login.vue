<template>
  <v-container fluid fill-height>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="elevation-12">
          <v-toolbar dark color="primary">
            <v-toolbar-title>Connexion</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-form id="loginForm" @submit.prevent="handleSubmit" ref="formRef">
              <v-text-field
                v-model="email"
                label="Email"
                type="email"
                required
                prepend-icon="mdi-email"
                :rules="[rules.required, rules.email]"
              />
              <v-text-field
                v-model="password"
                label="Mot de passe"
                type="password"
                required
                prepend-icon="mdi-lock"
                :rules="[rules.required]"
              />
              <v-card-actions>
                <v-spacer />
                <v-btn
                  color="primary"
                  type="submit"
                  :loading="loading"
                >
                  Se connecter
                </v-btn>
              </v-card-actions>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn
              text
              :to="{ name: 'Register' }"
            >
              Créer un compte
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
    >
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn
          text
          @click="snackbar.show = false"
        >
          Fermer
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

export default defineComponent({
  name: 'LoginPage',
  setup() {
    const store = useStore()
    const router = useRouter()

    const email = ref('')
    const password = ref('')
    const loading = ref(false)
    const formRef = ref(null)
    const snackbar = ref({
      show: false,
      text: '',
      color: 'error'
    })

    const rules = ref({
      required: v => !!v || 'Ce champ est requis',
      email: v => /.+@.+\..+/.test(v) || 'Email invalide'
    })

    const handleSubmit = async (event) => {
      event.preventDefault()
      console.log('Tentative de connexion...')
      
      const isValid = await formRef.value?.validate()
      if (!isValid) {
        console.log('Formulaire invalide')
        snackbar.value = {
          show: true,
          text: 'Veuillez remplir correctement tous les champs',
          color: 'error'
        }
        return
      }

      console.log('Email:', email.value)
      loading.value = true
      
      try {
        console.log('Envoi de la requête de connexion...')
        const response = await store.dispatch('auth/login', {
          email: email.value,
          password: password.value
        })
        console.log('Réponse de connexion:', response)
        
        // Vérifier l'état d'authentification
        const isAuthenticated = store.getters['auth/isAuthenticated']
        console.log('Est authentifié:', isAuthenticated)
        
        if (isAuthenticated) {
          snackbar.value = {
            show: true,
            text: 'Connexion réussie !',
            color: 'success'
          }
          console.log('Redirection vers la page d\'accueil...')
          await router.replace('/')
        } else {
          throw new Error('Échec de l\'authentification')
        }
      } catch (error) {
        console.error('Erreur de connexion:', error)
        snackbar.value = {
          show: true,
          text: error.message || 'Erreur lors de la connexion',
          color: 'error'
        }
      } finally {
        loading.value = false
      }
    }

    return {
      email,
      password,
      loading,
      formRef,
      rules,
      snackbar,
      handleSubmit
    }
  }
})
</script>
