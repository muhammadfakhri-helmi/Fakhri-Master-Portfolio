// Vite helpers shared by the public website and the local reviewer builds.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";

/**
 * Reads the recipient public key that the website embeds. JDS_PUBLIC_KEY_FILE
 * overrides the default (used by the end-to-end tests with a throw-away key).
 * Fails the build if the file contains anything that looks like private key material.
 */
export function readRecipientKey(root: string): Record<string, unknown> {
  const file = process.env.JDS_PUBLIC_KEY_FILE ? resolve(process.env.JDS_PUBLIC_KEY_FILE) : resolve(root, "src/config/recipient-public-key.json");
  const text = readFileSync(file, "utf8");
  if (/PRIVATE/i.test(text) || /"d"\s*:/.test(text) || /"data"\s*:/.test(text)) {
    throw new Error(`${file} looks like it contains a PRIVATE key. Only the public key may be embedded in the website.`);
  }
  const key = JSON.parse(text) as { configured?: boolean; spki?: unknown; keyId?: unknown };
  if (key.configured && (typeof key.spki !== "string" || typeof key.keyId !== "string")) {
    throw new Error(`${file}: configured public key needs "spki" and "keyId".`);
  }
  return { configured: !!key.configured, keyId: key.keyId ?? "", spki: key.spki ?? "", createdAt: (key as { createdAt?: string }).createdAt ?? "" };
}

/** Content-Security-Policy for the production page (dev server needs inline scripts for HMR). */
export function cspPlugin(policy: string): Plugin {
  return {
    name: "jds-csp",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      // Right after <meta charset>, before any script or stylesheet tag.
      handler: (html) => {
        const charset = '<meta charset="UTF-8" />';
        if (!html.includes(charset)) throw new Error("index.html needs <meta charset=\"UTF-8\" /> for the CSP plugin");
        return html.replace(charset, `${charset}\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`);
      },
    },
  };
}
