import { createRouter, createWebHistory } from "vue-router";
//
import LoginPage from "@/views/LoginPage.vue";
import Channels from "@/views/Channels.vue";
import PublicationChannels from "@/views/PublicationChannels.vue";
import Categories from "@/views/Categories.vue";
import Post from "@/views/Post.vue";
import Posts from "@/views/Posts.vue";
import Favorites from "@/views/Favorites.vue";
const CreatePost = () => import("@/views/CreatePost.vue");
const page404 = () => import("@/views/Page404.vue");
const ScheduledPosts = () => import("@/views/SheduledPosts.vue");
const Analytics = () => import("@/views/Analytics.vue");

const routes = [
    {
        path: "/",
        name: "index",
        component: Posts,
    },
    {
        path: "/channels",
        name: "channels",
        component: Channels,
    },
    {
        path: "/posted-channels",
        name: "posted-channels",
        component: PublicationChannels,
    },
    {
        path: "/favorites",
        name: "favorites",
        component: Favorites,
    },
    {
        path: "/analytics",
        name: "analytics",
        component: Analytics,
    },
    {
        path: "/categories",
        name: "categories",
        component: Categories,
    },
    {
        path: "/login",
        name: "login",
        component: LoginPage,
    },
    {
        path: "/create-post",
        name: "create-post",
        component: CreatePost,
    },
    {
        path: "/:catchAll(.*)",
        name: "404",
        component: page404,
    },
    {
        path: "/post/:id",
        name: "post",
        component: Post,
    },
    {
        path: "/scheduled-posts",
        name: "scheduled-posts",
        component: ScheduledPosts,
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach(async (to) => {
    const publicPages = ["/login"];
    const authRequired = !publicPages.includes(to.path);

    if (!authRequired) {
        return;
    }

    let token = null;
    try {
        token = localStorage.getItem("token");
    } catch (error) {
        console.error("Error accessing localStorage:", error);
        token = null;
    }

    if (!token) {
        return "/login";
    }

    return;
});

export default router;
