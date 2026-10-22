// Decrypts assessment files on the command line (the reviewer app does the same in the browser).
//
//   npm run decrypt -- --key <private-key file> <JDS_B8_ASSESSMENT_*.md> [...]
//   add --json to print the full decrypted answers (to the terminal only; nothing is written to disk)
//
// Passphrase: JDS_KEY_PASSPHRASE or an interactive prompt.

import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { decryptJson } from "../src/lib/crypto.ts";
import { parseEncryptedMarkdown } from "../src/lib/markdown.ts";
import { isProtectedKeyFile, loadPrivateKey } from "../src/lib/private-key.ts";
import type { SubmissionPayload } from "../src/lib/types.ts";
import { parseArgs, promptHidden } from "./node-helpers.ts";

const { flags, positional } = parseArgs(process.argv.slice(2));
if (typeof flags.key !== "string" || positional.length === 0) {
  console.error("Pemakaian: npm run decrypt -- --key <file kunci privat> <file .md> [...] [--json]");
  process.exit(2);
}

const keyText = readFileSync(flags.key, "utf8");
let passphrase: string | undefined;
if (isProtectedKeyFile(keyText)) passphrase = process.env.JDS_KEY_PASSPHRASE || (await promptHidden("Passphrase kunci privat: "));
const { key, keyId } = await loadPrivateKey(keyText, passphrase);

let failures = 0;
for (const file of positional) {
  try {
    const envelope = parseEncryptedMarkdown(readFileSync(file, "utf8"));
    const payload = await decryptJson<SubmissionPayload>(envelope, key, keyId);
    if (payload.submissionId !== envelope.submissionId) throw new Error("Submission ID di dalam dan di luar enkripsi berbeda.");
    if (flags.json === true) console.log(JSON.stringify(payload, null, 2));
    else console.log(`✓ ${basename(file)} — ${payload.submissionId} — ${payload.personal.fullName} — ${payload.track}`);
  } catch (error) {
    failures++;
    console.error(`✗ ${basename(file)} — ${(error as Error).message}`);
  }
}
process.exit(failures ? 1 : 0);
