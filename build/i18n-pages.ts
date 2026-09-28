// Renders src/page.html into the two static pages:
//   index.html     → English            (src/i18n/en.ts)
//   id/index.html  → Bahasa Indonesia   (src/i18n/id.ts)
// Runs before Vite's own HTML processing, so asset URLs in the template are
// rewritten for each page's depth exactly as if the HTML had been hand-written.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";
import { en, type Dict } from "../src/i18n/en.ts";
import { id } from "../src/i18n/id.ts";

export type Locale = "en" | "id";

const DICTIONARIES: Record<Locale, Dict> = { en, id };

/** The two page entries this plugin renders; any other HTML passes through untouched. */
function entryPages(root: string): Map<string, Locale> {
  return new Map<string, Locale>([
    [resolve(root, "index.html"), "en"],
    [resolve(root, "id/index.html"), "id"],
  ]);
}

/** Values that depend on the page rather than on the language. */
function pageValues(locale: Locale, siteUrl: string): Record<string, string> {
  const toRoot = locale === "id" ? "../" : "./";
  const self = siteUrl ? (locale === "id" ? `${siteUrl}id/` : siteUrl) : "";
  const headLinks = siteUrl
    ? [
        `<link rel="canonical" href="${self}" />`,
        `<link rel="alternate" hreflang="en" href="${siteUrl}" />`,
        `<link rel="alternate" hreflang="id" href="${siteUrl}id/" />`,
        `<link rel="alternate" hreflang="x-default" href="${siteUrl}" />`,
        `<meta property="og:url" content="${self}" />`,
      ].join("\n    ")
    : "";
  return {
    // Plain links to files in public/ are not rewritten by Vite, so they get
    // the page's own path back to the site root.
    "page.cv": `${toRoot}cv/Muhammad-Fakhri-Helmi-CV.pdf`,
    "page.hrefEn": locale === "en" ? "./" : "../",
    "page.hrefId": locale === "en" ? "id/" : "./",
    "page.currentEn": locale === "en" ? 'aria-current="true"' : "",
    "page.currentId": locale === "id" ? 'aria-current="true"' : "",
    "page.ogImage": `${siteUrl || toRoot}${locale === "id" ? "og-image-id.jpg" : "og-image.jpg"}`,
    "page.headLinks": headLinks,
  };
}

export function renderPage(template: string, locale: Locale, siteUrl = ""): string {
  const values: Record<string, string> = { ...DICTIONARIES[locale], ...pageValues(locale, siteUrl) };
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, key: string) => {
    const value = values[key];
    if (value === undefined) throw new Error(`[i18n-pages] unknown key "${key}" (${locale})`);
    return value;
  });
}

export function i18nPages(options: { root: string; siteUrl: string }): Plugin {
  const templatePath = resolve(options.root, "src/page.html");
  const pages = entryPages(options.root);
  return {
    name: "fmp-i18n-pages",
    transformIndexHtml: {
      order: "pre",
      handler(html, ctx) {
        const locale = pages.get(resolve(ctx.filename));
        if (!locale) return html; // e.g. scripts/og/og.html served by the dev server
        return renderPage(readFileSync(templatePath, "utf8"), locale, options.siteUrl);
      },
    },
    configureServer(server) {
      // The template is not imported by any module, so watch it explicitly.
      server.watcher.add(templatePath);
      server.watcher.on("change", (file) => {
        if (resolve(file) === templatePath) server.ws.send({ type: "full-reload" });
      });
    },
  };
}
