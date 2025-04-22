<template>
  <v-container class="fill-height">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card>
          <v-card-title class="bg-primary text-white">
            Nouveau mot de passe
          </v-card-title>
          <v-card-text class="pt-4">
            <p class="text-body-1 mb-4">
              Entrez votre nouveau mot de passe.
            </p>
            <v-form @submit.prevent="handleSubmit" ref="formRef">
              <v-text-field
                v-model="password"
                label="Nouveau mot de passe"
                type="password"
                required
                prepend-icon="mdi-lock"
                :rules="[
                  rules.required,
                  rules.minLength,
                  rules.maxLength,
                  rules.hasUpperCase,
                  rules.hasLowerCase,
                  rules.hasNumber,
                  rules.hasSpecial
                ]"
                persistent-hint
                hint="Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial"
              />
              <v-text-field
                v-model="confirmPassword"
                label="Confirmer le mot de passe"
                type="password"
                required
                prepend-icon="mdi-lock-check"
                :rules="[rules.required, rules.passwordMatch]"
              />
              <div class="d-flex flex-column gap-2">
                <v-btn
                  color="primary"
                  type="submit"
                  :loading="loading"
                  block
                >
                  Réinitialiser le mot de passe
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
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { API_URL } from '@/config'

// Désactiver les credentials pour cette requête spécifique
const axiosInstance = axios.create({
  withCredentials: false
})

const route = useRoute()
const router = useRouter()
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const formRef = ref(null)
const snackbar = ref({
  show: false,
  text: '',
  color: 'error'
})

const rules = {
  required: v => !!v || 'Ce champ est requis',
  minLength: v => v?.length >= 8 || 'Le mot de passe doit contenir au moins 8 caractères',
  maxLength: v => v?.length <= 72 || 'Le mot de passe ne peut pas dépasser 72 caractères',
  hasUpperCase: v => /[A-Z]/.test(v) || 'Le mot de passe doit contenir au moins une majuscule',
  hasLowerCase: v => /[a-z]/.test(v) || 'Le mot de passe doit contenir au moins une minuscule',
  hasNumber: v => /[0-9]/.test(v) || 'Le mot de passe doit contenir au moins un chiffre',
  hasSpecial: v => /[!@#$%^&*(),.?":{}|<>]/.test(v) || 'Le mot de passe doit contenir au moins un caractère spécial',
  passwordMatch: v => v === password.value || 'Les mots de passe ne correspondent pas'
}

const token = computed(() => route.params.token)

const handleSubmit = async (event) => {
  event.preventDefault()
  
  const { valid } = await formRef.value.validate()
  if (!valid) {
    snackbar.value = {
      show: true,
      text: 'Veuillez remplir correctement tous les champs',
      color: 'error'
    }
    return
  }

  loading.value = true
  
  try {
    const response = await axiosInstance.post(`${API_URL}/api/v1/auth/reinitialiser-mot-de-passe/${token.value}`, {
      password: password.value,
      confirmPassword: confirmPassword.value
    })

    if (response.data.status === 'success') {
      snackbar.value = {
        show: true,
        text: 'Votre mot de passe a été réinitialisé avec succès',
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
</script>
