// Private-key file handling for the local reviewer and the key scripts.
// Never imported by the public assessment website.
//
// Two private-key file formats are accepted:
//   1. Protected key (default): JSON with the PKCS#8 key encrypted by AES-256-GCM
//      under a PBKDF2-SHA-256 key derived from the reviewer's passphrase.
//   2. Plain PKCS#8 PEM (only when generated with --plain).

import { base64ToBytes, bytesToBase64, keyIdFromSpki, RSA_IMPORT_PARAMS } from "./crypto.ts";

export const PROTECTED_KEY_FORMAT = "JDS-B8-PRIVATE-KEY-v1";
export const PBKDF2_ITERATIONS = 600_000;

// Assembled from parts so this source file never contains a PEM armour line.
const PEM_LABEL = ["PRIVATE", "KEY"].join(" ");
const PEM_BEGIN = `-----${["BEGIN", PEM_LABEL].join(" ")}-----`;
const PEM_END = `-----${["END", PEM_LABEL].join(" ")}-----`;

export interface ProtectedPrivateKey {
  format: typeof PROTECTED_KEY_FORMAT;
  keyId: string;
  createdAt: string;
  kdf: { name: "PBKDF2"; hash: "SHA-256"; iterations: number; salt: string };
  cipher: { name: "AES-GCM"; iv: string };
  data: string;
}

export interface LoadedPrivateKey {
  key: CryptoKey;
  keyId: string;
}

export class PrivateKeyError extends Error {
  readonly code: "needs_passphrase" | "bad_passphrase" | "invalid_key";
  constructor(code: PrivateKeyError["code"], message: string) {
    super(message);
    this.name = "PrivateKeyError";
    this.code = code;
  }
}

const subtle = () => globalThis.crypto.subtle;

export function pkcs8ToPem(pkcs8: Uint8Array): string {
  const body = bytesToBase64(pkcs8).match(/.{1,64}/g)!.join("\n");
  return `${PEM_BEGIN}\n${body}\n${PEM_END}\n`;
}

export function pemToPkcs8(pem: string): Uint8Array<ArrayBuffer> {
  const start = pem.indexOf(PEM_BEGIN);
  const end = pem.indexOf(PEM_END);
  if (start === -1 || end === -1) throw new PrivateKeyError("invalid_key", "File bukan kunci privat PKCS#8 (PEM).");
  return base64ToBytes(pem.slice(start + PEM_BEGIN.length, end));
}

async function deriveWrappingKey(passphrase: string, salt: Uint8Array<ArrayBuffer>, iterations: number): Promise<CryptoKey> {
  const material = await subtle().importKey("raw", new TextEncoder().encode(passphrase.normalize("NFC")), "PBKDF2", false, ["deriveKey"]);
  return subtle().deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function protectPrivateKey(pkcs8: Uint8Array<ArrayBuffer>, passphrase: string, keyId: string): Promise<ProtectedPrivateKey> {
  if (passphrase.length < 12) throw new PrivateKeyError("bad_passphrase", "Passphrase minimal 12 karakter.");
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const wrappingKey = await deriveWrappingKey(passphrase, salt, PBKDF2_ITERATIONS);
  const createdAt = new Date().toISOString();
  const data = await subtle().encrypt({ name: "AES-GCM", iv, additionalData: new TextEncoder().encode(keyId) }, wrappingKey, pkcs8);
  return {
    format: PROTECTED_KEY_FORMAT,
    keyId,
    createdAt,
    kdf: { name: "PBKDF2", hash: "SHA-256", iterations: PBKDF2_ITERATIONS, salt: bytesToBase64(salt) },
    cipher: { name: "AES-GCM", iv: bytesToBase64(iv) },
    data: bytesToBase64(new Uint8Array(data)),
  };
}

export function isProtectedKeyFile(text: string): boolean {
  try {
    return (JSON.parse(text) as { format?: string }).format === PROTECTED_KEY_FORMAT;
  } catch {
    return false;
  }
}

/** Key ID of a private key, derived from its public half (same as the website's key ID). */
export async function keyIdFromPrivateKey(pkcs8: Uint8Array<ArrayBuffer>): Promise<string> {
  const extractable = await subtle().importKey("pkcs8", pkcs8, RSA_IMPORT_PARAMS, true, ["decrypt"]);
  const jwk = await subtle().exportKey("jwk", extractable);
  const publicKey = await subtle().importKey("jwk", { kty: "RSA", n: jwk.n, e: jwk.e, alg: "RSA-OAEP-256", ext: true }, RSA_IMPORT_PARAMS, true, ["encrypt"]);
  return keyIdFromSpki(new Uint8Array(await subtle().exportKey("spki", publicKey)));
}

async function importPkcs8(pkcs8: Uint8Array<ArrayBuffer>): Promise<LoadedPrivateKey> {
  let keyId: string;
  let key: CryptoKey;
  try {
    keyId = await keyIdFromPrivateKey(pkcs8);
    key = await subtle().importKey("pkcs8", pkcs8, RSA_IMPORT_PARAMS, false, ["decrypt"]);
  } catch {
    throw new PrivateKeyError("invalid_key", "Kunci privat tidak valid atau bukan kunci RSA-OAEP.");
  }
  return { key, keyId };
}

/**
 * Loads a private key from file text: protected JSON (needs the passphrase) or
 * plain PKCS#8 PEM. The resulting CryptoKey is non-extractable.
 */
export async function loadPrivateKey(fileText: string, passphrase?: string): Promise<LoadedPrivateKey> {
  if (isProtectedKeyFile(fileText)) {
    const file = JSON.parse(fileText) as ProtectedPrivateKey;
    if (!passphrase) throw new PrivateKeyError("needs_passphrase", "Kunci ini dilindungi passphrase. Masukkan passphrase.");
    const wrappingKey = await deriveWrappingKey(passphrase, base64ToBytes(file.kdf.salt), file.kdf.iterations);
    let pkcs8: Uint8Array<ArrayBuffer>;
    try {
      pkcs8 = new Uint8Array(
        await subtle().decrypt(
          { name: "AES-GCM", iv: base64ToBytes(file.cipher.iv), additionalData: new TextEncoder().encode(file.keyId) },
          wrappingKey,
          base64ToBytes(file.data),
        ),
      );
    } catch {
      throw new PrivateKeyError("bad_passphrase", "Passphrase salah atau file kunci rusak.");
    }
    try {
      const loaded = await importPkcs8(pkcs8);
      if (loaded.keyId !== file.keyId) throw new PrivateKeyError("invalid_key", "ID kunci tidak sesuai dengan isi file kunci.");
      return loaded;
    } finally {
      pkcs8.fill(0);
    }
  }
  return importPkcs8(pemToPkcs8(fileText));
}
