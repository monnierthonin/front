<template>
  <chanelWorkspace />
  <UserList />
  <div class="workspace-content">
    <Message />
    <textBox />
  </div>
</template>

<script>
import Message from '../components/messageComponentFile/Message.vue'
import textBox from '../components/messageComponentFile/textBox.vue'
import UserList from '../components/headerFile/UserChanelList.vue'
import chanelWorkspace from '../components/headerFile/chanelWorkspace.vue'

export default {
  name: 'Workspace',
  components: {
    Message,
    textBox,
    UserList,
    chanelWorkspace
  },
  props: {
    id: {
      type: String,
      required: true
    }
  },
  created() {
    // Charger les données du workspace en fonction de l'ID
    console.log('Chargement du workspace avec ID:', this.$route.params.id)
    // Ici, vous pouvez appeler un service pour récupérer les données du workspace
  }
}
</script>

<style scoped>
.workspace-content {
  margin-left: calc(var(--whidth-header) + var(--whidth-chanelWorkspace));
  margin-right: var(--whidth-userChanel);
  height: 100vh;
  display: flex;
  flex-direction: column-reverse;
  justify-content: flex-end;
  padding-bottom: 200px;
}
</style>
