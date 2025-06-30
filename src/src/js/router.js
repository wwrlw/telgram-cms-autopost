import { createRouter, createWebHistory } from "vue-router";
//
import Index from "@/views/Index.vue";
import LoginPage from "@/views/LoginPage.vue";
import Channels from "@/views/Channels.vue";
import PublicationChannels from "@/views/PublicationChannels.vue";
const page404 = () => import('@/views/Page404.vue');
const Post = () => import('@/views/Post.vue');
//

const routes = [
  {
    path: "/",
    name: "index",
    component: Index,
  },
  {
    path: "/channels",
    name: "channels",
    component: Channels,
  },
  {
    path: "/publication-channels",
    name: "publication-channels",
    component: PublicationChannels,
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
  {
    path: '/post/:id',
    name: 'post',
    component: Post,
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
    const publicPages = ['/login'];
    const authRequired = !publicPages.includes(to.path);
    const auth = {
        data: localStorage.getItem('token') ? true : false,
    };

    if (authRequired && !auth.data) {
        auth.returnUrl = to.fullPath;
        return '/login';
    }
});

export default router;