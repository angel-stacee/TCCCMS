import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
    ],
    preview: {
        allowedHosts: true,
    },
    server: {
        host: "0.0.0.0",
        port: 5173,
        allowedHosts: true,
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes("node_modules/recharts")) {
                        return "charts";
                    }
                    if (id.includes("node_modules/lucide-react")) {
                        return "icons";
                    }
                },
            },
        },
    },
});