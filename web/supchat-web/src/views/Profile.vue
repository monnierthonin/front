<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" sm="8" md="6">
        <v-card class="elevation-12">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title>Profil</v-toolbar-title>
          </v-toolbar>
          
          <v-card-text>
            <v-form ref="form" v-model="isValid">
              <!-- Photo de profil -->
              <div class="text-center mb-6">
                <v-avatar size="150" class="mb-3">
                  <v-img
                    :src="profilePictureUrl"
                    alt="Photo de profil"
                  ></v-img>
                </v-avatar>
                <div>
                  <v-file-input
                    v-model="profilePicture"
                    accept="image/*"
                    label="Changer la photo de profil"
                    prepend-icon="mdi-camera"
                    @change="handleProfilePictureChange"
                    :rules="pictureRules"
                    hide-details
                    class="mb-3"
                  ></v-file-input>
                </div>
              </div>

              <!-- Informations du profil -->
              <v-text-field
                v-model="username"
                :rules="usernameRules"
                label="Nom d'utilisateur"
                name="username"
                prepend-icon="mdi-account"
                type="text"
                required
              ></v-text-field>

              <v-text-field
                v-model="email"
                :rules="emailRules"
                label="Email"
                name="email"
                prepend-icon="mdi-email"
                type="email"
                required
              ></v-text-field>

              <!-- Changement de mot de passe -->
              <v-expansion-panels class="mb-6">
                <v-expansion-panel>
                  <v-expansion-panel-title>
                    Changer le mot de passe
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <v-form ref="passwordForm" v-model="isPasswordValid">
                      <v-text-field
                        v-model="currentPassword"
                        :rules="passwordRules"
                        label="Mot de passe actuel"
                        name="currentPassword"
                        prepend-icon="mdi-lock"
                        type="password"
                        required
                      ></v-text-field>

                      <v-text-field
                        v-model="newPassword"
                        :rules="passwordRules"
                        label="Nouveau mot de passe"
                        name="newPassword"
                        prepend-icon="mdi-lock-plus"
                        type="password"
                        required
                      ></v-text-field>

                      <v-text-field
                        v-model="confirmPassword"
                        :rules="[...passwordRules, passwordConfirmationRule]"
                        label="Confirmer le nouveau mot de passe"
                        name="confirmPassword"
                        prepend-icon="mdi-lock-check"
                        type="password"
                        required
                      ></v-text-field>

                      <v-btn
                        :loading="loadingPassword"
                        :disabled="!isPasswordValid || loadingPassword"
                        color="primary"
                        @click="handlePasswordChange"
                      >
                        Changer le mot de passe
                      </v-btn>
                    </v-form>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>

              <!-- Boutons d'action -->
              <v-btn
                :loading="loading"
                :disabled="!isValid || loading"
                color="primary"
                class="mr-4"
                @click="handleSubmit"
              >
                Mettre à jour le profil
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>

        <v-snackbar
          v-model="snackbar.show"
          :color="snackbar.color"
          timeout="3000"
        >
          {{ snackbar.text }}
        </v-snackbar>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'

export default defineComponent({
  name: 'ProfilePage',
  
  setup() {
    const store = useStore()
    const form = ref(null)
    const passwordForm = ref(null)
    const isValid = ref(false)
    const isPasswordValid = ref(false)
    const loading = ref(false)
    const loadingPassword = ref(false)
    
    // Champs du formulaire
    const username = ref('')
    const email = ref('')
    const profilePicture = ref(null)
    const currentPassword = ref('')
    const newPassword = ref('')
    const confirmPassword = ref('')
    
    const snackbar = ref({
      show: false,
      text: '',
      color: 'success'
    })

    // URL de la photo de profil
    const profilePictureUrl = computed(() => {
      const user = store.getters['auth/currentUser']
      if (!user || !user.profilePicture) return '/default-avatar.png'
      return user.profilePicture.startsWith('http') 
        ? user.profilePicture 
        : `/uploads/profiles/${user.profilePicture}`
    })

    // Règles de validation
    const usernameRules = [
      v => !!v || 'Le nom d\'utilisateur est requis',
      v => (v && v.length >= 3) || 'Le nom d\'utilisateur doit contenir au moins 3 caractères',
      v => (v && v.length <= 30) || 'Le nom d\'utilisateur ne peut pas dépasser 30 caractères',
      v => /^[a-zA-Z0-9_]+$/.test(v) || 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres et underscores'
    ]

    const emailRules = [
      v => !!v || 'L\'email est requis',
      v => /.+@.+\..+/.test(v) || 'L\'email doit être valide'
    ]

    const passwordRules = [
      v => !v || v.length >= 6 || 'Le mot de passe doit contenir au moins 6 caractères'
    ]

    const passwordConfirmationRule = v => v === newPassword.value || 'Les mots de passe ne correspondent pas'

    const pictureRules = [
      file => !file || file.size < 2000000 || 'L\'image doit faire moins de 2MB',
      file => !file || ['image/jpeg', 'image/png'].includes(file.type) || 'Format accepté : JPG ou PNG'
    ]

    // Gestionnaires d'événements
    const handleSubmit = async () => {
      if (!form.value?.validate()) return

      loading.value = true
      try {
        await store.dispatch('user/updateProfile', {
          username: username.value,
          email: email.value
        })

        snackbar.value = {
          show: true,
          text: 'Profil mis à jour avec succès. Si vous avez changé votre email, veuillez vérifier votre boîte de réception pour le confirmer.',
          color: 'success'
        }
      } catch (error) {
        snackbar.value = {
          show: true,
          text: error.message || 'Erreur lors de la mise à jour du profil',
          color: 'error'
        }
      } finally {
        loading.value = false
      }
    }

    const handlePasswordChange = async () => {
      if (!passwordForm.value?.validate()) return
      
      loadingPassword.value = true
      try {
        await store.dispatch('user/updatePassword', {
          currentPassword: currentPassword.value,
          newPassword: newPassword.value
        })

        snackbar.value = {
          show: true,
          text: 'Mot de passe mis à jour avec succès',
          color: 'success'
        }

        // Réinitialiser les champs
        currentPassword.value = ''
        newPassword.value = ''
        confirmPassword.value = ''
        passwordForm.value.reset()
      } catch (error) {
        snackbar.value = {
          show: true,
          text: error.message || 'Erreur lors de la mise à jour du mot de passe',
          color: 'error'
        }
      } finally {
        loadingPassword.value = false
      }
    }

    const handleProfilePictureChange = async () => {
      if (!profilePicture.value) return

      const formData = new FormData()
      formData.append('profilePicture', profilePicture.value)

      try {
        await store.dispatch('user/updateProfilePicture', formData)
        
        snackbar.value = {
          show: true,
          text: 'Photo de profil mise à jour avec succès',
          color: 'success'
        }

        // Réinitialiser le champ
        profilePicture.value = null
      } catch (error) {
        snackbar.value = {
          show: true,
          text: error.message || 'Erreur lors de la mise à jour de la photo',
          color: 'error'
        }
      }
    }

    onMounted(() => {
      const user = store.getters['auth/currentUser']
      if (user) {
        username.value = user.username
        email.value = user.email
      }
    })

    return {
      form,
      passwordForm,
      isValid,
      isPasswordValid,
      loading,
      loadingPassword,
      username,
      email,
      profilePicture,
      currentPassword,
      newPassword,
      confirmPassword,
      profilePictureUrl,
      usernameRules,
      emailRules,
      passwordRules,
      passwordConfirmationRule,
      pictureRules,
      handleSubmit,
      handlePasswordChange,
      handleProfilePictureChange,
      snackbar
    }
  }
})
</script>
