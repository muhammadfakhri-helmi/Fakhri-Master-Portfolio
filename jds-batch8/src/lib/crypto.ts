// Hybrid encryption with the Web Crypto API (browser and Node.js 22+):
//   - a fresh AES-256-GCM key encrypts the answers,
//   - RSA-OAEP (SHA-256) encrypts that AES key for the recruitment lead's public key.
// The envelope header is bound to the ciphertext as AES-GCM additional data, so
// changing the submission ID or key ID in the file makes decryption fail.
//
// This module only handles public-key operations and decryption with an already
// imported private key; private-key file handling lives in private-key.ts.

export const ENVELOPE_FORMAT = "JDS-B8-ENC-v1";
export const KEY_ALGORITHM = "RSA-OAEP-256";
export const CONTENT_ALGORITHM = "A256GCM";

const subtle = (): SubtleCrypto => {
  const c = globalThis.crypto;
  if (!c?.subtle) throw new Error("Web Crypto API tidak tersedia. Gunakan browser modern melalui HTTPS.");
  return c.subtle;
};

export const RSA_IMPORT_PARAMS: RsaHashedImportParams = { name: "RSA-OAEP", hash: "SHA-256" };

export interface EnvelopeHeader {
  format: typeof ENVELOPE_FORMAT;
  submissionId: string;
  createdAt: string;
  keyId: string;
  alg: typeof KEY_ALGORITHM;
  enc: typeof CONTENT_ALGORITHM;
}

export interface EncryptedEnvelope extends EnvelopeHeader {
  encryptedKey: string;
  iv: string;
  ciphertext: string;
}

export class DecryptionError extends Error {
  readonly code: "wrong_key" | "tampered" | "invalid_format";
  constructor(code: DecryptionError["code"], message: string) {
    super(message);
    this.name = "DecryptionError";
    this.code = code;
  }
}

// ---------- encoding helpers ----------

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const clean = base64.replace(/\s+/g, "");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean)) throw new DecryptionError("invalid_format", "Data base64 tidak valid.");
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

const utf8 = (text: string) => new TextEncoder().encode(text);

export function randomHex(byteLength: number): string {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(byteLength));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

// ---------- keys ----------

/** Key ID = first 16 hex characters of SHA-256(SPKI), grouped in fours. */
export async function keyIdFromSpki(spki: Uint8Array<ArrayBuffer>): Promise<string> {
  const digest = new Uint8Array(await subtle().digest("SHA-256", spki));
  const hex = Array.from(digest.subarray(0, 8), (b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  return hex.match(/.{4}/g)!.join("-");
}

export async function importPublicKey(spkiBase64: string): Promise<CryptoKey> {
  return subtle().importKey("spki", base64ToBytes(spkiBase64), RSA_IMPORT_PARAMS, false, ["encrypt"]);
}

export async function generateRecipientKeyPair(modulusLength = 4096): Promise<CryptoKeyPair> {
  return subtle().generateKey(
    { name: "RSA-OAEP", modulusLength, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["encrypt", "decrypt"],
  );
}

export async function exportPublicKeyBase64(key: CryptoKey): Promise<string> {
  return bytesToBase64(new Uint8Array(await subtle().exportKey("spki", key)));
}

// ---------- envelope ----------

/** Canonical header bytes used as AES-GCM additional authenticated data. */
export function headerAad(header: EnvelopeHeader): Uint8Array<ArrayBuffer> {
  const { format, submissionId, createdAt, keyId, alg, enc } = header;
  return utf8(JSON.stringify({ format, submissionId, createdAt, keyId, alg, enc }));
}

export async function encryptJson(
  value: unknown,
  publicKey: CryptoKey,
  meta: { keyId: string; submissionId: string; createdAt?: string },
): Promise<EncryptedEnvelope> {
  const header: EnvelopeHeader = {
    format: ENVELOPE_FORMAT,
    submissionId: meta.submissionId,
    createdAt: meta.createdAt ?? new Date().toISOString(),
    keyId: meta.keyId,
    alg: KEY_ALGORITHM,
    enc: CONTENT_ALGORITHM,
  };
  const aesKey = await subtle().generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt"]);
  const rawKey = new Uint8Array(await subtle().exportKey("raw", aesKey));
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  try {
    const ciphertext = await subtle().encrypt(
      { name: "AES-GCM", iv, additionalData: headerAad(header), tagLength: 128 },
      aesKey,
      utf8(JSON.stringify(value)),
    );
    const encryptedKey = await subtle().encrypt({ name: "RSA-OAEP" }, publicKey, rawKey);
    return {
      ...header,
      encryptedKey: bytesToBase64(new Uint8Array(encryptedKey)),
      iv: bytesToBase64(iv),
      ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
    };
  } finally {
    rawKey.fill(0);
  }
}

export function assertEnvelope(value: unknown): asserts value is EncryptedEnvelope {
  const v = value as Partial<EncryptedEnvelope> | null;
  const ok =
    !!v &&
    typeof v === "object" &&
    v.format === ENVELOPE_FORMAT &&
    v.alg === KEY_ALGORITHM &&
    v.enc === CONTENT_ALGORITHM &&
    [v.submissionId, v.createdAt, v.keyId, v.encryptedKey, v.iv, v.ciphertext].every((field) => typeof field === "string" && field.length > 0);
  if (!ok) throw new DecryptionError("invalid_format", "Format amplop terenkripsi tidak dikenali.");
}

export async function decryptJson<T = unknown>(
  envelope: EncryptedEnvelope,
  privateKey: CryptoKey,
  privateKeyId?: string,
): Promise<T> {
  assertEnvelope(envelope);
  if (privateKeyId && privateKeyId !== envelope.keyId) {
    throw new DecryptionError(
      "wrong_key",
      `File ini dienkripsi untuk kunci ${envelope.keyId}, sedangkan kunci privat yang dimuat adalah ${privateKeyId}.`,
    );
  }
  let rawKey: ArrayBuffer;
  try {
    rawKey = await subtle().decrypt({ name: "RSA-OAEP" }, privateKey, base64ToBytes(envelope.encryptedKey));
  } catch {
    throw new DecryptionError("wrong_key", "Kunci privat tidak cocok dengan file ini.");
  }
  try {
    const aesKey = await subtle().importKey("raw", rawKey, { name: "AES-GCM" }, false, ["decrypt"]);
    const plaintext = await subtle().decrypt(
      { name: "AES-GCM", iv: base64ToBytes(envelope.iv), additionalData: headerAad(envelope), tagLength: 128 },
      aesKey,
      base64ToBytes(envelope.ciphertext),
    );
    return JSON.parse(new TextDecoder().decode(plaintext)) as T;
  } catch {
    throw new DecryptionError("tampered", "File rusak atau telah diubah sehingga tidak dapat didekripsi.");
  } finally {
    new Uint8Array(rawKey).fill(0);
  }
}
