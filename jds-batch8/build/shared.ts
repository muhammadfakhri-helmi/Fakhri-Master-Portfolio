// Vite helpers shared by the public website and the local reviewer builds.

import type { Plugin } from "vite";

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
