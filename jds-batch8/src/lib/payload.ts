import { assessmentTrack, createInitialAnswers } from "./initial.ts";
import { assessmentFileName, buildAnswerMarkdown } from "./markdown.ts";
import type { Answers, SubmissionPayload } from "./types.ts";

/** Random 6-character submission ID, e.g. 7F29A3. */
export function newSubmissionId(): string {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(3));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

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
    external: track === "external" ? { ...a.external, companies: a.external.companies.filter(Boolean) } : null,
    final: { ...a.final, reward, leadership },
  };
}

export interface AnswerFile {
  fileName: string;
  content: string;
  submissionId: string;
}

/** The downloaded .md: readable answers plus a data block the reviewer app reads. */
export function createAnswerFile(answers: Answers): AnswerFile {
  const submissionId = newSubmissionId();
  const payload = buildPayload(answers, submissionId);
  return { fileName: assessmentFileName(submissionId), content: buildAnswerMarkdown(payload), submissionId };
}
