import { describe, expect, it } from "vitest";
import { averageWords, eligibilityOf, preScreen } from "../../src/lib/eligibility.ts";
import { buildPayload } from "../../src/lib/payload.ts";
import type { Candidate } from "../../src/lib/recap.ts";
import { emptyReview, type Review } from "../../src/lib/scoring.ts";
import { completeExternalAnswers, completeInternalAnswers } from "../fixtures.ts";

const candidate = (answers = completeInternalAnswers(), integrity = { pasteBlocked: 0 }): Candidate => ({
  submissionId: "ABC123",
  fileName: "x.md",
  payload: buildPayload(answers, "ABC123", undefined, integrity),
});
const review = (scores: Review["scores"], status: Review["status"] = "Belum direview"): Review => ({ ...emptyReview("ABC123"), scores, status });
const level = (c: Candidate, id: string, repeats: string[] = []) => preScreen(c, repeats).find((check) => check.id === id)?.level;

describe("pre-screen (indicators only)", () => {
  it("rates time available per week", () => {
    const a = completeInternalAnswers();
    expect(level(candidate(a), "time")).toBe("ok"); // fixture: 6–10 jam
    a.personal.weeklyHours = "3to5";
    expect(level(candidate(a), "time")).toBe("warn");
    a.personal.weeklyHours = "lt3";
    expect(level(candidate(a), "time")).toBe("fail");
  });

  it("rates the depth of answers by average words", () => {
    const deep = candidate();
    expect(averageWords(deep)).toBeGreaterThanOrEqual(15);
    expect(level(deep, "depth")).toBe("ok");
    const a = completeInternalAnswers();
    for (const key of Object.keys(a.internal) as (keyof typeof a.internal)[]) a.internal[key] = "Promosi lewat LinkedIn dan alumni.";
    a.team.reason = a.team.sharedContribution = a.final.accountability = a.final.finalCommitment = "Saya siap membantu tim sepenuhnya.";
    expect(level(candidate(a), "depth")).toBe("fail");
  });

  it("checks External KPI, placement, paste attempts and duplicates", () => {
    const ext = completeExternalAnswers();
    expect(level(candidate(ext), "kpi")).toBe("ok");
    ext.external.kpi = { total: "5", offline: "3", online: "2" };
    expect(level(candidate(ext), "kpi")).toBe("warn");
    ext.external.kpi = { total: "5", offline: "3", online: "1" };
    expect(level(candidate(ext), "kpi")).toBe("fail");
    expect(level(candidate(), "kpi")).toBeUndefined(); // Internal candidates have no KPI check

    const a = completeInternalAnswers();
    a.final.placement.answer = "no";
    expect(level(candidate(a), "placement")).toBe("warn");
    expect(level(candidate(undefined, { pasteBlocked: 2 }), "paste")).toBe("warn");
    expect(level(candidate(), "paste")).toBe("ok");
    expect(level(candidate(), "duplicate", ["BBBBBB"])).toBe("warn");
  });
});

describe("eligibility", () => {
  const all = (n: number) => ({ strategy: n, execution: n, problemSolving: n, collaboration: n, commitment: n });

  it("stays 'Belum dinilai' until every criterion is scored", () => {
    expect(eligibilityOf(candidate(), undefined)).toMatchObject({ id: "unscored", label: "Belum dinilai" });
    expect(eligibilityOf(candidate(), review({ strategy: 5 }))).toMatchObject({ id: "unscored", basis: "Skor belum lengkap (1/5)" });
  });

  it("follows the score thresholds", () => {
    expect(eligibilityOf(candidate(), review(all(4)))).toMatchObject({ id: "eligible", label: "Layak", score: 80 });
    // 4×35 + 3×25 + 3×20 + 4×10 + 4×10 over 5 = 28 + 15 + 12 + 8 + 8 = 71
    expect(eligibilityOf(candidate(), review({ strategy: 4, execution: 3, problemSolving: 3, collaboration: 4, commitment: 4 }))).toMatchObject({ id: "interview", score: 71 });
    expect(eligibilityOf(candidate(), review(all(3)))).toMatchObject({ id: "not_eligible", label: "Belum layak", score: 60 });
  });

  it("lets the reviewer's selection status override the score", () => {
    expect(eligibilityOf(candidate(), review(all(2), "Terpilih — Internal")).id).toBe("eligible");
    expect(eligibilityOf(candidate(), review(all(5), "Tidak dilanjutkan")).id).toBe("not_eligible");
    expect(eligibilityOf(candidate(), review({}, "Interview")).id).toBe("interview");
  });
});
