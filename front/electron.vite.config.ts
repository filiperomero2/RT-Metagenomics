import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-vite-plugin";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "electron-vite";

export default defineConfig({
  preload: {},
  main: {},
  renderer: {
    plugins: [
      tanstackRouter({
        target: "react",
      }),
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src/renderer/src"),
      },
    },
    server: {
      port: 5173,
      strictPort: true,
    },
  },
});
