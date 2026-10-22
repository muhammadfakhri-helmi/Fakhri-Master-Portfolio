import { beforeAll, describe, expect, it } from "vitest";
import { base64ToBytes, decryptJson, DecryptionError, encryptJson, exportPublicKeyBase64, generateRecipientKeyPair, importPublicKey, keyIdFromSpki } from "../../src/lib/crypto.ts";
import { assessmentFileName, buildEncryptedMarkdown, parseEncryptedMarkdown } from "../../src/lib/markdown.ts";
import { createEncryptedAssessment, type RecipientKey } from "../../src/lib/payload.ts";
import { keyIdFromPrivateKey, loadPrivateKey, pkcs8ToPem, protectPrivateKey } from "../../src/lib/private-key.ts";
import type { SubmissionPayload } from "../../src/lib/types.ts";
import { completeExternalAnswers, completeInternalAnswers, TEST_EMAIL, TEST_WA } from "../fixtures.ts";

interface TestKey {
  recipient: RecipientKey;
  pkcs8: Uint8Array<ArrayBuffer>;
  privateKey: CryptoKey;
}

async function makeKey(): Promise<TestKey> {
  const pair = await generateRecipientKeyPair(2048);
  const spki = await exportPublicKeyBase64(pair.publicKey);
  const keyId = await keyIdFromSpki(base64ToBytes(spki));
  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", pair.privateKey));
  return { recipient: { configured: true, keyId, spki }, pkcs8, privateKey: pair.privateKey };
}

let main: TestKey;
let other: TestKey;
beforeAll(async () => {
  [main, other] = await Promise.all([makeKey(), makeKey()]);
});

describe("hybrid encryption (AES-256-GCM + RSA-OAEP SHA-256)", () => {
  it("round-trips a submission and writes no plaintext into the .md file", async () => {
    const answers = completeExternalAnswers("Nama Sangat Rahasia");
    const file = await createEncryptedAssessment(answers, main.recipient);
    expect(file.fileName).toMatch(/^JDS_B8_ASSESSMENT_[0-9A-F]{6}\.md$/);
    expect(file.fileName).toBe(assessmentFileName(file.submissionId));
    for (const secret of ["Nama Sangat Rahasia", TEST_EMAIL, TEST_WA, "Operator Satu", "Prospek Bernama Rahasia", answers.external.outreachMessage.slice(0, 30)]) {
      expect(file.content).not.toContain(secret);
      expect(file.content).not.toContain(btoa(secret).slice(0, 12));
    }
    const envelope = parseEncryptedMarkdown(file.content);
    expect(envelope.submissionId).toBe(file.submissionId);
    expect(envelope.keyId).toBe(main.recipient.keyId);
    const loaded = await loadPrivateKey(pkcs8ToPem(main.pkcs8));
    const payload = await decryptJson<SubmissionPayload>(envelope, loaded.key, loaded.keyId);
    expect(payload.personal.fullName).toBe("Nama Sangat Rahasia");
    expect(payload.personal.email).toBe(TEST_EMAIL);
    expect(payload.track).toBe("external");
    expect(payload.internal).toBeNull();
    expect(payload.external?.companies).toHaveLength(5);
  });

  it("uses a fresh AES key and IV for every file", async () => {
    const answers = completeInternalAnswers();
    const [a, b] = await Promise.all([createEncryptedAssessment(answers, main.recipient), createEncryptedAssessment(answers, main.recipient)]);
    const ea = parseEncryptedMarkdown(a.content);
    const eb = parseEncryptedMarkdown(b.content);
    expect(ea.iv).not.toBe(eb.iv);
    expect(ea.encryptedKey).not.toBe(eb.encryptedKey);
    expect(ea.ciphertext).not.toBe(eb.ciphertext);
  });

  it("rejects the wrong private key (key ID check and RSA check)", async () => {
    const file = await createEncryptedAssessment(completeInternalAnswers(), main.recipient);
    const envelope = parseEncryptedMarkdown(file.content);
    const wrong = await loadPrivateKey(pkcs8ToPem(other.pkcs8));
    await expect(decryptJson(envelope, wrong.key, wrong.keyId)).rejects.toMatchObject({ code: "wrong_key" });
    // Even without the key-ID shortcut, RSA-OAEP decryption fails.
    await expect(decryptJson(envelope, other.privateKey)).rejects.toMatchObject({ code: "wrong_key" });
  });

  it("detects tampering with the ciphertext or the bound header", async () => {
    const file = await createEncryptedAssessment(completeInternalAnswers(), main.recipient);
    const envelope = parseEncryptedMarkdown(file.content);
    const bytes = base64ToBytes(envelope.ciphertext);
    bytes[10] = bytes[10]! ^ 0xff;
    const flipped = { ...envelope, ciphertext: btoa(String.fromCharCode(...bytes)) };
    await expect(decryptJson(flipped, main.privateKey)).rejects.toMatchObject({ code: "tampered" });
    await expect(decryptJson({ ...envelope, submissionId: "000000" }, main.privateKey)).rejects.toMatchObject({ code: "tampered" });
  });

  it("rejects files that are not encrypted assessments", () => {
    expect(() => parseEncryptedMarkdown("# hello")).toThrow(DecryptionError);
    const fake = buildEncryptedMarkdown({ format: "JDS-B8-ENC-v1" } as never).replace('"format"', '"x"');
    expect(() => parseEncryptedMarkdown(fake)).toThrow(DecryptionError);
  });

  it("refuses to encrypt without a configured key or with a mismatching key ID", async () => {
    await expect(createEncryptedAssessment(completeInternalAnswers(), { configured: false, keyId: "", spki: "" })).rejects.toThrow(/belum dikonfigurasi/);
    await expect(createEncryptedAssessment(completeInternalAnswers(), { ...main.recipient, keyId: "0000-0000-0000-0000" })).rejects.toThrow(/tidak sesuai/);
  });

  it("encrypts arbitrary JSON with additional data bound to the header", async () => {
    const pub = await importPublicKey(main.recipient.spki);
    const env = await encryptJson({ hello: "dunia" }, pub, { keyId: main.recipient.keyId, submissionId: "ABCDEF" });
    await expect(decryptJson(env, main.privateKey)).resolves.toEqual({ hello: "dunia" });
    await expect(decryptJson({ ...env, createdAt: "2000-01-01T00:00:00.000Z" }, main.privateKey)).rejects.toMatchObject({ code: "tampered" });
  });
});

describe("private key files", () => {
  it("derives the same key ID from the private key as from the public key", async () => {
    expect(await keyIdFromPrivateKey(main.pkcs8)).toBe(main.recipient.keyId);
  });

  it("protects the private key with a passphrase and rejects a wrong passphrase", async () => {
    const passphrase = "kata sandi panjang sekali";
    const file = JSON.stringify(await protectPrivateKey(main.pkcs8, passphrase, main.recipient.keyId));
    expect(file).not.toContain(btoa(String.fromCharCode(...main.pkcs8.subarray(0, 48))));
    await expect(loadPrivateKey(file)).rejects.toMatchObject({ code: "needs_passphrase" });
    await expect(loadPrivateKey(file, "passphrase yang salah")).rejects.toMatchObject({ code: "bad_passphrase" });
    const loaded = await loadPrivateKey(file, passphrase);
    expect(loaded.keyId).toBe(main.recipient.keyId);
    expect(loaded.key.extractable).toBe(false);
  });

  it("rejects short passphrases and garbage key files", async () => {
    await expect(protectPrivateKey(main.pkcs8, "pendek", main.recipient.keyId)).rejects.toMatchObject({ code: "bad_passphrase" });
    await expect(loadPrivateKey("bukan kunci")).rejects.toMatchObject({ code: "invalid_key" });
  });
});
