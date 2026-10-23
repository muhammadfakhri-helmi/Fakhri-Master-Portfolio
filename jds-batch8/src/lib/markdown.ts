// The downloaded answer file: readable Markdown (every question and answer, by
// section) followed by a JSON data block that the reviewer app reads. The
// readable part is for people; the data block is what the reviewer imports.

import { labelOf, TEAM_OPTIONS, TRACK_LABEL } from "./content.ts";
import { describeSubmission } from "./describe.ts";
import type { SubmissionPayload } from "./types.ts";

export const DATA_FENCE = "jds-b8-data";
export const FILE_PREFIX = "JDS_B8_ASSESSMENT_";

export class AnswerFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnswerFileError";
  }
}

export function assessmentFileName(submissionId: string): string {
  return `${FILE_PREFIX}${submissionId}.md`;
}

const cell = (text: string) => text.replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
const quote = (text: string) => (text.trim() ? text.trim().split(/\r?\n/).map((line) => `> ${line}`.trimEnd()).join("\n") : "> —");

export function buildAnswerMarkdown(payload: SubmissionPayload): string {
  const submitted = new Date(payload.submittedAt);
  const date = Number.isNaN(submitted.getTime())
    ? payload.submittedAt
    : submitted.toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Jakarta" }) + " WIB";
  const team =
    payload.team.preference === "flexible"
      ? `Flexible (menjawab pertanyaan ${TRACK_LABEL[payload.track]})`
      : labelOf(TEAM_OPTIONS, payload.team.preference);

  const lines = [
    "# JDS Batch 8 — Recruitment Committee Assessment",
    "",
    "| | |",
    "| --- | --- |",
    `| Submission ID | \`${payload.submissionId}\` |`,
    `| Nama | ${cell(payload.personal.fullName)} |`,
    `| Pilihan tim | ${cell(team)} |`,
    `| Dikirim | ${cell(date)} |`,
    ...(payload.integrity ? [`| Percobaan paste yang diblokir | ${payload.integrity.pasteBlocked} |`] : []),
    "",
  ];

  for (const section of describeSubmission(payload)) {
    lines.push(`## ${section.title}`, "");
    for (const item of section.items) {
      lines.push(`**${item.label}**`, "");
      if (Array.isArray(item.value)) lines.push(...(item.value.length ? item.value.map((v) => `- ${v.replace(/\r?\n/g, " ")}`) : ["- —"]));
      else lines.push(quote(item.value));
      lines.push("");
    }
  }

  lines.push(
    "---",
    "",
    "_Blok di bawah ini dibaca oleh aplikasi reviewer panitia. Jangan diubah atau dihapus._",
    "",
    "```" + DATA_FENCE,
    JSON.stringify(payload, null, 2),
    "```",
    "",
  );
  return lines.join("\n");
}

/** Reads the data block of an answer file. */
export function parseAnswerMarkdown(markdown: string): SubmissionPayload {
  // The fences must be whole lines: answer text can only contain them inside a
  // quoted line ("> ...") or an escaped JSON string, never as a line of its own.
  const lines = markdown.split(/\r?\n/);
  const open = lines.lastIndexOf("```" + DATA_FENCE);
  if (open === -1) throw new AnswerFileError("File ini bukan file jawaban asesmen JDS Batch 8 (blok data tidak ditemukan).");
  const close = lines.indexOf("```", open + 1);
  if (close === -1) throw new AnswerFileError("Blok data di dalam file terpotong.");
  let payload: SubmissionPayload;
  try {
    payload = JSON.parse(lines.slice(open + 1, close).join("\n")) as SubmissionPayload;
  } catch {
    throw new AnswerFileError("Blok data di dalam file rusak atau telah diubah.");
  }
  const ok =
    payload?.schema === "jds-b8-assessment" &&
    typeof payload.submissionId === "string" &&
    /^[0-9A-F]{6,16}$/.test(payload.submissionId) &&
    (payload.track === "internal" || payload.track === "external") &&
    !!payload.personal &&
    !!payload.team &&
    !!payload.final &&
    (payload.track === "internal" ? !!payload.internal : !!payload.external);
  if (!ok) throw new AnswerFileError("Isi blok data tidak lengkap atau bukan format asesmen JDS Batch 8.");
  return payload;
}
