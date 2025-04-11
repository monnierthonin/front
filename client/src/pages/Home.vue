<template>
  <chanelWorkspace />
  <UserList />
  <div class="home">
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
  name: 'Home',
  components: {
    Message,
    textBox,
    UserList,
    chanelWorkspace
  }
};
</script>

<style scoped>
.home {
  margin-left: calc(var(--whidth-header) + var(--whidth-chanelWorkspace));
  margin-right: var(--whidth-userChanel);
  height: 100vh;
  display: flex;
  flex-direction: column-reverse;
  justify-content: flex-end;
  padding-bottom: 200px;
}
</style>
