<template>
  <div class="param-container">
    <WorkspaceInfo />
    <UserManager />
    <ChannelManager />
  </div>
</template>

<script>
import WorkspaceInfo from '../components/workspaceParamFile/WorkspaceInfo.vue'
import UserManager from '../components/workspaceParamFile/UserManager.vue'
import ChannelManager from '../components/workspaceParamFile/ChannelManager.vue'

export default {
  name: 'ParamWorkspace',
  components: {
    WorkspaceInfo,
    UserManager,
    ChannelManager
  }
}
</script>

<style scoped>
.param-container {
  margin-left: var(--whidth-header);
  padding: 2rem;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  gap: 85px;
}
</style>
