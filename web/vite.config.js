import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
// https://vite.dev/config/
export default defineConfig({
    plugins: [
        vue({
            template: {
                compilerOptions: {
                    isCustomElement: (tag) => tag === "emoji-picker",
                },
            },
        }),
        tailwindcss(),
    ],
    server: {
        host: "0.0.0.0",
        port: 5174,
        allowedHosts: ["tgdev.chiorio.com"],
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
