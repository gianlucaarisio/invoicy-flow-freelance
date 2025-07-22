import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { i18nOptimize } from "./vite-plugin-i18n-optimize";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    // port: 5173
  },
  plugins: [
    react(),
    i18nOptimize({
      localesDir: "src/locales",
      minify: mode === "production",
      removeUnusedKeys: false, // Keep disabled to avoid breaking translations
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Optimize chunk splitting for translations and better caching
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Keep translation files separate for better caching
          "i18n-vendor": ["i18next", "react-i18next", "i18next-http-backend"],
          // Separate critical UI libraries
          "ui-vendor": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-toast",
          ],
        },
        // Optimize asset naming for better caching
        assetFileNames: (assetInfo) => {
          // Check if it's a translation file based on the source
          if (assetInfo.source && typeof assetInfo.source === "string") {
            try {
              const parsed = JSON.parse(assetInfo.source);
              // If it parses as JSON and looks like translations, put it in locales folder
              if (typeof parsed === "object" && parsed !== null) {
                return "locales/[name]-[hash][extname]";
              }
            } catch {
              // Not JSON, continue with normal asset handling
            }
          }
          return "assets/[name]-[hash][extname]";
        },
        chunkFileNames: (chunkInfo) => {
          // Separate i18n chunks for better caching
          if (chunkInfo.name?.includes("i18n")) {
            return "i18n/[name]-[hash].js";
          }
          return "js/[name]-[hash].js";
        },
      },
    },
    // Optimize build performance
    target: "es2020",
    minify: mode === "production" ? "terser" : false,
  },
}));
