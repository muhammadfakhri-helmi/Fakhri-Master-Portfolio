// The downloaded file: Markdown with instructions in plaintext and every answer
// inside one encrypted envelope. No name, contact or answer is ever written in
// plaintext — only the random submission ID, the date and the recipient key ID.

import { assertEnvelope, DecryptionError, type EncryptedEnvelope } from "./crypto.ts";
import { RECRUITMENT_LEAD } from "./content.ts";

export const FENCE_LANG = "jds-b8-encrypted";
export const FILE_PREFIX = "JDS_B8_ASSESSMENT_";

export function assessmentFileName(submissionId: string): string {
  return `${FILE_PREFIX}${submissionId}.md`;
}

export function buildEncryptedMarkdown(envelope: EncryptedEnvelope): string {
  const body = JSON.stringify(envelope, null, 2);
  return [
    "# JDS Batch 8 — Recruitment Committee Assessment (Encrypted)",
    "",
    `- **Submission ID:** \`${envelope.submissionId}\``,
    `- **Dibuat:** ${envelope.createdAt}`,
    `- **Format:** ${envelope.format} (AES-256-GCM + RSA-OAEP SHA-256)`,
    `- **Kunci penerima:** \`${envelope.keyId}\``,
    "",
    "Seluruh identitas dan jawaban dalam file ini terenkripsi. Hanya Ketua Rekrutmen",
    `JDS Batch 8 (${RECRUITMENT_LEAD}) yang memegang kunci privat untuk membukanya.`,
    "",
    "**Jangan mengubah isi file ini.** Perubahan sekecil apa pun membuat file tidak dapat dibuka.",
    "Kirim file ini secara manual kepada Ketua Rekrutmen melalui kanal resmi yang diberikan panitia.",
    "",
    "```" + FENCE_LANG,
    body,
    "```",
    "",
  ].join("\n");
}

export function parseEncryptedMarkdown(markdown: string): EncryptedEnvelope {
  const pattern = new RegExp("```" + FENCE_LANG + "\\s*\\n([\\s\\S]*?)\\n```");
  const match = markdown.match(pattern);
  if (!match?.[1]) throw new DecryptionError("invalid_format", "File ini bukan file asesmen JDS Batch 8 yang terenkripsi.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(match[1]);
  } catch {
    throw new DecryptionError("invalid_format", "Blok terenkripsi di dalam file rusak.");
  }
  assertEnvelope(parsed);
  return parsed;
}
