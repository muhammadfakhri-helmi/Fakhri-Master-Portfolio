import { base64ToBytes, encryptJson, importPublicKey, keyIdFromSpki, randomHex } from "./crypto.ts";
import { assessmentTrack, createInitialAnswers } from "./initial.ts";
import { assessmentFileName, buildEncryptedMarkdown } from "./markdown.ts";
import type { Answers, SubmissionPayload } from "./types.ts";

export interface RecipientKey {
  configured: boolean;
  keyId: string;
  spki: string;
  createdAt?: string;
  owner?: string;
}

/** Random 6-character submission ID, e.g. 7F29A3. */
export const newSubmissionId = () => randomHex(3);

function trimDeep<T>(value: T): T {
  if (typeof value === "string") return value.trim() as T;
  if (Array.isArray(value)) return value.map(trimDeep) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, trimDeep(v)])) as T;
  }
  return value;
}

/**
 * Keeps only what the candidate actually answered on their path: the completed
 * case assessment, nominee details only when they plan to nominate, and the
 * coordinator questions only when they are interested.
 */
export function buildPayload(answers: Answers, submissionId: string, submittedAt = new Date().toISOString()): SubmissionPayload {
  const track = assessmentTrack(answers);
  if (!track) throw new Error("Pilihan tim belum lengkap.");
  const a = trimDeep(answers);
  const blank = createInitialAnswers().final;
  const reward = a.final.reward.plan === "yes" ? a.final.reward : { ...blank.reward, plan: a.final.reward.plan };
  const leadership =
    a.final.leadership.interest && a.final.leadership.interest !== "member_only"
      ? a.final.leadership
      : { ...blank.leadership, interest: a.final.leadership.interest };
  return {
    schema: "jds-b8-assessment",
    schemaVersion: 2,
    submissionId,
    submittedAt,
    track,
    personal: { ...a.personal, skillsOther: a.personal.skills.includes("Other") ? a.personal.skillsOther : "" },
    team: { ...a.team, flexibleTrack: a.team.preference === "flexible" ? a.team.flexibleTrack : "" },
    internal: track === "internal" ? a.internal : null,
    external: track === "external" ? a.external : null,
    final: { ...a.final, reward, leadership },
  };
}

export interface EncryptedFile {
  fileName: string;
  content: string;
  submissionId: string;
}

export async function createEncryptedAssessment(answers: Answers, recipient: RecipientKey): Promise<EncryptedFile> {
  if (!recipient.configured || !recipient.spki) throw new Error("Kunci publik Ketua Rekrutmen belum dikonfigurasi.");
  const publicKey = await importPublicKey(recipient.spki);
  const keyId = await keyIdFromSpki(base64ToBytes(recipient.spki));
  if (recipient.keyId && recipient.keyId !== keyId) throw new Error("ID kunci publik tidak sesuai dengan isi kunci. Hubungi panitia.");
  const submissionId = newSubmissionId();
  const payload = buildPayload(answers, submissionId);
  const envelope = await encryptJson(payload, publicKey, { keyId, submissionId, createdAt: payload.submittedAt });
  return { fileName: assessmentFileName(submissionId), content: buildEncryptedMarkdown(envelope), submissionId };
}
