import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import { i18nPages } from "./build/i18n-pages.ts";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ mode }) => {
  // VITE_SITE_URL (optional, with trailing slash) makes Open Graph and
  // hreflang URLs absolute; the GitHub Pages workflow sets it automatically.
  const siteUrl = loadEnv(mode, root, "VITE_").VITE_SITE_URL ?? "";

  return {
    // Relative base: the build works at the site root or under any sub-path.
    base: "./",
    plugins: [i18nPages({ root, siteUrl })],
    build: {
      target: "es2022",
      sourcemap: false, // no source maps in the public build (they would expose source paths)
      assetsInlineLimit: 0,
      cssCodeSplit: false,
      rolldownOptions: {
        input: {
          en: resolve(root, "index.html"),
          id: resolve(root, "id/index.html"),
        },
      },
    },
    server: {
      port: 5188,
      strictPort: true,
    },
    preview: {
      port: 5189,
      strictPort: true,
    },
  };
});
