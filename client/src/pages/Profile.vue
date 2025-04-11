<template>
  <div class="profile-container">
    <ProfileInfo />
    <ProfileStatus />
    <ProfileActions />
  </div>
</template>

<script>
import ProfileInfo from '../components/profilParamFile/ProfileInfo.vue'
import ProfileStatus from '../components/profilParamFile/ProfileStatus.vue'
import ProfileActions from '../components/profilParamFile/ProfileActions.vue'

export default {
  name: 'Profile',
  components: {
    ProfileInfo,
    ProfileStatus,
    ProfileActions
  }
}
</script>

<style scoped>
.profile-container {
  margin-left: var(--whidth-header);
  padding: 2rem;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  gap: 170px;
}
</style>
