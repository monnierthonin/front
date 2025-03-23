<template>
  <v-container fluid fill-height>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="elevation-12">
          <v-toolbar dark color="primary">
            <v-toolbar-title>Inscription</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-form @submit.prevent="handleSubmit" ref="formRef">
              <v-text-field
                v-model="email"
                label="Email"
                type="email"
                required
                prepend-icon="mdi-email"
                :rules="[rules.required, rules.email]"
              />
              <v-text-field
                v-model="username"
                label="Nom d'utilisateur"
                required
                prepend-icon="mdi-account"
                :rules="[rules.required, rules.username]"
                hint="Le nom d'utilisateur doit contenir au moins 3 caractères"
                persistent-hint
              />
              <v-text-field
                v-model="password"
                label="Mot de passe"
                type="password"
                required
                prepend-icon="mdi-lock"
                :rules="[rules.required, rules.password]"
                hint="Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial"
                persistent-hint
              />
              <v-text-field
                v-model="confirmPassword"
                label="Confirmer le mot de passe"
                type="password"
                required
                prepend-icon="mdi-lock"
                :rules="[rules.required, rules.confirmPassword]"
              />
              <v-text-field
                v-model="nom"
                label="Nom"
                required
                prepend-icon="mdi-account"
                :rules="[rules.required]"
              />
              <v-text-field
                v-model="prenom"
                label="Prénom"
                required
                prepend-icon="mdi-account"
                :rules="[rules.required]"
              />
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn
              color="primary"
              @click="handleSubmit"
              :loading="loading"
            >
              S'inscrire
            </v-btn>
          </v-card-actions>
          <v-card-actions>
            <v-spacer />
            <v-btn
              text
              :to="{ name: 'Login' }"
            >
              Déjà un compte ? Se connecter
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
  name: 'RegisterPage',
  setup() {
    const store = useStore()
    const router = useRouter()
    const email = ref('')
    const username = ref('')
    const password = ref('')
    const confirmPassword = ref('')
    const nom = ref('')
    const prenom = ref('')
    const loading = ref(false)
    const formRef = ref(null)
    const snackbar = ref({
      show: false,
      text: '',
      color: 'success'
    })

    const rules = ref({
      required: v => !!v || 'Ce champ est requis',
      email: v => /.+@.+\..+/.test(v) || 'Email invalide',
      username: v => {
        if (!v) return 'Nom d\'utilisateur requis'
        if (v.length < 3) return 'Le nom d\'utilisateur doit contenir au moins 3 caractères'
        return true
      },
      password: v => {
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
        if (!v) return 'Mot de passe requis'
        if (v.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères'
        if (!regex.test(v)) return 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial'
        return true
      },
      confirmPassword: v => v === password.value || 'Les mots de passe ne correspondent pas'
    })

    const handleSubmit = async () => {
      const isValid = await formRef.value?.validate()
      if (!isValid) return

      loading.value = true
      try {
        await store.dispatch('auth/register', {
          email: email.value,
          username: username.value,
          password: password.value,
          confirmPassword: confirmPassword.value,
          nom: nom.value,
          prenom: prenom.value
        })
        snackbar.value.text = 'Inscription réussie ! Veuillez vérifier votre email pour activer votre compte.'
        snackbar.value.color = 'success'
        snackbar.value.show = true
        // Rediriger vers la page de login après 3 secondes
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } catch (error) {
        console.error('Erreur d\'inscription:', error)
        snackbar.value.text = error.response?.data?.message || 'Erreur lors de l\'inscription'
        snackbar.value.color = 'error'
        snackbar.value.show = true
      } finally {
        loading.value = false
      }
    }

    return {
      email,
      username,
      password,
      confirmPassword,
      nom,
      prenom,
      loading,
      formRef,
      rules,
      snackbar,
      handleSubmit
    }
  }
})
</script>
