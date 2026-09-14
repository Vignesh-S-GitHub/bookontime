import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
  base: "/bookontime/",
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["icons/*.png"],
      manifest: {
        name: "BookOnTime",
        short_name: "BookOnTime",
        description: "Book Before It’s Late.",
        start_url: "/bookontime/",
        scope: "/bookontime/",
        display: "standalone",
        theme_color: "#2563EB",
        background_color: "#FAFBFF",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,webp,woff2}"],
        navigateFallback: "index.html",
        runtimeCaching: [
          {
            urlPattern: /\/bookontime\/data\/holidays\/.*\.json$/,
            handler: "CacheFirst",
            options: {
              cacheName: "bookontime-holidays-v1",
              expiration: { maxEntries: 200, maxAgeSeconds: 31536000 },
            },
          },
        ],
      },
    }),
  ],
  test: { include: ["tests/**/*.test.ts"] },
});
