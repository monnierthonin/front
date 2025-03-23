import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify'
import './plugins/axios'

const app = createApp(App)

// Create a global snackbar
app.config.globalProperties.$snackbar = {
  show: false,
  text: '',
  color: 'success'
}

app.use(router)
app.use(store)
app.use(vuetify)

app.mount('#app')
