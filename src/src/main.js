import { createApp } from "vue";
import "@/assets/styles/style.css";
import App from "@/App.vue";
import router from "@/js/router";
import toastPlugin from "@/js/toast-plugin";
import lazy from "@/directives/lazy";

const app = createApp(App);

app.directive("lazy", lazy);

app.use(router).use(toastPlugin).mount("#app");
