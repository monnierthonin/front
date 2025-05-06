<template>
  <p class="auth-switch">
    {{ isLogin ? "Pas encore de compte ?" : "Déjà un compte ?" }}
    <a href="#" @click.prevent="$emit('toggle')">
      {{ isLogin ? "S'inscrire" : "Se connecter" }}
    </a>
  </p>
</template>

<script>
export default {
  name: 'AuthToggle',
  props: {
    isLogin: {
      type: Boolean,
      required: true
    }
  }
}
</script>

<style scoped>
.auth-switch {
  text-align: center;
  color: var(--text-secondary);
  margin: 0;
}

.auth-switch a {
  color: var(--primary-color);
  text-decoration: none;
  margin-left: 0.5rem;
}

.auth-switch a:hover {
  text-decoration: underline;
}
</style>
