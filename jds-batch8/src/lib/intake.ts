// Loading encrypted assessment files into the reviewer, with duplicate detection.

import { decryptJson, DecryptionError } from "./crypto.ts";
import { parseEncryptedMarkdown } from "./markdown.ts";
import type { Candidate } from "./recap.ts";
import type { SubmissionPayload } from "./types.ts";

export type IntakeStatus = "ok" | "duplicate_file" | "id_conflict" | "wrong_key" | "tampered" | "invalid_format";

export interface IntakeResult {
  fileName: string;
  status: IntakeStatus;
  message: string;
  submissionId?: string;
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export interface IntakeState {
  candidates: Candidate[];
  /** submissionId → hash of the encrypted block, to tell a re-loaded file from an ID collision. */
  hashes: Record<string, string>;
  /** submissionIds that also appeared in another file with different contents. */
  conflicts: string[];
}

export const emptyIntake = (): IntakeState => ({ candidates: [], hashes: {}, conflicts: [] });

export async function intakeFile(
  state: IntakeState,
  fileName: string,
  text: string,
  key: { key: CryptoKey; keyId: string },
): Promise<{ state: IntakeState; result: IntakeResult }> {
  try {
    const envelope = parseEncryptedMarkdown(text);
    const sid = envelope.submissionId;
    const hash = await sha256Hex(envelope.ciphertext + envelope.encryptedKey);
    if (state.hashes[sid]) {
      if (state.hashes[sid] === hash) {
        return { state, result: { fileName, status: "duplicate_file", submissionId: sid, message: `File yang sama (ID ${sid}) sudah dimuat — diabaikan.` } };
      }
      return {
        state: { ...state, conflicts: [...new Set([...state.conflicts, sid])] },
        result: {
          fileName,
          status: "id_conflict",
          submissionId: sid,
          message: `Submission ID ${sid} sudah dipakai file lain dengan isi berbeda — file ini tidak dimuat. Periksa manual atau minta kandidat mengunduh ulang.`,
        },
      };
    }
    const payload = await decryptJson<SubmissionPayload>(envelope, key.key, key.keyId);
    if (payload?.schema !== "jds-b8-assessment" || payload.submissionId !== sid) {
      throw new DecryptionError("tampered", "Isi file tidak sesuai dengan Submission ID di luar enkripsi.");
    }
    return {
      state: {
        ...state,
        candidates: [...state.candidates, { submissionId: sid, fileName, payload }],
        hashes: { ...state.hashes, [sid]: hash },
      },
      result: { fileName, status: "ok", submissionId: sid, message: `${payload.personal.fullName} — ${sid}` },
    };
  } catch (error) {
    const code = error instanceof DecryptionError ? error.code : "invalid_format";
    return { state, result: { fileName, status: code, message: (error as Error).message } };
  }
}

const normalize = (text: string) => text.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

/** Same e-mail, WhatsApp number or name under different submission IDs → probably the same person submitting twice. */
export function possibleRepeatSubmissions(candidates: Candidate[]): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  const keys = (c: Candidate) =>
    [
      c.payload.personal.email && `email:${normalize(c.payload.personal.email)}`,
      c.payload.personal.whatsapp && `wa:${c.payload.personal.whatsapp.replace(/\D/g, "").replace(/^0/, "62")}`,
      c.payload.personal.fullName && `name:${normalize(c.payload.personal.fullName)}`,
    ].filter(Boolean) as string[];
  const index = new Map<string, string[]>();
  for (const c of candidates) for (const k of keys(c)) index.set(k, [...(index.get(k) ?? []), c.submissionId]);
  for (const ids of index.values()) {
    if (ids.length < 2) continue;
    for (const id of ids) out[id] = [...new Set([...(out[id] ?? []), ...ids.filter((other) => other !== id)])];
  }
  return out;
}
