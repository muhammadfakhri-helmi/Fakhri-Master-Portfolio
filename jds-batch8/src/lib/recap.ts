// Reviewer exports. The general recap never contains prospect names or nominee
// names; those stay in the restricted detail view of the reviewer.

import {
  APPROACH_OPTIONS,
  INDUSTRY_OPTIONS,
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
];

export function teamPreferenceText(payload: SubmissionPayload): string {
  const pref = payload.team.preference;
  if (!pref) return "—";
  return pref === "flexible" ? `Flexible (asesmen ${TRACK_LABEL[payload.track]})` : PREFERENCE_LABEL[pref];
}

export function kpiPlanText(payload: SubmissionPayload): string {
  if (payload.external) {
    const { kpi } = payload.external;
    const check = checkKpi(kpi);
    const weeks = check.weeksNeeded ? ` · estimasi ±${check.weeksNeeded} minggu` : "";
    return `${kpi.weeklyProspects} prospek/minggu · konversi ${kpi.conversionRate}%${weeks} · Jika 50%: ${clip(kpi.halfKpiPlan, 160)}`;
  }
  if (payload.internal) {
    return payload.internal.deliverables.map((d, i) => `D${i + 1}: ${clip(d.title, 60)} (${clip(d.deadline, 30)})`).join(" | ");
  }
  return "";
}

export function strategySummary(payload: SubmissionPayload, max = 220): string {
  if (!payload.internal) return "";
  const s = payload.internal.strategy;
  return `Strategi: ${clip(s.mainStrategy, max)} | 3 langkah awal: ${clip(s.firstThreeSteps, Math.round(max * 0.7))}`;
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
    ext ? ext.companies.map((c) => c.name).join("; ") : "",
    kpiPlanText(p),
    strategySummary(p),
    p.final.reward.plan ? REWARD_SHORT[p.final.reward.plan] : "",
    result.score ?? (result.scored ? `Belum lengkap (${result.scored}/${result.total})` : ""),
    review.notes,
    review.status,
    result.classification?.label ?? "",
    TRACK_LABEL[p.track],
    p.submissionId,
  ];
}

export function recapCsv(candidates: Candidate[], reviews: Record<string, Review>, delimiter?: Delimiter): string {
  return toCsv(RECAP_HEADER, candidates.map((c) => recapRow(c, reviews[c.submissionId])), delimiter);
}

export function externalCompaniesCsv(candidates: Candidate[], delimiter?: Delimiter): string {
  const header = ["Candidate", "Submission ID", "Company", "Industry", "Target Profile", "Reason", "Approach"];
  const rows: unknown[][] = [];
  for (const c of candidates) {
    for (const company of c.payload.external?.companies ?? []) {
      rows.push([
        c.payload.personal.fullName,
        c.submissionId,
        company.name,
        company.industry === "other" ? `Other: ${company.industryOther}` : labelOf(INDUSTRY_OPTIONS, company.industry),
        company.targetProfile,
        company.reason,
        company.approach === "other" ? `Other: ${company.approachOther}` : labelOf(APPROACH_OPTIONS, company.approach),
      ]);
    }
  }
  return toCsv(header, rows, delimiter);
}

export const KPI_HEADER = [
  "Candidate",
  "Submission ID",
  "Total Confirmed",
  "Offline",
  "Online",
  "Experienced",
  "Fresh Graduate",
  "Operator O&G/Geothermal",
  "Senior Service Company",
  "Networking",
  "Prospects per Week",
  "Conversion Rate (%)",
  "Estimated Weeks",
  "KPI Consistent",
  "Prospect Sources",
  "Plan at 50% KPI",
  "Accountable Commitment",
];

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
      n.experienced ?? ext.kpi.experienced,
      n.freshGraduate ?? ext.kpi.freshGraduate,
      n.operator ?? ext.kpi.operator,
      n.seniorService ?? ext.kpi.seniorService,
      n.networking ?? ext.kpi.networking,
      n.weeklyProspects ?? ext.kpi.weeklyProspects,
      n.conversionRate ?? ext.kpi.conversionRate,
      check.weeksNeeded ?? "",
      Object.keys(check.errors).length ? "Tidak" : "Ya",
      ext.kpi.prospectSources,
      ext.kpi.halfKpiPlan,
      ext.kpi.accountableCommitment,
    ]);
  }
  return toCsv(KPI_HEADER, rows, delimiter);
}

export function internalStrategyCsv(candidates: Candidate[], delimiter?: Delimiter): string {
  const header = [
    "Candidate",
    "Submission ID",
    "Main Strategy",
    "Operator Professionals",
    "Senior Service Company",
    "Fresh Graduate",
    "Networking & Sponsorship",
    "First Three Steps",
    "Internal Priorities",
    "Support to External",
    "Effectiveness Measures",
    "Recovery Priorities (7 days)",
    "Recovery KPI",
    "30-day Deliverables",
  ];
  const rows: unknown[][] = [];
  for (const c of candidates) {
    const i = c.payload.internal;
    if (!i) continue;
    rows.push([
      c.payload.personal.fullName,
      c.submissionId,
      i.strategy.mainStrategy,
      i.strategy.operatorPlan,
      i.strategy.seniorServicePlan,
      i.strategy.freshGraduatePlan,
      i.strategy.networkingPlan,
      i.strategy.firstThreeSteps,
      i.execution.priorities,
      i.execution.externalSupport,
      i.execution.effectivenessMeasure,
      i.recovery.priorities,
      i.recovery.recoveryKpi,
      i.deliverables.map((d) => `${d.title} — ${d.deadline} — ${d.indicator}`).join(" | "),
    ]);
  }
  return toCsv(header, rows, delimiter);
}

/** Sum of External candidates' KPI projections (each candidate's total counts unique participants once). */
export function aggregateKpi(candidates: Candidate[]) {
  const sum = { candidates: 0, total: 0, offline: 0, online: 0, experienced: 0, freshGraduate: 0, operator: 0, seniorService: 0, networking: 0 };
  for (const c of candidates) {
    const ext = c.payload.external;
    if (!ext) continue;
    const n = checkKpi(ext.kpi).numbers;
    sum.candidates++;
    for (const key of ["total", "offline", "online", "experienced", "freshGraduate", "operator", "seniorService", "networking"] as const) {
      sum[key] += n[key] ?? 0;
    }
  }
  return sum;
}
