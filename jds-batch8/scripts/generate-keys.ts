// Generates the recruitment lead's RSA-OAEP key pair.
//
//   npm run keys:generate                      private key → ~/JDS-B8-Private-Keys/ (passphrase-protected)
//   npm run keys:generate -- --out <folder>    choose another folder OUTSIDE this repository
//   npm run keys:generate -- --plain           unprotected PEM (not recommended)
//   npm run keys:generate -- --force           replace an already configured public key
//
// The public key is written to src/config/recipient-public-key.json, which the
// website embeds at build time. The private key is never written inside the
// repository: the script refuses any output folder within it.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { exportPublicKeyBase64, generateRecipientKeyPair, keyIdFromSpki, base64ToBytes } from "../src/lib/crypto.ts";
import { pkcs8ToPem, protectPrivateKey } from "../src/lib/private-key.ts";
import { isInside, parseArgs, projectRoot, promptHidden, repoRoot } from "./node-helpers.ts";

const { flags } = parseArgs(process.argv.slice(2));
const outDir = resolve(typeof flags.out === "string" ? flags.out : join(homedir(), "JDS-B8-Private-Keys"));
const publicOut = resolve(typeof flags["public-out"] === "string" ? flags["public-out"] : join(projectRoot, "src", "config", "recipient-public-key.json"));
const bits = Number(typeof flags.bits === "string" ? flags.bits : 4096);
const plain = flags.plain === true;

function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}

if (![3072, 4096].includes(bits)) fail("--bits harus 3072 atau 4096.");
if (isInside(outDir, repoRoot) || isInside(outDir, projectRoot)) {
  fail(`Folder kunci privat tidak boleh berada di dalam repository:\n  ${outDir}\nGunakan --out dengan folder di luar repository.`);
}
const readConfigured = (): { configured?: boolean; keyId?: string } => {
  try {
    return JSON.parse(readFileSync(publicOut, "utf8"));
  } catch {
    return {};
  }
};
if (existsSync(publicOut) && flags.force !== true) {
  const current = readConfigured();
  if (current.configured) {
    fail(
      `Kunci publik ${current.keyId} sudah dikonfigurasi di ${publicOut}.\n` +
        "Membuat kunci baru berarti file asesmen baru hanya bisa dibuka dengan kunci privat baru.\n" +
        "Jalankan ulang dengan --force bila memang ingin mengganti kunci.",
    );
  }
}

let passphrase = "";
if (!plain) {
  passphrase = process.env.JDS_KEY_PASSPHRASE ?? "";
  if (!passphrase) {
    passphrase = await promptHidden("Passphrase untuk melindungi kunci privat (min. 12 karakter): ");
    const confirm = await promptHidden("Ulangi passphrase: ");
    if (passphrase !== confirm) fail("Passphrase tidak sama.");
  }
  if (passphrase.length < 12) fail("Passphrase minimal 12 karakter.");
}

console.log(`Membuat pasangan kunci RSA-OAEP ${bits}-bit (SHA-256)…`);
const pair = await generateRecipientKeyPair(bits);
const spki = await exportPublicKeyBase64(pair.publicKey);
const keyId = await keyIdFromSpki(base64ToBytes(spki));
const pkcs8 = new Uint8Array(await globalThis.crypto.subtle.exportKey("pkcs8", pair.privateKey));
const createdAt = new Date().toISOString();

mkdirSync(outDir, { recursive: true, mode: 0o700 });
const privatePath = join(outDir, plain ? `jds-b8-private-key-${keyId}.pem` : `jds-b8-private-key-${keyId}.json`);
if (existsSync(privatePath)) fail(`File sudah ada: ${privatePath}`);
const privateContent = plain ? pkcs8ToPem(pkcs8) : JSON.stringify(await protectPrivateKey(pkcs8, passphrase, keyId), null, 2) + "\n";
writeFileSync(privatePath, privateContent, { mode: 0o600, flag: "wx" });
pkcs8.fill(0);

writeFileSync(
  publicOut,
  JSON.stringify({ configured: true, keyId, spki, createdAt, owner: "Muhammad Fakhri Helmi", algorithm: "RSA-OAEP-256", modulusLength: bits }, null, 2) + "\n",
);

console.log(`
✓ Kunci dibuat — Key ID ${keyId}

  Kunci privat (RAHASIA, jangan dibagikan / di-commit):
    ${privatePath}${plain ? "\n    ⚠ Tanpa passphrase. Simpan di penyimpanan terenkripsi." : "\n    Dilindungi passphrase (PBKDF2-SHA-256 600.000 iterasi + AES-256-GCM)."}

  Kunci publik (aman dipublikasikan, ikut di-build ke website):
    ${publicOut}

Langkah berikutnya:
  1. Buat cadangan kunci privat di tempat aman (mis. USB terenkripsi). Tanpa kunci ini,
     semua file asesmen TIDAK BISA dibuka.
  2. Commit & push file kunci publik, lalu deploy (lihat DEPLOYMENT.md).
  3. Pastikan Key ID di halaman asesmen = ${keyId}.
`);
