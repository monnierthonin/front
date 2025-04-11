<template>
  <header class="header">
    <nav class="nav-container">
      <div class="nav-logo-workspace">
        <div class="logo">
          <router-link to="/">
            <img src="../assets/styles/image/logoSupChat.png" alt="LogoSupChat" class="logo">
          </router-link>
        </div>
          <ul class="nav-links">
            <li><router-link to="/" class="nav-link"><img src="../assets/styles/image/logoAjout.png" alt="ajoutWorkspace" class="AjoutWorkspace"></router-link></li>
            <li class="workspace-container">
              <div class="workspace-list">
                <div class="workspace-item" style="background-color: #7289da"></div> <!-- a remplacer par les workspace de l'utilisateur-->
                <div class="workspace-item" style="background-color: #43b581"></div>
                <div class="workspace-item" style="background-color: #f04747"></div>
                <div class="workspace-item" style="background-color: #faa61a"></div>
                <div class="workspace-item" style="background-color: #b9bbbe"></div>
                <div class="workspace-item" style="background-color: #2c2f33"></div>
                <div class="workspace-item" style="background-color: #99aab5"></div>
                <div class="workspace-item" style="background-color: #e91e63"></div>
                <div class="workspace-item" style="background-color: #9c27b0"></div>
                <div class="workspace-item" style="background-color: #3f51b5"></div>
              </div>
            </li>
          </ul>
      </div>
      <div class="botom-header">
        <div class="boutonModeration"><!-- a afficher quand l'utilisateur esr admin -->
          <button class="moderationButton"><img src="../assets/styles/image/moderation.png" alt="moderation" class="moderation"></button>
        </div>
        <div class="boutonProfil">
          <router-link to="/profile">
            <button class="profilButton"><img src="../assets/styles/image/profilDelault.png" alt="profil" class="profilDefault"></button>
          </router-link>
        </div>
      </div>
    </nav>
  </header>
  <main class="content">
    <!-- Contenu de la page -->
  </main>
</template>

<script>
export default {
  name: 'Header'
}
</script>

<style scoped>
.header {
  background-color: var(--secondary-color);
  position: fixed;
  height: 100vh;
  width: var(--whidth-header);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.nav-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  justify-content: space-between;
  height: 100%;
}

.nav-logo-workspace {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.logo {
  width: 60px;
  margin-bottom: 10px;
  margin-top: -4px;
}

.nav-links {
  display: flex;
  flex-direction: column;
  align-items: center;
  list-style: none;
  gap: 0.8rem;
  width: 100%;
}

.nav-link {
  color: var(--text-color);
  text-decoration: none;
  font-size: 0.9rem;
}

.profilButton {
  border-radius: 50%;
  border: none;
}

.moderationButton {
  border-radius: 50%;
  border: none;
}

.moderationButton img{
  width: 40px;
  height: 40px;
}

.nav-link.router-link-active {
  color: var(--primary-color);
}

.boutonProfil {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 10px 0px 0px 0px;
}

.boutonModeration {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 10px 0px 0px 0px;
}

.content {
  margin-left: 120px;
  padding: 20px;
}

.profilDefault {
  width: 50px;
  height: 50px;
}

.AjoutWorkspace {
  width: 50px;
  height: 50px;
}

.workspace-container {
  height: 58vh;
  overflow: hidden;
  padding: 4px;
}

.workspace-list {
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  /* Masquer la scrollbar sur Firefox */
  scrollbar-width: none;
}

/* Masquer la scrollbar sur Chrome/Safari */
.workspace-list::-webkit-scrollbar {
  display: none;
}

.workspace-item {
  width: 50px;
  height: 50px;
  flex-shrink: 0; /* Empêche les éléments de se rétrécir */
  border-radius: 50%;
  cursor: pointer;
  transition: border-radius 0.2s ease;
}

.botom-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-top: auto; /* Pousse .botom-header en bas */
  padding-bottom: 20px; /* Ajoute un peu d'espace en bas */
}

.workspace-item:hover {
  border-radius: 30%;
}
</style>
