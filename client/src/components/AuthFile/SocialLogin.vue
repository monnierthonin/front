<template>
  <div class="social-login">
    <button type="button" class="social-btn google" @click="loginWithGoogle">
      <img src="../../assets/styles/image/googleIcon.png" alt="Google">
      Continuer avec Google
    </button>
    <button type="button" class="social-btn microsoft" @click="loginWithMicrosoft">
      <img src="../../assets/styles/image/microsoftIcon.png" alt="Microsoft">
      Continuer avec Microsoft
    </button>
    <button type="button" class="social-btn facebook" @click="loginWithFacebook">
      <img src="../../assets/styles/image/facebookIcon.png" alt="Facebook">
      Continuer avec Facebook
    </button>
  </div>
</template>

<script>
export default {
  name: 'SocialLogin',
  methods: {
    loginWithGoogle() {
      this.$emit('google-login')
    },
    loginWithMicrosoft() {
      this.$emit('microsoft-login')
    },
    loginWithFacebook() {
      this.$emit('facebook-login')
    }
  }
}
</script>

<style scoped>
.social-login {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.social-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  background-color: var(--background-secondary);
  color: var(--text-primary);
  cursor: pointer;
  transition: background-color 0.2s;
}

.social-btn img {
  width: 24px;
  height: 24px;
}

.social-btn:hover {
  background-color: var(--background-hover);
}
</style>
