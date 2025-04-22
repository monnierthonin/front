<template>
  <v-container class="fill-height">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card>
          <v-card-title class="bg-primary text-white">
            Réinitialisation du mot de passe
          </v-card-title>
          <v-card-text class="pt-4">
            <p class="text-body-1 mb-4">
              Entrez votre adresse email pour recevoir un lien de réinitialisation de mot de passe.
            </p>
            <v-form @submit.prevent="handleSubmit" ref="formRef">
              <v-text-field
                v-model="email"
                label="Email"
                type="email"
                required
                prepend-icon="mdi-email"
                :rules="[rules.required, rules.email]"
              />
              <div class="d-flex flex-column gap-2">
                <v-btn
                  color="primary"
                  type="submit"
                  :loading="loading"
                  block
                >
                  Envoyer le lien
                </v-btn>
                <v-btn
                  variant="text"
                  :to="{ name: 'Login' }"
                  block
                >
                  Retour à la connexion
                </v-btn>
              </div>
            </v-form>
          </v-card-text>
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
        <v-btn icon @click="snackbar.show = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { API_URL } from '@/config'

const router = useRouter()
const email = ref('')
const loading = ref(false)
const formRef = ref(null)
const snackbar = ref({
  show: false,
  text: '',
  color: 'error'
})

const rules = {
  required: v => !!v || 'Ce champ est requis',
  email: v => /.+@.+\..+/.test(v) || 'Email invalide'
}

const handleSubmit = async (event) => {
  event.preventDefault()
  
  const { valid } = await formRef.value.validate()
  if (!valid) {
    snackbar.value = {
      show: true,
      text: 'Veuillez entrer une adresse email valide',
      color: 'error'
    }
    return
  }

  loading.value = true
  
  try {
    const response = await axios.post(`${API_URL}/api/v1/auth/mot-de-passe-oublie`, {
      email: email.value
    })

    if (response.data.status === 'success') {
      snackbar.value = {
        show: true,
        text: 'Un email de réinitialisation a été envoyé à votre adresse',
        color: 'success'
      }

      // Rediriger vers la page de connexion après quelques secondes
      setTimeout(() => {
        router.push({ name: 'Login' })
      }, 3000)
    } else {
      throw new Error(response.data.message || 'Une erreur est survenue')
    }
  } catch (error) {
    console.error('Erreur:', error)
    snackbar.value = {
      show: true,
      text: error.response?.data?.message || error.message || 'Une erreur est survenue',
      color: 'error'
    }
  } finally {
    loading.value = false
  }
}
</script>]]>
