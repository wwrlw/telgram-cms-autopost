import { createApp } from 'vue'
import './assets/styles/style.css'
import App from './App.vue'
import router from './js/router'


// const pinia = createPinia();

createApp(App).use(router).mount('#app')