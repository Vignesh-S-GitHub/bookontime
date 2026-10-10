import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath } from "node:url";
import type { IndexHtmlTransformContext } from "vite";
export default defineConfig(({ mode }) => ({
  base: mode === "android" ? "/" : "/bookontime/",
  build: {
    outDir: mode === "android" ? "dist-android" : "dist",
    sourcemap: false,
  },
  resolve:
    mode === "android"
      ? {
          alias: {
            "virtual:pwa-register/react": fileURLToPath(
              new URL("./src/offline-sw.ts", import.meta.url),
            ),
          },
        }
      : undefined,
  plugins: [
    ...(mode === "android"
      ? [
          {
            name: "offline-csp",
            transformIndexHtml: (
              html: string,
              context: IndexHtmlTransformContext,
            ) =>
              context.server
                ? html
                : html.replace(
                    "<head>",
                    `<head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'; worker-src 'none'">`,
                  ),
          },
        ]
      : []),
    react(),
    ...(mode === "android"
      ? []
      : [
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
                {
                  src: "icons/icon-192.png",
                  sizes: "192x192",
                  type: "image/png",
                },
                {
                  src: "icons/icon-512.png",
                  sizes: "512x512",
                  type: "image/png",
                },
                {
                  src: "icons/maskable-512.png",
                  sizes: "512x512",
                  type: "image/png",
                  purpose: "maskable",
                },
              ],
            },
            workbox: {
              globPatterns: ["**/*.{js,css,html,png,webp,woff2,json}"],
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
        ]),
  ],
  test: { include: ["tests/**/*.test.ts"] },
}));
