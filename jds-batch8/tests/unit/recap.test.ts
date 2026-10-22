import { beforeAll, describe, expect, it } from "vitest";
import { base64ToBytes, exportPublicKeyBase64, generateRecipientKeyPair, keyIdFromSpki } from "../../src/lib/crypto.ts";
import { csvCell, toCsv } from "../../src/lib/csv.ts";
import { emptyIntake, intakeFile, possibleRepeatSubmissions } from "../../src/lib/intake.ts";
import { createEncryptedAssessment, buildPayload, type RecipientKey } from "../../src/lib/payload.ts";
import { aggregateKpi, externalCompaniesCsv, externalKpiCsv, internalStrategyCsv, RECAP_HEADER, recapCsv, type Candidate } from "../../src/lib/recap.ts";
import type { Review } from "../../src/lib/scoring.ts";
import { completeExternalAnswers, completeInternalAnswers } from "../fixtures.ts";

const candidate = (answers: ReturnType<typeof completeInternalAnswers>, sid: string): Candidate => ({ submissionId: sid, fileName: `JDS_B8_ASSESSMENT_${sid}.md`, payload: buildPayload(answers, sid) });

describe("CSV", () => {
  it("is Excel-friendly: BOM, CRLF, quoted cells, formula injection neutralised", () => {
    const csv = toCsv(["A", "B"], [["=HYPERLINK(\"x\")", 'kata "kutip"'], [5, "+62 test"]]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toContain("\r\n");
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
    expect(csv).toContain(`"kata ""kutip"""`);
    expect(csv).toContain(`"5"`);
    expect(csvCell("@cmd")).toBe(`"'@cmd"`);
    expect(toCsv(["A", "B"], [[1, 2]], ";")).toContain(`"A";"B"`);
  });

  it("exports the recap with the agreed columns and without third-party names", () => {
    const ext = completeExternalAnswers("Kandidat External");
    ext.final.reward = { plan: "yes", nomineeName: "Nominee Rahasia", nomineeBackground: "Engineer", nomineeReason: "Alasan yang cukup panjang untuk lolos.", nomineeContext: "", transparencyAck: true };
    ext.final.leadership = { interest: "lead_external", readiness: "siap", actions: ["a", "b", "c"] };
    const int = completeInternalAnswers("Kandidat Internal");
    const candidates = [candidate(ext, "AAAAAA"), candidate(int, "BBBBBB")];
    const reviews: Record<string, Review> = {
      AAAAAA: { submissionId: "AAAAAA", scores: { mapping: 5, kpiFeasibility: 4, outreach: 4, collaboration: 3, commitment: 5 }, notes: "Kuat di mapping", status: "Interview", updatedAt: "" },
    };
    const csv = recapCsv(candidates, reviews);
    const [header, rowExt, rowInt] = csv.slice(1).split("\r\n");
    expect(header).toBe(RECAP_HEADER.map((h) => `"${h}"`).join(","));
    expect(RECAP_HEADER.slice(0, 14)).toEqual([
      "Name", "Team Preference", "Weekly Availability", "Leadership Interest", "Target Participants", "Offline Target", "Online Target",
      "Target Companies", "KPI Plan", "Internal Strategy Summary", "Reward Nomination Plan", "Reviewer Score", "Reviewer Notes", "Selection Status",
    ]);
    expect(rowExt).toContain(`"Kandidat External","External"`);
    expect(rowExt).toContain(`"20","14","6"`);
    expect(rowExt).toContain("Operator Satu; Geo Dua");
    expect(rowExt).toContain(`"85","Kuat di mapping","Interview","Strong Candidate"`);
    expect(rowExt).toContain("Ya — External");
    expect(rowInt).toContain("Strategi: strategy.mainStrategy");
    expect(csv).not.toContain("Nominee Rahasia");
    expect(csv).not.toContain("Prospek Bernama Rahasia");
  });

  it("exports External companies, KPI projections and Internal strategy summaries", () => {
    const candidates = [candidate(completeExternalAnswers("E1"), "AAAAAA"), candidate(completeInternalAnswers("I1"), "BBBBBB")];
    const companies = externalCompaniesCsv(candidates);
    expect(companies.trim().split("\r\n")).toHaveLength(6);
    expect(companies).toContain(`"E1","AAAAAA","Geo Dua","Geothermal"`);
    const kpi = externalKpiCsv(candidates);
    expect(kpi).toContain(`"E1","AAAAAA","20","14","6","18","2","3","3","4","15","20","7","Ya"`);
    expect(kpi).not.toContain("I1");
    const strategy = internalStrategyCsv(candidates);
    expect(strategy).toContain(`"I1","BBBBBB"`);
    expect(strategy).not.toContain(`"E1"`);
    expect(aggregateKpi(candidates)).toMatchObject({ candidates: 1, total: 20, offline: 14, online: 6 });
  });
});

describe("reviewer intake", () => {
  let recipient: RecipientKey;
  let key: { key: CryptoKey; keyId: string };
  let wrongKey: { key: CryptoKey; keyId: string };
  beforeAll(async () => {
    const [pair, otherPair] = await Promise.all([generateRecipientKeyPair(2048), generateRecipientKeyPair(2048)]);
    const spki = await exportPublicKeyBase64(pair.publicKey);
    const keyId = await keyIdFromSpki(base64ToBytes(spki));
    recipient = { configured: true, keyId, spki };
    key = { key: pair.privateKey, keyId };
    wrongKey = { key: otherPair.privateKey, keyId: await keyIdFromSpki(base64ToBytes(await exportPublicKeyBase64(otherPair.publicKey))) };
  });

  it("loads many files, ignores a re-loaded file and flags submission-ID conflicts", async () => {
    const a = await createEncryptedAssessment(completeInternalAnswers("Satu"), recipient);
    const b = await createEncryptedAssessment(completeExternalAnswers("Dua"), recipient);
    let state = emptyIntake();
    for (const f of [a, b]) state = (await intakeFile(state, f.fileName, f.content, key)).state;
    expect(state.candidates.map((c) => c.payload.personal.fullName)).toEqual(["Satu", "Dua"]);

    const again = await intakeFile(state, a.fileName, a.content, key);
    expect(again.result.status).toBe("duplicate_file");
    expect(again.state.candidates).toHaveLength(2);

    // A different submission that happens to carry the same ID.
    const c = await createEncryptedAssessment(completeInternalAnswers("Tiga"), recipient);
    const collided = c.content.split(c.submissionId).join(a.submissionId);
    const conflict = await intakeFile(state, "collision.md", collided, key);
    expect(conflict.result.status).toBe("id_conflict");
    expect(conflict.state.conflicts).toEqual([a.submissionId]);
  });

  it("reports wrong keys, tampered and foreign files", async () => {
    const a = await createEncryptedAssessment(completeInternalAnswers(), recipient);
    expect((await intakeFile(emptyIntake(), "a.md", a.content, wrongKey)).result.status).toBe("wrong_key");
    const tampered = a.content.replace(/"ciphertext": "(.)/, (_m, ch: string) => `"ciphertext": "${ch === "A" ? "B" : "A"}`);
    expect((await intakeFile(emptyIntake(), "t.md", tampered, key)).result.status).toBe("tampered");
    expect((await intakeFile(emptyIntake(), "x.md", "# catatan biasa", key)).result.status).toBe("invalid_format");
  });

  it("detects the same person submitting twice under different IDs", () => {
    const first = candidate(completeInternalAnswers("Rina"), "AAAAAA");
    const second = candidate(completeExternalAnswers("Rina"), "BBBBBB");
    const third = candidate(completeExternalAnswers("Orang Lain"), "CCCCCC");
    third.payload.personal.email = "lain";
    third.payload.personal.whatsapp = "0";
    expect(possibleRepeatSubmissions([first, second, third])).toEqual({ AAAAAA: ["BBBBBB"], BBBBBB: ["AAAAAA"] });
  });
});
