import { describe, expect, it } from "vitest";
import { AnswerFileError, buildAnswerMarkdown, parseAnswerMarkdown } from "../../src/lib/markdown.ts";
import { buildPayload, createAnswerFile } from "../../src/lib/payload.ts";
import { completeExternalAnswers, completeInternalAnswers, TEST_EMAIL } from "../fixtures.ts";

describe("answer file (.md)", () => {
  it("records every answer in readable Markdown, by section", () => {
    const answers = completeExternalAnswers("Rina | Kandidat");
    const file = createAnswerFile(answers);
    expect(file.fileName).toMatch(/^JDS_B8_ASSESSMENT_[0-9A-F]{6}\.md$/);
    const md = file.content;
    expect(md).toContain("# JDS Batch 8 — Recruitment Committee Assessment");
    expect(md).toContain(`| Submission ID | \`${file.submissionId}\` |`);
    expect(md).toContain("| Nama | Rina \\| Kandidat |");
    expect(md).toContain("| Pilihan tim | External Team |");
    for (const heading of ["## A · Personal Background", "## B · Team Preference & Commitment", "## C · External Team — Objective & Outreach", "## D · Reward & Leadership"]) {
      expect(md).toContain(heading);
    }
    expect(md).toContain("**Q3 Email**\n\n> " + TEST_EMAIL);
    expect(md).toContain("**Q9 Perusahaan sasaran**\n\n- Operator Satu\n- Geo Dua\n- Service Tiga");
    expect(md).toContain("**Q10 Target peserta terkonfirmasi**\n\n> 20 orang (offline 14, online 6)");
    expect(md).toContain("> " + answers.external.conversion);
    expect(md).not.toContain("Internal Team — Objective");
  });

  it("keeps multi-line answers inside their quote", () => {
    const answers = completeInternalAnswers();
    answers.internal.strategy = "1. Petakan target\n2. Siapkan materi\n3. Bagi tugas";
    const md = buildAnswerMarkdown(buildPayload(answers, "ABC123"));
    expect(md).toContain("> 1. Petakan target\n> 2. Siapkan materi\n> 3. Bagi tugas");
  });

  it("round-trips through the data block the reviewer reads", () => {
    const answers = completeInternalAnswers("Data Kandidat");
    answers.team.reason += "\n```jds-b8-data\n{ bukan data }\n```";
    const payload = buildPayload(answers, "A1B2C3");
    expect(parseAnswerMarkdown(buildAnswerMarkdown(payload))).toEqual(payload);
  });

  it("rejects files without a valid data block", () => {
    expect(() => parseAnswerMarkdown("# catatan biasa")).toThrow(AnswerFileError);
    const md = buildAnswerMarkdown(buildPayload(completeInternalAnswers(), "A1B2C3"));
    expect(() => parseAnswerMarkdown(md.replace('"schema": "jds-b8-assessment"', '"schema": "lain"'))).toThrow(/bukan format/);
    expect(() => parseAnswerMarkdown(md.replace('"submissionId": "A1B2C3"', '"submissionId": "A1B2C3",,'))).toThrow(/rusak/);
  });
});
