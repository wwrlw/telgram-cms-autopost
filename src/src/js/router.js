import { createRouter, createWebHistory } from "vue-router";
//
import Index from "@/views/Index.vue";
import LoginPage from "@/views/LoginPage.vue";
const page404 = () => import('@/views/Page404.vue');
//

const routes = [
  {
    path: "/",
    name: "index",
    component: Index,
  },
  {
    path: "/login",
    name: "login",
    component: LoginPage,
  },
  {
    path: "/:catchAll(.*)",
    name: "404",
    component: page404,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
    const publicPages = ['/login'];
    const authRequired = !publicPages.includes(to.path);
    const auth = {
        user: true,
    };

    if (authRequired && !auth.user) {
        auth.returnUrl = to.fullPath;
        return '/login';
    }
});

export default router;