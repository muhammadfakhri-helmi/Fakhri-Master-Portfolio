// Reviewer exports. The general recap never contains nominee names; those stay
// in the restricted detail view of the reviewer.

import {
  LEADERSHIP_SHORT,
  labelOf,
  PREFERENCE_LABEL,
  REWARD_SHORT,
  TRACK_LABEL,
  WEEKLY_HOURS_OPTIONS,
} from "./content.ts";
import { toCsv, type Delimiter } from "./csv.ts";
import { computeScore, emptyReview, type Review } from "./scoring.ts";
import type { SubmissionPayload } from "./types.ts";
import { checkKpi } from "./validation.ts";

export interface Candidate {
  submissionId: string;
  fileName: string;
  payload: SubmissionPayload;
}

export const clip = (text: string, max: number) => {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
};

export const RECAP_HEADER = [
  "Name",
  "Team Preference",
  "Weekly Availability",
  "Leadership Interest",
  "Target Participants",
  "Offline Target",
  "Online Target",
  "Target Companies",
  "KPI Plan",
  "Internal Strategy Summary",
  "Reward Nomination Plan",
  "Reviewer Score",
  "Reviewer Notes",
  "Selection Status",
  "Classification",
  "Assessment Track",
  "Submission ID",
  "Paste Attempts Blocked",
];

export function teamPreferenceText(payload: SubmissionPayload): string {
  const pref = payload.team.preference;
  if (!pref) return "—";
  return pref === "flexible" ? `Flexible (asesmen ${TRACK_LABEL[payload.track]})` : PREFERENCE_LABEL[pref];
}

export function kpiPlanText(payload: SubmissionPayload): string {
  if (payload.external) {
    const { kpi, kpiReason } = payload.external;
    return `${kpi.total} peserta (offline ${kpi.offline}, online ${kpi.online}) · ${clip(kpiReason, 180)}`;
  }
  return "";
}

export function strategySummary(payload: SubmissionPayload, max = 220): string {
  if (!payload.internal) return "";
  const i = payload.internal;
  return `Strategi: ${clip(i.strategy, max)} | Mengukur kemajuan: ${clip(i.tracking, Math.round(max * 0.6))}`;
}

export function recapRow(candidate: Candidate, review: Review = emptyReview(candidate.submissionId)): unknown[] {
  const p = candidate.payload;
  const result = computeScore(p.track, review.scores);
  const ext = p.external;
  const availability = `${labelOf(WEEKLY_HOURS_OPTIONS, p.personal.weeklyHours)} — ${clip(p.personal.availableTimes, 80)}`;
  return [
    p.personal.fullName,
    teamPreferenceText(p),
    availability,
    p.final.leadership.interest ? LEADERSHIP_SHORT[p.final.leadership.interest] : "",
    ext ? Number(ext.kpi.total) : "",
    ext ? Number(ext.kpi.offline) : "",
    ext ? Number(ext.kpi.online) : "",
    ext ? ext.companies.join("; ") : "",
    kpiPlanText(p),
    strategySummary(p),
    p.final.reward.plan ? REWARD_SHORT[p.final.reward.plan] : "",
    result.score ?? (result.scored ? `Belum lengkap (${result.scored}/${result.total})` : ""),
    review.notes,
    review.status,
    result.classification?.label ?? "",
    TRACK_LABEL[p.track],
    p.submissionId,
    p.integrity?.pasteBlocked ?? "",
  ];
}

export function recapCsv(candidates: Candidate[], reviews: Record<string, Review>, delimiter?: Delimiter): string {
  return toCsv(RECAP_HEADER, candidates.map((c) => recapRow(c, reviews[c.submissionId])), delimiter);
}

export function externalCompaniesCsv(candidates: Candidate[], delimiter?: Delimiter): string {
  const header = ["Candidate", "Submission ID", "Company", "Target Professionals"];
  const rows: unknown[][] = [];
  for (const c of candidates) {
    for (const company of c.payload.external?.companies ?? []) {
      rows.push([c.payload.personal.fullName, c.submissionId, company, c.payload.external!.targetProfile]);
    }
  }
  return toCsv(header, rows, delimiter);
}

export const KPI_HEADER = ["Candidate", "Submission ID", "Total Confirmed", "Offline", "Online", "KPI Consistent", "Why Realistic", "Approach", "Conversion & Follow-up", "Reporting"];

export function externalKpiCsv(candidates: Candidate[], delimiter?: Delimiter): string {
  const rows: unknown[][] = [];
  for (const c of candidates) {
    const ext = c.payload.external;
    if (!ext) continue;
    const check = checkKpi(ext.kpi);
    const n = check.numbers;
    rows.push([
      c.payload.personal.fullName,
      c.submissionId,
      n.total ?? ext.kpi.total,
      n.offline ?? ext.kpi.offline,
      n.online ?? ext.kpi.online,
      Object.keys(check.errors).length ? "Tidak" : "Ya",
      ext.kpiReason,
      ext.approach,
      ext.conversion,
      ext.reporting,
    ]);
  }
  return toCsv(KPI_HEADER, rows, delimiter);
}

export function internalStrategyCsv(candidates: Candidate[], delimiter?: Delimiter): string {
  const header = ["Candidate", "Submission ID", "Strategy for 300 Participants", "Dividing Targets & Measuring Progress", "Support to External", "If Registrations Fall Short", "Fresh Graduate & Experienced Composition"];
  const rows: unknown[][] = [];
  for (const c of candidates) {
    const i = c.payload.internal;
    if (!i) continue;
    rows.push([c.payload.personal.fullName, c.submissionId, i.strategy, i.tracking, i.externalSupport, i.recovery, i.composition]);
  }
  return toCsv(header, rows, delimiter);
}

/** Sum of External candidates' KPI projections (each candidate's total counts unique participants once). */
export function aggregateKpi(candidates: Candidate[]) {
  const sum = { candidates: 0, total: 0, offline: 0, online: 0 };
  for (const c of candidates) {
    const ext = c.payload.external;
    if (!ext) continue;
    const n = checkKpi(ext.kpi).numbers;
    sum.candidates++;
    sum.total += n.total ?? 0;
    sum.offline += n.offline ?? 0;
    sum.online += n.online ?? 0;
  }
  return sum;
}
