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
const EditScheduledPost = () => import("@/views/EditScheduledPost.vue");
const Analytics = () => import("@/views/Analytics.vue");
const UserManagement = () => import("@/views/UserManagement.vue");
const SystemLogs = () => import("@/views/SystemLogs.vue");
const Settings = () => import("@/views/Settings.vue");
import { getToken } from "@/js/http";

const ROLES = {
    SUPER_ADMIN: "super_admin",
    ADMIN: "admin",
    EDITOR: "editor",
    BANNED: "banned",
};

const routes = [
    {
        path: "/",
        name: "index",
        component: Posts,
        meta: { keepAlive: true },
    },
    {
        path: "/channels",
        name: "channels",
        component: Channels,
        meta: { forbiddenRoles: [ROLES.EDITOR] },
    },
    {
        path: "/settings",
        name: "settings",
        component: Settings,
        meta: { requiredRole: ROLES.SUPER_ADMIN },
    },
    {
        path: "/posted-channels",
        name: "posted-channels",
        component: PublicationChannels,
        meta: { forbiddenRoles: [ROLES.EDITOR] },
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
        meta: { forbiddenRoles: [ROLES.EDITOR] },
    },
    {
        path: "/categories",
        name: "categories",
        component: Categories,
    },
    {
        path: "/users",
        name: "users",
        component: UserManagement,
        meta: { requiredRole: ROLES.SUPER_ADMIN },
    },
    {
        path: "/logs",
        name: "logs",
        component: SystemLogs,
        meta: { allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
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
    {
        path: "/edit-scheduled-post/:id",
        name: "edit-scheduled-post",
        component: EditScheduledPost,
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) return savedPosition;
        return false;
    },
});

router.beforeEach(async (to) => {
    const publicPages = ["/login"];
    const authRequired = !publicPages.includes(to.path);

    if (!authRequired) {
        return;
    }

    let token = null;
    let userRole = null;
    try {
        token = getToken();
        userRole =
            localStorage.getItem("role") || sessionStorage.getItem("role");
    } catch (error) {
        console.error("Error accessing localStorage:", error);
        token = null;
        userRole = null;
    }

    if (!token) {
        return "/login";
    }

    if (userRole === ROLES.BANNED) {
        console.warn("Access denied: user is banned");
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("role");
        return "/login";
    }

    if (!userRole || userRole === "undefined" || userRole === "null") {
        console.warn("Access denied: invalid user role");
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("role");
        return "/login";
    }

    if (to.meta?.requiredRole && userRole !== to.meta.requiredRole) {
        console.warn(
            `Access denied: required role ${to.meta.requiredRole}, user has ${userRole}`
        );
        return "/";
    }

    if (to.meta?.allowedRoles && !to.meta.allowedRoles.includes(userRole)) {
        console.warn(
            `Access denied: allowed roles ${to.meta.allowedRoles}, user has ${userRole}`
        );
        return "/";
    }

    if (to.meta?.forbiddenRoles && to.meta.forbiddenRoles.includes(userRole)) {
        console.warn(`Access denied: forbidden for role ${userRole}`);
        return "/";
    }

    return;
});

// router.afterEach(() => {
//     window.scrollTo({ top: 0, behavior: "smooth" });
// });

export default router;
