// Small helpers shared by the Node.js scripts (key generation, decryption, checks).

import { realpathSync } from "node:fs";
import { dirname, relative, resolve, isAbsolute } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
/** The Git repository that contains this project (the portfolio repository). */
export const repoRoot = resolve(projectRoot, "..");

export function parseArgs(argv: string[]): { flags: Record<string, string | true>; positional: string[] } {
  const flags: Record<string, string | true> = {};
  const positional: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg.startsWith("--")) {
      const [name, inline] = arg.slice(2).split("=", 2) as [string, string | undefined];
      const next = argv[i + 1];
      if (inline !== undefined) flags[name] = inline;
      else if (next !== undefined && !next.startsWith("--")) {
        flags[name] = next;
        i++;
      } else flags[name] = true;
    } else positional.push(arg);
  }
  return { flags, positional };
}

export function isInside(child: string, parent: string): boolean {
  const realParent = (() => {
    try {
      return realpathSync(parent);
    } catch {
      return resolve(parent);
    }
  })();
  const rel = relative(realParent, resolve(child));
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

/** Reads a line from the terminal without echoing it (for passphrases). */
export function promptHidden(question: string): Promise<string> {
  return new Promise((resolvePromise, reject) => {
    if (!process.stdin.isTTY) {
      reject(new Error("Tidak ada terminal interaktif. Set JDS_KEY_PASSPHRASE untuk mode non-interaktif."));
      return;
    }
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const output = rl as unknown as { _writeToOutput: (s: string) => void; output: NodeJS.WriteStream };
    let muted = false;
    output._writeToOutput = (s: string) => {
      if (!muted) process.stdout.write(s);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolvePromise(answer);
    });
    muted = true;
  });
}
