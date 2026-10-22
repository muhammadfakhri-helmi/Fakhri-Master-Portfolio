// Step-by-step validation. Every error is keyed by a field path (e.g.
// "external.companies.2.name") so the form can show it next to the field.

import { assessmentTrack, MIN_COMPANIES } from "./initial.ts";
import type { Answers, PersonalKpi, Team } from "./types.ts";

export type Errors = Record<string, string>;

export const LIMITS = {
  short: 160,
  medium: 600,
  essay: 4000,
  /** Minimum characters for short answers ("jawaban singkat"). */
  partMin: 20,
  /** Minimum characters for main answers. */
  essayMin: 30,
} as const;

export type StepId = "personal" | "skills" | "team" | "internal-objective" | "external-objective" | "reward-leadership" | "commitment" | "review";

export const TRACK_STEPS: Record<Team, StepId[]> = {
  internal: ["internal-objective"],
  external: ["external-objective"],
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

// ---------- KPI ----------

export interface KpiNumbers {
  total: number;
  offline: number;
  online: number;
}

export interface KpiCheck {
  errors: Errors;
  warnings: string[];
  numbers: Partial<KpiNumbers>;
}

export function checkKpi(kpi: PersonalKpi, prefix = "external.kpi"): KpiCheck {
  const errors: Errors = {};
  const warnings: string[] = [];
  const n: Partial<KpiNumbers> = {};

  for (const field of ["total", "offline", "online"] as const) {
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
    if (n.total < 1) errors[`${prefix}.total`] = "Target minimal 1 peserta terkonfirmasi.";
    else if (n.total > 300) errors[`${prefix}.total`] = "Target individu tidak boleh melebihi target acara (300 peserta).";
    else if (n.total > 40) warnings.push(`Target ${n.total} peserta jauh di atas contoh 20 per anggota. Pastikan angka ini realistis.`);
  }
  const { total, offline, online } = n;
  if (total !== undefined && offline !== undefined && online !== undefined && offline + online !== total) {
    errors[`${prefix}.online`] = `Offline + online harus sama dengan target total (${offline} + ${online} = ${offline + online}, target ${total}).`;
  }
  return { errors, warnings, numbers: n };
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
      text(errors, "personal.readiestSkill", p.readiestSkill, 10);
      choice(errors, "personal.weeklyHours", p.weeklyHours);
      text(errors, "personal.availableTimes", p.availableTimes, 5);
      break;
    }
    case "team": {
      choice(errors, "team.preference", team.preference);
      if (team.preference === "flexible") choice(errors, "team.flexibleTrack", team.flexibleTrack, "Pilih set pertanyaan yang ingin kamu jawab.");
      text(errors, "team.reason", team.reason, LIMITS.essayMin);
      text(errors, "team.sharedContribution", team.sharedContribution, LIMITS.essayMin);
      break;
    }
    case "internal-objective": {
      for (const [field, value] of Object.entries(internal)) text(errors, `internal.${field}`, value as string, LIMITS.partMin);
      break;
    }
    case "external-objective": {
      const filled = external.companies.map((c) => c.trim()).filter(Boolean);
      if (filled.length < MIN_COMPANIES) errors["external.companies"] = `Sebutkan minimal ${MIN_COMPANIES} perusahaan.`;
      const seen = new Set<string>();
      external.companies.forEach((name, i) => {
        const normalized = name.trim().toLowerCase();
        if (!normalized) return;
        if (seen.has(normalized)) errors[`external.companies.${i}`] = "Perusahaan ini sudah disebutkan.";
        seen.add(normalized);
        noContact(errors, `external.companies.${i}`, name);
      });
      text(errors, "external.targetProfile", external.targetProfile, LIMITS.partMin);
      Object.assign(errors, checkKpi(external.kpi).errors);
      for (const field of ["kpiReason", "approach", "conversion", "reporting"] as const) text(errors, `external.${field}`, external[field], LIMITS.partMin);
      noContact(errors, "external.targetProfile", external.targetProfile);
      break;
    }
    case "reward-leadership": {
      const { reward, leadership } = final;
      choice(errors, "final.reward.plan", reward.plan);
      if (reward.plan === "yes") {
        text(errors, "final.reward.nomineeBackground", reward.nomineeBackground, 10);
        text(errors, "final.reward.nomineeReason", reward.nomineeReason, 20);
        if (!reward.transparencyAck) errors["final.reward.transparencyAck"] = "Centang untuk menyatakan pengajuan dilakukan secara transparan.";
        for (const field of ["nomineeName", "nomineeBackground", "nomineeReason", "nomineeContext"] as const) noContact(errors, `final.reward.${field}`, reward[field]);
      }
      choice(errors, "final.leadership.interest", leadership.interest);
      if (leadership.interest && leadership.interest !== "member_only") {
        text(errors, "final.leadership.readiness", leadership.readiness, LIMITS.essayMin);
        leadership.actions.forEach((action, i) => text(errors, `final.leadership.actions.${i}`, action, 10));
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
