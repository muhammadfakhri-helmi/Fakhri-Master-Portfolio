/// <reference types="vitest/config" />
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { cspPlugin } from "./build/shared.ts";

const root = fileURLToPath(new URL(".", import.meta.url));

// The public website: the assessment (index.html) and the eligibility dashboard
// (reviewer.html). The dashboard only reads answer files from the reviewer's own
// device and keeps scores in that browser. vite.reviewer.config.ts builds the
// same dashboard for the optional local server (reviewer/server.mjs).
export default defineConfig({
  root,
  // Relative base: works at /jds-batch8/ on GitHub Pages or at any other sub-path.
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
        "connect-src 'none'",
        "form-action 'none'",
        "base-uri 'none'",
        "object-src 'none'",
      ].join("; "),
    ),
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2022",
    sourcemap: false,
    // Never inline assets as data: URIs — the CSP only allows fonts from the site itself.
    assetsInlineLimit: 0,
    rolldownOptions: {
      input: {
        assessment: fileURLToPath(new URL("index.html", import.meta.url)),
        reviewer: fileURLToPath(new URL("reviewer.html", import.meta.url)),
      },
    },
  },
  server: { port: 5190, strictPort: true },
  preview: { port: 5191, strictPort: true },
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/ui/**/*.test.tsx"],
    environment: "node",
    testTimeout: 60_000,
  },
});
