// Step-by-step validation. Every error is keyed by a field path (e.g.
// "external.companies.2.name") so the form can show it next to the field.

import { assessmentTrack, MIN_COMPANIES, MIN_DELIVERABLES, MIN_PROSPECTS } from "./initial.ts";
import type { Answers, PersonalKpi, Team } from "./types.ts";

export type Errors = Record<string, string>;

export const LIMITS = {
  short: 160,
  medium: 600,
  essay: 4000,
  /** Minimum characters for each sub-question of a case study. */
  partMin: 40,
  /** Minimum characters for main essay answers. */
  essayMin: 80,
  outreachMin: 150,
} as const;

export type StepId =
  | "personal"
  | "skills"
  | "team"
  | "internal-strategy"
  | "internal-execution"
  | "internal-recovery"
  | "internal-deliverables"
  | "external-companies"
  | "external-prospects"
  | "external-kpi"
  | "external-outreach"
  | "external-first30"
  | "reward-leadership"
  | "commitment"
  | "review";

export const TRACK_STEPS: Record<Team, StepId[]> = {
  internal: ["internal-strategy", "internal-execution", "internal-recovery", "internal-deliverables"],
  external: ["external-companies", "external-prospects", "external-kpi", "external-outreach", "external-first30"],
};

export function stepsFor(answers: Answers): StepId[] {
  const track = assessmentTrack(answers);
  return ["personal", "skills", "team", ...(track ? TRACK_STEPS[track] : []), "reward-leadership", "commitment", "review"];
}

// ---------- helpers ----------

const len = (text: string) => text.trim().length;

function text(errors: Errors, key: string, value: string, min = 1, label = "Jawaban"): void {
  const n = len(value);
  if (n === 0) errors[key] = "Wajib diisi.";
  else if (n < min) errors[key] = `${label} minimal ${min} karakter agar cukup konkret (saat ini ${n}).`;
}

function choice(errors: Errors, key: string, value: string, message = "Pilih salah satu."): void {
  if (!value) errors[key] = message;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CONTACT_EMAIL_RE = /[^\s@]+@[^\s@]+\.[a-z]{2,}/i;
const CONTACT_PHONE_RE = /(?:\+?\d[\s.-]?){9,}/;

/** Detects e-mail addresses or phone numbers in fields about third parties. */
export function containsContactDetails(value: string): boolean {
  return CONTACT_EMAIL_RE.test(value) || CONTACT_PHONE_RE.test(value);
}

const THIRD_PARTY_MESSAGE = "Jangan mencantumkan nomor telepon atau email pihak ketiga.";

function noContact(errors: Errors, key: string, value: string): void {
  if (!errors[key] && containsContactDetails(value)) errors[key] = THIRD_PARTY_MESSAGE;
}

export function parseCount(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d{1,4}$/.test(trimmed)) return null;
  return Number(trimmed);
}

export function parsePercent(value: string): number | null {
  const trimmed = value.trim().replace(",", ".");
  if (!/^\d{1,3}(?:\.\d{1,2})?$/.test(trimmed)) return null;
  return Number(trimmed);
}

// ---------- KPI ----------

export interface KpiNumbers {
  total: number;
  offline: number;
  online: number;
  experienced: number;
  freshGraduate: number;
  operator: number;
  seniorService: number;
  networking: number;
  weeklyProspects: number;
  conversionRate: number;
}

export interface KpiCheck {
  errors: Errors;
  warnings: string[];
  numbers: Partial<KpiNumbers>;
  /** Weeks needed to reach the total at the stated prospect volume and conversion rate. */
  weeksNeeded: number | null;
}

const KPI_COUNT_FIELDS = [
  "total",
  "offline",
  "online",
  "experienced",
  "freshGraduate",
  "operator",
  "seniorService",
  "networking",
] as const;

export function checkKpi(kpi: PersonalKpi, prefix = "external.kpi"): KpiCheck {
  const errors: Errors = {};
  const warnings: string[] = [];
  const n: Partial<KpiNumbers> = {};

  for (const field of KPI_COUNT_FIELDS) {
    const value = kpi[field];
    if (!value.trim()) {
      errors[`${prefix}.${field}`] = "Wajib diisi (isi 0 bila tidak ada).";
      continue;
    }
    const parsed = parseCount(value);
    if (parsed === null) errors[`${prefix}.${field}`] = "Masukkan bilangan bulat 0 atau lebih.";
    else n[field] = parsed;
  }

  if (n.total !== undefined) {
    if (n.total < 1) errors[`${prefix}.total`] = "Target total minimal 1 peserta terkonfirmasi.";
    else if (n.total > 300) errors[`${prefix}.total`] = "Target individu tidak boleh melebihi target acara (300 peserta).";
    else if (n.total > 40) warnings.push(`Target ${n.total} peserta jauh di atas contoh 20 per anggota. Pastikan angka ini realistis dan dapat kamu pertanggungjawabkan.`);
  }

  const { total, offline, online, experienced, freshGraduate, operator, seniorService, networking } = n;
  if (total !== undefined && offline !== undefined && online !== undefined && offline + online !== total) {
    errors[`${prefix}.online`] = `Offline + online harus sama dengan target total (${offline} + ${online} = ${offline + online}, target ${total}).`;
  }
  if (total !== undefined && experienced !== undefined && freshGraduate !== undefined && experienced + freshGraduate !== total) {
    errors[`${prefix}.freshGraduate`] = `Experienced + fresh graduate harus sama dengan target total (${experienced} + ${freshGraduate} = ${experienced + freshGraduate}, target ${total}).`;
  }
  if (experienced !== undefined && operator !== undefined && seniorService !== undefined && operator + seniorService > experienced) {
    errors[`${prefix}.seniorService`] = `Operator + senior service company (${operator + seniorService}) adalah bagian dari experienced, jadi tidak boleh melebihi ${experienced}.`;
  }
  if (total !== undefined && networking !== undefined && networking > total) {
    errors[`${prefix}.networking`] = `Peserta dengan kontribusi networking adalah bagian dari total, jadi tidak boleh melebihi ${total}.`;
  }
  if (freshGraduate !== undefined && freshGraduate > 20) {
    warnings.push("Target fresh graduate individumu melebihi kuota acara (20). Pertimbangkan memprioritaskan peserta experienced.");
  }

  if (!kpi.weeklyProspects.trim()) errors[`${prefix}.weeklyProspects`] = "Wajib diisi.";
  else {
    const weekly = parseCount(kpi.weeklyProspects);
    if (weekly === null || weekly < 1 || weekly > 500) errors[`${prefix}.weeklyProspects`] = "Masukkan bilangan bulat 1–500.";
    else n.weeklyProspects = weekly;
  }
  if (!kpi.conversionRate.trim()) errors[`${prefix}.conversionRate`] = "Wajib diisi.";
  else {
    const rate = parsePercent(kpi.conversionRate);
    if (rate === null || rate <= 0 || rate > 100) errors[`${prefix}.conversionRate`] = "Masukkan persentase lebih dari 0 hingga 100.";
    else n.conversionRate = rate;
  }

  let weeksNeeded: number | null = null;
  if (n.total && n.weeklyProspects && n.conversionRate) {
    const perWeek = (n.weeklyProspects * n.conversionRate) / 100;
    weeksNeeded = Math.ceil(n.total / perWeek);
  }

  text(errors, `${prefix}.prospectSources`, kpi.prospectSources, 20);
  text(errors, `${prefix}.halfKpiPlan`, kpi.halfKpiPlan, LIMITS.partMin);
  text(errors, `${prefix}.accountableCommitment`, kpi.accountableCommitment, LIMITS.partMin);

  return { errors, warnings, numbers: n, weeksNeeded };
}

// ---------- steps ----------

export function validateStep(step: StepId, answers: Answers): Errors {
  const errors: Errors = {};
  const { personal: p, team, internal, external, final } = answers;

  switch (step) {
    case "personal": {
      text(errors, "personal.fullName", p.fullName, 3, "Nama");
      text(errors, "personal.university", p.university, 2);
      text(errors, "personal.major", p.major, 2);
      const year = p.graduationYear.trim();
      if (!year) errors["personal.graduationYear"] = "Wajib diisi.";
      else if (!/^\d{4}$/.test(year) || Number(year) < 1970 || Number(year) > 2035)
        errors["personal.graduationYear"] = "Masukkan tahun 4 digit (contoh: 2021).";
      choice(errors, "personal.status", p.status);
      if (!p.email.trim()) errors["personal.email"] = "Wajib diisi.";
      else if (!EMAIL_RE.test(p.email.trim())) errors["personal.email"] = "Format email tidak valid.";
      const digits = p.whatsapp.replace(/\D/g, "");
      if (!p.whatsapp.trim()) errors["personal.whatsapp"] = "Wajib diisi.";
      else if (!/^[+\d][\d\s-]*$/.test(p.whatsapp.trim()) || digits.length < 9 || digits.length > 15)
        errors["personal.whatsapp"] = "Masukkan nomor WhatsApp yang valid (9–15 digit).";
      break;
    }
    case "skills": {
      if (p.skills.length === 0) errors["personal.skills"] = "Pilih minimal satu keahlian.";
      if (p.skills.includes("Other")) text(errors, "personal.skillsOther", p.skillsOther, 2);
      text(errors, "personal.readiestSkill", p.readiestSkill, 20);
      choice(errors, "personal.weeklyHours", p.weeklyHours);
      text(errors, "personal.availableTimes", p.availableTimes, 5);
      break;
    }
    case "team": {
      choice(errors, "team.preference", team.preference);
      if (team.preference === "flexible") choice(errors, "team.flexibleTrack", team.flexibleTrack, "Pilih studi kasus yang ingin kamu kerjakan.");
      text(errors, "team.reason", team.reason, LIMITS.essayMin);
      text(errors, "team.sharedContribution", team.sharedContribution, LIMITS.essayMin);
      break;
    }
    case "internal-strategy": {
      for (const [field, value] of Object.entries(internal.strategy)) text(errors, `internal.strategy.${field}`, value, LIMITS.partMin);
      break;
    }
    case "internal-execution": {
      for (const [field, value] of Object.entries(internal.execution)) text(errors, `internal.execution.${field}`, value, LIMITS.partMin);
      break;
    }
    case "internal-recovery": {
      for (const [field, value] of Object.entries(internal.recovery)) text(errors, `internal.recovery.${field}`, value, LIMITS.partMin);
      break;
    }
    case "internal-deliverables": {
      if (internal.deliverables.length < MIN_DELIVERABLES) errors["internal.deliverables"] = `Isi minimal ${MIN_DELIVERABLES} deliverable.`;
      internal.deliverables.forEach((d, i) => {
        const k = `internal.deliverables.${i}`;
        text(errors, `${k}.title`, d.title, 5);
        text(errors, `${k}.deadline`, d.deadline, 3);
        text(errors, `${k}.indicator`, d.indicator, 15);
        text(errors, `${k}.impact`, d.impact, 20);
      });
      break;
    }
    case "external-companies": {
      if (external.companies.length < MIN_COMPANIES) errors["external.companies"] = `Isi minimal ${MIN_COMPANIES} perusahaan target.`;
      const seen = new Map<string, number>();
      external.companies.forEach((c, i) => {
        const k = `external.companies.${i}`;
        text(errors, `${k}.name`, c.name, 2);
        const normalized = c.name.trim().toLowerCase();
        if (normalized) {
          if (seen.has(normalized)) errors[`${k}.name`] = `Perusahaan ini sudah ada di entri #${seen.get(normalized)! + 1}.`;
          else seen.set(normalized, i);
        }
        choice(errors, `${k}.industry`, c.industry);
        if (c.industry === "other") text(errors, `${k}.industryOther`, c.industryOther, 2);
        text(errors, `${k}.targetProfile`, c.targetProfile, 5);
        text(errors, `${k}.reason`, c.reason, 20);
        choice(errors, `${k}.approach`, c.approach);
        if (c.approach === "other") text(errors, `${k}.approachOther`, c.approachOther, 2);
        for (const field of ["name", "targetProfile", "reason", "industryOther", "approachOther"] as const) noContact(errors, `${k}.${field}`, c[field]);
      });
      break;
    }
    case "external-prospects": {
      if (external.prospects.length < MIN_PROSPECTS) errors["external.prospects"] = `Isi minimal ${MIN_PROSPECTS} calon target.`;
      external.prospects.forEach((t, i) => {
        const k = `external.prospects.${i}`;
        text(errors, `${k}.profile`, t.profile, 5);
        text(errors, `${k}.companyOrIndustry`, t.companyOrIndustry, 2);
        text(errors, `${k}.experience`, t.experience, 1);
        text(errors, `${k}.relevance`, t.relevance, 20);
        choice(errors, `${k}.relationship`, t.relationship);
        text(errors, `${k}.approachPlan`, t.approachPlan, 20);
        for (const field of ["name", "profile", "companyOrIndustry", "experience", "relevance", "approachPlan"] as const) noContact(errors, `${k}.${field}`, t[field]);
      });
      break;
    }
    case "external-kpi": {
      Object.assign(errors, checkKpi(external.kpi).errors);
      break;
    }
    case "external-outreach": {
      text(errors, "external.outreachMessage", external.outreachMessage, LIMITS.outreachMin, "Pesan");
      break;
    }
    case "external-first30": {
      for (const [field, value] of Object.entries(external.first30)) text(errors, `external.first30.${field}`, value, 20);
      break;
    }
    case "reward-leadership": {
      const { reward, leadership } = final;
      choice(errors, "final.reward.plan", reward.plan);
      if (reward.plan === "yes") {
        text(errors, "final.reward.nomineeBackground", reward.nomineeBackground, 10);
        text(errors, "final.reward.nomineeReason", reward.nomineeReason, 30);
        if (!reward.transparencyAck) errors["final.reward.transparencyAck"] = "Centang untuk menyatakan pengajuan dilakukan secara transparan.";
        for (const field of ["nomineeName", "nomineeBackground", "nomineeReason", "nomineeContext"] as const) noContact(errors, `final.reward.${field}`, reward[field]);
      }
      choice(errors, "final.leadership.interest", leadership.interest);
      if (leadership.interest && leadership.interest !== "member_only") {
        text(errors, "final.leadership.readiness", leadership.readiness, LIMITS.essayMin);
        leadership.actions.forEach((action, i) => text(errors, `final.leadership.actions.${i}`, action, 15));
      }
      break;
    }
    case "commitment": {
      text(errors, "final.accountability", final.accountability, LIMITS.essayMin);
      text(errors, "final.finalCommitment", final.finalCommitment, LIMITS.essayMin);
      choice(errors, "final.placement.answer", final.placement.answer);
      if (!final.consent) errors["final.consent"] = "Persetujuan pemrosesan data wajib dicentang untuk mengirim asesmen.";
      break;
    }
    case "review":
      break;
  }
  return errors;
}

/** Validates every step on the candidate's path; returns errors grouped by step. */
export function validateAll(answers: Answers): Partial<Record<StepId, Errors>> {
  const result: Partial<Record<StepId, Errors>> = {};
  for (const step of stepsFor(answers)) {
    const errors = validateStep(step, answers);
    if (Object.keys(errors).length) result[step] = errors;
  }
  if (!assessmentTrack(answers)) result.team = { ...result.team, "team.preference": "Pilih tim terlebih dahulu." };
  return result;
}
