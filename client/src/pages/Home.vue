<template>
  <FriendsList />
  <div class="home">
    <Message />
    <textBox />
  </div>
</template>

<script>
import FriendsList from '../components/headerFile/FriendsList.vue'
import Message from '../components/messageComponentFile/Message.vue'
import textBox from '../components/messageComponentFile/textBox.vue'

export default {
  name: 'Home',
  components: {
    FriendsList,
    Message,
    textBox
  }
};
</script>

<style scoped>
.home {
  margin-left: calc(var(--whidth-header) + var(--whidth-friendsList));
  height: 100vh;
  display: flex;
  flex-direction: column-reverse;
  justify-content: flex-end;
  padding-bottom: 200px;
}
</style>
