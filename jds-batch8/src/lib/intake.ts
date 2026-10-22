// Loading answer files into the reviewer, with duplicate detection.

import { AnswerFileError, parseAnswerMarkdown } from "./markdown.ts";
import type { Candidate } from "./recap.ts";

export type IntakeStatus = "ok" | "duplicate_file" | "id_conflict" | "invalid_format";

export interface IntakeResult {
  fileName: string;
  status: IntakeStatus;
  message: string;
  submissionId?: string;
}

export interface IntakeState {
  candidates: Candidate[];
  /** submissionId → fingerprint of the answers, to tell a re-loaded file from an ID collision. */
  fingerprints: Record<string, string>;
  /** submissionIds that also appeared in another file with different answers. */
  conflicts: string[];
}

export const emptyIntake = (): IntakeState => ({ candidates: [], fingerprints: {}, conflicts: [] });

export function intakeFile(state: IntakeState, fileName: string, text: string): { state: IntakeState; result: IntakeResult } {
  try {
    const payload = parseAnswerMarkdown(text);
    const sid = payload.submissionId;
    const fingerprint = JSON.stringify(payload);
    if (state.fingerprints[sid] !== undefined) {
      if (state.fingerprints[sid] === fingerprint) {
        return { state, result: { fileName, status: "duplicate_file", submissionId: sid, message: `File yang sama (ID ${sid}) sudah dimuat — diabaikan.` } };
      }
      return {
        state: { ...state, conflicts: [...new Set([...state.conflicts, sid])] },
        result: {
          fileName,
          status: "id_conflict",
          submissionId: sid,
          message: `Submission ID ${sid} sudah dipakai file lain dengan isi berbeda — file ini tidak dimuat. Periksa manual.`,
        },
      };
    }
    return {
      state: {
        ...state,
        candidates: [...state.candidates, { submissionId: sid, fileName, payload }],
        fingerprints: { ...state.fingerprints, [sid]: fingerprint },
      },
      result: { fileName, status: "ok", submissionId: sid, message: `${payload.personal.fullName} — ${sid}` },
    };
  } catch (error) {
    const message = error instanceof AnswerFileError ? error.message : "File tidak dapat dibaca.";
    return { state, result: { fileName, status: "invalid_format", message } };
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
