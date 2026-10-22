/// <reference types="vitest/config" />
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { cspPlugin, readRecipientKey } from "./build/shared.ts";

const root = fileURLToPath(new URL(".", import.meta.url));

// The public assessment website. The local reviewer has its own config
// (vite.reviewer.config.ts) and is never part of this build.
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
  define: {
    __RECIPIENT_KEY__: JSON.stringify(readRecipientKey(root)),
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2022",
    sourcemap: false,
    rolldownOptions: { input: { assessment: fileURLToPath(new URL("index.html", import.meta.url)) } },
  },
  server: { port: 5190, strictPort: true },
  preview: { port: 5191, strictPort: true },
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/ui/**/*.test.tsx"],
    environment: "node",
    testTimeout: 60_000,
  },
});
