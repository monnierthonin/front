<template>
  <div class="conversation-view">
    <v-container fluid class="pa-0 fill-height">
      <v-row no-gutters class="fill-height">
        <v-col cols="12" class="fill-height">
          <conversation-group
            v-if="conversationId"
            :conversation-id="conversationId"
          />
          <div v-else class="d-flex justify-center align-center fill-height">
            <v-card class="pa-5 text-center" max-width="500">
              <v-card-title class="text-h5">Conversation non trouvée</v-card-title>
              <v-card-text>
                <p>La conversation que vous recherchez n'existe pas ou vous n'y avez pas accès.</p>
              </v-card-text>
              <v-card-actions class="justify-center">
                <v-btn color="primary" to="/messages">
                  Retour aux messages
                </v-btn>
              </v-card-actions>
            </v-card>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import ConversationGroup from '@/components/ConversationGroup.vue';

export default {
  name: 'ConversationView',
  
  components: {
    ConversationGroup
  },
  
  setup() {
    const route = useRoute();
    const conversationId = ref(null);
    
    onMounted(() => {
      conversationId.value = route.params.id;
    });
    
    return {
      conversationId
    };
  }
};
</script>

<style scoped>
.conversation-view {
  height: 100%;
}

.fill-height {
  height: 100%;
}
</style>
