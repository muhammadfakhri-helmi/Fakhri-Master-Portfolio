// Eligibility ("kelayakan") for the reviewer dashboard.
//
// Two layers, both transparent:
//   1. Pre-screen: objective checks read from the answer file (time available,
//      depth of answers, KPI consistency, placement flexibility, blocked paste
//      attempts, possible duplicate). They flag what to look at — they never
//      decide on their own.
//   2. Eligibility: from the reviewer's weighted score (or an explicit selection
//      status). Without a score the candidate stays "Belum dinilai".

import type { Candidate } from "./recap.ts";
import { computeScore, type Review } from "./scoring.ts";
import { checkKpi } from "./validation.ts";

export type CheckLevel = "ok" | "warn" | "fail";

export interface Check {
  id: "time" | "depth" | "kpi" | "placement" | "paste" | "duplicate";
  label: string;
  level: CheckLevel;
  detail: string;
}

export const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

/** Answers whose depth is measured: the five team questions plus the commitment essays. */
function substantiveAnswers(c: Candidate): string[] {
  const p = c.payload;
  const team = p.internal
    ? Object.values(p.internal)
    : p.external
      ? [p.external.targetProfile, p.external.kpiReason, p.external.approach, p.external.conversion, p.external.reporting]
      : [];
  return [...team, p.team.reason, p.team.sharedContribution, p.final.accountability, p.final.finalCommitment];
}

export function averageWords(c: Candidate): number {
  const answers = substantiveAnswers(c);
  if (!answers.length) return 0;
  return Math.round(answers.reduce((sum, text) => sum + countWords(text), 0) / answers.length);
}

export function preScreen(c: Candidate, repeats: string[] = []): Check[] {
  const p = c.payload;
  const checks: Check[] = [];

  const hours = p.personal.weeklyHours;
  checks.push(
    hours === "lt3"
      ? { id: "time", label: "Waktu", level: "fail", detail: "Kurang dari 3 jam per minggu" }
      : hours === "3to5"
        ? { id: "time", label: "Waktu", level: "warn", detail: "3–5 jam per minggu" }
        : { id: "time", label: "Waktu", level: "ok", detail: hours === "gt10" ? "Lebih dari 10 jam per minggu" : "6–10 jam per minggu" },
  );

  const words = averageWords(c);
  checks.push({
    id: "depth",
    label: "Kedalaman jawaban",
    level: words >= 15 ? "ok" : words >= 8 ? "warn" : "fail",
    detail: `Rata-rata ${words} kata per jawaban`,
  });

  if (p.external) {
    const kpi = checkKpi(p.external.kpi);
    const total = kpi.numbers.total ?? 0;
    checks.push(
      Object.keys(kpi.errors).length
        ? { id: "kpi", label: "KPI", level: "fail", detail: "Angka target tidak konsisten" }
        : total < 10
          ? { id: "kpi", label: "KPI", level: "warn", detail: `Target ${total} peserta (di bawah 10)` }
          : { id: "kpi", label: "KPI", level: "ok", detail: `Target ${total} peserta terkonfirmasi` },
    );
  }

  const placement = p.final.placement.answer;
  checks.push({
    id: "placement",
    label: "Penempatan",
    level: placement === "yes" ? "ok" : "warn",
    detail: placement === "yes" ? "Bersedia di tim mana pun" : placement === "conditional" ? "Bersedia dengan pertimbangan" : "Hanya tim pilihan",
  });

  if (p.integrity) {
    const n = p.integrity.pasteBlocked;
    checks.push({ id: "paste", label: "Copy-paste", level: n ? "warn" : "ok", detail: n ? `Mencoba paste ${n} kali (diblokir)` : "Tidak ada percobaan paste" });
  }

  if (repeats.length) checks.push({ id: "duplicate", label: "Duplikasi", level: "warn", detail: `Data sama dengan ID ${repeats.join(", ")}` });
  return checks;
}

export type EligibilityId = "eligible" | "interview" | "not_eligible" | "unscored";

export const ELIGIBILITY_LABEL: Record<EligibilityId, string> = {
  eligible: "Layak",
  interview: "Perlu wawancara",
  not_eligible: "Belum layak",
  unscored: "Belum dinilai",
};

export interface Eligibility {
  id: EligibilityId;
  label: string;
  score: number | null;
  /** Why the candidate has this status. */
  basis: string;
}

/**
 * Explicit reviewer decisions win (selected / interview / not continued);
 * otherwise the weighted score decides: ≥75 Layak, 65–74 Perlu wawancara,
 * <65 Belum layak (same thresholds as the scoring classification).
 */
export function eligibilityOf(c: Candidate, review: Review | undefined): Eligibility {
  const result = computeScore(c.payload.track, review?.scores ?? {});
  const make = (id: EligibilityId, basis: string): Eligibility => ({ id, label: ELIGIBILITY_LABEL[id], score: result.score, basis });
  const status = review?.status;
  if (status === "Terpilih — Internal" || status === "Terpilih — External") return make("eligible", `Status: ${status}`);
  if (status === "Tidak dilanjutkan") return make("not_eligible", "Status: Tidak dilanjutkan");
  if (status === "Interview") return make("interview", "Status: Interview");
  if (result.score === null) return make("unscored", result.scored ? `Skor belum lengkap (${result.scored}/${result.total})` : "Belum ada skor");
  if (result.score >= 75) return make("eligible", `Skor ${result.score}`);
  if (result.score >= 65) return make("interview", `Skor ${result.score}`);
  return make("not_eligible", `Skor ${result.score}`);
}
