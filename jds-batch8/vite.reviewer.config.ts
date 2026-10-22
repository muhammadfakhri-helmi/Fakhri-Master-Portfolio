import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { cspPlugin } from "./build/shared.ts";

// The private local reviewer. Built into reviewer/dist/ (git-ignored) and served
// only on 127.0.0.1 by reviewer/server.mjs. Never deployed.
export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  base: "./",
  plugins: [
    react(),
    tailwindcss(),
    cspPlugin(
      [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self'",
        "img-src 'self' data: blob:",
        "font-src 'self'",
        "connect-src 'self'",
        "form-action 'none'",
        "base-uri 'none'",
        "object-src 'none'",
      ].join("; "),
    ),
  ],
  build: {
    outDir: "reviewer/dist",
    emptyOutDir: true,
    target: "es2022",
    sourcemap: false,
    // Never inline assets as data: URIs — the CSP only allows fonts from the site itself.
    assetsInlineLimit: 0,
    rolldownOptions: { input: { reviewer: fileURLToPath(new URL("reviewer.html", import.meta.url)) } },
  },
  server: { port: 5192, strictPort: true, host: "127.0.0.1" },
});
