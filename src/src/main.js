import { createApp } from 'vue'
import './assets/styles/style.css'
import App from './App.vue'
import router from './js/router'
import toastPlugin from './js/toast-plugin'


// const pinia = createPinia();

createApp(App)
  .use(router)
  .use(toastPlugin)
  .mount('#app')